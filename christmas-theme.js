/* Site-wide Christmas effects. Presentation only; no app/data logic. */
(() => {
  "use strict";
  if (window.__drSandaruwanChristmasMounted) return;
  window.__drSandaruwanChristmasMounted = true;

  const stylesheetUrl = new URL("./christmas-theme.css?v=20261115", import.meta.url).href;

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
      flake.style.setProperty("--x-left", `${Math.random() * 100}%`);
      flake.style.setProperty("--x-size", `${5 + Math.random() * 9}px`);
      flake.style.setProperty("--x-opacity", `${0.22 + Math.random() * 0.48}`);
      flake.style.setProperty("--x-duration", `${11 + Math.random() * 15}s`);
      flake.style.setProperty("--x-delay", `${-Math.random() * 24}s`);
      flake.style.setProperty("--x-sway", `${-45 + Math.random() * 90}px`);
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
    badge.innerHTML = `
      <span class="xmas-santa" aria-hidden="true">🎅</span>
      <span class="xmas-santa-copy">
        <b>SANTA IS HERE</b>
        <small><i aria-hidden="true"></i> ACTIVE · MERRY CHRISTMAS</small>
      </span>`;
    document.body.appendChild(badge);
  }

  function mount() {
    if (!document.body || !document.head) return;
    document.documentElement.classList.add("christmas-theme-active");
    document.body.classList.add("christmas-theme-active");
    addStylesheet();
    addGarland();
    addSnowfall();
    addSanta();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }

  window.addEventListener("pageshow", mount);
})();