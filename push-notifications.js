import { app } from "./firebase.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

(() => {
  const config = window.LMS_PUSH_CONFIG || {};
  const apiUrl = String(config.apiUrl || "").replace(/\/+$/, "");
  const vapidKey = String(config.vapidKey || "").trim();
  const studentId = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();

  if (!apiUrl || !vapidKey || sessionStorage.getItem("loggedIn") !== "true" || !studentId) return;


  const withTimeout = (promise, timeoutMs, message) => new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }, timeoutMs);
    Promise.resolve(promise).then(value => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    }, error => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(error);
    });
  });

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000, message = "The notification server did not respond. Check your connection and try again.") => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
    } catch (error) {
      if (error?.name === "AbortError") throw new Error(message);
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  };


  const requestNotificationPermission = () => {
    // Modern Chrome, Samsung Internet and Safari implement the Promise form.
    // Call it without arguments directly from the Enable button's click handler.
    try {
      const result = Notification.requestPermission();
      if (result && typeof result.then === "function") return result;
      if (typeof result === "string") return Promise.resolve(result);

      // Compatibility fallback for older callback-only browsers.
      return new Promise((resolve, reject) => {
        try {
          const callbackResult = Notification.requestPermission(permission => resolve(permission));
          if (callbackResult && typeof callbackResult.then === "function") {
            callbackResult.then(resolve, reject);
          } else if (typeof callbackResult === "string") {
            resolve(callbackResult);
          }
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const browserFamily = (() => {
    const ua = navigator.userAgent || "";
    if (/SamsungBrowser/i.test(ua)) return "samsung";
    if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
    if (/Android/i.test(ua) && /Chrome|CriOS/i.test(ua)) return "chrome-android";
    if (/Android/i.test(ua)) return "android-other";
    if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/i.test(ua)) return "safari";
    if (/Edg/i.test(ua)) return "edge";
    if (/Firefox/i.test(ua)) return "firefox";
    if (/Chrome|Chromium/i.test(ua)) return "chrome";
    return "other";
  })();

  const getBrowserPermissionHelp = () => {
    if (browserFamily === "ios") {
      return {
        title: "Allow notifications on iPhone / iPad",
        steps: "1. iOS/iPadOS 16.4 or later is required for Web Push.<br>2. Add Dr. Sandaruwan LMS to the Home Screen from the browser Share menu.<br>3. Open the LMS using its Home Screen icon, then allow notifications when asked.",
        system: "Check Settings → Notifications → Dr. Sandaruwan LMS → Allow Notifications."
      };
    }
    if (browserFamily === "safari") {
      return {
        title: "Allow notifications in Safari",
        steps: "1. Open Safari → Settings → Websites → Notifications.<br>2. Find drsandaruwanperera.lk and set it to Allow.<br>3. Return to the LMS and press Try Again.",
        system: "Also check macOS System Settings → Notifications → Safari."
      };
    }
    if (browserFamily === "samsung") {
      return {
        title: "Allow notifications in Samsung Internet",
        steps: "1. Open Samsung Internet → Menu → Settings → Sites and downloads → Notifications.<br>2. Allow notifications for drsandaruwanperera.lk.<br>3. Return to the LMS and press Try Again.",
        system: "Also check Android Settings → Apps → Samsung Internet → Notifications → Allow."
      };
    }
    if (browserFamily === "chrome-android" || browserFamily === "android-other") {
      return {
        title: "Allow notifications in your Android browser",
        steps: "1. Open the browser menu → Settings → Site settings → Notifications.<br>2. Allow notifications for drsandaruwanperera.lk.<br>3. Return to the LMS and press Try Again.",
        system: "Also check Android Settings → Apps → your browser → Notifications → Allow."
      };
    }
    return {
      title: "Allow notifications in your browser",
      steps: "1. Open this website's site controls beside the address bar.<br>2. Set Notifications to Allow for drsandaruwanperera.lk.<br>3. Return to the LMS and press Try Again.",
      system: "Check that the browser and operating system are up to date."
    };
  };

  const showBrowserPermissionHelp = () => {
    const existing = card.querySelector(".lms-push-android-help");
    if (existing) return;
    const details = getBrowserPermissionHelp();
    const help = document.createElement("div");
    help.className = "lms-push-android-help";
    help.innerHTML =
      '<strong>' + details.title + '</strong>' +
      '<span>' + details.steps + '</span>' +
      '<span class="lms-push-android-system">' + details.system + '</span>';
    card.insertBefore(help, button);
  };

  const getAudience = () => {
    const type = String(sessionStorage.getItem("studentType") || sessionStorage.getItem("studentGrade") || "").toLowerCase();
    if (type.includes("10")) return "grade10";
    if (type.includes("11")) return "grade11";
    if (type === "al" || type.includes("advanced") || type.includes("a/l")) {
      const year = String(sessionStorage.getItem("alYear") || "");
      return ["2027", "2028"].includes(year) ? "al" + year : "al";
    }
    return "";
  };

  const grade = getAudience();
  if (!grade) return;

  const host = document.querySelector("main.main-content, main.main, .main-content, main");
  if (!host) return;

  const enabledStorageKey = "drsLmsPushEnabledV2:" + encodeURIComponent(studentId);
  const refreshSessionKey = "drsLmsPushRefreshAttemptedV1:" + encodeURIComponent(studentId);
  const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandaloneApp = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true;

  const wasEnabledOnThisDevice = () => {
    try {
      return localStorage.getItem(enabledStorageKey) === "yes";
    } catch (_) {
      return false;
    }
  };

  const rememberEnabledOnThisDevice = () => {
    try {
      localStorage.setItem(enabledStorageKey, "yes");
      sessionStorage.setItem(refreshSessionKey, "yes");
    } catch (error) {
      console.warn("Could not save this device's notification preference.", error);
    }
  };

  let messaging = null;
  let foregroundListenerReady = false;

  const attachForegroundListener = instance => {
    if (foregroundListenerReady) return;
    foregroundListenerReady = true;
    onMessage(instance, async payload => {
      const title = payload?.notification?.title || payload?.data?.title || "Dr. Sandaruwan LMS";
      const body = payload?.notification?.body || payload?.data?.body || "You have a new LMS update.";
      if (Notification.permission !== "granted" || !("serviceWorker" in navigator)) return;

      try {
        // iOS Home Screen web apps display notifications via the service-worker
        // registration; the Notification constructor is not supported there.
        const registration = await navigator.serviceWorker.ready;
        const worker = registration.active || registration.waiting;
        worker?.postMessage({
          type: "LMS_ADD_APP_BADGE",
          announcementId: payload?.data?.announcementId || ("push-" + Date.now())
        });
        await registration.showNotification(title, {
          body,
          icon: "./icons/dr-sandaruwan-lms-192.png",
          badge: "./icons/dr-sandaruwan-lms-192.png",
          tag: "dr-sandaruwan-lms-" + String(payload?.data?.announcementId || Date.now()),
          renotify: false,
          data: { url: payload?.data?.url || "./announcements.html" }
        });
      } catch (error) {
        console.warn("Could not display the foreground LMS notification.", error);
      }
    });
  };


  const checkHealth = async () => {
    const response = await fetchWithTimeout(
      apiUrl + "/health",
      {},
      12000,
      "The notification server timed out. Check the internet connection and tap Retry Connection."
    );
    const health = await response.json().catch(() => ({}));
    if (!response.ok || !health.configured) {
      throw new Error(health.error || "The notification service is not ready. Please try again.");
    }
    if (!messaging) messaging = getMessaging(app);
    attachForegroundListener(messaging);
    return messaging;
  };

  const sendSubscription = async (token, report = () => {}) => {
    report("Saving this phone's notification registration…");
    const response = await fetchWithTimeout(
      apiUrl + "/subscribe",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId,
          grade,
          token,
          platform: isAppleMobile ? "ios-web-app" : browserFamily === "samsung" ? "samsung-internet" : browserFamily === "chrome-android" ? "chrome-android" : browserFamily === "safari" ? "safari-macos" : "web"
        })
      },
      15000,
      "The server did not save this phone's registration. Check your connection and tap Try Again."
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not save notification settings.");
    return result;
  };

  const registerCurrentDevice = async (report = () => {}) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return false;
    report("Checking notification support on this phone…");
    if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !window.crypto?.subtle) {
      throw new Error("This browser does not expose the Web Push APIs required by the LMS. Update the browser or use Chrome, Samsung Internet, or a supported Safari version.");
    }
    if (isAppleMobile && !isStandaloneApp) return false;

    report("Connecting to the notification server…");
    const instance = await checkHealth();

    report("Installing the notification service on this phone…");
    const registration = await withTimeout(
      navigator.serviceWorker.register("./service-worker.js?v=20261122-app-badge", {
        scope: "./",
        updateViaCache: "none"
      }),
      15000,
      "The notification service could not be installed. Check your connection, reopen the LMS app and tap Try Again."
    );

    report("Activating the notification service…");
    const readyRegistration = await withTimeout(
      navigator.serviceWorker.ready,
      15000,
      "The notification service is still not active. Close other LMS tabs, reopen the installed app and try again."
    );
    const activeRegistration = readyRegistration.active ? readyRegistration : registration;
    if (!activeRegistration.active) {
      throw new Error("The notification service did not become active. Update Chrome, reopen the LMS app and try again.");
    }

    report("Creating this phone's secure notification token…");
    const token = await withTimeout(
      getToken(instance, {
        vapidKey,
        serviceWorkerRegistration: activeRegistration
      }),
      25000,
      "Firebase took too long to create this browser's notification token. Check the browser version and internet connection, then tap Try Again."
    );
    if (!token) {
      throw new Error("This browser did not create a notification token. Check its Web Push support, allow notifications for this website, and try again.");
    }

    await sendSubscription(token, report);
    rememberEnabledOnThisDevice();
    report("Notifications enabled. Opening your LMS…");
    return true;
  };

  // The setup gate is mandatory until this student has successfully
  // registered a push subscription on this device. A previously granted
  // browser permission alone is NOT proof that the device is registered.
  const alreadyEnabled = wasEnabledOnThisDevice();
  const permissionAlreadyGranted = "Notification" in window && Notification.permission === "granted";

  if (alreadyEnabled && permissionAlreadyGranted) {
    // Existing subscribers never see the setup again. Refresh their FCM token
    // silently once per app session to keep delivery registrations current.
    let attemptedThisSession = false;
    try {
      attemptedThisSession = sessionStorage.getItem(refreshSessionKey) === "yes";
      if (!attemptedThisSession) sessionStorage.setItem(refreshSessionKey, "yes");
    } catch (_) {}

    if (!attemptedThisSession) {
      registerCurrentDevice().catch(error => {
        console.warn("Silent LMS push subscription refresh failed; it will retry on the next app launch.", error);
        try { sessionStorage.removeItem(refreshSessionKey); } catch (_) {}
      });
    }
    return;
  }

  // If notification permission was revoked in iOS/browser settings, require
  // the student to restore it rather than silently bypassing setup.
  if (alreadyEnabled && !permissionAlreadyGranted) {
    try { localStorage.removeItem(enabledStorageKey); } catch (_) {}
  }

  const style = document.createElement("style");
  style.textContent = [
    ".lms-push-gate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;box-sizing:border-box;padding:22px;background:rgba(5,9,22,.82);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px)}",
    ".lms-push-gate *{box-sizing:border-box}",
    ".lms-push-gate-card{width:min(100%,440px);padding:clamp(25px,6vw,38px);border:1px solid rgba(167,139,250,.28);border-radius:25px;background:linear-gradient(155deg,#17213b 0%,#10182b 58%,#111827 100%);box-shadow:0 30px 100px rgba(0,0,0,.48);color:#f8fafc;text-align:center;font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif}",
    ".lms-push-gate-icon{width:66px;height:66px;display:grid;place-items:center;margin:0 auto 18px;border:1px solid rgba(167,139,250,.28);border-radius:21px;background:rgba(139,92,246,.16);font-size:30px}",
    ".lms-push-gate-kicker{margin:0 0 9px;color:#c4b5fd;font-size:10px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase}",
    ".lms-push-gate h1{margin:0;color:#fff;font-size:clamp(23px,5vw,29px);font-weight:850;letter-spacing:-.7px;line-height:1.18}",
    ".lms-push-gate-copy{margin:13px 0 0;color:#c3cce0;font-size:13px;line-height:1.7}",
    ".lms-push-gate-status{min-height:42px;display:flex;align-items:center;justify-content:center;margin:17px 0 13px;padding:10px 12px;border:1px solid rgba(148,163,184,.15);border-radius:12px;background:rgba(255,255,255,.045);color:#d6dced;font-size:11px;line-height:1.5}",
    ".lms-push-gate button{width:100%;min-height:50px;padding:0 18px;border:0;border-radius:14px;background:linear-gradient(110deg,#b8ff55,#7fe22b);color:#15210d;font:850 13px Inter,system-ui,sans-serif;box-shadow:0 12px 28px rgba(126,226,43,.2);cursor:pointer;transition:transform .18s ease,filter .18s ease}",
    ".lms-push-gate button:hover{filter:brightness(1.04);transform:translateY(-1px)}",
    ".lms-push-gate button:disabled{opacity:.65;cursor:wait;transform:none}",
    ".lms-push-gate-note{display:block;margin:14px 0 0;color:#929db4;font-size:10px;line-height:1.6}",
    ".lms-push-gate-link{display:inline-block;margin-top:12px;color:#c4b5fd;font-size:11px;font-weight:750;text-decoration:underline;text-underline-offset:3px}",
    ".lms-push-android-help{display:grid;gap:9px;margin:12px 0;padding:13px;border:1px solid rgba(166,255,46,.28);border-radius:13px;background:rgba(166,255,46,.07);text-align:left}",
    ".lms-push-android-help strong{color:#d7ff9e;font-size:11px;font-weight:850;line-height:1.4}",
    ".lms-push-android-help span{color:#e2e8f0;font-size:10px;line-height:1.65}",
    ".lms-push-android-help .lms-push-android-system{color:#bec9dd}",
    "@media(max-width:480px){.lms-push-gate{padding:16px}.lms-push-gate-card{border-radius:21px}.lms-push-gate-copy{font-size:12px}}",
    "@media(prefers-reduced-motion:reduce){.lms-push-gate button{transition:none}}"
  ].join("");
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "lms-push-gate";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "lmsPushGateTitle");
  overlay.setAttribute("aria-describedby", "lmsPushGateDescription");
  overlay.innerHTML =
    '<section class="lms-push-gate-card">' +
      '<div class="lms-push-gate-icon" aria-hidden="true">🔔</div>' +
      '<p class="lms-push-gate-kicker">One-time setup</p>' +
      '<h1 id="lmsPushGateTitle">Enable Notifications</h1>' +
      '<p class="lms-push-gate-copy" id="lmsPushGateDescription">Stay informed about important announcements, exam updates, results and student notices. Complete this one-time notification setup to continue to your LMS dashboard. You will not be asked again after successful registration.</p>' +
      '<div class="lms-push-gate-status" role="status" aria-live="polite">Checking notification service…</div>' +
      '<button type="button" disabled>Checking…</button>' +
      '<small class="lms-push-gate-note">You only need to complete this setup once on this device. After successful registration, this step will not appear again.</small>' +
    '</section>';
  document.body.appendChild(overlay);

  const button = overlay.querySelector("button");
  const status = overlay.querySelector(".lms-push-gate-status");
  const card = overlay.querySelector(".lms-push-gate-card");
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  let unlocked = false;

  const setStatus = message => {
    if (status) status.textContent = message || "";
    if (button && button.disabled && /^(Enabling|Working)…$/.test(button.textContent)) {
      button.textContent = "Working…";
    }
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    document.body.style.overflow = originalOverflow;
    overlay.remove();
    style.remove();
  };

  const showUnsupportedFallback = () => {
    let message = "This browser version does not provide all APIs required for Web Push. Update the browser and operating system, then reopen the LMS.";
    if (browserFamily === "ios") {
      message = "iPhone/iPad Web Push requires iOS/iPadOS 16.4 or later and the LMS installed from the Home Screen. Update the device and open the installed LMS app.";
    } else if (browserFamily === "samsung") {
      message = "Update Samsung Internet to the latest version. Then open the LMS website in Samsung Internet and allow notifications for this site.";
    } else if (browserFamily === "chrome" || browserFamily === "chrome-android") {
      message = "Update Google Chrome to the latest version, enable site notifications for drsandaruwanperera.lk, and reopen the LMS.";
    } else if (browserFamily === "safari") {
      message = "Web Push on Mac requires Safari 16 or later on macOS 13 or later. Update Safari/macOS and allow this website under Safari → Settings → Websites → Notifications.";
    }
    setStatus(message);
    button.disabled = true;
    button.textContent = "Update Browser to Enable";
    const link = document.createElement("a");
    link.className = "lms-push-gate-link";
    link.href = "./app-required.html";
    link.textContent = "View installation instructions";
    card.appendChild(link);
  };


  const enable = async () => {
    if (isAppleMobile && !isStandaloneApp) {
      window.location.href = "./app-required.html";
      return;
    }
    button.disabled = true;
    button.textContent = "Enabling…";

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        setStatus("Waiting for you to allow notifications…");
        permission = await withTimeout(
          requestNotificationPermission(),
          45000,
          "The browser did not finish the notification permission request. Follow the browser-specific steps below, then tap Try Again."
        );
      }
      if (permission !== "granted") {
        if (permission === "denied") {
          setStatus("Notifications are blocked for this website in this browser. Allow them in the browser's site settings and device notification settings, then tap Check Again.");
          showBrowserPermissionHelp();
          button.textContent = "Check Again";
        } else {
          setStatus("Notification permission was not granted. Press Enable Notifications and choose Allow to continue.");
          button.textContent = "Try Again";
        }
        return;
      }

      const registered = await withTimeout(
        registerCurrentDevice(setStatus),
        95000,
        "Notification setup took too long. Close extra LMS tabs, check your internet connection and tap Try Again. Your login is safe."
      );
      if (!registered) {
        throw new Error("This browser could not finish Web Push setup. Update the browser, allow notifications for this site, and try again.");
      }
      setStatus("Notifications are enabled for this device. Opening your LMS…");
      button.textContent = "Notifications Enabled ✓";
      window.setTimeout(unlock, 450);
    } catch (error) {
      console.error("LMS push notification setup failed:", error);
      setStatus(error?.message || "Could not enable notifications. Please try again.");
      if (/permission|timeout|timed out|did not finish/i.test(String(error?.message || ""))) {
        showBrowserPermissionHelp();
      }
      button.textContent = "Try Again";
    } finally {
      if (!unlocked) button.disabled = false;
    }
  };

  button.addEventListener("click", enable);

  (async () => {
    try {
      const browserHasWebPushApis =
        window.isSecureContext &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "indexedDB" in window &&
        "fetch" in window &&
        "crypto" in window &&
        Boolean(window.crypto?.subtle);
      if (!browserHasWebPushApis) {
        showUnsupportedFallback();
        return;
      }
      if (isAppleMobile) {
        const iosVersion = (navigator.userAgent.match(/OS (\d+)[._](\d+)/i) || []);
        if (iosVersion.length >= 3) {
          const major = Number(iosVersion[1]);
          const minor = Number(iosVersion[2]);
          if (major < 16 || (major === 16 && minor < 4)) {
            setStatus("This iPhone/iPad needs iOS/iPadOS 16.4 or later for Web Push. Update the device, add the LMS to the Home Screen, and open it from that icon.");
            button.disabled = true;
            button.textContent = "Update iOS to Enable";
            return;
          }
        }
      }

      if (isAppleMobile && !isStandaloneApp) {
        setStatus("Notification setup is required. On iPhone or iPad, open Dr. Sandaruwan LMS from its Home Screen icon. If it is not installed yet, use Safari → Share → Add to Home Screen.");
        const link = document.createElement("a");
        link.className = "lms-push-gate-link";
        link.href = "./app-required.html";
        link.textContent = "View app installation instructions";
        card.appendChild(link);
        button.disabled = true;
        button.textContent = "Open the Installed LMS App";
        link.addEventListener("click", () => {
          // Instructions only; the mandatory gate is not marked complete.
        });
        return;
      }

      setStatus("Checking the notification server…");
      await checkHealth();
      setStatus(Notification.permission === "denied"
        ? "Notifications are blocked for this website. Follow the browser-specific instructions below, allow notifications, then tap Check Again."
        : "Notification setup is required. Press Enable Notifications and choose Allow to register this device.");
      button.disabled = false;
      button.textContent = Notification.permission === "denied" ? "Check Again" : "Enable Notifications";
      if (Notification.permission === "denied") showBrowserPermissionHelp();
    } catch (error) {
      console.warn("LMS push service is not ready:", error);
      setStatus(error?.message || "The notification service is temporarily unavailable. Please retry.");
      button.disabled = false;
      button.textContent = "Retry Connection";
    }
  })();
})();