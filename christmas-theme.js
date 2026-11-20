import { db, doc, onSnapshot } from "./firebase.js";

(() => {
  "use strict";
  if (window.__drSandaruwanChristmasMounted) return;
  window.__drSandaruwanChristmasMounted = true;

  const SETTINGS_DOC_ID = "__themeSeasonSchedule";
  const stylesheetUrl = new URL("./christmas-theme.css?v=20261120-dashboard-ice", import.meta.url).href;
  const dashboardStylesheetUrl = new URL("./winter-dashboard-theme.css?v=20261120-transition-stable", import.meta.url).href;
  const DEFAULT_CHRISTMAS_EMOJIS = ["❄️", "🎄", "🎅", "🎁", "🔔", "⭐", "🦌", "🕯️"];
  let sessions = [];
  let currentSignature = "";
  let nextTimer = null;

  function addStylesheet() {
    let baseLink = document.getElementById("christmas-theme-stylesheet");
    if (!baseLink) {
      baseLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .find(item => /christmas-theme\\.css(?:\\?|$)/.test(item.href));
    }
    if (!baseLink) {
      baseLink = document.createElement("link");
      baseLink.rel = "stylesheet";
      document.head.appendChild(baseLink);
    }
    baseLink.id = "christmas-theme-stylesheet";
    baseLink.href = stylesheetUrl;

    let dashboardLink = document.getElementById("winter-dashboard-theme-stylesheet");
    if (!dashboardLink) {
      dashboardLink = document.createElement("link");
      dashboardLink.id = "winter-dashboard-theme-stylesheet";
      dashboardLink.rel = "stylesheet";
      document.head.appendChild(dashboardLink);
    }
    dashboardLink.href = dashboardStylesheetUrl;
  }

  function selectedEmojiSet(active) {
    if (Array.isArray(active.decorationEmojis)) {
      return active.decorationEmojis
        .map(value => String(value || "").trim())
        .filter(value => value && value.length <= 16)
        .slice(0, 12);
    }
    return DEFAULT_CHRISTMAS_EMOJIS;
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
    const flakes = ["❄", "❅", "❆", "❄", "❅"];
    const count = window.matchMedia("(max-width: 600px)").matches ? 14 : 24;
    for (let i = 0; i < count; i += 1) {
      const flake = document.createElement("span");
      flake.className = "xmas-snowflake";
      flake.textContent = flakes[i % flakes.length];
      flake.style.setProperty("--x-left", (Math.random() * 100) + "%");
      flake.style.setProperty("--x-size", (12 + Math.random() * 15) + "px");
      flake.style.setProperty("--x-opacity", (0.24 + Math.random() * 0.34).toString());
      flake.style.setProperty("--x-duration", (14 + Math.random() * 13) + "s");
      flake.style.setProperty("--x-delay", (-Math.random() * 24) + "s");
      flake.style.setProperty("--x-sway", (-55 + Math.random() * 110) + "px");
      layer.appendChild(flake);
    }
    document.body.appendChild(layer);
  }

  function addEmojiDecorations(active) {
    const emojis = selectedEmojiSet(active);
    if (!emojis.length || document.getElementById("christmas-emoji-decorations")) return;
    const layer = document.createElement("div");
    layer.id = "christmas-emoji-decorations";
    layer.setAttribute("aria-hidden", "true");
    const count = Math.min(18, Math.max(6, emojis.length * 2));
    for (let i = 0; i < count; i += 1) {
      const item = document.createElement("span");
      item.className = "xmas-floating-emoji";
      item.textContent = emojis[i % emojis.length];
      item.style.left = (4 + ((i * 37) % 92)) + "%";
      item.style.top = (10 + ((i * 23) % 80)) + "%";
      item.style.setProperty("--x-emoji-size", (17 + (i % 4) * 5) + "px");
      item.style.setProperty("--x-emoji-opacity", (0.22 + (i % 3) * 0.07).toString());
      item.style.setProperty("--x-emoji-duration", (9 + (i % 5) * 1.8) + "s");
      item.style.setProperty("--x-emoji-delay", (-((i * 1.7) % 12)) + "s");
      layer.appendChild(item);
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
    ["christmas-garland", "christmas-snowfall", "christmas-emoji-decorations", "christmas-santa-badge"].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.remove();
    });
  }

  function activeSiteSession(now = Date.now()) {
    return sessions
      .filter(item => item &&
        item.enabled === true &&
        item.themeKey &&
        Number.isFinite(Number(item.startsAt)) &&
        Number.isFinite(Number(item.endsAt)) &&
        Number(item.startsAt) <= now &&
        Number(item.endsAt) > now)
      .sort((a, b) => Number(b.startsAt) - Number(a.startsAt))[0] || null;
  }


  const THEME_CACHE_KEY = "drsp:active-season-theme:v1";

  function syncThemeCache() {
    try {
      const active = activeSiteSession();
      if (active && active.themeKey === "christmas") {
        localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({
          id: String(active.id || ""),
          themeKey: "christmas",
          endsAt: Number(active.endsAt),
          cachedAt: Date.now()
        }));
      } else {
        localStorage.removeItem(THEME_CACHE_KEY);
      }
    } catch (error) {
      console.warn("Could not synchronise seasonal theme cache:", error);
    }
  }

  function applyCurrentTheme() {
    const active = activeSiteSession();
    const isChristmas = Boolean(active && active.themeKey === "christmas");
    const signature = active
      ? [active.id, active.themeKey, active.title, active.decorations !== false,
          active.accentColour || "", active.backgroundColour || "",
          JSON.stringify(active.decorationEmojis ?? null)].join("|")
      : "default";
    if (signature === currentSignature) return;
    currentSignature = signature;

    removeDecorations();
    const stylesheet = document.getElementById("christmas-theme-stylesheet");

    if (!isChristmas) {
      document.documentElement.classList.remove("christmas-theme-active");
      if (document.body) document.body.classList.remove("christmas-theme-active");
      if (stylesheet) stylesheet.remove();
      if (!active) {
        document.documentElement.style.removeProperty("--season-accent");
        document.documentElement.style.removeProperty("--season-bg");
      }
      return;
    }

    const accent = /^#[0-9a-f]{6}$/i.test(active.accentColour || "") ? active.accentColour : "#a91f31";
    const background = /^#[0-9a-f]{6}$/i.test(active.backgroundColour || "") ? active.backgroundColour : "#07162d";
    document.documentElement.style.setProperty("--season-accent", accent);
    document.documentElement.style.setProperty("--season-bg", background);
    document.documentElement.classList.add("christmas-theme-active");
    if (document.body) document.body.classList.add("christmas-theme-active");

    addStylesheet();
    if (active.decorations !== false) {
      addGarland();
      addSnowfall();
      addEmojiDecorations(active);
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
        syncThemeCache();
        refresh();
      },
      error => {
        console.warn("Seasonal theme status could not be loaded:", error);
        sessions = [];
        refresh();
      }
    );
  } catch (error) {
    console.warn("Seasonal theme schedule listener could not start:", error);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  window.addEventListener("pageshow", refresh);
})();