/*
 * Shared Sri Lanka seasonal theme runtime.
 * Reads published schedules from Firestore and applies the currently active theme
 * to the main website, student login and student dashboard.
 */
import { db, collection, onSnapshot } from "./firebase.js";

(() => {
  "use strict";

  const COLLECTION = "siteThemeSchedules";
  const STYLE_ID = "site-season-theme-stylesheet";
  const LAYER_ID = "site-season-decorations";
  const ZONE = "Asia/Colombo";
  let schedules = [];
  let activeId = "";
  let nextTimer = null;
  let currentLayer = null;
  let currentStyleLink = null;
  let lastScheduleSignature = "";

  const themeDecor = {
    halloween: ["👻", "🎃", "🦇", "✨", "🕸️"],
    christmas: ["❄️", "🎄", "⭐", "🔔", "✨"],
    "new-year": ["🎆", "✨", "🎇", "🥂", "⭐"],
    avurudu: ["🌸", "☀️", "🌾", "🪷", "✨"],
    vesak: ["🏮", "🪷", "✨", "🕯️", "🌕"],
    deepavali: ["🪔", "✨", "🌟", "🌼", "🪷"],
    custom: ["✨", "✦", "✧", "✦", "✨"]
  };

  function getActiveSchedule(now = Date.now()) {
    return schedules
      .filter(item =>
        item.enabled === true &&
        item.themeKey &&
        Number.isFinite(Number(item.startsAt)) &&
        Number.isFinite(Number(item.endsAt)) &&
        Number(item.startsAt) <= now &&
        Number(item.endsAt) > now
      )
      .sort((a, b) => Number(b.startsAt) - Number(a.startsAt))[0] || null;
  }

  function removeDecorations() {
    if (currentLayer) {
      currentLayer.remove();
      currentLayer = null;
    }
  }

  function removeThemeStyles() {
    if (currentStyleLink) {
      currentStyleLink.remove();
      currentStyleLink = null;
    }
    document.documentElement.removeAttribute("data-site-season");
    document.documentElement.removeAttribute("data-site-theme-name");
    document.documentElement.style.removeProperty("--site-custom-accent");
    document.documentElement.style.removeProperty("--site-custom-background");
  }

  function pageType() {
    if (document.querySelector(".frame")) return "main";
    if (document.getElementById("loginBtn")) return "login";
    if (document.querySelector(".lms-dashboard")) return "dashboard";
    return "other";
  }

  function createDecorations(schedule) {
    removeDecorations();
    if (!schedule || schedule.decorations === false) return;
    const icons = themeDecor[schedule.themeKey];
    if (!icons || !document.body) return;

    const layer = document.createElement("div");
    layer.id = LAYER_ID;
    layer.className = "site-season-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.dataset.theme = schedule.themeKey;

    const edge = document.createElement("div");
    edge.className = "site-season-edge";
    layer.appendChild(edge);

    const count = window.innerWidth <= 600 ? 6 : 11;
    for (let i = 0; i < count; i += 1) {
      const item = document.createElement("span");
      item.className = "site-season-float";
      item.textContent = icons[i % icons.length];
      item.style.left = (4 + ((i * 37) % 92)) + "%";
      item.style.top = (12 + ((i * 23) % 76)) + "%";
      item.style.setProperty("--season-delay", (-((i * 1.7) % 13)) + "s");
      item.style.setProperty("--season-duration", (8 + (i % 5) * 1.7) + "s");
      item.style.setProperty("--season-size", (18 + (i % 4) * 7) + "px");
      layer.appendChild(item);
    }

    document.body.appendChild(layer);
    currentLayer = layer;
  }

  function applySchedule(schedule) {
    const signature = schedule
      ? [
          schedule.id,
          schedule.themeKey,
          schedule.title,
          schedule.decorations !== false,
          schedule.customAccent || "",
          schedule.customBackground || ""
        ].join("|")
      : "default";

    if (signature === lastScheduleSignature) return;
    lastScheduleSignature = signature;
    activeId = schedule ? schedule.id : "";

    removeDecorations();
    removeThemeStyles();

    if (!schedule || schedule.themeKey === "default") return;

    document.documentElement.dataset.siteSeason = schedule.themeKey;
    document.documentElement.dataset.siteThemeName = schedule.title || schedule.themeKey;
    if (schedule.themeKey === "custom") {
      if (/^#[0-9a-f]{6}$/i.test(schedule.customAccent || "")) {
        document.documentElement.style.setProperty("--site-custom-accent", schedule.customAccent);
      }
      if (/^#[0-9a-f]{6}$/i.test(schedule.customBackground || "")) {
        document.documentElement.style.setProperty("--site-custom-background", schedule.customBackground);
      }
    }

    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("./season-theme.css?v=1", import.meta.url).href;
    document.head.appendChild(link);
    currentStyleLink = link;
    createDecorations(schedule);
  }

  function scheduleNextBoundary() {
    if (nextTimer !== null) window.clearTimeout(nextTimer);
    const now = Date.now();
    const boundaries = schedules
      .filter(item => item.enabled === true)
      .flatMap(item => [Number(item.startsAt), Number(item.endsAt)])
      .filter(value => Number.isFinite(value) && value > now);
    const next = boundaries.length ? Math.min(...boundaries) : now + 60 * 60 * 1000;
    nextTimer = window.setTimeout(() => {
      applySchedule(getActiveSchedule());
      scheduleNextBoundary();
    }, Math.min(Math.max(next - now + 100, 1000), 2147480000));
  }

  function refresh() {
    applySchedule(getActiveSchedule());
    scheduleNextBoundary();
  }

  try {
    onSnapshot(
      collection(db, COLLECTION),
      snapshot => {
        schedules = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        refresh();
      },
      error => {
        console.warn("Seasonal theme schedule could not be loaded:", error);
        // If a schedule cannot be read, keep the site's original appearance.
        schedules = [];
        refresh();
      }
    );
  } catch (error) {
    console.warn("Seasonal theme runtime could not start:", error);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  window.addEventListener("pageshow", refresh);
  window.addEventListener("resize", () => {
    const active = getActiveSchedule();
    if (active && active.id === activeId) createDecorations(active);
  });
})();
