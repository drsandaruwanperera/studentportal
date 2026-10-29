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

    function removeEffects() {
        aborter.abort();
        timers.forEach(timer => window.clearTimeout(timer));
        timers.clear();
        layer.remove();
        style.remove();
    }

    const cutoffTimer = window.setTimeout(removeEffects, remaining);
    const checkCutoff = () => {
        if (Date.now() >= CUTOFF) removeEffects();
    };
    window.addEventListener("pageshow", checkCutoff, { signal: aborter.signal });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkCutoff();
    }, { signal: aborter.signal });
})();