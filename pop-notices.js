import {
  db, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot
} from "./firebase.js";

(() => {
  "use strict";

  const role = String(sessionStorage.getItem("adminRole") || "")
    .trim().toLowerCase().replace(/[\s_-]+/g, "");
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
  const form = $("popNoticeForm");
  const list = $("noticeList");
  const message = $("formMessage");
  const saveButton = $("saveNoticeBtn");
  const cancelButton = $("cancelEditBtn");
  const noticesRef = collection(db, "popNotices");
  const seedRef = doc(db, "popNotices", "__existingExamCountdownsV1");
  const notices = new Map();
  let editingId = null;
  let activeFilter = "active";
  let latestItems = [];
  let unsubscribe = null;

  const fields = {
    title: $("noticeTitle"),
    subtitle: $("noticeSubtitle"),
    message: $("noticeMessage"),
    grade11: $("audienceGrade11"),
    al2027: $("audienceAL2027"),
    targetAt: $("countdownTargetAt"),
    startsAt: $("noticeStartsAt"),
    endsAt: $("noticeEndsAt"),
    buttonLabel: $("buttonLabel"),
    buttonUrl: $("buttonUrl"),
    enabled: $("noticeEnabled")
  };

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const toMillis = value => {
    if (value && typeof value.toMillis === "function") return value.toMillis();
    if (value instanceof Date) return value.getTime();
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  function parseColomboDate(value) {
    if (!value) return NaN;
    // datetime-local has no timezone. The admin form explicitly uses Sri Lanka time.
    return Date.parse(value + ":00+05:30");
  }

  function toColomboInput(value) {
    const ms = toMillis(value);
    if (!ms) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(ms));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return values.year + "-" + values.month + "-" + values.day + "T" +
      values.hour + ":" + values.minute;
  }

  function formatDate(value) {
    const ms = toMillis(value);
    if (!ms) return "Not set";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo", day: "2-digit", month: "short",
      year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).format(new Date(ms)) + " SL time";
  }

  function getStatus(item, now = Date.now()) {
    if (item.enabled === false) return "disabled";
    const start = toMillis(item.startsAt);
    const end = toMillis(item.endsAt);
    if (start && now < start) return "scheduled";
    if (end && now >= end) return "expired";
    if (start && end && start <= now && now < end) return "active";
    return "disabled";
  }

  function showMessage(text, isError = false) {
    message.textContent = text || "";
    message.classList.toggle("error", Boolean(isError));
    message.setAttribute("role", isError ? "alert" : "status");
  }

  async function seedExistingCountdowns() {
    const marker = await getDoc(seedRef);
    if (marker.exists()) return;

    const now = Date.now();
    const defaults = [
      {
        id: "grade11-exam-countdown-2026",
        title: "Grade 11",
        subtitle: "Annual Examination Countdown",
        message: "Official examination window: 08–17 December 2026 · Countdown to the first exam day.",
        audiences: ["grade11"],
        countdownLabel: "First exam day",
        targetAt: Date.parse("2026-12-08T00:00:00+05:30"),
        startsAt: now - 60000,
        endsAt: Date.parse("2026-12-18T00:00:00+05:30"),
        buttonLabel: "View Exam Details",
        buttonUrl: "my-program.html"
      },
      {
        id: "al2027-exam-countdown-2027",
        title: "A/L 2027",
        subtitle: "Final Examination Countdown",
        message: "Official examination window: 03–28 August 2027 · Countdown to the first exam day.",
        audiences: ["al2027"],
        countdownLabel: "First exam day",
        targetAt: Date.parse("2027-08-03T00:00:00+05:30"),
        startsAt: now - 60000,
        endsAt: Date.parse("2027-08-29T00:00:00+05:30"),
        buttonLabel: "View Exam Details",
        buttonUrl: "my-program.html"
      }
    ];

    for (const item of defaults) {
      const ref = doc(db, "popNotices", item.id);
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, {
          ...item,
          enabled: true,
          createdAt: now,
          updatedAt: now,
          createdBy: sessionStorage.getItem("adminUsername") || "Super Admin",
          updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin",
          seededFromDashboardCountdown: true
        });
      }
    }

    await setDoc(seedRef, {
      seedVersion: 1,
      seededAt: Date.now(),
      source: "dashboard-home-experience.js"
    });
  }

  function resetForm() {
    editingId = null;
    form.reset();
    fields.enabled.checked = true;
    fields.buttonLabel.value = "View Exam Details";
    fields.buttonUrl.value = "my-program.html";
    $("formTitle").textContent = "Create New Notice";
    saveButton.textContent = "Save Notice";
    cancelButton.hidden = true;
    fields.grade11.checked = false;
    fields.al2027.checked = false;
    const now = Date.now();
    fields.startsAt.value = toColomboInput(now - 60000);
    fields.endsAt.value = toColomboInput(now + 7 * 24 * 60 * 60 * 1000);
    fields.targetAt.value = "";
    showMessage("");
  }

  function editNotice(item) {
    editingId = item.id;
    fields.title.value = item.title || "";
    fields.subtitle.value = item.subtitle || "";
    fields.message.value = item.message || "";
    fields.grade11.checked = (item.audiences || []).includes("grade11");
    fields.al2027.checked = (item.audiences || []).includes("al2027");
    fields.targetAt.value = toColomboInput(item.targetAt);
    fields.startsAt.value = toColomboInput(item.startsAt);
    fields.endsAt.value = toColomboInput(item.endsAt);
    fields.buttonLabel.value = item.buttonLabel || "View Exam Details";
    fields.buttonUrl.value = item.buttonUrl || "my-program.html";
    fields.enabled.checked = item.enabled !== false;
    $("formTitle").textContent = "Edit Pop Notice";
    saveButton.textContent = "Save Changes";
    cancelButton.hidden = false;
    showMessage("Editing: " + (item.title || item.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const audiences = [];
    if (fields.grade11.checked) audiences.push("grade11");
    if (fields.al2027.checked) audiences.push("al2027");

    const targetAt = parseColomboDate(fields.targetAt.value);
    const startsAt = parseColomboDate(fields.startsAt.value);
    const endsAt = parseColomboDate(fields.endsAt.value);

    if (!audiences.length) {
      showMessage("Select at least one student batch.", true);
      return;
    }
    if (![targetAt, startsAt, endsAt].every(Number.isFinite)) {
      showMessage("Enter the countdown target and notice schedule dates.", true);
      return;
    }
    if (endsAt <= startsAt) {
      showMessage("The Hide after date must be later than the Show from date.", true);
      return;
    }
    if (targetAt <= 0) {
      showMessage("Choose a valid exam countdown date.", true);
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving…";
    showMessage("Saving notice to the student portal…");

    try {
      const id = editingId || doc(noticesRef).id;
      const old = editingId ? notices.get(editingId) : null;
      const now = Date.now();
      const data = {
        title: fields.title.value.trim(),
        subtitle: fields.subtitle.value.trim(),
        message: fields.message.value.trim(),
        audiences,
        targetAt,
        startsAt,
        endsAt,
        countdownLabel: old?.countdownLabel || "Exam day",
        buttonLabel: fields.buttonLabel.value.trim() || "View Exam Details",
        buttonUrl: fields.buttonUrl.value.trim() || "my-program.html",
        enabled: fields.enabled.checked,
        updatedAt: now,
        updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin"
      };
      if (!editingId) {
        data.createdAt = now;
        data.createdBy = sessionStorage.getItem("adminUsername") || "Super Admin";
      }
      await setDoc(doc(db, "popNotices", id), data, { merge: true });
      resetForm();
      showMessage("Notice saved. Matching students will see it after their next login.");
    } catch (error) {
      console.error("Pop notice save failed:", error);
      showMessage("Could not save. Firestore returned " + (error?.code || error?.message || "an unknown error") + ".", true);
    } finally {
      saveButton.disabled = false;
      if (!editingId) saveButton.textContent = "Save Notice";
    }
  });

  cancelButton.addEventListener("click", resetForm);

  function renderStats(items) {
    const counts = { active: 0, scheduled: 0, expired: 0 };
    items.forEach(item => {
      const status = getStatus(item);
      if (status === "active") counts.active++;
      else if (status === "scheduled") counts.scheduled++;
      else counts.expired++;
    });
    $("activeCount").textContent = counts.active;
    $("scheduledCount").textContent = counts.scheduled;
    $("expiredCount").textContent = counts.expired;
    $("activeTabCount").textContent = counts.active;
    $("scheduledTabCount").textContent = counts.scheduled;
    $("expiredTabCount").textContent = counts.expired;
    $("allTabCount").textContent = items.length;
    $("totalNotices").textContent = items.length + (items.length === 1 ? " notice" : " notices");
  }

  function renderList() {
    renderStats(latestItems);
    const filtered = latestItems.filter(item => activeFilter === "all" || getStatus(item) === activeFilter);
    if (!filtered.length) {
      list.innerHTML = '<div class="pop-empty-state">No ' + escapeHTML(activeFilter) + ' pop notices. Create a notice or switch the filter.</div>';
      return;
    }

    list.innerHTML = filtered.map(item => {
      const status = getStatus(item);
      const statusLabel = status === "active" ? "ACTIVE" : status === "scheduled" ? "SCHEDULED" : status === "expired" ? "EXPIRED" : "DISABLED";
      const audiences = (item.audiences || []).map(x => x === "grade11" ? "Grade 11" : x === "al2027" ? "A/L 2027" : x).join(" · ");
      return '<article class="pop-notice-item">' +
        '<div class="pop-notice-item-top"><div class="pop-notice-title"><span class="pop-notice-icon">▦</span><div><h3>' + escapeHTML(item.title || "Untitled notice") + '</h3><p>' + escapeHTML(item.subtitle || "Exam countdown") + '</p></div></div>' +
        '<span class="pop-status ' + status + '">' + statusLabel + '</span></div>' +
        '<div class="pop-notice-meta"><span class="pop-meta-chip">' + escapeHTML(audiences || "No audience") + '</span><span class="pop-meta-chip">Exam: ' + escapeHTML(formatDate(item.targetAt)) + '</span></div>' +
        '<p class="pop-notice-message">' + escapeHTML(item.message || "") + '</p>' +
        '<div class="pop-notice-actions"><button type="button" data-edit="' + escapeHTML(item.id) + '">Edit</button><button type="button" data-toggle="' + escapeHTML(item.id) + '">' + (item.enabled === false ? "Enable" : "Pause") + '</button><button type="button" class="delete" data-delete="' + escapeHTML(item.id) + '">Delete</button></div>' +
        '</article>';
    }).join("");

    list.querySelectorAll("[data-edit]").forEach(button => {
      button.addEventListener("click", () => {
        const item = notices.get(button.dataset.edit);
        if (item) editNotice(item);
      });
    });

    list.querySelectorAll("[data-toggle]").forEach(button => {
      button.addEventListener("click", async () => {
        const item = notices.get(button.dataset.toggle);
        if (!item) return;
        button.disabled = true;
        try {
          await setDoc(doc(db, "popNotices", item.id), {
            enabled: item.enabled === false,
            updatedAt: Date.now(),
            updatedBy: sessionStorage.getItem("adminUsername") || "Super Admin"
          }, { merge: true });
        } catch (error) {
          console.error(error);
          showMessage("Could not update the notice status: " + (error?.code || error?.message || "unknown error"), true);
        } finally {
          button.disabled = false;
        }
      });
    });

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", async () => {
        const item = notices.get(button.dataset.delete);
        if (!item || !confirm("Delete the pop notice “" + (item.title || item.id) + "”? Students will no longer receive it.")) return;
        button.disabled = true;
        try {
          await deleteDoc(doc(db, "popNotices", item.id));
          if (editingId === item.id) resetForm();
          showMessage("Pop notice deleted.");
        } catch (error) {
          console.error(error);
          showMessage("Could not delete the notice: " + (error?.code || error?.message || "unknown error"), true);
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(tab => tab.classList.toggle("active", tab === button));
      renderList();
    });
  });

  async function start() {
    $("adminName").textContent = sessionStorage.getItem("adminUsername") || "Super Admin";
    resetForm();

    try {
      await seedExistingCountdowns();
      unsubscribe = onSnapshot(noticesRef, snapshot => {
        notices.clear();
        latestItems = snapshot.docs
          .map(item => ({ id: item.id, ...item.data() }))
          .filter(item => !item.id.startsWith("__"))
          .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
        latestItems.forEach(item => notices.set(item.id, item));
        renderList();
        if (message.textContent.startsWith("Loading")) showMessage("");
      }, error => {
        console.error("Could not read Pop Notices:", error);
        list.innerHTML = '<div class="pop-empty-state">Could not load pop notices: ' + escapeHTML(error?.code || error?.message || "Firestore error") + '.</div>';
        showMessage("Firestore read failed. Check the popNotices collection rules.", true);
      });
    } catch (error) {
      console.error("Could not initialise Pop Notices:", error);
      list.innerHTML = '<div class="pop-empty-state">The countdown starter notices could not be loaded.</div>';
      showMessage("Initial setup failed: " + (error?.code || error?.message || "Firestore error") + ". Check Firestore read/write rules.", true);
    }
  }

  window.addEventListener("beforeunload", () => {
    if (typeof unsubscribe === "function") unsubscribe();
  });

  start();
})();