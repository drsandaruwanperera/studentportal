// Grade 11-only dashboard notification for the latest Top Ranking results.

function isGrade11Student() {
    const values = [
        sessionStorage.getItem("studentType"),
        sessionStorage.getItem("studentGrade")
    ]
        .map(value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, ""));

    return values.includes("grade11") || values.includes("11");
}

if (isGrade11Student()) {
    const style = document.createElement("style");
    style.textContent = `
        #grade11ResultNotice {
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            box-sizing: border-box;
            border: 1px solid rgba(166,255,46,.16);
            background:
                radial-gradient(circle at 92% 12%, rgba(166,255,46,.08), transparent 28%),
                linear-gradient(135deg, #11182b 0%, #151f35 100%);
        }
        #grade11ResultNotice::after {
            content: "";
            position: absolute;
            top: 0;
            left: -35%;
            width: 28%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
            transform: skewX(-18deg);
            animation: grade11NoticeShine 4.5s ease-in-out infinite;
            pointer-events: none;
        }
        #grade11ResultNotice .result-notice-icon {
            width: 42px;
            height: 42px;
            border-radius: 13px;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
            background: rgba(166,255,46,.10);
            border: 1px solid rgba(166,255,46,.16);
            font-size: 20px;
        }
        #grade11ResultNotice .result-notice-copy {
            min-width: 0;
            flex: 1 1 auto;
        }
        #grade11ResultNotice .result-notice-copy strong {
            display: block;
            color: #f4f7ff;
            font-size: 13px;
            line-height: 1.35;
        }
        #grade11ResultNotice .result-notice-copy p {
            margin: 5px 0 0;
            color: #9aa7bc;
            font-size: 10px;
            line-height: 1.55;
        }
        #grade11ResultNotice .result-notice-copy .result-tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 7px;
            color: #a6ff2e;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        #grade11ResultNotice .result-notice-action {
            position: relative;
            z-index: 1;
            flex: 0 0 auto;
            border: 1px solid rgba(166,255,46,.20);
            border-radius: 10px;
            padding: 10px 13px;
            background: rgba(166,255,46,.08);
            color: #a6ff2e;
            font-size: 10px;
            font-weight: 800;
            text-decoration: none;
            white-space: nowrap;
            transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }
        #grade11ResultNotice .result-notice-action:hover {
            transform: translateY(-1px);
            background: rgba(166,255,46,.14);
            border-color: rgba(166,255,46,.32);
        }
        @keyframes grade11NoticeShine {
            0%, 58% { left: -35%; opacity: 0; }
            68% { opacity: 1; }
            82%, 100% { left: 120%; opacity: 0; }
        }
        @media(max-width:700px) {
            #grade11ResultNotice {
                align-items: flex-start !important;
                flex-wrap: wrap;
            }
            #grade11ResultNotice .result-notice-copy {
                flex: 1 1 calc(100% - 58px);
            }
            #grade11ResultNotice .result-notice-action {
                width: 100%;
                text-align: center;
            }
        }
    `;
    document.head.appendChild(style);

    function render() {
        const list = document.getElementById("portalNotificationList");
        if (!list) return false;
        if (document.getElementById("grade11ResultNotice")) return true;

        list.innerHTML = `
            <div class="portal-notice" id="grade11ResultNotice">
                <div class="result-notice-icon" aria-hidden="true">🏆</div>
                <div class="result-notice-copy">
                    <span class="result-tag">Grade 11 • Results Update</span>
                    <strong>Top Ranking Results Are Out Now</strong>
                    <p>Your latest Top Ranking result is now available. Scroll down to view your result and marks.</p>
                </div>
                <a class="result-notice-action" href="#grade11ResultsSection" id="grade11ResultNoticeLink">View My Result →</a>
            </div>
        `;

        document.getElementById("grade11ResultNoticeLink")?.addEventListener("click", event => {
            event.preventDefault();
            document.getElementById("grade11ResultsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        return true;
    }

    function boot() {
        if (render()) return;

        const observer = new MutationObserver(() => {
            if (render()) observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Covers slow dashboard module loading without relying on a single timing race.
        let attempts = 0;
        const retry = window.setInterval(() => {
            attempts += 1;
            if (render() || attempts >= 30) window.clearInterval(retry);
        }, 250);

        window.setTimeout(() => observer.disconnect(), 10000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
}
