import { db, collection, doc, setDoc, deleteDoc, onSnapshot } from "./firebase.js";

(() => {
  "use strict";
  const role = String(sessionStorage.getItem("adminRole") || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const loggedIn = sessionStorage.getItem("adminLoggedIn") === "true";
  const superAdmin = role === "full" || role === "superadmin";
  if (!loggedIn) {
    window.location.replace("admin-login.html");
    return;
  }
  if (!superAdmin) {
    window.location.replace("admin.html");
    return;
  }

  const $ = id => document.getElementById(id);
  const form = $("themeScheduleForm");
  const list = $("scheduleList");
  const msg = $("schedulerMessage");
  const saveBtn = $("saveScheduleBtn");
  const schedules = new Map();
  let editingId = null;

  const themeLabels = {
    default: "Default / Normal",
    halloween: "Halloween",
    christmas: "Christmas",
    "new-year": "New Year",
    avurudu: "Sinhala & Tamil New Year (Avurudu)",
    vesak: "Vesak",
    deepavali: "Deepavali",
    custom: "Custom Brand Theme"
  };

  const themeColors = {
    default: ["#0b1020", "#a6ff2e"],
    halloween: ["#0b1020", "#ff8a2a"],
    christmas: ["#071a17", "#4ade80"],
    "new-year": ["#0a1026", "#ffd166"],
    avurudu: ["#21130e", "#f8c34a"],
    vesak: ["#08152e", "#f6d76b"],
    deepavali: ["#1b101d", "#ffba4b"],
    custom: ["#0b1020", "#a6ff2e"]
  };

  function showMessage(text, isError = false) {
    msg.textContent = text || "";
    msg.classList.toggle("error", isError);
  }

  function colomboNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
  }

  function colomboInputToMs(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || "");
    if (!match) return NaN;
    const [, year, month, day, hour, minute] = match.map(Number);
    // Sri Lanka uses UTC+05:30. The input is always interpreted in Asia/Colombo.
    return Date.UTC(year, month - 1, day, hour, minute) - (5 * 60 + 30) * 60 * 1000;
  }

  function formatColombo(ms) {
    if (!Number.isFinite(Number(ms))) return "—";
    return new Intl.DateTimeFormat("en-LK", {
      timeZone: "Asia/Colombo", year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true
    }).format(new Date(Number(ms))) + " SLST";
  }

  function statusFor(item, now = Date.now()) {
    if (!item.enabled) return "paused";
    if (now < Number(item.startsAt)) return "upcoming";
    if (now >= Number(item.endsAt)) return "expired";
    return "active";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function updatePreview() {
    const key = $("themeKey").value;
    const colors = themeColors[key] || themeColors.custom;
    const accent = key === "custom" ? $("customAccent").value : colors[1];
    const background = key === "custom" ? $("customBackground").value : colors[0];
    $("previewSwatch").style.background = `linear-gradient(135deg,${background},${accent})`;
    $("previewName").textContent = themeLabels[key] || "Seasonal theme";
    $("previewDescription").textContent = key === "default"
      ? "The original website, login and dashboard styling will show during this session."
      : "This theme will be applied to the main website, login and student dashboard during the scheduled dates.";
    const isCustom = key === "custom";
    $("customThemeFields").hidden = !isCustom;
  }

  function resetForm() {
    form.reset();
    $("scheduleId").value = "";
    $("startsAt").value = colomboNow();
    $("endsAt").value = colomboInputDefaultEnd();
    $("scheduleEnabled").checked = true;
    $("decorationsEnabled").checked = true;
    editingId = null;
    $("formHeading").textContent = "Create a theme session";
    saveBtn.textContent = "Save schedule";
    $("cancelEditBtn").hidden = true;
    updatePreview();
  }

  function colomboInputDefaultEnd() {
    const end = Date.now() + 24 * 60 * 60 * 1000;
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(end));
    const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
  }

  function renderList() {
    const all = [...schedules.values()].sort((a, b) => Number(a.startsAt) - Number(b.startsAt));
    const now = Date.now();
    $("statTotal").textContent = String(all.length);
    $("statActive").textContent = String(all.filter(item => statusFor(item, now) === "active").length);
    $("statUpcoming").textContent = String(all.filter(item => statusFor(item, now) === "upcoming").length);

    if (!all.length) {
      list.innerHTML = '<div class="schedule-empty">No theme sessions yet. Create a session to schedule a seasonal design across the website.</div>';
      return;
    }

    list.innerHTML = all.map(item => {
      const status = statusFor(item, now);
      const statusText = { active: "LIVE NOW", upcoming: "SCHEDULED", expired: "ENDED", paused: "DISABLED" }[status];
      return `
        <article class="schedule-item" data-id="${escapeHTML(item.id)}">
          <div class="schedule-item-top">
            <div>
              <h3>${escapeHTML(item.title)}</h3>
              <p>${escapeHTML(themeLabels[item.themeKey] || item.themeKey)}</p>
            </div>
            <span class="schedule-badge ${status}">${statusText}</span>
          </div>
          <div class="schedule-meta">
            <span>Start: ${escapeHTML(formatColombo(item.startsAt))}</span>
            <span>End: ${escapeHTML(formatColombo(item.endsAt))}</span>
            <span>${item.decorations === false ? "Decorations off" : "Decorations on"}</span>
          </div>
          <div class="schedule-actions">
            <button class="schedule-action" type="button" data-action="edit" data-id="${escapeHTML(item.id)}">Edit</button>
            <button class="schedule-action" type="button" data-action="toggle" data-id="${escapeHTML(item.id)}">${item.enabled ? "Disable" : "Enable"}</button>
            <button class="schedule-action delete" type="button" data-action="delete" data-id="${escapeHTML(item.id)}">Delete</button>
          </div>
        </article>`;
    }).join("");
  }

  function editSchedule(id) {
    const item = schedules.get(id);
    if (!item) return;
    editingId = id;
    $("scheduleId").value = id;
    $("sessionTitle").value = item.title || "";
    $("themeKey").value = item.themeKey || "halloween";
    $("startsAt").value = msToColomboInput(item.startsAt);
    $("endsAt").value = msToColomboInput(item.endsAt);
    $("scheduleEnabled").checked = item.enabled === true;
    $("decorationsEnabled").checked = item.decorations !== false;
    $("customAccent").value = item.customAccent || "#a6ff2e";
    $("customBackground").value = item.customBackground || "#0b1020";
    $("formHeading").textContent = "Edit theme session";
    saveBtn.textContent = "Update schedule";
    $("cancelEditBtn").hidden = false;
    updatePreview();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function msToColomboInput(ms) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(Number(ms)));
    const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
  }

  async function saveSchedule(event) {
    event.preventDefault();
    const title = $("sessionTitle").value.trim();
    const themeKey = $("themeKey").value;
    const startsAt = colomboInputToMs($("startsAt").value);
    const endsAt = colomboInputToMs($("endsAt").value);
    if (!title) return showMessage("Please enter a session name.", true);
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
      return showMessage("The end date and time must be later than the start date and time.", true);
    }
    if (themeKey === "custom") {
      for (const id of ["customAccent", "customBackground"]) {
        if (!/^#[0-9a-f]{6}$/i.test($(id).value)) return showMessage("Please select valid custom theme colours.", true);
      }
    }

    const id = editingId || (window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : "theme-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9));
    const old = schedules.get(id);
    const record = {
      title,
      themeKey,
      startsAt,
      endsAt,
      timeZone: ZONE,
      enabled: $("scheduleEnabled").checked,
      decorations: $("decorationsEnabled").checked,
      customAccent: themeKey === "custom" ? $("customAccent").value : "",
      customBackground: themeKey === "custom" ? $("customBackground").value : "",
      createdAt: old?.createdAt || Date.now(),
      updatedAt: Date.now(),
      createdBy: old?.createdBy || sessionStorage.getItem("adminUsername") || "Super Admin",
      updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin"
    };

    saveBtn.disabled = true;
    showMessage("Saving schedule…");
    try {
      await setDoc(doc(db, COLLECTION, id), record);
      showMessage("Schedule saved. All public pages will update automatically.");
      resetForm();
    } catch (error) {
      console.error("Could not save theme schedule:", error);
      showMessage("Could not save. Check Firestore permissions and try again.", true);
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function toggleSchedule(id) {
    const item = schedules.get(id);
    if (!item) return;
    try {
      await setDoc(doc(db, COLLECTION, id), { enabled: !item.enabled, updatedAt: Date.now(), updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin" }, { merge: true });
      showMessage(item.enabled ? "Schedule disabled. The public pages will return to the next active session or default theme." : "Schedule enabled.");
    } catch (error) {
      console.error(error);
      showMessage("Could not update this schedule. Check Firestore permissions.", true);
    }
  }

  async function deleteSchedule(id) {
    const item = schedules.get(id);
    if (!item || !window.confirm(`Delete the "${item.title}" theme session?`)) return;
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      showMessage("Theme session deleted.");
      if (editingId === id) resetForm();
    } catch (error) {
      console.error(error);
      showMessage("Could not delete this schedule. Check Firestore permissions.", true);
    }
  }

  form.addEventListener("submit", saveSchedule);
  $("cancelEditBtn").addEventListener("click", resetForm);
  $("themeKey").addEventListener("change", updatePreview);
  $("customAccent").addEventListener("input", updatePreview);
  $("customBackground").addEventListener("input", updatePreview);
  $("refreshClockBtn").addEventListener("click", () => {
    $("colomboClock").textContent = formatColombo(Date.now());
  });
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "edit") editSchedule(id);
    if (action === "toggle") toggleSchedule(id);
    if (action === "delete") deleteSchedule(id);
  });

  $("adminName").textContent = sessionStorage.getItem("adminUsername") || "Super Admin";
  $("colomboClock").textContent = formatColombo(Date.now());
  window.setInterval(() => $("colomboClock").textContent = formatColombo(Date.now()), 30000);
  resetForm();

  onSnapshot(collection(db, COLLECTION), snapshot => {
    schedules.clear();
    snapshot.forEach(item => schedules.set(item.id, { id: item.id, ...item.data() }));
    renderList();
  }, error => {
    console.error("Could not load theme schedules:", error);
    list.innerHTML = '<div class="schedule-empty">Could not load schedules. Check Firestore collection read permissions.</div>';
    showMessage("Unable to read theme schedules from Firestore.", true);
  });
})();
