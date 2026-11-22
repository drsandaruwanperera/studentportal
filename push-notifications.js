import { app } from "./firebase.js";
import { isSupported, getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

(() => {
  const config = window.LMS_PUSH_CONFIG || {};
  const apiUrl = String(config.apiUrl || "").replace(/\/+$/, "");
  const vapidKey = String(config.vapidKey || "").trim();
  const studentId = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();

  if (!apiUrl || !vapidKey || sessionStorage.getItem("loggedIn") !== "true" || !studentId) return;

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
    const response = await fetch(apiUrl + "/health", { cache: "no-store" });
    const health = await response.json().catch(() => ({}));
    if (!response.ok || !health.configured) {
      throw new Error(health.error || "The notification service is not ready. Please try again.");
    }
    if (!messaging) messaging = getMessaging(app);
    attachForegroundListener(messaging);
    return messaging;
  };

  const sendSubscription = async token => {
    const response = await fetch(apiUrl + "/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentId,
        grade,
        token,
        platform: isAppleMobile ? "ios-web-app" : "web"
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not save notification settings.");
    return result;
  };

  const registerCurrentDevice = async () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return false;
    if (!(await isSupported())) return false;
    if (isAppleMobile && !isStandaloneApp) return false;

    const instance = await checkHealth();
    const registration = await navigator.serviceWorker.register("./service-worker.js?v=20261122-app-badge", {
      scope: "./",
      updateViaCache: "none"
    });
    await navigator.serviceWorker.ready;

    const token = await getToken(instance, {
      vapidKey,
      serviceWorkerRegistration: registration
    });
    if (!token) throw new Error("This device did not create a notification token.");

    await sendSubscription(token);
    rememberEnabledOnThisDevice();
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
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    document.body.style.overflow = originalOverflow;
    overlay.remove();
    style.remove();
  };

  const showUnsupportedFallback = () => {
    setStatus("Notifications are required to use the LMS on this device, but this browser does not support Web Push. On iPhone or iPad, install the LMS from Safari using Share → Add to Home Screen, then open the installed app. On other devices, use a supported browser.");
    button.disabled = true;
    button.textContent = "Notifications Not Supported";
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
        // Permission prompts must be opened directly from this user click.
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        if (permission === "denied") {
          setStatus("Notifications are blocked for this app. This setup is required. Open iPhone Settings → Notifications → Dr. Sandaruwan LMS → Allow Notifications, then return here and press Check Again.");
          button.textContent = "Check Again";
        } else {
          setStatus("Notification permission was not granted. Press Enable Notifications and choose Allow to continue.");
          button.textContent = "Try Again";
        }
        return;
      }

      const registered = await registerCurrentDevice();
      if (!registered) {
        throw new Error("This device could not complete notification registration. Keep this setup open and check the app installation, notification permission and internet connection.");
      }
      setStatus("Notifications are enabled for this device. Opening your LMS…");
      button.textContent = "Notifications Enabled ✓";
      window.setTimeout(unlock, 450);
    } catch (error) {
      console.error("LMS push notification setup failed:", error);
      setStatus(error?.message || "Could not enable notifications. Please try again.");
      button.textContent = "Try Again";
    } finally {
      if (!unlocked) button.disabled = false;
    }
  };

  button.addEventListener("click", enable);

  (async () => {
    try {
      if (
        !(await isSupported()) ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        showUnsupportedFallback();
        return;
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

      await checkHealth();
      setStatus(Notification.permission === "denied"
        ? "Notifications are currently blocked. Allow them in this site's browser settings, then press Check Again."
        : "Notification setup is required. Press Enable Notifications and choose Allow to register this device.");
      button.disabled = false;
      button.textContent = Notification.permission === "denied" ? "Check Again" : "Enable Notifications";
    } catch (error) {
      console.warn("LMS push service is not ready:", error);
      setStatus(error?.message || "The notification service is temporarily unavailable. Please retry.");
      button.disabled = false;
      button.textContent = "Retry Connection";
    }
  })();
})();