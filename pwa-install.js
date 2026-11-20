(() => {
  "use strict";

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js", { scope: "./" })
        .catch((error) => {
          console.warn("LMS app setup could not register its service worker.", error);
        });
    });
  }

  if (isStandalone()) return;

  const wrapper = document.createElement("div");
  wrapper.className = "pwa-install-widget";
  wrapper.innerHTML = `
    <button class="pwa-install-button" type="button" aria-label="Install Dr. Sandaruwan LMS">
      <span class="pwa-install-icon" aria-hidden="true">🎓</span>
      <span>Install LMS App</span>
    </button>
    <span class="pwa-install-help" role="status" aria-live="polite"></span>
  `;

  const button = wrapper.querySelector("button");
  const help = wrapper.querySelector(".pwa-install-help");
  let deferredPrompt = null;

  const style = document.createElement("style");
  style.textContent = `
    .pwa-install-widget {
      position: fixed;
      left: 16px;
      bottom: 18px;
      z-index: 2500;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: calc(100vw - 32px);
      font-family: Inter, "Segoe UI", Arial, sans-serif;
    }
    .pwa-install-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
      padding: 0 16px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 999px;
      background: linear-gradient(135deg, #102b46, #1d526a);
      color: #fff;
      box-shadow: 0 10px 26px rgba(8,27,45,.24);
      font: 750 12px/1 Inter, "Segoe UI", Arial, sans-serif;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .pwa-install-button:focus-visible {
      outline: 3px solid #f2c56d;
      outline-offset: 3px;
    }
    .pwa-install-icon { font-size: 17px; line-height: 1; }
    .pwa-install-help {
      display: none;
      max-width: min(280px, calc(100vw - 48px));
      padding: 9px 12px;
      border: 1px solid #dce5ec;
      border-radius: 12px;
      background: #fff;
      color: #24364a;
      box-shadow: 0 8px 24px rgba(8,27,45,.12);
      font-size: 11px;
      line-height: 1.45;
    }
    .pwa-install-help.visible { display: block; }
    @media (max-width: 800px) {
      .pwa-install-widget { bottom: 88px; left: 12px; }
      .pwa-install-button { min-height: 42px; padding: 0 14px; }
    }
    @media (prefers-reduced-motion: no-preference) {
      .pwa-install-button { transition: transform .18s ease, box-shadow .18s ease; }
      .pwa-install-button:hover { transform: translateY(-2px); box-shadow: 0 13px 30px rgba(8,27,45,.3); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.setAttribute("aria-label", "Install Dr. Sandaruwan LMS on this device");
  });

  button.addEventListener("click", async () => {
    help.classList.remove("visible");
    if (!deferredPrompt) {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      help.textContent = isIOS
        ? "Tap Share, then choose Add to Home Screen."
        : "Open Chrome menu ⋮ and choose Install app or Add to Home screen.";
      help.classList.add("visible");
      return;
    }

    button.disabled = true;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (choice && choice.outcome === "accepted") {
        wrapper.remove();
      } else {
        button.disabled = false;
      }
    } catch (error) {
      console.warn("The LMS app installation prompt was unavailable.", error);
      button.disabled = false;
      help.textContent = "Open Chrome menu ⋮ and choose Install app or Add to Home screen.";
      help.classList.add("visible");
    }
  });

  window.addEventListener("appinstalled", () => wrapper.remove());
})();
