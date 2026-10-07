import { db, doc, getDoc, updateDoc, collection, getDocs, onSnapshot } from "./firebase.js";

const studentId = sessionStorage.getItem("studentId");
const studentRef = studentId ? doc(db, "students", studentId) : null;

function esc(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
    }[m]));
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function injectStyle() {
    if (document.querySelector('link[data-dashboard-enhancements="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "dashboard-enhancements.css?v=2";
    link.dataset.dashboardEnhancements = "1";
    document.head.appendChild(link);
}

function injectSidebarStyle() {
    if (document.getElementById("studentSidebarFixStyle")) return;

    const style = document.createElement("style");
    style.id = "studentSidebarFixStyle";
    style.textContent = `
        .sidebar { overflow-y:auto; overflow-x:hidden; }
        .sidebar-nav { flex-shrink:0; }
        .sidebar-spacer { flex:1 1 auto; min-height:12px; }
        .student-account { order:4; flex-shrink:0; }
        #logoutBtn.sidebar-logout {
            order:5;
            flex-shrink:0;
            margin-top:10px;
            margin-bottom:8px;
            min-height:44px;
            background:linear-gradient(135deg,#ef4444,#dc2626) !important;
            border:1px solid rgba(255,255,255,.12) !important;
            color:#fff !important;
            box-shadow:0 8px 18px rgba(239,68,68,.22);
            font-weight:700;
        }
        #logoutBtn.sidebar-logout:hover {
            background:linear-gradient(135deg,#dc2626,#b91c1c) !important;
            transform:translateY(-1px);
        }
    `;
    document.head.appendChild(style);
}

function cleanSidebarAndPlaceLogout() {
    const sidebar = document.querySelector(".sidebar");
    const logout = document.getElementById("logoutBtn");
    const account = document.querySelector(".student-account");
    const spacer = document.querySelector(".sidebar-spacer");

    if (sidebar && account && logout) {
        if (spacer) sidebar.insertBefore(spacer, account);
        sidebar.insertBefore(account, logout);
        sidebar.appendChild(logout);
    }

    if (logout && !logout.dataset.studentLogoutBound) {
        logout.dataset.studentLogoutBound = "1";
        logout.addEventListener("click", () => {
            [
                "loggedIn",
                "studentId",
                "studentType",
                "studentGrade",
                "studentName",
                "studentNIC"
            ].forEach((key) => sessionStorage.removeItem(key));
            window.location.replace("index.html");
        });
    }
}

function buildSections() {
    const content = document.querySelector(".content");
    if (!content || document.getElementById("dashboardEnhancements")) return;

    const wrap = document.createElement("div");
    wrap.id = "dashboardEnhancements";
    wrap.className = "dashboard-enhancements";
    wrap.innerHTML = `
        <div class="enhance-grid single-column">
            <section class="enhance-card target-card" id="targetSection">
                <div class="enhance-head">
                    <div>
                        <p class="enhance-eyebrow">MY TARGET</p>
                        <h2>Set Your Goal</h2>
                        <p class="enhance-muted">Choose the paper-completion target you want to reach.</p>
                    </div>
                    <span class="enhance-pill" id="targetPill">85%</span>
                </div>
                <div class="target-box">
                    <input id="targetInput" type="number" min="40" max="100" step="1" value="85" aria-label="Target percentage">
                    <span>% target</span>
                    <button class="target-save" id="targetSave" type="button">Save Target</button>
                </div>
                <div class="target-message" id="targetMessage"></div>
            </section>
        </div>

        <div class="enhance-grid">
            <section class="enhance-card" id="achievementSection">
                <div class="enhance-head">
                    <div>
                        <p class="enhance-eyebrow">ACHIEVEMENTS</p>
                        <h2>Keep Building Your Streak</h2>
                        <p class="enhance-muted">Milestones update from your real paper activity.</p>
                    </div>
                </div>
                <div class="achievement-list" id="achievementList"></div>
            </section>

            <section class="enhance-card" id="notificationSection">
                <div class="enhance-head">
                    <div>
                        <p class="enhance-eyebrow">NOTIFICATIONS</p>
                        <h2>Latest Updates</h2>
                        <p class="enhance-muted">Important notices from the portal.</p>
                    </div>
                </div>
                <div class="notification-list" id="portalNotificationList">
                    <div class="portal-empty">Loading updates…</div>
                </div>
            </section>
        </div>

        <section class="enhance-card" id="quickActionsSection">
            <div class="enhance-section-title">
                <p class="enhance-eyebrow">QUICK ACCESS</p>
                <h2>Continue Learning</h2>
            </div>
            <div class="quick-grid">
                <a class="quick-action" href="#" id="quickModel">
                    <span class="quick-action-icon">📘</span>
                    <span class="quick-action-copy"><strong>Model Papers</strong><small>Practice</small></span>
                </a>
                <a class="quick-action" href="#" id="quickPast">
                    <span class="quick-action-icon">📖</span>
                    <span class="quick-action-copy"><strong>Past Papers</strong><small>Examination</small></span>
                </a>
                <a class="quick-action" href="#" id="quickProgress">
                    <span class="quick-action-icon">📊</span>
                    <span class="quick-action-copy"><strong>My Progress</strong><small>Track learning</small></span>
                </a>
                <a class="quick-action" href="#" id="quickSupport">
                    <span class="quick-action-icon">🛟</span>
                    <span class="quick-action-copy"><strong>Support</strong><small>Get assistance</small></span>
                </a>
            </div>
        </section>
    `;

    const announcement = content.querySelector(".announcement-card");
    if (announcement) content.insertBefore(wrap, announcement);
    else content.appendChild(wrap);
}

function setupNavigation() {
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });
    const links = {
        myProgressNav: "summaryProgress",
        announcementsNav: "notificationSection",
        quickProgress: "summaryProgress",
        quickSupport: "supportNav",
        enhanceTargetNav: "targetSection",
        enhanceAchievementNav: "achievementSection",
        enhanceNotificationNav: "notificationSection"
    };

    Object.entries(links).forEach(([id, target]) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.enhanceBound === "1") return;
        el.dataset.enhanceBound = "1";
        el.addEventListener("click", (event) => {
            event.preventDefault();
            if (target === "supportNav") document.querySelector(".support-card")?.scrollIntoView({ behavior:"smooth" });
            else scrollTo(target);
        });
    });
}

function setupQuickLinks() {
    const pairs = [
        ["quickModel", "modelPapersCard"],
        ["quickPast", "pastPapersCard"],
        ["quickProgress", "summaryProgress"]
    ];
    pairs.forEach(([from, to]) => {
        const source = document.getElementById(from);
        const target = document.getElementById(to);
        if (!source || !target || source.dataset.bound === "1") return;
        source.dataset.bound = "1";
        source.addEventListener("click", (e) => {
            e.preventDefault();
            if (to === "summaryProgress") target.closest(".summary-card")?.scrollIntoView({ behavior:"smooth", block:"center" });
            else target.click();
        });
    });

    const support = document.getElementById("quickSupport");
    if (support && !support.dataset.bound) {
        support.dataset.bound = "1";
        support.addEventListener("click", (e) => {
            e.preventDefault();
            document.querySelector(".support-card")?.scrollIntoView({ behavior:"smooth" });
        });
    }
}

function animateNumber(element, target, suffix = "", duration = 900) {
    if (!element) return;
    const end = Number(target) || 0;
    const start = 0;
    const started = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    function frame(now) {
        const progress = Math.min(1, (now - started) / duration);
        const value = Math.round(start + (end - start) * ease(progress));
        element.textContent = `${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function animateProgressFill(fill, target, duration = 1100) {
    if (!fill) return;
    const end = clamp(Number(target) || 0, 0, 100);
    fill.style.width = "0%";
    requestAnimationFrame(() => {
        fill.style.width = `${end}%`;
        fill.style.transition = `width ${duration}ms cubic-bezier(.22,1,.36,1)`;
    });
}

function animateRealDashboardData() {
    const totalEl = document.getElementById("totalPapers");
    const viewedEl = document.getElementById("viewedPapers");
    const summaryProgress = document.getElementById("summaryProgress");
    const progressValue = document.getElementById("progressValue");
    const progressFill = document.getElementById("progressFill");

    const readNumber = (el) => {
        if (!el) return 0;
        const match = String(el.textContent || "").match(/\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : 0;
    };

    const total = readNumber(totalEl);
    const viewed = readNumber(viewedEl);
    const progress = clamp(readNumber(summaryProgress) || readNumber(progressValue), 0, 100);

    if (totalEl) animateNumber(totalEl, total, "", 950);
    if (viewedEl) animateNumber(viewedEl, viewed, "", 850);
    if (summaryProgress) animateNumber(summaryProgress, progress, "%", 1000);
    if (progressValue) animateNumber(progressValue, progress, "%", 1000);
    animateProgressFill(progressFill, progress);

    document.querySelectorAll(".summary-card").forEach((card, index) => {
        card.style.setProperty("--card-delay", `${index * 90}ms`);
        card.classList.add("data-animated");
    });
}

function getTrackedStats(data) {
    let total = 0;
    let viewed = 0;
    for (let i = 1; i <= 50; i++) {
        const key = `paper${String(i).padStart(2, "0")}Viewed`;
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            total++;
            if (data[key] === true) viewed++;
        }
    }
    return {
        total,
        viewed,
        progress: total ? Math.round((viewed / total) * 100) : 0
    };
}

function renderAchievements(stats, target) {
    const list = document.getElementById("achievementList");
    if (!list) return;
    const items = [
        ["📘", "First Step", stats.viewed >= 1, "Viewed your first tracked paper"],
        ["🔥", "5 Papers", stats.viewed >= 5, "Reached 5 tracked papers"],
        ["🏆", "10 Papers", stats.viewed >= 10, "Reached 10 tracked papers"],
        ["📈", "50% Progress", stats.progress >= 50, "Reached 50% completion"],
        ["🎯", "Target Reached", stats.progress >= target, `Reached your ${target}% target`]
    ];
    list.innerHTML = items.slice(0, 4).map(([icon, title, unlocked, text]) => `
        <div class="achievement" style="opacity:${unlocked ? 1 : .55}">
            <div class="achievement-icon">${icon}</div>
            <div><strong>${esc(title)}${unlocked ? " ✓" : ""}</strong><span>${esc(text)}</span></div>
        </div>
    `).join("");
}

function setupTarget(data, stats) {
    const input = document.getElementById("targetInput");
    const pill = document.getElementById("targetPill");
    const save = document.getElementById("targetSave");
    const msg = document.getElementById("targetMessage");

    let target = clamp(Number(data.targetPercentage ?? data.targetMark ?? data.target ?? 85), 40, 100);
    if (!Number.isFinite(target)) target = 85;
    if (input) input.value = target;
    if (pill) pill.textContent = `${target}%`;
    renderAchievements(stats, target);

    save?.addEventListener("click", async () => {
        const next = clamp(Number(input?.value || 85), 40, 100);
        save.disabled = true;
        try {
            if (!studentRef) throw new Error("Student session unavailable.");
            await updateDoc(studentRef, { targetPercentage: next });
            target = next;
            if (pill) pill.textContent = `${next}%`;
            renderAchievements(stats, target);
            if (msg) msg.textContent = "Target saved successfully.";
        } catch (error) {
            console.error(error);
            if (msg) {
                msg.textContent = "Could not save target. Please try again.";
                msg.style.color = "#c73555";
            }
        } finally {
            save.disabled = false;
        }
    });
}

function timestampValue(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function formatDate(value) {
    const ms = timestampValue(value);
    return ms ? new Date(ms).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "";
}

function normalizeGrade(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function announcementMatchesStudent(item) {
    if (item.enabled === false || item.active === false) return false;
    if (item.expiresAt && timestampValue(item.expiresAt) < Date.now()) return false;

    const studentGrade = normalizeGrade(
        sessionStorage.getItem("studentGrade") ||
        sessionStorage.getItem("studentType") ||
        ""
    );

    const target = item.grade ?? item.targetGrade ?? item.targetAudience ?? "all";

    if (Array.isArray(target)) {
        return target.some((value) => {
            const g = normalizeGrade(value);
            return !g || g === "all" || g === studentGrade ||
                (g === "grade10" && studentGrade.includes("10")) ||
                (g === "grade11" && studentGrade.includes("11")) ||
                (g === "al" && (studentGrade === "al" || studentGrade.includes("advanced")));
        });
    }

    const g = normalizeGrade(target);
    if (!g || g === "all" || g === "allstudents") return true;
    if (g === "grade10") return studentGrade.includes("10");
    if (g === "grade11") return studentGrade.includes("11");
    if (g === "al" || g === "alevel" || g === "advancedlevel") {
        return studentGrade === "al" || studentGrade.includes("advanced");
    }
    return g === studentGrade;
}

function announcementDate(value) {
    const ms = timestampValue(value);
    return ms ? new Date(ms).toLocaleDateString("en-GB", {
        day:"2-digit", month:"short", year:"numeric"
    }) : "Latest";
}

function ensureNotificationUI() {
    if (document.getElementById("portalNotificationPopover")) return;

    const bell = document.querySelector(".lms-notification");
    if (!bell) return;

    bell.innerHTML = `
        <span class="notification-bell-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg></span>
        <span class="notification-card-copy"><strong>Updates</strong><small>Notifications</small></span>
        <i class="notification-dot"></i>
        <b class="notification-count" id="notificationCount">0</b>
    `;

    const popover = document.createElement("div");
    popover.id = "portalNotificationPopover";
    popover.className = "portal-notification-popover";
    popover.innerHTML = `
        <div class="portal-popover-head">
            <div><strong>Notifications</strong><span>Latest updates for you</span></div>
            <button type="button" id="closeNotificationPopover">×</button>
        </div>
        <div id="portalNotificationItems" class="portal-notification-items">
            <div class="portal-empty">Loading updates…</div>
        </div>
        <a class="portal-notification-all" href="announcements.html">View all announcements →</a>
    `;
    document.body.appendChild(popover);

    const modal = document.createElement("div");
    modal.id = "announcementModal";
    modal.className = "announcement-modal";
    modal.innerHTML = `
        <div class="announcement-modal-backdrop" data-close-announcement></div>
        <article class="announcement-modal-card">
            <button type="button" class="announcement-modal-close" data-close-announcement>×</button>
            <div class="announcement-modal-icon">📢</div>
            <span class="announcement-modal-tag">ANNOUNCEMENT</span>
            <h2 id="announcementModalTitle">Portal Update</h2>
            <time id="announcementModalDate"></time>
            <p id="announcementModalMessage"></p>
            <div class="announcement-modal-actions">
                <a href="announcements.html" id="announcementModalViewAll">Open Announcements</a>
                <button type="button" data-close-announcement>Close</button>
            </div>
        </article>
    `;
    document.body.appendChild(modal);

    bell.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpening = !popover.classList.contains("open");
        popover.classList.toggle("open");
        if (isOpening) markNotificationsRead();
    });
    document.getElementById("closeNotificationPopover")?.addEventListener("click", () => popover.classList.remove("open"));
    document.addEventListener("click", (event) => {
        if (!popover.contains(event.target) && !bell.contains(event.target)) popover.classList.remove("open");
    });
    modal.querySelectorAll("[data-close-announcement]").forEach((el) => {
        el.addEventListener("click", () => modal.classList.remove("open"));
    });
}

function openAnnouncementModal(item) {
    ensureNotificationUI();
    const modal = document.getElementById("announcementModal");
    if (!modal) return;
    document.getElementById("announcementModalTitle").textContent = item.title || "Portal Update";
    document.getElementById("announcementModalDate").textContent = announcementDate(item.createdAt);
    document.getElementById("announcementModalMessage").textContent =
        item.message || item.description || "Important information for students.";
    const link = document.getElementById("announcementModalViewAll");
    link.href = item.id
        ? `announcements.html?id=${encodeURIComponent(item.id)}`
        : "announcements.html";
    modal.classList.add("open");
    document.getElementById("portalNotificationPopover")?.classList.remove("open");
}

function notificationReadKey() {
    return `lmsReadNotifications_${studentId || "guest"}`;
}

function getReadNotificationIds() {
    try {
        return JSON.parse(localStorage.getItem(notificationReadKey()) || "[]");
    } catch {
        return [];
    }
}

function saveReadNotificationIds(ids) {
    try {
        localStorage.setItem(notificationReadKey(), JSON.stringify(ids.slice(-100)));
    } catch {}
}

function markNotificationsRead(items = null) {
    const current = items || window.__portalNotificationItems || [];
    if (!current.length) return;
    const ids = current.map(x => x.id).filter(Boolean);
    const merged = [...new Set([...getReadNotificationIds(), ...ids])];
    saveReadNotificationIds(merged);
    renderNotificationItems(current);
}

function renderNotificationItems(items) {
    const list = document.getElementById("portalNotificationItems");
    const count = document.getElementById("notificationCount");
    const dot = document.querySelector(".notification-dot");
    if (!list) return;

    window.__portalNotificationItems = items;
    const readIds = new Set(getReadNotificationIds());
    const unreadItems = items.filter(item => !readIds.has(item.id));

    if (count) {
        count.textContent = unreadItems.length > 9 ? "9+" : String(unreadItems.length);
        count.style.display = unreadItems.length ? "grid" : "none";
    }
    if (dot) dot.style.display = unreadItems.length ? "block" : "none";

    if (!items.length) {
        list.innerHTML = '<div class="portal-empty">No new notifications right now.</div>';
        return;
    }

    list.innerHTML = items.map((x) => `
        <button type="button" class="portal-notification-item" data-announcement-id="${esc(x.id)}">
            <span class="portal-notification-item-icon">📢</span>
            <span class="portal-notification-item-copy">
                <strong>${esc(x.title || "Portal Update")}</strong>
                <small>${esc(x.message || x.description || "Important information for students.")}</small>
                <time>${esc(announcementDate(x.createdAt))}</time>
            </span>
        </button>
    `).join("");

    list.querySelectorAll("[data-announcement-id]").forEach((button) => {
        button.addEventListener("click", () => {
            const item = items.find((x) => x.id === button.dataset.announcementId);
            if (item) openAnnouncementModal(item);
        });
    });
}

function loadLatestMonthlyPaper() {
    try {
        onSnapshot(collection(db, "monthlyTopRankingPapers"), snapshot => {
            const items = snapshot.docs
                .map(d => ({id:d.id, ...d.data()}))
                .filter(x => x.published !== false)
                .sort((a,b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

            const latest = items[0];
            if (!latest) return;

            const month = String(latest.month || "").charAt(0).toUpperCase() + String(latest.month || "").slice(1);
            const number = String(latest.paperNumber || 1).padStart(2, "0");
            const title = document.getElementById("modelPapersTitle");
            const description = document.getElementById("modelPapersDescription");
            const link = document.querySelector("#modelPapersCard .material-link");

            if (title) title.textContent = "🏆 Top Ranking Model";
            if (description) description.textContent = `${month} ${latest.year || ""} • Paper ${number}`;
            if (link) {
                link.innerHTML = "Explore Top Ranking Model <span>→</span>";
                link.href = "model-papers.html";
            }
        }, error => {
            console.info("Monthly paper dashboard listener unavailable.", error);
        });
    } catch (error) {
        console.info("Monthly paper dashboard listener could not start.", error);
    }
}

function renderDashboardAnnouncements(items) {
    const list = document.getElementById("portalNotificationList");
    if (!list) return;

    if (!items.length) {
        list.innerHTML = '<div class="portal-empty">No announcements right now.</div>';
        return;
    }

    list.innerHTML = items.map((item) => `
        <button type="button" class="portal-notice dashboard-announcement-item" data-dashboard-announcement-id="${esc(item.id)}">
            <span class="portal-notice-icon">📢</span>
            <span>
                <strong>${esc(item.title || "Portal Update")}</strong>
                <p>${esc(item.message || item.description || "Important information for students.")}</p>
                <time>${esc(announcementDate(item.createdAt))}</time>
            </span>
        </button>
    `).join("");

    list.querySelectorAll("[data-dashboard-announcement-id]").forEach((button) => {
        button.addEventListener("click", () => {
            const item = items.find((x) => x.id === button.dataset.dashboardAnnouncementId);
            if (item) openAnnouncementModal(item);
        });
    });
}

function loadNotifications() {
    ensureNotificationUI();

    const list = document.getElementById("portalNotificationItems");
    if (!list) return;

    try {
        onSnapshot(collection(db, "announcements"), (snap) => {
            const items = snap.docs
                .map((d) => ({ id:d.id, ...d.data() }))
                .filter((item) => !["legacy-grade11-top-ranking-results", "legacy-al-answer-release-paper01-september2026"].includes(item.id))
                .filter((item) => item.showOnDashboard !== false)
                .filter(announcementMatchesStudent)
                .sort((a,b) => timestampValue(b.createdAt) - timestampValue(a.createdAt));

            // Dashboard shows the complete active announcement feed.
            renderDashboardAnnouncements(items);

            // Header notification popover keeps a compact latest-6 view.
            renderNotificationItems(items.slice(0, 6));
        }, (error) => {
            console.info("Announcements collection is not available yet.", error);
            renderNotificationItems([]);
        });
    } catch (error) {
        console.info("Notification listener could not start.", error);
        renderNotificationItems([]);
    }
}

function ensureAlStudyMaterials() {
    const grade = String(
        sessionStorage.getItem("studentGrade") ||
        sessionStorage.getItem("studentType") ||
        ""
    ).toLowerCase().trim().replace(/\s+/g, "");

    if (!["al", "a/l", "advanced", "advancedlevel"].includes(grade)) {
        return;
    }

    const apply = () => {
        const model = document.getElementById("modelPapersCard");
        const past = document.getElementById("pastPapersCard");

        if (model) {
            model.style.display = "";
            const title = document.getElementById("modelPapersTitle");
            const description = document.getElementById("modelPapersDescription");
            const link = model.querySelector(".material-link");
            if (title) title.textContent = "🏆 Top Ranking Model";
            if (description) description.textContent = "A/L Student Top Ranking Model Papers";
            if (link) link.innerHTML = "Explore Top Ranking Model <span>→</span>";
        }

        if (past) {
            past.style.display = "none";
        }
    };

    apply();

    const grid = document.getElementById("materialGrid");
    if (grid && !grid.dataset.alVisibilityGuarded) {
        grid.dataset.alVisibilityGuarded = "1";
        const observer = new MutationObserver(apply);
        observer.observe(grid, { subtree: true, attributes: true, attributeFilter: ["style"] });
    }
}

async function init() {
    injectStyle();
    injectSidebarStyle();
    cleanSidebarAndPlaceLogout();
    buildSections();
    setupNavigation();
    setupQuickLinks();
    ensureAlStudyMaterials();

    // dashboard.js is loaded before this module, so these values are the real live dashboard values.
    animateRealDashboardData();

    if (!studentRef) {
        loadNotifications();
        return;
    }

    try {
        const snap = await getDoc(studentRef);
        const data = snap.exists() ? snap.data() : {};
        const stats = getTrackedStats(data);
        setupTarget(data, stats);
    } catch (error) {
        console.error("Could not load student enhancement data:", error);
    }

    loadNotifications();
    loadLatestMonthlyPaper();
}

init();
