/*
 * Shared Sri Lanka seasonal theme runtime.
 * Reads published schedules from Firestore and applies the currently active theme
 * to the main website, student login and student dashboard.
 */
import { db, doc, onSnapshot } from "./firebase.js";

(() => {
  "use strict";

  const SETTINGS_DOC_ID = "__themeSeasonSchedule";
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
    document.documentElement.style.removeProperty("--season-accent");
    document.documentElement.style.removeProperty("--season-bg");
    document.documentElement.style.removeProperty("--season-panel");
    document.documentElement.style.removeProperty("--season-text");
    document.documentElement.style.removeProperty("--season-muted");
    document.documentElement.style.removeProperty("--season-accent-contrast");
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

  function hexToRgb(hex) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!match) return null;
    const value = match[1];
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16)
    ];
  }

  function relativeLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const channels = rgb.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function blendHex(first, second, weight) {
    const a = hexToRgb(first);
    const b = hexToRgb(second);
    if (!a || !b) return first;
    const amount = Math.max(0, Math.min(1, Number(weight) || 0));
    return "#" + a.map((value, index) =>
      Math.round(value * (1 - amount) + b[index] * amount).toString(16).padStart(2, "0")
    ).join("");
  }

  function applySchedule(schedule) {
    const signature = schedule
      ? [
          schedule.id,
          schedule.themeKey,
          schedule.title,
          schedule.decorations !== false,
          schedule.customAccent || "",
          schedule.customBackground || "",
          schedule.accentColour || "",
          schedule.backgroundColour || ""
        ].join("|")
      : "default";

    if (signature === lastScheduleSignature) return;
    lastScheduleSignature = signature;
    activeId = schedule ? schedule.id : "";

    removeDecorations();
    removeThemeStyles();

    if (!schedule) return;

    const root = document.documentElement;
    root.dataset.siteSeason = schedule.themeKey;
    root.dataset.siteThemeName = schedule.title || schedule.themeKey;
    const accentColour = schedule.accentColour || schedule.customAccent || "";
    const backgroundColour = schedule.backgroundColour || schedule.customBackground || "";
    if (/^#[0-9a-f]{6}$/i.test(accentColour)) {
      root.style.setProperty("--season-accent", accentColour);
      root.style.setProperty("--site-custom-accent", accentColour);
    }
    if (/^#[0-9a-f]{6}$/i.test(backgroundColour)) {
      root.style.setProperty("--season-bg", backgroundColour);
      root.style.setProperty("--site-custom-background", backgroundColour);
    }

    // Default / Normal sessions can also carry a saved colour pair. Apply it
    // without adding seasonal decorations, and adapt surface/text contrast to
    // the selected background so the custom palette remains readable.
    if (schedule.themeKey === "default") {
      const safeBackground = /^#[0-9a-f]{6}$/i.test(backgroundColour) ? backgroundColour : "#0b1020";
      const safeAccent = /^#[0-9a-f]{6}$/i.test(accentColour) ? accentColour : "#a6ff2e";
      const lightBackground = relativeLuminance(safeBackground) > 0.42;
      root.style.setProperty("--season-panel", blendHex(safeBackground, "#ffffff", lightBackground ? 0.88 : 0.10));
      root.style.setProperty("--season-text", lightBackground ? "#11182b" : "#f4f7ff");
      root.style.setProperty("--season-muted", lightBackground ? "#596579" : "#aeb8ce");
      root.style.setProperty("--season-accent-contrast", relativeLuminance(safeAccent) > 0.48 ? "#11182b" : "#f4f7ff");
    }

    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("./season-theme.css?v=2", import.meta.url).href;
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
      doc(db, "websiteSettings", SETTINGS_DOC_ID),
      snapshot => {
        const data = snapshot.exists() ? snapshot.data() : {};
        schedules = Array.isArray(data.sessions) ? data.sessions : [];
        refresh();
      },
      error => {
        console.warn("Seasonal theme schedule could not be loaded:", error);
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
