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
      '<p class="lms-push-gate-kicker">Required login step</p>' +
      '<h1 id="lmsPushGateTitle">Enable Notifications</h1>' +
      '<p class="lms-push-gate-copy" id="lmsPushGateDescription">Stay informed about important announcements, exam updates, results and student notices. Please enable notifications to continue to your LMS dashboard.</p>' +
      '<div class="lms-push-gate-status" role="status" aria-live="polite">Checking notification service…</div>' +
      '<button type="button" disabled>Checking…</button>' +
      '<small class="lms-push-gate-note">This confirmation appears after each login. If notifications were already allowed on this device, this step refreshes its registration without asking you again.</small>' +
    '</section>';
  document.body.appendChild(overlay);

  const button = overlay.querySelector("button");
  const status = overlay.querySelector(".lms-push-gate-status");
  const card = overlay.querySelector(".lms-push-gate-card");
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  let messaging = null;
  let serviceReady = false;
  let foregroundListenerReady = false;
  let unlocked = false;
  let unsupported = false;

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
    unsupported = true;
    setStatus("This browser or device does not support web push notifications. You can continue, but notifications will not be available on this device.");
    button.disabled = false;
    button.textContent = "Continue to LMS";
    button.addEventListener("click", unlock, { once: true });
  };

  const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandaloneApp = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true;

  const checkHealth = async () => {
    const response = await fetch(apiUrl + "/health", { cache: "no-store" });
    const health = await response.json().catch(() => ({}));
    if (!response.ok || !health.configured) {
      throw new Error(health.error || "The notification service is not ready. Please try again.");
    }
    serviceReady = true;
    if (!messaging) messaging = getMessaging(app);
    if (!foregroundListenerReady) {
      foregroundListenerReady = true;
      onMessage(messaging, payload => {
        const title = payload?.notification?.title || "Dr. Sandaruwan LMS";
        const body = payload?.notification?.body || "You have a new LMS update.";
        if (Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "./icons/dr-sandaruwan-lms-192.png",
            data: { url: payload?.data?.url || "./announcements.html" }
          });
        }
      });
    }
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

  const enable = async () => {
    if (unsupported) {
      unlock();
      return;
    }
    if (isAppleMobile && !isStandaloneApp) {
      window.location.href = "./app-required.html";
      return;
    }
    if (!serviceReady) {
      button.disabled = true;
      button.textContent = "Checking…";
      setStatus("Checking the notification service. Please wait.");
      try {
        await checkHealth();
        setStatus("The notification service is ready. Press Enable Notifications to continue.");
        button.textContent = "Enable Notifications";
      } catch (error) {
        setStatus(error?.message || "The notification service is temporarily unavailable.");
        button.textContent = "Retry Connection";
      } finally {
        button.disabled = false;
      }
      return;
    }

    button.disabled = true;
    button.textContent = "Enabling…";

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        // Keep the permission request directly inside the button's click gesture.
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        if (permission === "denied") {
          setStatus("Notifications are blocked for this site. Open your browser or device Site Settings, allow Notifications, then press Check Again here.");
          button.textContent = "Check Again";
        } else {
          setStatus("Notification permission was not granted. Press Enable Notifications and choose Allow to continue.");
          button.textContent = "Try Again";
        }
        return;
      }

      const registration = await navigator.serviceWorker.register("./service-worker.js", {
        scope: "./",
        updateViaCache: "none"
      });
      await navigator.serviceWorker.ready;

      if (!messaging) messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });
      if (!token) throw new Error("This device did not create a notification token. Please try again.");

      await sendSubscription(token);
      setStatus("Notifications are enabled and this device is registered. Opening your LMS…");
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
      const supported = await isSupported();
      if (!supported || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        showUnsupportedFallback();
        return;
      }

      if (isAppleMobile && !isStandaloneApp) {
        setStatus("On iPhone or iPad, open the installed LMS from your Home Screen to enable notifications. Add the LMS to your Home Screen first if you have not installed it.");
        const link = document.createElement("a");
        link.className = "lms-push-gate-link";
        link.href = "./app-required.html";
        link.textContent = "View app installation instructions";
        card.appendChild(link);
        button.disabled = false;
        button.textContent = "Open App Instructions";
        return;
      }

      await checkHealth();
      setStatus(Notification.permission === "denied"
        ? "Notifications are currently blocked. Allow them in this site's browser settings, then press Check Again."
        : "Press Enable Notifications to register this device and continue.");
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