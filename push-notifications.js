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
  style.textContent = ".lms-push-optin{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 18px;padding:15px 17px;border:1px solid rgba(166,255,46,.23);border-radius:16px;background:linear-gradient(120deg,rgba(91,75,255,.18),rgba(17,24,43,.94));box-shadow:0 12px 28px rgba(0,0,0,.16)}"+
    ".lms-push-optin-copy{min-width:0}.lms-push-optin strong{display:block;color:#f4f7ff;font-size:13px;font-weight:850}.lms-push-optin p{margin:5px 0 0;color:#aeb8ce;font-size:11px;line-height:1.5}"+
    ".lms-push-optin button{flex:none;min-height:40px;padding:0 14px;border:0;border-radius:11px;background:linear-gradient(135deg,#a6ff2e,#78d91e);color:#101827;font-size:11px;font-weight:900;cursor:pointer}"+
    ".lms-push-optin button:disabled{opacity:.6;cursor:wait}.lms-push-optin-status{margin-top:5px;color:#c4b5fd;font-size:10px}"+
    "@media(max-width:600px){.lms-push-optin{align-items:flex-start;flex-direction:column}.lms-push-optin button{width:100%}}";
  document.head.appendChild(style);
  const banner = document.createElement("section");
  banner.className = "lms-push-optin";
  banner.innerHTML = '<div class="lms-push-optin-copy"><strong>Get important LMS updates</strong><p>Allow notifications for announcements, exam updates and important student notices.</p><div class="lms-push-optin-status" role="status" aria-live="polite"></div></div><button type="button">Enable Notifications</button>';
  host.prepend(banner);
  const button = banner.querySelector("button");
  const status = banner.querySelector(".lms-push-optin-status");
  let messaging = null;
  const setStatus = message => { status.textContent = message || ""; };
  const sendSubscription = async token => {
    const response = await fetch(apiUrl + "/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentId, grade, token,
        platform: /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios-web-app" : "web"
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not save notification settings.");
    return result;
  };
  const enable = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("This browser does not support web notifications.");
      return;
    }
    const appleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    if (appleMobile && !installed) {
      setStatus("On iPhone or iPad, first use Share → Add to Home Screen, open the installed app, then enable notifications here.");
      return;
    }
    button.disabled = true;
    button.textContent = "Enabling…";
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "Notifications are blocked in browser settings. Allow them for this site to continue." : "Notification permission was not granted.");
        return;
      }
      const registration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      if (!messaging) messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token) throw new Error("The browser did not create a notification token. Please try again.");
      await sendSubscription(token);
      button.textContent = "Notifications Enabled ✓";
      button.disabled = true;
      setStatus("This device is registered for important LMS announcements.");
    } catch (error) {
      console.error("LMS push notification setup failed:", error);
      setStatus(error?.message || "Could not enable notifications. Please try again.");
      button.textContent = "Try Again";
    } finally {
      if (button.textContent !== "Notifications Enabled ✓") button.disabled = false;
    }
  };
  (async () => {
    try {
      if (!(await isSupported())) { banner.remove(); return; }
      const response = await fetch(apiUrl + "/health", { cache: "no-store" });
      const health = await response.json().catch(() => ({}));
      if (!response.ok || !health.configured) { banner.remove(); return; }
      if (Notification.permission === "granted") {
        await enable();
      } else if (Notification.permission === "denied") {
        setStatus("Notifications are blocked in this browser. You can allow them from site settings.");
        button.textContent = "Notification Settings";
      }
      if (!messaging) messaging = getMessaging(app);
      onMessage(messaging, payload => {
        const title = payload?.notification?.title || "Dr. Sandaruwan LMS";
        const body = payload?.notification?.body || "You have a new LMS update.";
        if (Notification.permission === "granted") new Notification(title, {
          body, icon: "./icons/dr-sandaruwan-lms-192.png",
          data: { url: payload?.data?.url || "./announcements.html" }
        });
      });
    } catch (error) {
      console.warn("LMS push service is not ready:", error);
      banner.remove();
    }
  })();
  button.addEventListener("click", enable);
})();
