/*
 * Seasonal Halloween effects for the Student Portal login.
 * Preserves the existing layout, text, theme, form and authentication logic.
 * Expires at 2026-11-15 00:00 Asia/Colombo (2026-11-14T18:30:00Z).
 */
(() => {
    "use strict";

    const CUTOFF = Date.parse("2026-11-14T18:30:00Z");
    const remaining = CUTOFF - Date.now();
    if (remaining <= 0 || document.getElementById("portal-halloween-layer")) return;

    const style = document.createElement("style");
    style.id = "portal-halloween-effects-styles";
    style.textContent = `
        #portal-halloween-layer {
            position: fixed;
            inset: 0;
            z-index: 20;
            overflow: hidden;
            pointer-events: none;
            contain: layout style;
        }
        #portal-halloween-layer .phe-ghost,
        #portal-halloween-layer .phe-pumpkin,
        #portal-halloween-layer .phe-bat,
        #portal-halloween-layer .phe-spark {
            position: absolute;
            user-select: none;
            -webkit-user-select: none;
            pointer-events: none;
            will-change: transform, opacity;
            line-height: 1;
        }
        #portal-halloween-layer .phe-ghost {
            font-family: system-ui, sans-serif;
            font-size: clamp(25px, 2.9vw, 37px);
            filter: drop-shadow(0 0 9px rgba(167, 139, 250, .6));
            animation: phe-ghost-float 6.4s ease-in-out infinite;
        }
        #portal-halloween-layer .phe-ghost-left {
            left: 10px;
            top: 23%;
        }
        #portal-halloween-layer .phe-ghost-right {
            right: 10px;
            top: 59%;
            font-size: clamp(23px, 2.5vw, 33px);
            animation-delay: -3.6s;
        }
        #portal-halloween-layer .phe-cursor-ghost {
            left: 0;
            top: 0;
            opacity: 0;
            font-size: 23px;
            transform: translate3d(-100px, -100px, 0);
            filter: drop-shadow(0 0 10px rgba(168, 85, 247, .7));
            animation: phe-cursor-wiggle 2.7s ease-in-out infinite;
        }
        #portal-halloween-layer.phe-cursor-active .phe-cursor-ghost { opacity: .88; }
        #portal-halloween-layer .phe-pumpkin {
            font-size: clamp(26px, 2.6vw, 37px);
            filter: drop-shadow(0 0 8px rgba(249, 115, 22, .38));
            animation: phe-pumpkin-glow 3s ease-in-out infinite;
        }
        #portal-halloween-layer .phe-pumpkin-left {
            left: 12px;
            bottom: 16%;
        }
        #portal-halloween-layer .phe-pumpkin-right {
            right: 12px;
            top: 14%;
            animation-delay: -1.5s;
        }
        #portal-halloween-layer .phe-pumpkin.phe-react {
            animation: phe-pumpkin-react .72s cubic-bezier(.2,.85,.35,1.25) both;
            filter: drop-shadow(0 0 15px rgba(255, 115, 24, .9));
        }
        #portal-halloween-layer .phe-bat {
            left: -45px;
            top: 32%;
            font-size: 20px;
            opacity: .7;
            animation: phe-bat-flight 21s linear infinite;
            animation-delay: -7s;
        }
        #portal-halloween-layer .phe-bat-two {
            top: 76%;
            font-size: 16px;
            opacity: .52;
            animation-duration: 27s;
            animation-delay: -17s;
        }
        #portal-halloween-layer .phe-spark {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #ff922b;
            box-shadow: 0 0 8px 2px rgba(255, 127, 35, .38);
            animation: phe-spark-rise 5.8s ease-in-out infinite;
        }
        @keyframes phe-ghost-float {
            0%, 100% { translate: 0 0; rotate: -5deg; }
            50% { translate: 4px -15px; rotate: 5deg; }
        }
        @keyframes phe-cursor-wiggle {
            0%, 100% { rotate: -8deg; }
            50% { rotate: 8deg; }
        }
        @keyframes phe-pumpkin-glow {
            0%, 100% { transform: translateY(0) rotate(-3deg) scale(1); }
            50% { transform: translateY(-5px) rotate(3deg) scale(1.04); }
        }
        @keyframes phe-pumpkin-react {
            0% { transform: scale(1) rotate(0); }
            38% { transform: scale(1.32) rotate(-12deg); }
            68% { transform: scale(1.12) rotate(9deg); }
            100% { transform: scale(1.06) rotate(0); }
        }
        @keyframes phe-bat-flight {
            0% { transform: translate3d(-5vw, 0, 0) rotate(-7deg); }
            50% { transform: translate3d(52vw, -15px, 0) rotate(4deg); }
            100% { transform: translate3d(110vw, 9px, 0) rotate(-3deg); }
        }
        @keyframes phe-spark-rise {
            0%, 100% { transform: translate3d(0, 10px, 0) scale(.55); opacity: .18; }
            45% { transform: translate3d(6px, -17px, 0) scale(1.1); opacity: .82; }
            75% { opacity: .38; }
        }
        @media (max-width: 760px) {
            #portal-halloween-layer .phe-ghost-left { left: 2px; top: 17%; font-size: 25px; }
            #portal-halloween-layer .phe-ghost-right { right: 2px; top: 56%; font-size: 24px; }
            #portal-halloween-layer .phe-pumpkin-left { left: 3px; bottom: 7%; font-size: 27px; }
            #portal-halloween-layer .phe-pumpkin-right { right: 3px; top: 10%; font-size: 27px; }
            #portal-halloween-layer .phe-cursor-ghost,
            #portal-halloween-layer .phe-bat-two { display: none; }
            #portal-halloween-layer .phe-spark { width: 3px; height: 3px; }
        }
        @media (prefers-reduced-motion: reduce) {
            #portal-halloween-layer .phe-ghost,
            #portal-halloween-layer .phe-pumpkin,
            #portal-halloween-layer .phe-bat,
            #portal-halloween-layer .phe-spark,
            #portal-halloween-layer .phe-cursor-ghost {
                animation: none !important;
                transition: none !important;
            }
            #portal-halloween-layer .phe-cursor-ghost { display: none !important; }
        }
    `;
    document.head.appendChild(style);

    const widgetStyle = document.createElement("style");
    widgetStyle.id = "he-halloween-widget-styles";
    widgetStyle.textContent = `
        #he-halloween-widget {
            position: fixed;
            left: 20px;
            bottom: 20px;
            z-index: 1005;
            width: 60px;
            height: 60px;
            pointer-events: auto;
            font-family: Inter, "Segoe UI", Arial, sans-serif;
        }
        #he-halloween-widget .he-widget-trigger {
            position: relative;
            display: grid;
            place-items: center;
            width: 60px;
            height: 60px;
            padding: 0;
            border: 1px solid rgba(166, 255, 46, .5);
            border-radius: 50%;
            background: radial-gradient(circle at 32% 24%, #30225a, #10182c 74%);
            color: #fff;
            cursor: pointer;
            isolation: isolate;
            box-shadow: 0 9px 30px rgba(0,0,0,.32), 0 0 22px rgba(124,58,237,.22);
            transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        #he-halloween-widget .he-widget-trigger::before {
            content: "";
            position: absolute;
            inset: -5px;
            border: 1px solid rgba(255, 138, 36, .55);
            border-radius: 50%;
            z-index: -1;
            animation: he-widget-pulse 2.8s ease-out infinite;
        }
        #he-halloween-widget .he-widget-trigger:hover,
        #he-halloween-widget .he-widget-trigger:focus-visible {
            transform: translateY(-3px) scale(1.04);
            border-color: #a6ff2e;
            box-shadow: 0 12px 34px rgba(0,0,0,.38), 0 0 24px rgba(255,138,36,.28);
            outline: none;
        }
        #he-halloween-widget .he-widget-icon {
            display: block;
            font-size: 30px;
            line-height: 1;
            filter: drop-shadow(0 0 7px rgba(255,138,36,.35));
            animation: he-widget-pumpkin 3.2s ease-in-out infinite;
        }
        #he-halloween-widget .he-widget-dot {
            position: absolute;
            right: 4px;
            top: 4px;
            width: 10px;
            height: 10px;
            border: 2px solid #11182b;
            border-radius: 50%;
            background: #a6ff2e;
            box-shadow: 0 0 9px rgba(166,255,46,.65);
        }
        #he-halloween-widget .he-widget-panel {
            position: absolute;
            left: 0;
            bottom: calc(100% + 13px);
            display: none;
            width: min(300px, calc(100vw - 28px));
            padding: 16px;
            border: 1px solid rgba(166,255,46,.22);
            border-radius: 18px;
            background: linear-gradient(145deg, rgba(17,24,43,.98), rgba(34,24,67,.98));
            color: #f4f7ff;
            box-shadow: 0 20px 55px rgba(0,0,0,.42), 0 0 25px rgba(124,58,237,.13);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
        }
        #he-halloween-widget .he-widget-panel.is-open {
            display: block;
            animation: he-widget-panel-in .22s ease-out both;
        }
        #he-halloween-widget .he-widget-panel-head {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #he-halloween-widget .he-widget-ghost {
            display: grid;
            place-items: center;
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            border: 1px solid rgba(167,139,250,.28);
            border-radius: 13px;
            background: rgba(124,58,237,.18);
            font-size: 24px;
            animation: he-widget-ghost 3.4s ease-in-out infinite;
        }
        #he-halloween-widget .he-widget-heading {
            min-width: 0;
            flex: 1;
        }
        #he-halloween-widget .he-widget-heading strong {
            display: block;
            color: #f4f7ff;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: .1px;
        }
        #he-halloween-widget .he-widget-heading small {
            display: block;
            margin-top: 4px;
            color: #aeb8ce;
            font-size: 10px;
        }
        #he-halloween-widget .he-widget-close {
            display: grid;
            place-items: center;
            width: 29px;
            height: 29px;
            flex: 0 0 29px;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 9px;
            background: rgba(255,255,255,.04);
            color: #cbd5e1;
            font-size: 20px;
            cursor: pointer;
        }
        #he-halloween-widget .he-widget-copy {
            margin: 13px 0 11px;
            color: #c5cee0;
            font-size: 11px;
            line-height: 1.6;
        }
        #he-halloween-widget .he-widget-expiry {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 10px;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 10px;
            background: rgba(255,255,255,.04);
            color: #b8c4d8;
            font-size: 10px;
        }
        #he-halloween-widget .he-widget-expiry span:first-child {
            color: #ff9a3d;
            font-size: 13px;
        }
        #he-halloween-widget .he-widget-pause {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            min-height: 39px;
            margin-top: 11px;
            padding: 9px 12px;
            border: 1px solid rgba(166,255,46,.35);
            border-radius: 11px;
            background: linear-gradient(135deg, rgba(64,55,201,.42), rgba(124,58,237,.28));
            color: #f4f7ff;
            font: 750 11px/1.2 Inter, "Segoe UI", Arial, sans-serif;
            cursor: pointer;
            transition: background .2s ease, border-color .2s ease;
        }
        #he-halloween-widget .he-widget-pause:hover {
            border-color: #a6ff2e;
            background: rgba(64,55,201,.52);
        }
        #he-halloween-widget .he-widget-action-icon {
            color: #a6ff2e;
            font-size: 13px;
        }
        #he-halloween-widget .he-widget-trigger:focus-visible,
        #he-halloween-widget .he-widget-close:focus-visible,
        #he-halloween-widget .he-widget-pause:focus-visible {
            outline: 2px solid #a6ff2e;
            outline-offset: 3px;
        }
        #halloween-effects-layer.he-effects-paused *,
        #portal-halloween-layer.he-effects-paused * {
            animation-play-state: paused !important;
        }
        @keyframes he-widget-pulse {
            0% { transform: scale(.93); opacity: .8; }
            100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes he-widget-pumpkin {
            0%, 100% { transform: translateY(0) rotate(-4deg); }
            50% { transform: translateY(-3px) rotate(4deg); }
        }
        @keyframes he-widget-ghost {
            0%, 100% { transform: translateY(0) rotate(-4deg); }
            50% { transform: translateY(-4px) rotate(4deg); }
        }
        @keyframes he-widget-panel-in {
            from { opacity: 0; transform: translateY(7px) scale(.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 700px) {
            #he-halloween-widget { left: 12px; bottom: 14px; width: 54px; height: 54px; }
            #he-halloween-widget .he-widget-trigger { width: 54px; height: 54px; }
            #he-halloween-widget .he-widget-icon { font-size: 27px; }
            #he-halloween-widget .he-widget-panel { width: min(290px, calc(100vw - 24px)); }
        }
        @media (prefers-reduced-motion: reduce) {
            #he-halloween-widget *,
            #he-halloween-widget .he-widget-trigger::before {
                animation: none !important;
                transition: none !important;
            }
        }
    `;
    document.head.appendChild(widgetStyle);

    const halloweenWidget = document.createElement("div");
    halloweenWidget.id = "he-halloween-widget";
    halloweenWidget.innerHTML =
        '<button type="button" class="he-widget-trigger" id="he-widget-trigger" aria-label="Open Halloween effects widget" aria-expanded="false" aria-controls="he-widget-panel">' +
            '<span class="he-widget-icon" aria-hidden="true">🎃</span><span class="he-widget-dot" aria-hidden="true"></span>' +
        '</button>' +
        '<section id="he-widget-panel" class="he-widget-panel" role="dialog" aria-label="Halloween effects" aria-hidden="true">' +
            '<div class="he-widget-panel-head">' +
                '<span class="he-widget-ghost" aria-hidden="true">👻</span>' +
                '<div class="he-widget-heading"><strong>Spooky season</strong><small>Little surprises are active</small></div>' +
                '<button type="button" class="he-widget-close" aria-label="Close Halloween widget">×</button>' +
            '</div>' +
            '<p class="he-widget-copy">A little Halloween magic, while keeping the website design just as it is.</p>' +
            '<div class="he-widget-expiry"><span aria-hidden="true">◷</span><span>Auto-removes Nov 15, 2026</span></div>' +
            '<button type="button" class="he-widget-pause" aria-pressed="false"><span class="he-widget-action-icon" aria-hidden="true">Ⅱ</span><span>Pause animations</span></button>' +
        '</section>';
    document.body.appendChild(halloweenWidget);

    const layer = document.createElement("div");
    layer.id = "portal-halloween-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML =
        '<span class="phe-ghost phe-ghost-left">👻</span>' +
        '<span class="phe-ghost phe-ghost-right">👻</span>' +
        '<span class="phe-ghost phe-cursor-ghost">👻</span>' +
        '<span class="phe-pumpkin phe-pumpkin-left">🎃</span>' +
        '<span class="phe-pumpkin phe-pumpkin-right">🎃</span>' +
        '<span class="phe-bat">🦇</span>' +
        '<span class="phe-bat phe-bat-two">🦇</span>';
    document.body.appendChild(layer);

    const sparkPositions = [
        [7, 21, .3], [18, 68, 1.6], [31, 38, 2.2], [42, 84, .8],
        [55, 24, 2.8], [67, 64, 1.4], [78, 17, 3.2], [91, 44, .5],
        [87, 82, 2.1], [12, 89, 3.5]
    ];
    sparkPositions.forEach((pos, index) => {
        const spark = document.createElement("span");
        spark.className = "phe-spark";
        spark.style.left = pos[0] + "%";
        spark.style.top = pos[1] + "%";
        spark.style.animationDelay = "-" + pos[2] + "s";
        spark.style.opacity = index % 2 ? ".8" : ".55";
        layer.appendChild(spark);
    });

    const aborter = new AbortController();
    const timers = new Set();
    const pumpkins = [...layer.querySelectorAll(".phe-pumpkin")];
    const cursorGhost = layer.querySelector(".phe-cursor-ghost");
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let lastMove = 0;

    const widgetTrigger = halloweenWidget.querySelector(".he-widget-trigger");
    const widgetPanel = halloweenWidget.querySelector(".he-widget-panel");
    const widgetClose = halloweenWidget.querySelector(".he-widget-close");
    const widgetPause = halloweenWidget.querySelector(".he-widget-pause");
    const widgetPauseIcon = halloweenWidget.querySelector(".he-widget-action-icon");
    const widgetPauseLabel = widgetPause.querySelector("span:last-child");
    let animationsPaused = false;

    function setWidgetOpen(open) {
        widgetPanel.classList.toggle("is-open", open);
        widgetPanel.setAttribute("aria-hidden", String(!open));
        widgetTrigger.setAttribute("aria-expanded", String(open));
    }

    function setAnimationsPaused(paused) {
        animationsPaused = paused;
        layer.classList.toggle("he-effects-paused", paused);
        widgetPause.setAttribute("aria-pressed", String(paused));
        widgetPauseIcon.textContent = paused ? "▶" : "Ⅱ";
        widgetPauseLabel.textContent = paused ? "Resume animations" : "Pause animations";
    }

    widgetTrigger.addEventListener("click", () => {
        setWidgetOpen(!widgetPanel.classList.contains("is-open"));
    }, { signal: aborter.signal });
    widgetClose.addEventListener("click", () => setWidgetOpen(false), { signal: aborter.signal });
    widgetPause.addEventListener("click", () => setAnimationsPaused(!animationsPaused), { signal: aborter.signal });
    document.addEventListener("pointerdown", event => {
        if (event.target instanceof Node && !halloweenWidget.contains(event.target)) {
            setWidgetOpen(false);
        }
    }, { signal: aborter.signal });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setWidgetOpen(false);
    }, { signal: aborter.signal });


    function react(pumpkin) {
        if (pumpkin.classList.contains("phe-react")) return;
        pumpkin.classList.add("phe-react");
        const timer = window.setTimeout(() => {
            pumpkin.classList.remove("phe-react");
            timers.delete(timer);
        }, 780);
        timers.add(timer);
    }

    if (canHover) {
        window.addEventListener("pointermove", event => {
            const now = Date.now();
            if (now - lastMove > 30) {
                const overInteractiveArea = event.target instanceof Element &&
                    !!event.target.closest(".login-panel, input, button, a, .whatsapp-widget");
                if (overInteractiveArea) {
                    layer.classList.remove("phe-cursor-active");
                } else {
                    cursorGhost.style.transform = "translate3d(" +
                        Math.round(event.clientX + 15) + "px," +
                        Math.round(event.clientY + 14) + "px,0)";
                    layer.classList.add("phe-cursor-active");
                }
                lastMove = now;
            }

            pumpkins.forEach(pumpkin => {
                const rect = pumpkin.getBoundingClientRect();
                const dx = event.clientX - (rect.left + rect.width / 2);
                const dy = event.clientY - (rect.top + rect.height / 2);
                if (Math.hypot(dx, dy) < 66) react(pumpkin);
            });
        }, { passive: true, signal: aborter.signal });

        window.addEventListener("pointerleave", () => {
            layer.classList.remove("phe-cursor-active");
        }, { passive: true, signal: aborter.signal });
    }

    let cutoffTimer = null;
    function removeEffects() {
        aborter.abort();
        if (cutoffTimer !== null) window.clearTimeout(cutoffTimer);
        timers.forEach(timer => window.clearTimeout(timer));
        timers.clear();
        layer.remove();
        halloweenWidget.remove();
        widgetStyle.remove();
        style.remove();
    }

    const cutoffTimerDelay = remaining;
    cutoffTimer = window.setTimeout(removeEffects, cutoffTimerDelay);
    const checkCutoff = () => {
        if (Date.now() >= CUTOFF) removeEffects();
    };
    window.addEventListener("pageshow", checkCutoff, { signal: aborter.signal });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkCutoff();
    }, { signal: aborter.signal });
})();