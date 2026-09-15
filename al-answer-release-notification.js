// A/L-only notification for the released Top Ranking Paper 01 answers.

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
}

function isALStudent() {
    const values = [
        sessionStorage.getItem("studentType"),
        sessionStorage.getItem("studentGrade"),
        document.getElementById("gradeBadge")?.textContent,
        document.getElementById("dashboardTitle")?.textContent,
        document.getElementById("sidebarStudentGrade")?.textContent
    ].map(normalize);

    return values.some(value => [
        "al",
        "a/l",
        "alevel",
        "advanced",
        "advancedlevel"
    ].includes(value));
}

function ensureStyles() {
    if (document.getElementById("alAnswerReleaseNotificationStyle")) return;

    const style = document.createElement("style");
    style.id = "alAnswerReleaseNotificationStyle";
    style.textContent = `
        .al-answer-release-notification {
            display:flex;
            align-items:center;
            gap:14px;
            padding:15px 16px;
            margin:0 0 12px;
            border:1px solid rgba(163,230,53,.28);
            border-radius:14px;
            background:linear-gradient(135deg,rgba(132,204,22,.10),rgba(59,130,246,.06));
            box-shadow:0 8px 24px rgba(0,0,0,.10);
        }
        .al-answer-release-notification .al-release-icon {
            width:42px;
            height:42px;
            flex:0 0 42px;
            display:grid;
            place-items:center;
            border-radius:12px;
            background:rgba(132,204,22,.16);
            font-size:21px;
        }
        .al-answer-release-notification .al-release-copy {
            min-width:0;
            flex:1;
        }
        .al-answer-release-notification .al-release-copy strong {
            display:block;
            margin-bottom:3px;
            font-size:14px;
        }
        .al-answer-release-notification .al-release-copy span {
            display:block;
            font-size:12px;
            line-height:1.5;
            opacity:.72;
        }
        .al-answer-release-notification .al-release-link {
            flex:0 0 auto;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-height:38px;
            padding:0 14px;
            border-radius:10px;
            background:#84cc16;
            color:#101827;
            text-decoration:none;
            font-size:12px;
            font-weight:800;
            white-space:nowrap;
        }
        .al-answer-release-notification .al-release-link:hover {
            filter:brightness(1.06);
            transform:translateY(-1px);
        }
        @media (max-width:640px) {
            .al-answer-release-notification { align-items:flex-start; }
            .al-answer-release-notification .al-release-link { align-self:center; }
        }
    `;
    document.head.appendChild(style);
}

function renderALAnswerNotification() {
    const section = document.getElementById("notificationSection");
    const list = document.getElementById("portalNotificationList");
    if (!section || !list || !isALStudent()) return false;

    if (document.getElementById("alAnswerReleaseNotification")) return true;

    ensureStyles();

    const item = document.createElement("article");
    item.id = "alAnswerReleaseNotification";
    item.className = "al-answer-release-notification";
    item.innerHTML = `
        <div class="al-release-icon" aria-hidden="true">📄</div>
        <div class="al-release-copy">
            <strong>Answer Release</strong>
            <span>A/L Top Ranking Paper 01 — September 2026 answers are now available.</span>
        </div>
        <a class="al-release-link" href="al-top-ranking-paper.html?paper=01&month=september">View Answers</a>
    `;

    // Keep the release card outside the dynamic notification list so that
    // loadNotifications() cannot replace/remove it after rendering.
    section.insertBefore(item, list);
    return true;
}

function init() {
    if (!isALStudent()) return;

    if (renderALAnswerNotification()) return;

    const observer = new MutationObserver(() => {
        if (renderALAnswerNotification()) observer.disconnect();
    });

    observer.observe(document.body, { childList:true, subtree:true });

    window.setTimeout(() => observer.disconnect(), 10000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once:true });
} else {
    init();
}
