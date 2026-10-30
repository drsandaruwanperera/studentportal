import { db, doc, getDoc, setDoc, onSnapshot } from "./firebase.js";

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
  const SETTINGS_DOC_ID = "__themeSeasonSchedule";
  const scheduleDocumentRef = doc(db, "websiteSettings", SETTINGS_DOC_ID);

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
    msg.setAttribute("role", isError ? "alert" : "status");
    msg.setAttribute("aria-live", "polite");
  }

  async function testFirestoreConnection() {
    const testBtn = $("testConnectionBtn");
    if (testBtn) {
      testBtn.disabled = true;
      testBtn.textContent = "Checking…";
    }
    showMessage("Checking Firestore access to answersheet2026 / websiteSettings / " + SETTINGS_DOC_ID + "…");
    try {
      const snapshot = await getDoc(scheduleDocumentRef);
      const data = snapshot.exists() ? snapshot.data() : {};
      const count = Array.isArray(data.sessions) ? data.sessions.length : 0;
      showMessage("Firestore connection OK. Read access confirmed. Saved sessions: " + count + ".");
      if (!snapshot.exists()) {
        showMessage("Firestore read access is OK, but the schedule document does not exist yet. Save a schedule to create it.");
      }
    } catch (error) {
      console.error("Theme scheduler Firestore connection test failed:", error);
      const code = error?.code || "unknown";
      const detail = error?.message || "No additional error details.";
      showMessage("Firestore check failed (" + code + "): " + detail + " Confirm that the websiteSettings rule was published in Firebase project answersheet2026.", true);
    } finally {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = "Test connection";
      }
    }
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

  function updatePreview(applyPresetColours = false) {
    const key = $("themeKey").value;
    const colors = themeColors[key] || themeColors.custom;

    // Choosing a preset automatically fills both colour controls.
    if (applyPresetColours) {
      $("customAccent").value = colors[1];
      $("customBackground").value = colors[0];
    }

    const accent = $("customAccent").value || colors[1];
    const background = $("customBackground").value || colors[0];
    $("previewSwatch").style.background = `linear-gradient(135deg,${background},${accent})`;
    $("previewName").textContent = themeLabels[key] || "Seasonal theme";
    $("previewDescription").textContent = key === "default"
      ? "Default appearance. The original site colours are shown outside this scheduled session."
      : "Preset colours are filled automatically. You can adjust the accent and background before saving.";
    $("customThemeFields").hidden = false;
    $("colourPresetHint").textContent = key === "custom"
      ? "Custom theme: choose both colours manually."
      : "Automatically filled from the selected preset. You can still fine-tune either colour.";
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
    updatePreview(true);
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
    const all = [...schedules.values()]
      .filter(item => item.meta !== true && item.id !== "_scheduler-migration-v1")
      .sort((a, b) => {
        const rank = { active: 0, upcoming: 1, paused: 2, expired: 3 };
        return rank[statusFor(a, Date.now())] - rank[statusFor(b, Date.now())] ||
          Number(b.startsAt) - Number(a.startsAt);
      });
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
        <article class="schedule-item ${status === "active" ? "active-session" : ""}" data-id="${escapeHTML(item.id)}">
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
    const presetColours = themeColors[item.themeKey] || themeColors.custom;
    $("customAccent").value = item.accentColour || item.customAccent || presetColours[1];
    $("customBackground").value = item.backgroundColour || item.customBackground || presetColours[0];
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
    if (!title) {
      showMessage("Please enter a session name before saving.", true);
      $("sessionTitle").focus();
      return;
    }
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
      showMessage("Please select both a valid start date/time and end date/time.", true);
      return;
    }
    if (endsAt <= startsAt) {
      showMessage("The end date and time must be later than the start date and time.", true);
      $("endsAt").focus();
      return;
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
      accentColour: $("customAccent").value,
      backgroundColour: $("customBackground").value,
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
      const nextSchedules = new Map(schedules);
      nextSchedules.set(id, { id, ...record });
      await persistScheduleDocument(nextSchedules);
      showMessage("Schedule saved successfully. The public pages will update automatically.");
      resetForm();
    } catch (error) {
      console.error("Could not save theme schedule:", error);
      showMessage("Save failed (" + (error?.code || "unknown") + "): " + (error?.message || "Check websiteSettings Firestore write access."), true);
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function toggleSchedule(id) {
    const item = schedules.get(id);
    if (!item) return;
    try {
      const nextSchedules = new Map(schedules);
      nextSchedules.set(id, {
        ...item,
        enabled: !item.enabled,
        updatedAt: Date.now(),
        updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin"
      });
      await persistScheduleDocument(nextSchedules);
      showMessage(item.enabled ? "Schedule disabled. The public pages will return to the next active session or the default theme." : "Schedule enabled.");
    } catch (error) {
      console.error(error);
      showMessage("Update failed (" + (error?.code || "unknown") + "): " + (error?.message || "Check websiteSettings Firestore write access."), true);
    }
  }

  async function deleteSchedule(id) {
    const item = schedules.get(id);
    if (!item || !window.confirm(`Delete the "${item.title}" theme session?`)) return;
    try {
      const nextSchedules = new Map(schedules);
      nextSchedules.delete(id);
      await persistScheduleDocument(nextSchedules);
      showMessage("Theme session deleted.");
      if (editingId === id) resetForm();
    } catch (error) {
      console.error(error);
      showMessage("Delete failed (" + (error?.code || "unknown") + "): " + (error?.message || "Check websiteSettings Firestore write access."), true);
    }
  }

  async function persistScheduleDocument(nextSchedules, extra = {}) {
    const sessions = [...nextSchedules.values()].map(item => ({ ...item }));
    await setDoc(scheduleDocumentRef, {
      sessions,
      timeZone: ZONE,
      updatedAt: Date.now(),
      updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin",
      ...extra
    }, { merge: true });
    const verification = await getDoc(scheduleDocumentRef);
    if (!verification.exists()) {
      throw new Error("The save request completed, but the schedule document could not be verified.");
    }
    const savedSessions = Array.isArray(verification.data().sessions) ? verification.data().sessions : [];
    schedules.clear();
    savedSessions.forEach(item => {
      if (item && item.id) schedules.set(item.id, item);
    });
    renderList();
  }

  form.noValidate = true;
  form.addEventListener("submit", saveSchedule);
  $("testConnectionBtn").addEventListener("click", testFirestoreConnection);
  $("cancelEditBtn").addEventListener("click", resetForm);
  $("themeKey").addEventListener("change", () => updatePreview(true));
  $("customAccent").addEventListener("input", updatePreview);
  $("customBackground").addEventListener("input", updatePreview);
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
  window.setInterval(() => { $("colomboClock").textContent = formatColombo(Date.now()); renderList(); }, 30000);
  resetForm();

  const HALLOWEEN_START = 1790793000000; // 2026-10-01 00:00 Asia/Colombo
  const HALLOWEEN_END = 1794681000000;   // 2026-11-15 00:00 Asia/Colombo
  let halloweenSeedInProgress = false;

  onSnapshot(scheduleDocumentRef, snapshot => {
    const data = snapshot.exists() ? snapshot.data() : {};
    schedules.clear();
    (Array.isArray(data.sessions) ? data.sessions : []).forEach(item => {
      if (item && item.id) schedules.set(String(item.id), item);
    });

    const withinHalloween = Date.now() >= HALLOWEEN_START && Date.now() < HALLOWEEN_END;
    const handled = data.legacyHalloweenHandled === true;
    const hasHalloween = schedules.has("halloween-2026-active");

    if (withinHalloween && !handled && !hasHalloween && !halloweenSeedInProgress) {
      halloweenSeedInProgress = true;
      const nextSchedules = new Map(schedules);
      nextSchedules.set("halloween-2026-active", {
        id: "halloween-2026-active",
        title: "Halloween 2026 · Existing live session",
        themeKey: "halloween",
        startsAt: HALLOWEEN_START,
        endsAt: HALLOWEEN_END,
        timeZone: ZONE,
        enabled: true,
        decorations: true,
        accentColour: "#ff8a2a",
        backgroundColour: "#0b1020",
        customAccent: "",
        customBackground: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: "Existing seasonal theme",
        updatedBy: "Theme Scheduler",
        migratedFromExistingSeason: true
      });
      list.innerHTML = '<div class="schedule-empty">Restoring the existing Halloween session…</div>';
      persistScheduleDocument(nextSchedules, { legacyHalloweenHandled: true })
        .then(() => showMessage("Existing Halloween session added and marked LIVE NOW."))
        .catch(error => {
          console.error("Could not restore the existing Halloween schedule:", error);
          renderList();
          showMessage("Halloween restore failed (" + (error?.code || "unknown") + "): " + (error?.message || "Check Firestore write permissions."), true);
        })
        .finally(() => { halloweenSeedInProgress = false; });
      return;
    }
    renderList();
  }, error => {
    console.error("Could not load theme schedules:", error);
    list.innerHTML = '<div class="schedule-empty">Theme sessions could not load. Firestore returned: ' + escapeHTML(error?.code || error?.message || "unknown error") + '.</div>';
    showMessage("Unable to read theme schedule document: " + (error?.code || error?.message || "unknown error"), true);
  });
})();
