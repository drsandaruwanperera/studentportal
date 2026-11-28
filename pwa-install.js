(() => {
  "use strict";

  const isStandalone = () =>
    (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true;

  // Mark the installed PWA explicitly so app-only layout safeguards can
  // be applied without changing the normal browser website.
  if (isStandalone()) {
    document.documentElement.classList.add("installed-lms-app");
    document.documentElement.dataset.lmsDisplayMode = "standalone";
  }

  // Opening the installed LMS clears its Home Screen unread badge.
  // The service worker also clears the persisted unread IDs so new pushes
  // can start a fresh badge count after the student returns to the app.
  const clearLmsHomeScreenBadge = () => {
    if (!isStandalone()) return;
    try {
      if (typeof navigator.clearAppBadge === "function") {
        navigator.clearAppBadge().catch(() => {});
      }
    } catch (_) {}

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const worker = registration.active || registration.waiting;
        worker?.postMessage({ type: "LMS_CLEAR_APP_BADGE" });
      }).catch(() => {});
    }
  };

  clearLmsHomeScreenBadge();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") clearLmsHomeScreenBadge();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js?v=20261122-app-badge", { scope: "./", updateViaCache: "none" })
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
      <span class="pwa-install-icon" aria-hidden="true"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 17.5 24 7l20 10.5L24 28 4 17.5Z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><path d="M12 22.2v10.1c7.1 5.6 16.9 5.6 24 0V22.2M43.8 18v13" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="43.8" cy="34.5" r="2.5" fill="currentColor"/></svg></span>
      <span>Install LMS App</span>
    </button>
    <span class="pwa-install-help" role="status" aria-live="polite"></span>
  `;

  const button = wrapper.querySelector("button");
  const help = wrapper.querySelector(".pwa-install-help");
  let deferredPrompt = null;

  // iPadOS can present a desktop-style Safari user agent, so also
  // recognise iPads by their touch-capable Mac platform identifier.
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isAppleMobile =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMac = !isAppleMobile && /macintosh|mac os x/i.test(userAgent);
  const getManualInstallHelp = () => {
    if (isAppleMobile) {
      return "In Safari, tap Share → Add to Home Screen → Add. If “Open as Web App” appears, leave it turned on.";
    }
    if (isMac) {
      return "In Safari on macOS Sonoma 14 or later, choose Share → Add to Dock (or File → Add to Dock).";
    }
    return "Open your browser menu and choose Install app or Add to Home screen.";
  };

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
    .pwa-install-icon { display: grid; place-items: center; line-height: 1; }
    .pwa-install-icon svg { width: 19px; height: 19px; display: block; }
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
  // Join the action row below the login card when it exists (WOW layout):
  // the row lays Install (left) and WhatsApp (right) side by side on
  // short viewports. Fall back to body for any page without the row.
  const actionRow = document.getElementById("wowActionRow");
  if (actionRow) actionRow.appendChild(wrapper);
  else document.body.appendChild(wrapper);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.setAttribute("aria-label", "Install Dr. Sandaruwan LMS on this device");
  });

  button.addEventListener("click", async () => {
    help.classList.remove("visible");
    if (!deferredPrompt) {
      help.textContent = getManualInstallHelp();
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
      help.textContent = getManualInstallHelp();
      help.classList.add("visible");
    }
  });


  // Optional post-login install invitation. Website access is never gated.
  window.showLmsPostLoginInstallPrompt = (onContinue) => {
    const dismissedUntil = Number(localStorage.getItem("lmsInstallPromptDismissedUntil") || 0);
    if (isStandalone() || dismissedUntil > Date.now()) {
      onContinue?.();
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "lms-install-modal-backdrop";
    overlay.innerHTML = `
      <section class="lms-install-modal" role="dialog" aria-modal="true" aria-labelledby="lmsInstallTitle">
        <button class="lms-install-close" type="button" aria-label="Close">×</button>
        <div class="lms-install-art"><div class="lms-install-phone"><div class="lms-install-appicon">DS<span>LMS</span></div><i></i><i></i><i></i></div></div>
        <div class="lms-install-eyebrow">YOUR LEARNING SPACE</div>
        <h2 id="lmsInstallTitle">Install the Dr. Sandaruwan LMS App?</h2>
        <p class="lms-install-description">Get faster access to your learning dashboard with an app-like experience.</p>
        <div class="lms-install-benefits">
          <span>✓ Faster access</span><span>✓ Learning updates</span><span>✓ Study materials</span>
        </div>
        <p class="lms-install-help" aria-live="polite"></p>
        <button class="lms-install-primary" type="button">Install App</button>
        <button class="lms-install-later" type="button">Maybe Later</button>
        <div class="lms-install-footnote">You can continue using the website anytime.</div>
      </section>`;
    const close = () => { overlay.remove(); onContinue?.(); };
    const primary = overlay.querySelector(".lms-install-primary");
    const later = overlay.querySelector(".lms-install-later");
    const helpText = overlay.querySelector(".lms-install-help");
    const dismiss = () => {
      try { localStorage.setItem("lmsInstallPromptDismissedUntil", String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch (_) {}
      close();
    };
    overlay.querySelector(".lms-install-close").addEventListener("click", dismiss);
    later.addEventListener("click", dismiss);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) dismiss(); });
    primary.addEventListener("click", async () => {
      if (!deferredPrompt) {
        helpText.textContent = getManualInstallHelp();
        primary.textContent = "Continue to LMS";
        primary.onclick = close;
        return;
      }
      primary.disabled = true;
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      } catch (error) {
        console.warn("The LMS app installation prompt was unavailable.", error);
        helpText.textContent = getManualInstallHelp();
        primary.disabled = false;
        primary.textContent = "Continue to LMS";
        primary.onclick = close;
        return;
      }
      close();
    });
    document.body.appendChild(overlay);
    primary.focus();
  };

  const modalStyle = document.createElement("style");
  modalStyle.textContent = `
    .lms-install-modal-backdrop{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:rgba(3,10,24,.76);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font-family:Inter,"Segoe UI",Arial,sans-serif}
    .lms-install-modal{position:relative;width:min(430px,100%);padding:28px 26px 22px;border:1px solid rgba(148,190,220,.25);border-radius:25px;background:radial-gradient(circle at 50% 0,rgba(36,91,119,.45),transparent 43%),linear-gradient(155deg,#10263c,#071525 78%);color:#f6f9fc;text-align:center;box-shadow:0 28px 90px rgba(0,0,0,.48)}
    .lms-install-close{position:absolute;top:13px;right:16px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#dce8f2;font-size:23px;cursor:pointer}
    .lms-install-art{height:130px;display:grid;place-items:center;margin:-2px 0 13px}
    .lms-install-phone{width:78px;height:122px;padding:14px 9px 9px;border:3px solid #a8c2d1;border-radius:17px;background:linear-gradient(145deg,#173c56,#081a2d);box-shadow:0 12px 35px rgba(0,0,0,.35);transform:rotate(-7deg)}
    .lms-install-appicon{height:48px;width:48px;margin:3px auto 10px;display:grid;place-content:center;border-radius:13px;background:linear-gradient(145deg,#c7f36b,#72b83f);color:#102a36;font-weight:900;font-size:17px}
    .lms-install-appicon span{font-size:8px;letter-spacing:1px}
    .lms-install-phone i{display:block;height:4px;margin:6px 2px;border-radius:5px;background:rgba(199,231,242,.42)}
    .lms-install-eyebrow{color:#b8e96b;font-size:10px;font-weight:850;letter-spacing:2px}
    .lms-install-modal h2{margin:10px 0 9px;font-size:25px;line-height:1.17;font-weight:850;letter-spacing:-.7px}
    .lms-install-description{max-width:330px;margin:0 auto;color:#b8c7d4;font-size:13px;line-height:1.55}
    .lms-install-benefits{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:18px 0;color:#dce8ee;font-size:10px;font-weight:700}
    .lms-install-benefits span{padding:7px 9px;border:1px solid rgba(179,216,231,.13);border-radius:20px;background:rgba(255,255,255,.045)}
    .lms-install-help{margin:8px 0;color:#d9e7ef;font-size:12px;line-height:1.5}
    .lms-install-primary,.lms-install-later{width:100%;min-height:48px;border-radius:13px;font-weight:850;cursor:pointer}
    .lms-install-primary{margin-top:8px;border:0;background:linear-gradient(100deg,#d2f879,#9edc52);color:#142b24;box-shadow:0 9px 25px rgba(158,220,82,.18)}
    .lms-install-primary:disabled{opacity:.65;cursor:wait}
    .lms-install-later{margin-top:9px;border:1px solid rgba(220,236,245,.24);background:rgba(255,255,255,.055);color:#e5edf4}
    .lms-install-footnote{margin-top:14px;color:#91a4b5;font-size:10px}
    @media(max-width:420px){.lms-install-modal{padding:24px 19px 19px}.lms-install-modal h2{font-size:22px}}
  `;
  document.head.appendChild(modalStyle);

  window.addEventListener("appinstalled", () => wrapper.remove());
})();
