import { db, doc, onSnapshot } from "./firebase.js";

(() => {
  "use strict";
  if (window.__drSandaruwanChristmasMounted) return;
  window.__drSandaruwanChristmasMounted = true;

  const SETTINGS_DOC_ID = "__themeSeasonSchedule";
  const stylesheetUrl = new URL("./christmas-theme.css?v=20261115-3", import.meta.url).href;
  let sessions = [];
  let currentSignature = "";
  let nextTimer = null;

  function addStylesheet() {
    if (document.getElementById("christmas-theme-stylesheet")) return;
    const link = document.createElement("link");
    link.id = "christmas-theme-stylesheet";
    link.rel = "stylesheet";
    link.href = stylesheetUrl;
    document.head.appendChild(link);
  }

  function addGarland() {
    if (document.getElementById("christmas-garland")) return;
    const garland = document.createElement("div");
    garland.id = "christmas-garland";
    garland.setAttribute("aria-hidden", "true");
    document.body.appendChild(garland);
  }

  function addSnowfall() {
    const path = window.location.pathname.toLowerCase();
    const isReader = /(?:viewer|paper-answer|answer-viewer)/.test(path) || path.includes("/pdfjs/");
    if (isReader || document.getElementById("christmas-snowfall")) return;
    const layer = document.createElement("div");
    layer.id = "christmas-snowfall";
    layer.setAttribute("aria-hidden", "true");
    const flakes = ["❄", "✦", "❅", "·", "❆"];
    const count = window.matchMedia("(max-width: 600px)").matches ? 20 : 34;
    for (let i = 0; i < count; i += 1) {
      const flake = document.createElement("span");
      flake.className = "xmas-snowflake";
      flake.textContent = flakes[i % flakes.length];
      flake.style.setProperty("--x-left", (Math.random() * 100) + "%");
      flake.style.setProperty("--x-size", (5 + Math.random() * 9) + "px");
      flake.style.setProperty("--x-opacity", (0.22 + Math.random() * 0.48).toString());
      flake.style.setProperty("--x-duration", (11 + Math.random() * 15) + "s");
      flake.style.setProperty("--x-delay", (-Math.random() * 24) + "s");
      flake.style.setProperty("--x-sway", (-45 + Math.random() * 90) + "px");
      layer.appendChild(flake);
    }
    document.body.appendChild(layer);
  }

  function addSanta() {
    if (document.getElementById("christmas-santa-badge")) return;
    const badge = document.createElement("div");
    badge.id = "christmas-santa-badge";
    badge.setAttribute("role", "img");
    badge.setAttribute("aria-label", "Santa is here — active Christmas season");
    badge.innerHTML =
      '<span class="xmas-santa" aria-hidden="true">🎅</span>' +
      '<span class="xmas-santa-copy"><b>SANTA IS HERE</b>' +
      '<small><i aria-hidden="true"></i> ACTIVE · MERRY CHRISTMAS</small></span>';
    document.body.appendChild(badge);
  }

  function removeDecorations() {
    ["christmas-garland","christmas-snowfall","christmas-santa-badge"].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.remove();
    });
  }

  function activeChristmasSession(now = Date.now()) {
    return sessions
      .filter(item => item &&
        item.enabled === true &&
        item.themeKey === "christmas" &&
        Number.isFinite(Number(item.startsAt)) &&
        Number.isFinite(Number(item.endsAt)) &&
        Number(item.startsAt) <= now &&
        Number(item.endsAt) > now)
      .sort((a, b) => Number(b.startsAt) - Number(a.startsAt))[0] || null;
  }

  function applyCurrentTheme() {
    const active = activeChristmasSession();
    const signature = active
      ? [active.id, active.title, active.decorations !== false, active.accentColour || "", active.backgroundColour || ""].join("|")
      : "default";
    if (signature === currentSignature) return;
    currentSignature = signature;

    const enabled = Boolean(active);
    document.documentElement.classList.toggle("christmas-theme-active", enabled);
    if (document.body) document.body.classList.toggle("christmas-theme-active", enabled);
    removeDecorations();
    if (!enabled) return;

    addStylesheet();
    if (active.decorations !== false) {
      addGarland();
      addSnowfall();
      addSanta();
    }
  }

  function scheduleNextBoundary() {
    if (nextTimer !== null) window.clearTimeout(nextTimer);
    const now = Date.now();
    const boundaries = sessions
      .filter(item => item && item.enabled === true)
      .flatMap(item => [Number(item.startsAt), Number(item.endsAt)])
      .filter(value => Number.isFinite(value) && value > now);
    const next = boundaries.length ? Math.min(...boundaries) : now + 60 * 60 * 1000;
    nextTimer = window.setTimeout(() => {
      applyCurrentTheme();
      scheduleNextBoundary();
    }, Math.min(Math.max(next - now + 100, 1000), 2147480000));
  }

  function refresh() {
    applyCurrentTheme();
    scheduleNextBoundary();
  }

  try {
    onSnapshot(
      doc(db, "websiteSettings", SETTINGS_DOC_ID),
      snapshot => {
        const data = snapshot.exists() ? snapshot.data() : {};
        sessions = Array.isArray(data.sessions) ? data.sessions : [];
        refresh();
      },
      error => {
        console.warn("Christmas theme status could not be loaded:", error);
        sessions = [];
        refresh();
      }
    );
  } catch (error) {
    console.warn("Christmas theme schedule listener could not start:", error);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  window.addEventListener("pageshow", refresh);
})();