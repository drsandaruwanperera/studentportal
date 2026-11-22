/* Lightweight shared LMS theme + automatic seasonal snowfall.
   No Firebase dependency and no changes to application behaviour. */
(() => {
  "use strict";
  if (window.__lmsBrandGlassRuntime) return;
  window.__lmsBrandGlassRuntime = true;

  const scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : window.location.href;
  const assetBase = new URL(".", scriptUrl);
  const cssUrl = new URL("brand-glass-theme.css?v=11", assetBase).href;

  document.documentElement.classList.add("lms-brand-glass", "student-glass-ui");
  document.documentElement.classList.remove("student-portal-winter-unified");
  document.querySelectorAll(
    'link[href*="winter-dashboard-theme.css"],link[href*="portal-winter-unified.css"]'
  ).forEach(item => item.remove());
  ["winter-dashboard-theme-stylesheet","portal-winter-unified-stylesheet"].forEach(id => {
    const oldLink = document.getElementById(id);
    if (oldLink) oldLink.remove();
  });
  let link = document.getElementById("lms-brand-glass-theme-stylesheet");
  if (!link) {
    link = document.createElement("link");
    link.id = "lms-brand-glass-theme-stylesheet";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = cssUrl;

  function inAutomaticWinterSeason(now = new Date()) {
    const month = now.getMonth();
    const day = now.getDate();
    return (month === 10 && day >= 20) || month === 11 || (month === 0 && day <= 5);
  }

  function ensureSnowfall() {
    const existingLayer = document.getElementById("christmas-snowfall");
    const automaticLayer = document.querySelector("#christmas-snowfall[data-lms-auto-snow='true']");
    const scheduledTheme = document.documentElement.classList.contains("christmas-theme-active");
    const winterSeason = inAutomaticWinterSeason();
    const reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!winterSeason && !scheduledTheme) {
      if (automaticLayer) automaticLayer.remove();
      return;
    }
    if (reduceMotion || existingLayer) return;
    const layer = document.createElement("div");
    layer.id = "christmas-snowfall";
    layer.dataset.lmsAutoSnow = "true";
    layer.setAttribute("aria-hidden", "true");
    const flakes = ["❄", "❅", "❆", "❄", "❅"];
    const count = window.matchMedia("(max-width: 600px)").matches ? 12 : 20;

    for (let i = 0; i < count; i += 1) {
      const flake = document.createElement("span");
      flake.className = "xmas-snowflake";
      flake.textContent = flakes[i % flakes.length];
      flake.style.setProperty("--x-left", (Math.random() * 100) + "%");
      flake.style.setProperty("--x-size", (11 + Math.random() * 13) + "px");
      flake.style.setProperty("--x-opacity", (0.20 + Math.random() * 0.23).toString());
      flake.style.setProperty("--x-duration", (17 + Math.random() * 15) + "s");
      flake.style.setProperty("--x-delay", (-Math.random() * 25) + "s");
      flake.style.setProperty("--x-sway", (-38 + Math.random() * 76) + "px");
      layer.appendChild(flake);
    }
    document.body.appendChild(layer);
  }

  const loginCssUrl = new URL("login-professional-theme.css?v=approved-purple-glass-4", assetBase).href;

  function ensureLoginGlassStylesheet() {
    if (!document.getElementById("loginBtn") && !document.getElementById("lms-app-splash")) return;
    let loginLink = document.getElementById("lms-login-glass-theme-stylesheet");
    if (!loginLink) {
      loginLink = document.createElement("link");
      loginLink.id = "lms-login-glass-theme-stylesheet";
      loginLink.rel = "stylesheet";
      document.head.appendChild(loginLink);
    }
    loginLink.href = loginCssUrl;
    document.head.appendChild(loginLink);
  }

  function refresh() {
    ensureSnowfall();
    // Keep the shared brand layer last, then place login/loading specifics above it.
    link.href = cssUrl;
    document.head.appendChild(link);
    ensureLoginGlassStylesheet();
  }

  refresh();
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });

  function scheduleDailyRefresh() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    window.setTimeout(() => {
      ensureSnowfall();
      scheduleDailyRefresh();
    }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
  }
  scheduleDailyRefresh();
})();
