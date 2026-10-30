import { db, doc, getDoc, setDoc, deleteDoc, onSnapshot } from "./firebase.js";

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
  let saveInProgress = false;
  const ZONE = "Asia/Colombo";
  const SETTINGS_DOC_ID = "__themeSeasonSchedule";
  const scheduleDocumentRef = doc(db, "websiteSettings", SETTINGS_DOC_ID);
  const paletteDocumentRef = doc(db, "websiteSettings", "__themeSeasonPalette");
  const savedPalettes = new Map();

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
      testBtn.textContent = "Testing read/write…";
    }
    showMessage("Testing Firestore read and write permissions…");
    const testRef = doc(db, "websiteSettings", "__themeSeasonWriteTest");
    try {
      const before = await getDoc(scheduleDocumentRef);
      await setDoc(testRef, {
        test: true,
        checkedAt: Date.now(),
        checkedBy: sessionStorage.getItem("adminUsername") || "Admin"
      });
      const after = await getDoc(testRef);
      if (!after.exists() || after.data().test !== true) {
        throw new Error("The temporary write could not be read back.");
      }
      await deleteDoc(testRef);
      const count = before.exists() && Array.isArray(before.data().sessions)
        ? before.data().sessions.length
        : 0;
      showMessage("Firestore READ + WRITE + DELETE access OK. Saved sessions: " + count + ". You can now save a schedule.");
    } catch (error) {
      console.error("Theme scheduler read/write test failed:", error);
      showMessage("Firestore write test failed (" + (error?.code || "unknown") + "): " + (error?.message || "Check websiteSettings rules and publish them to answersheet2026."), true);
    } finally {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = "Test connection";
      }
    }
  }

  async function saveColourChoices() {
    const button = $("saveColoursBtn");
    const themeKey = $("themeKey").value;
    const accentColour = $("customAccent").value;
    const backgroundColour = $("customBackground").value;

    if (!/^#[0-9a-f]{6}$/i.test(accentColour) || !/^#[0-9a-f]{6}$/i.test(backgroundColour)) {
      showMessage("Choose valid Accent and Background colours before saving.", true);
      return;
    }

    button.disabled = true;
    button.textContent = "Saving colours…";
    showMessage("Saving the " + (themeLabels[themeKey] || "selected") + " colour pair…");
    try {
      const current = await getDoc(paletteDocumentRef);
      const existing = current.exists() && current.data().palettes && typeof current.data().palettes === "object"
        ? current.data().palettes
        : {};
      const palettes = {
        ...existing,
        [themeKey]: {
          accentColour,
          backgroundColour,
          updatedAt: Date.now(),
          updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin"
        }
      };

      await setDoc(paletteDocumentRef, {
        palettes,
        timeZone: ZONE,
        updatedAt: Date.now(),
        updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin"
      }, { merge: true });

      savedPalettes.set(themeKey, { accentColour, backgroundColour });
      updatePreview(false);
      $("colourSaveState").textContent = "Saved for " + (themeLabels[themeKey] || themeKey) + ". These colours will load next time you choose this preset.";
      showMessage("Colours saved successfully for " + (themeLabels[themeKey] || themeKey) + ". Now use Save schedule to publish them during a session.");
    } catch (error) {
      console.error("Could not save the theme colour pair:", error);
      showMessage("COLOUR SAVE FAILED (" + (error?.code || "unknown") + "): " + (error?.message || "Check websiteSettings write permission."), true);
    } finally {
      button.disabled = false;
      button.textContent = "Save colours";
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

    // Reuse a colour pair previously saved for this preset; otherwise load
    // the preset's built-in defaults whenever the preset is selected.
    if (applyPresetColours) {
      const saved = savedPalettes.get(key);
      $("customAccent").value = saved?.accentColour || colors[1];
      $("customBackground").value = saved?.backgroundColour || colors[0];
    }

    const accent = $("customAccent").value || colors[1];
    const background = $("customBackground").value || colors[0];
    $("previewSwatch").style.background = `linear-gradient(135deg,${background},${accent})`;
    $("previewName").textContent = themeLabels[key] || "Seasonal theme";
    $("previewDescription").textContent = key === "default"
      ? "Default appearance. The original site colours are shown outside this scheduled session."
      : "Choose your colours, save this preset's palette, then save a session to publish it.";
    $("customThemeFields").hidden = false;
    $("colourPresetHint").textContent = savedPalettes.has(key)
      ? "Your saved colour pair for this preset is loaded. You can change and save it again."
      : "Preset colours are filled automatically. Choose your own colours and use Save colours to remember them.";
    $("previewSwatch").style.borderColor = accent;
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
    event?.preventDefault?.();
    if (saveInProgress) return;
    let title = $("sessionTitle").value.trim();
    const themeKey = $("themeKey").value;
    const startsAt = colomboInputToMs($("startsAt").value);
    const endsAt = colomboInputToMs($("endsAt").value);
    // Generate a readable name when the admin leaves the optional title blank.
    if (!title && Number.isFinite(startsAt)) {
      const year = new Intl.DateTimeFormat("en-LK", {
        timeZone: "Asia/Colombo", year: "numeric"
      }).format(new Date(startsAt));
      title = (themeLabels[themeKey] || "Seasonal") + " " + year + " Session";
      $("sessionTitle").value = title;
    }
    if (!title) {
      showMessage("Enter a session name, or choose a theme so the scheduler can create a default name.", true);
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

    showMessage("Preparing your " + (themeLabels[themeKey] || "seasonal") + " session…");
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

    saveInProgress = true;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    showMessage("Saving “" + title + "” to Firebase…");
    try {
      const nextSchedules = new Map(schedules);
      nextSchedules.set(id, { id, ...record });
      await persistScheduleDocument(nextSchedules);
      showMessage("Schedule saved and verified in Firebase. " + schedules.size + " session(s) are now stored. The public pages will update automatically.");
      resetForm();
    } catch (error) {
      console.error("Could not save theme schedule:", error);
      showMessage("SAVE FAILED (" + (error?.code || "unknown") + "): " + (error?.message || "Check websiteSettings Firestore write access.") + " No success was reported; the schedule was not verified.", true);
    } finally {
      saveInProgress = false;
      saveBtn.disabled = false;
      saveBtn.textContent = editingId ? "Update schedule" : "Save schedule";
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
  // Support direct taps/clicks on mobile and desktop independently of form submit.
  saveBtn.type = "button";
  saveBtn.onclick = event => { void saveSchedule(event); };
  form.addEventListener("submit", event => { void saveSchedule(event); });
  window.saveThemeSchedule = event => saveSchedule(event);
  $("testConnectionBtn").addEventListener("click", testFirestoreConnection);
  $("saveColoursBtn").addEventListener("click", saveColourChoices);
  $("cancelEditBtn").addEventListener("click", resetForm);
  $("themeKey").addEventListener("change", () => {
    $("colourSaveState").textContent = "";
    updatePreview(true);
  });
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

  onSnapshot(paletteDocumentRef, snapshot => {
    const data = snapshot.exists() ? snapshot.data() : {};
    savedPalettes.clear();
    const palettes = data.palettes && typeof data.palettes === "object" ? data.palettes : {};
    Object.entries(palettes).forEach(([key, value]) => {
      if (value && /^#[0-9a-f]{6}$/i.test(value.accentColour || "") &&
          /^#[0-9a-f]{6}$/i.test(value.backgroundColour || "")) {
        savedPalettes.set(key, {
          accentColour: value.accentColour,
          backgroundColour: value.backgroundColour
        });
      }
    });
    const currentKey = $("themeKey").value;
    const saved = savedPalettes.get(currentKey);
    if (saved && !editingId) {
      $("customAccent").value = saved.accentColour;
      $("customBackground").value = saved.backgroundColour;
      updatePreview(false);
    }
  }, error => {
    console.warn("Saved theme colour presets could not be loaded:", error);
  });

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
