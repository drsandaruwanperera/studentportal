(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("student-glass-ui");

  const page = (window.location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  const standaloneApp =
    (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true;
  const appProtectedPages = new Set([
    "dashboard.html", "dashboard-grade10.html", "dashboard-grade11.html",
    "my-program.html", "study.html", "progress.html", "results.html",
    "announcements.html", "support.html", "profile.html", "student-model-answers.html"
  ]);
  if (appProtectedPages.has(page)) {
    if (sessionStorage.getItem("loggedIn") !== "true") {
      window.location.replace("index.html");
      return;
    }
    if (!standaloneApp) {
      window.location.replace("app-required.html");
      return;
    }
  }

  // Some hosting routes and home-screen shortcuts serve the dashboard from "/" or an alias.
  // Detect the actual dashboard markup as well as the filename so the mobile navigation
  // and the teacher portrait are present on the page students are really viewing.
  const hasDashboardMarkup = !!document.querySelector(".dashboard-learning-banner, #learningProgram, .lms-stat-grid");
  const isDashboard = page === "dashboard.html" || page === "" ||
    page === "index.html" || page.includes("dashboard") || hasDashboardMarkup;
  const isStudy = page === "my-program.html" || page === "study.html";
  const isResults = page === "progress.html" || page === "results.html";
  const isAnnouncements = page === "announcements.html";
  const isSupport = page === "support.html";
  const isProfile = page === "profile.html";

  // Safari/iOS private browsing and privacy restrictions can throw when
  // sessionStorage is accessed. A blocked storage read must never stop the
  // shared header and mobile navigation from rendering.
  function readSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  const studentName = String(
    readSessionValue("studentName") ||
    readSessionValue("studentId") ||
    "Student"
  ).trim() || "Student";

  const studentInitial = Array.from(studentName)[0]?.toUpperCase() || "S";
  const appIcon = "./icons/dr-sandaruwan-lms-192.png?v=approved-2026-11-21";
  const teacherPhoto = "https://raw.githubusercontent.com/drsandaruwanperera/drsandaruwanperera.github.io/main/assets/sir-photo.png?v=20261122-portrait-fit";

  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    study: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10.5h8"/></svg>',
    results: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5V12M10 19.5V5M16 19.5V9M22 19.5V3.5"/><path d="M3 20.5h18"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>',
    announcements: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h3l10 4V6L6 10H3Z"/><path d="M6 14l2.5 5H12l-2-4.2M19 9l2-2M19 15l2 2"/></svg>',
    logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>'
  };

  function makeLink(href, label, icon, active) {
    const link = document.createElement("a");
    link.href = href;
    link.className = active ? "active" : "";
    link.innerHTML = icon + "<span>" + label + "</span>";
    if (active) link.setAttribute("aria-current", "page");
    return link;
  }

  function safeText(node, value) {
    if (node) node.textContent = value;
  }

  function buildMobileHeader() {
    const existing = document.querySelector(".shared-mobile-header");
    if (existing) {
      const avatar = existing.querySelector(".shared-header-student");
      if (avatar) {
        avatar.textContent = studentInitial;
        avatar.setAttribute("aria-label", studentName);
      }
      const announcementLink = existing.querySelector('.shared-header-action[href="announcements.html"]');
      if (announcementLink) {
        announcementLink.classList.add("shared-header-announcements");
        announcementLink.setAttribute("aria-label", "Announcements");
        announcementLink.setAttribute("title", "Announcements");
        announcementLink.innerHTML = icons.announcements + '<span class="shared-header-announcement-dot" aria-hidden="true"></span>';
      }
      return;
    }

    const header = document.createElement("header");
    header.className = "shared-mobile-header";

    const brand = document.createElement("a");
    brand.className = "shared-header-brand";
    brand.href = "dashboard.html";
    brand.setAttribute("aria-label", "Dr. Sandaruwan LMS home");

    const brandImage = document.createElement("img");
    brandImage.src = appIcon;
    brandImage.alt = "";
    const brandCopy = document.createElement("span");
    const brandName = document.createElement("strong");
    brandName.textContent = "Dr. Sandaruwan LMS";
    const brandSub = document.createElement("small");
    brandSub.textContent = "STUDENT PORTAL";
    brandCopy.append(brandName, brandSub);
    brand.append(brandImage, brandCopy);

    const announcements = document.createElement("a");
    announcements.className = "shared-header-action";
    announcements.href = "announcements.html";
    announcements.setAttribute("aria-label", "Announcements");
    announcements.classList.add("shared-header-announcements");
    announcements.title = "Announcements";
    announcements.innerHTML = icons.announcements + '<span class="shared-header-announcement-dot" aria-hidden="true"></span>';

    const avatar = document.createElement("span");
    avatar.className = "shared-header-student";
    avatar.textContent = studentInitial;
    avatar.setAttribute("aria-label", studentName);

    const logout = document.createElement("a");
    logout.className = "shared-header-action";
    logout.href = "index.html";
    logout.setAttribute("aria-label", "Log out");
    logout.innerHTML = icons.logout;

    header.append(brand, announcements, avatar, logout);
    document.body.insertBefore(header, document.body.firstChild);
  }

  function makeMoreButton() {
    const wrapper = document.createElement("div");
    wrapper.className = "shared-sidebar-more";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "shared-sidebar-more-trigger";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = icons.more + "<span>More</span><span class=\"shared-more-chevron\" aria-hidden=\"true\">⌄</span>";

    const panel = document.createElement("div");
    panel.className = "shared-sidebar-more-panel";
    panel.id = "sharedSidebarMorePanel";
    button.setAttribute("aria-controls", panel.id);
    panel.hidden = true;

    button.addEventListener("click", () => {
      const open = panel.hidden;
      panel.hidden = !open;
      button.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    });

    wrapper.append(button, panel);
    return { wrapper, button, panel };
  }

  function addMoreNavigation() {
    const nav = document.querySelector(".sidebar-nav") || document.querySelector(".side nav");
    if (!nav) return null;

    const labels = {
      "dashboard.html": "Dashboard",
      "my-program.html": "Study",
      "progress.html": "Results",
      "announcements.html": "Announcements",
      "support.html": "Support Team",
      "profile.html": "Profile"
    };
    const activePages = {
      "dashboard.html": isDashboard,
      "my-program.html": isStudy,
      "progress.html": isResults,
      "announcements.html": isAnnouncements,
      "support.html": isSupport,
      "profile.html": isProfile
    };

    Array.from(nav.querySelectorAll("a")).forEach(link => {
      const href = (link.getAttribute("href") || "").split("?")[0];
      if (!Object.prototype.hasOwnProperty.call(labels, href)) return;

      const label = link.querySelector("span:not(.nav-icon)");
      if (label) label.textContent = labels[href];
      const active = Boolean(activePages[href]);
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    // Desktop navigation keeps all destinations visible as normal sidebar links.
    // Only the compact mobile bottom bar uses its existing More sheet.
    nav.querySelectorAll(".shared-sidebar-more").forEach(node => node.remove());
    nav.dataset.sharedNavReady = "true";

    return {
      announcementLink: nav.querySelector('a[href="announcements.html"]'),
      supportLink: nav.querySelector('a[href="support.html"]'),
      profileLink: nav.querySelector('a[href="profile.html"]')
    };
  }

  function buildMobileNavigation(moreLinks) {
    const existing = document.querySelector(".shared-bottom-nav");
    if (existing) {
      const moreMenu = existing.querySelector(".shared-more-menu");
      if (moreMenu) {
        moreMenu.classList.toggle("is-current", isAnnouncements || isSupport || isProfile);
        moreMenu.addEventListener("toggle", () => {
          const trigger = moreMenu.querySelector("summary");
          if (trigger) trigger.setAttribute("aria-expanded", String(moreMenu.open));
        });
      }
      return;
    }

    const nav = document.createElement("nav");
    nav.className = "shared-bottom-nav";
    nav.setAttribute("aria-label", "Student navigation");

    const dashboard = makeLink("dashboard.html", "Dashboard", icons.dashboard, isDashboard);
    const study = makeLink("my-program.html", "Study", icons.study, isStudy);
    const results = makeLink("progress.html", "Results", icons.results, isResults);

    const portrait = document.createElement("button");
    portrait.type = "button";
    portrait.className = "shared-floating-teacher";
    portrait.style.setProperty("border", "3px solid #a6ff2e", "important");
    portrait.style.setProperty("background", "#a6ff2e", "important");
    portrait.style.setProperty("box-shadow", "0 0 0 4px rgba(166,255,46,.15), 0 9px 24px rgba(0,0,0,.34), 0 0 19px rgba(166,255,46,.28)", "important");
    portrait.setAttribute("aria-label", "Open AI Study Buddy with Dr. Sandaruwan");
    portrait.setAttribute("aria-controls", "studyBuddyPanel");
    portrait.setAttribute("aria-expanded", "false");
    portrait.title = "Open AI Study Buddy";
    const photo = document.createElement("img");
    photo.src = teacherPhoto;
    photo.alt = "Dr. Sandaruwan";
    photo.loading = "eager";
    photo.decoding = "async";
    photo.onerror = () => {
      photo.onerror = null;
      photo.src = appIcon;
    };
    const caption = document.createElement("span");
    caption.className = "shared-floating-teacher-caption";
    caption.textContent = "AI";
    portrait.append(photo, caption);
    portrait.addEventListener("click", () => {
      if (!isDashboard) {
        window.location.href = "dashboard.html#study-buddy";
        return;
      }
      if (typeof window.openStudentStudyAssistant === "function") {
        window.openStudentStudyAssistant();
      } else {
        const launcher = document.getElementById("studyBuddyLauncher");
        if (launcher) launcher.click();
      }
      portrait.setAttribute("aria-expanded", "true");
    });

    const more = document.createElement("button");
    more.type = "button";
    more.className = "shared-more-mobile-trigger" + ((isAnnouncements || isSupport || isProfile) ? " active" : "");
    more.setAttribute("aria-expanded", "false");
    more.setAttribute("aria-controls", "sharedMorePanel");
    more.innerHTML = icons.more + "<span>More</span>";

    const panel = document.createElement("div");
    panel.className = "shared-more-panel";
    panel.id = "sharedMorePanel";
    panel.setAttribute("aria-label", "More student options");

    (moreLinks || []).forEach(link => {
      const href = (link.getAttribute("href") || "").split("?")[0];
      const isAnnouncementLink = href === "announcements.html";
      const isProfileLink = href === "profile.html";
      const copy = document.createElement("a");
      copy.href = href;
      copy.className = "shared-more-link";
      copy.innerHTML = '<span aria-hidden="true">' + (isAnnouncementLink ? "◉" : isProfileLink ? "◎" : "✚") + "</span><strong>" +
        (isAnnouncementLink ? "Announcements" : isProfileLink ? "Profile" : "Support Team") + "</strong>";
      if ((isAnnouncements && isAnnouncementLink) || (isSupport && !isAnnouncementLink && !isProfileLink) || (isProfile && isProfileLink)) {
        copy.classList.add("active");
        copy.setAttribute("aria-current", "page");
      }
      panel.appendChild(copy);
    });

    more.addEventListener("click", () => {
      const open = !panel.classList.contains("open");
      panel.classList.toggle("open", open);
      more.classList.toggle("active", open || isAnnouncements || isSupport || isProfile);
      more.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", event => {
      if (!panel.contains(event.target) && !more.contains(event.target)) {
        panel.classList.remove("open");
        more.setAttribute("aria-expanded", "false");
        more.classList.toggle("active", isAnnouncements || isSupport || isProfile);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        panel.classList.remove("open");
        more.setAttribute("aria-expanded", "false");
        more.classList.toggle("active", isAnnouncements || isSupport || isProfile);
      }
    });

    nav.append(dashboard, study, portrait, results, more);
    document.body.append(panel, nav);
  }

  function updatePageTitles() {
    if (isStudy) {
      safeText(document.querySelector(".top h1"), "Study");
      const resourceTab = document.querySelector(".tabs .tab");
      if (resourceTab && resourceTab.textContent.trim() === "Accounting") {
        resourceTab.textContent = "Study Resources";
      }
      document.title = "Study | Dr. Sandaruwan LMS";
    } else if (isResults) {
      safeText(document.querySelector(".top h1"), "Results");
      safeText(document.querySelector(".top p"),
        "Published physical examination results and your paper progress.");
      document.title = "Results | Dr. Sandaruwan LMS";
    } else if (isAnnouncements) {
      document.title = "Announcements | Dr. Sandaruwan LMS";
    } else if (isSupport) {
      document.title = "Support Team | Dr. Sandaruwan LMS";
    } else if (isProfile) {
      document.title = "Profile | Dr. Sandaruwan LMS";
      safeText(document.querySelector(".top h1"), "Profile");
    }
  }

  function addDashboardGreetingAndPortrait() {
    if (!isDashboard) return;
    const copy = document.querySelector(".learning-banner-copy");
    if (!copy) return;

    if (!copy.querySelector(".shared-dashboard-greeting")) {
      const greeting = document.createElement("p");
      greeting.className = "shared-dashboard-greeting";
      const hourText = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Colombo",
        hour: "2-digit",
        hourCycle: "h23"
      }).format(new Date());
      const hour = Number(hourText);
      const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      greeting.append(document.createTextNode("Good " + part + ", "));
      const name = document.createElement("strong");
      name.textContent = studentName;
      greeting.appendChild(name);
      const first = copy.firstElementChild;
      copy.insertBefore(greeting, first || null);
    }

    if (!document.querySelector(".shared-banner-portrait")) {
      const portrait = document.createElement("div");
      portrait.className = "shared-banner-portrait";
      const image = document.createElement("img");
      image.src = teacherPhoto;
      image.alt = "Dr. Sandaruwan";
      image.loading = "eager";
      image.decoding = "async";
      image.onerror = () => {
        image.onerror = null;
        image.src = appIcon;
      };
      portrait.appendChild(image);
      // On mobile, place the teacher photo in the same compact row as the
      // date tile and greeting. Desktop keeps its original banner placement.
      const portraitHost = window.matchMedia("(max-width: 800px)").matches
        ? (document.querySelector(".dashboard-mobile-overview-top") || copy.parentElement)
        : copy.parentElement;
      portraitHost?.appendChild(portrait);
    }

    const journey = document.querySelector(".learning-orbit");
    if (journey) journey.remove();

    // Keep the original dashboard section labels and links intact.
    safeText(document.getElementById("programHeading"), "Your learning program");
  }

  function getColomboToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const get = type => Number(parts.find(part => part.type === type)?.value || 0);
    return { year: get("year"), month: get("month"), day: get("day") };
  }

  function buildCalendar() {
    if (!isDashboard || document.querySelector(".shared-agenda-grid")) return;
    const banner = document.querySelector(".dashboard-learning-banner");
    const exam = document.getElementById("examFocus");
    if (!banner || !exam) return;

    const agenda = document.createElement("section");
    agenda.className = "shared-agenda-grid";
    agenda.setAttribute("aria-label", "Calendar and upcoming exam");

    const calendar = document.createElement("div");
    calendar.className = "shared-calendar-card";
    calendar.innerHTML =
      '<div class="shared-calendar-head">' +
        '<button type="button" data-calendar-prev aria-label="Previous month">‹</button>' +
        '<strong data-calendar-title></strong>' +
        '<button type="button" data-calendar-next aria-label="Next month">›</button>' +
      '</div><div class="shared-calendar-grid" data-calendar-grid></div>';

    const learningVisual = document.createElement("aside");
    learningVisual.className = "shared-learning-visual";
    learningVisual.setAttribute("aria-label", "Your learning space");
    learningVisual.innerHTML = `
      <div class="shared-learning-visual-art" aria-hidden="true">
        <svg viewBox="0 0 240 156" role="presentation" focusable="false">
          <defs>
            <linearGradient id="lmsCapGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f4eaff"/>
              <stop offset=".52" stop-color="#a78bfa"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
            <linearGradient id="lmsBookGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#ffffff"/>
              <stop offset="1" stop-color="#c4b5fd"/>
            </linearGradient>
          </defs>
          <path class="shared-learning-orbit shared-learning-orbit-purple" d="M20 100C35 30 89 14 143 34s82 63 65 92-76 16-116 2S35 146 20 100Z"/>
          <path class="shared-learning-orbit shared-learning-orbit-green" d="M34 117C56 145 108 141 151 102s46-77 11-84"/>
          <g class="shared-learning-cap">
            <path d="m64 92 56-20 57 20-57 23-56-23Z" fill="url(#lmsCapGlow)" stroke="#f3e8ff" stroke-width="3" stroke-linejoin="round"/>
            <path d="M84 101v20c21 14 55 14 76 0v-20" fill="none" stroke="#c4b5fd" stroke-width="3" stroke-linejoin="round"/>
          </g>
          <g class="shared-learning-tassel">
            <path d="M177 92v30" stroke="#a6ff2e" stroke-width="3" stroke-linecap="round"/>
            <circle cx="177" cy="126" r="4" fill="#a6ff2e"/>
          </g>
          <g class="shared-learning-book">
            <path d="M52 130c18-13 36-13 58 1 22-14 42-14 63-1v19c-21-14-41-14-63 0-22-14-40-14-58 0v-19Z" fill="url(#lmsBookGlow)" stroke="#d9c8ff" stroke-width="2" stroke-linejoin="round"/>
            <path d="M110 132v17M68 135c13-6 25-5 39 3M125 138c14-8 27-9 41-3" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
          </g>
          <path class="shared-learning-sparkles" d="m35 46 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8ZM199 49l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6Z" fill="#f4eaff"/>
        </svg>
      </div>
      <strong>YOUR LEARNING SPACE</strong>
      <span>Keep moving forward</span>
    `;

    const placeholder = document.createElement("div");
    placeholder.className = "shared-next-event-placeholder";
    placeholder.innerHTML = "<strong>Next exam</strong><span>No examination date has been published for your programme yet. Details will appear here when scheduled.</span>";

    const mobileDashboardLayout = window.matchMedia("(max-width: 800px)").matches;
    if (mobileDashboardLayout) {
      const examStack = document.createElement("section");
      examStack.className = "shared-exam-stack";
      examStack.setAttribute("aria-label", "Upcoming milestone and exam information");
      examStack.append(exam, placeholder);

      agenda.append(calendar, learningVisual);
      banner.insertAdjacentElement("afterend", agenda);
      agenda.insertAdjacentElement("afterend", examStack);
    } else {
      // Retain the existing desktop calendar + exam layout.
      agenda.append(calendar, exam, placeholder);
      banner.insertAdjacentElement("afterend", agenda);
    }

    const today = getColomboToday();
    let viewYear = today.year;
    let viewMonth = today.month;
    const title = calendar.querySelector("[data-calendar-title]");
    const grid = calendar.querySelector("[data-calendar-grid]");

    const render = () => {
      const firstDay = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay();
      const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
      title.textContent = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }).format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)));

      const cells = [];
      ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(day => {
        const cell = document.createElement("span");
        cell.className = "shared-calendar-weekday";
        cell.textContent = day;
        cells.push(cell);
      });

      for (let i = 0; i < firstDay; i += 1) {
        const empty = document.createElement("span");
        empty.className = "shared-calendar-empty";
        cells.push(empty);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const cell = document.createElement("span");
        cell.className = "shared-calendar-day";
        cell.textContent = String(day);
        if (viewYear === today.year && viewMonth === today.month && day === today.day) {
          cell.classList.add("is-today");
          cell.setAttribute("aria-current", "date");
        }
        cells.push(cell);
      }
      grid.replaceChildren(...cells);
    };

    calendar.querySelector("[data-calendar-prev]")?.addEventListener("click", () => {
      viewMonth -= 1;
      if (viewMonth < 1) {
        viewMonth = 12;
        viewYear -= 1;
      }
      render();
    });

    calendar.querySelector("[data-calendar-next]")?.addEventListener("click", () => {
      viewMonth += 1;
      if (viewMonth > 12) {
        viewMonth = 1;
        viewYear += 1;
      }
      render();
    });

    const syncExamState = () => {
      const scheduled = !exam.hidden;
      placeholder.hidden = scheduled;
      exam.style.display = scheduled ? "" : "none";
    };

    new MutationObserver(syncExamState).observe(exam, {
      attributes: true,
      attributeFilter: ["hidden", "style", "class"]
    });
    window.setTimeout(syncExamState, 250);
    window.setTimeout(syncExamState, 1000);
    render();
  }

  function addAnnouncementFilters() {
    if (!isAnnouncements || document.querySelector(".shared-announcement-filters")) return;
    const host = document.getElementById("firestoreAnnouncementList");
    if (!host) return;

    const filters = document.createElement("div");
    filters.className = "shared-announcement-filters";
    filters.setAttribute("role", "group");
    filters.setAttribute("aria-label", "Filter announcements");

    const options = [
      ["all", "All"],
      ["important", "Important"],
      ["exam", "Exams"],
      ["general", "General"]
    ];

    function applyFilter(key) {
      host.querySelectorAll(".notice").forEach(card => {
        const category = card.dataset.sharedAnnouncementCategory || "general";
        card.hidden = key !== "all" && category !== key;
      });
    }

    options.forEach(([key, label], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.filter = key;
      button.classList.toggle("active", index === 0);
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => {
        filters.querySelectorAll("button").forEach(item => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        applyFilter(key);
      });
      filters.appendChild(button);
    });
    host.parentElement?.insertBefore(filters, host);

    const tagCards = () => {
      host.querySelectorAll(".notice").forEach(card => {
        const title = card.querySelector("h3")?.textContent || "";
        const message = card.querySelector(".notice-message")?.textContent || "";
        const content = (title + " " + message).toLowerCase();
        const category = /important|urgent|action required|deadline/.test(content)
          ? "important"
          : /exam|examination|timetable|test|assessment|paper result/.test(content)
            ? "exam"
            : "general";
        card.dataset.sharedAnnouncementCategory = category;
      });
      const selected = filters.querySelector("button.active")?.dataset.filter || "all";
      applyFilter(selected);
    };

    new MutationObserver(tagCards).observe(host, { childList: true, subtree: true });
    tagCards();
  }

  function resetDashboardScrollPosition() {
    if (!isDashboard || !window.matchMedia("(max-width: 800px)").matches || window.location.hash) return;
    try {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    } catch (_) {}
    const reset = () => {
      if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    requestAnimationFrame(() => requestAnimationFrame(reset));
    window.setTimeout(reset, 100);
    window.addEventListener("pageshow", event => {
      if (event.persisted) {
        reset();
        requestAnimationFrame(reset);
        window.setTimeout(reset, 80);
      }
    });
  }

  function init() {
    buildMobileHeader();
    const sidebarMore = addMoreNavigation();
    let moreLinks = sidebarMore
      ? [sidebarMore.announcementLink, sidebarMore.supportLink, sidebarMore.profileLink].filter(Boolean)
      : [];
    // Keep the More sheet usable even on pages that do not render a sidebar.
    if (!moreLinks.length) {
      moreLinks = [
        ["announcements.html", "Announcements"],
        ["support.html", "Support Team"],
        ["profile.html", "Profile"]
      ].map(([href, label]) => {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        return link;
      });
    }
    buildMobileNavigation(moreLinks);
    document.body.classList.add("student-mobile-navigation-ready");
    updatePageTitles();
    addDashboardGreetingAndPortrait();
    buildCalendar();
    addAnnouncementFilters();
    resetDashboardScrollPosition();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
