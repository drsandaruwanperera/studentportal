/* Synchronous seasonal-theme bootstrap.
   Reads the last Firestore-confirmed active season before first paint,
   so linked LMS tabs do not flash back to their legacy palette. */
(() => {
  "use strict";
  try {
    const raw = localStorage.getItem("drsp:active-season-theme:v1");
    if (!raw) return;
    const cached = JSON.parse(raw);
    const now = Date.now();
    const fresh = Number.isFinite(Number(cached.cachedAt)) &&
      now - Number(cached.cachedAt) < 24 * 60 * 60 * 1000;
    const stillActive = cached.themeKey === "christmas" &&
      Number.isFinite(Number(cached.endsAt)) &&
      Number(cached.endsAt) > now;
    if (!fresh || !stillActive) return;
    document.documentElement.classList.add("christmas-theme-active");
    document.documentElement.dataset.seasonThemeBootstrap = "cached";
  } catch (error) {
    // Theme caching must never block the student portal from opening.
  }
})();
