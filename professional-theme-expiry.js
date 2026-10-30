/* Temporary professional theme scheduler.
   Restores the repository's existing default CSS at the Sri Lanka cutoff. */
(() => {
  "use strict";
  const CUTOFF_UTC = Date.parse("2026-11-14T18:30:00Z"); // 2026-11-15 00:00 Asia/Colombo
  const script = document.currentScript;
  const themeHref = script && script.getAttribute("data-theme-css");
  if (!themeHref || !document.head) return;

  let themeLink = null;
  let expiryTimer = null;

  function removeTemporaryTheme() {
    if (themeLink) {
      themeLink.disabled = true;
      themeLink.remove();
      themeLink = null;
    }
    if (expiryTimer !== null) {
      window.clearTimeout(expiryTimer);
      expiryTimer = null;
    }
  }

  function syncThemeWithClock() {
    const remaining = CUTOFF_UTC - Date.now();

    if (remaining <= 0) {
      removeTemporaryTheme();
      return;
    }

    if (!themeLink || !themeLink.isConnected) {
      themeLink = document.createElement("link");
      themeLink.rel = "stylesheet";
      themeLink.href = themeHref;
      themeLink.setAttribute("data-temporary-professional-theme", "true");
      document.head.appendChild(themeLink);
    }

    if (expiryTimer !== null) window.clearTimeout(expiryTimer);
    expiryTimer = window.setTimeout(syncThemeWithClock, remaining + 50);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncThemeWithClock();
  });
  window.addEventListener("pageshow", syncThemeWithClock);
  syncThemeWithClock();
})();
