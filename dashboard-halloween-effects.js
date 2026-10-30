/*
 * Halloween decorations for the Student Assessment Portal dashboard.
 * Decorative overlay only: does not change dashboard data, links, controls,
 * navigation, Firebase, authentication, or grade routing.
 * Automatically removes at 2026-11-15 00:00 Asia/Colombo
 * (2026-11-14T18:30:00Z).
 */
(() => {
  "use strict";

  const CUTOFF = Date.parse("2026-11-14T18:30:00Z");
  const LAYER_ID = "dashboard-halloween-layer";
  const STYLE_ID = "dashboard-halloween-styles";
  let expiryTimer = null;
  let layer = null;
  let style = null;

  const css = `
    #${LAYER_ID} {
      position: fixed;
      inset: 0;
      z-index: 70;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      contain: layout style;
      font-family: system-ui, sans-serif;
    }
    #${LAYER_ID} .dhe-item {
      position: absolute;
      display: block;
      line-height: 1;
      pointer-events: none;
      will-change: transform, opacity;
      filter: drop-shadow(0 0 10px rgba(255, 117, 28, .22));
    }
    #${LAYER_ID} .dhe-web {
      width: clamp(88px, 12vw, 170px);
      height: clamp(88px, 12vw, 170px);
      opacity: .48;
      background:
        repeating-conic-gradient(from 0deg, rgba(185,161,255,.46) 0deg 1deg, transparent 1deg 15deg),
        repeating-radial-gradient(circle at 0 0, transparent 0 12px, rgba(185,161,255,.42) 13px 14px, transparent 15px 25px);
      -webkit-mask-image: radial-gradient(circle at 0 0, #000 0 48%, transparent 78%);
      mask-image: radial-gradient(circle at 0 0, #000 0 48%, transparent 78%);
    }
    #${LAYER_ID} .dhe-web-left { left: 0; top: 0; }
    #${LAYER_ID} .dhe-web-right { right: 0; top: 0; transform: rotate(90deg); }
    #${LAYER_ID} .dhe-moon {
      position: absolute;
      top: 12%;
      right: 7%;
      width: clamp(48px, 6vw, 82px);
      aspect-ratio: 1;
      border-radius: 50%;
      opacity: .24;
      background: radial-gradient(circle at 36% 34%, #fff8d8 0 5%, #ffd078 38%, #ff9b49 70%, transparent 72%);
      box-shadow: 0 0 34px rgba(255,154,67,.34);
    }
    #${LAYER_ID} .dhe-ghost {
      font-size: clamp(27px, 3vw, 43px);
      filter: drop-shadow(0 0 12px rgba(178,135,255,.64));
      animation: dhe-ghost-float 7.2s ease-in-out infinite;
      opacity: .92;
    }
    #${LAYER_ID} .dhe-ghost-one {
      left: max(278px, 21vw);
      top: 18%;
      animation-delay: -2.2s;
    }
    #${LAYER_ID} .dhe-ghost-two {
      right: 3.5%;
      top: 46%;
      font-size: clamp(25px, 2.7vw, 38px);
      animation-delay: -4.6s;
    }
    #${LAYER_ID} .dhe-ghost-three {
      left: 63%;
      bottom: 6%;
      font-size: clamp(25px, 2.5vw, 36px);
      animation-delay: -1.1s;
    }
    #${LAYER_ID} .dhe-pumpkin {
      font-size: clamp(38px, 4.7vw, 66px);
      filter: drop-shadow(0 0 13px rgba(255,112,18,.62));
      animation: dhe-pumpkin-glow 3.2s ease-in-out infinite;
    }
    #${LAYER_ID} .dhe-pumpkin-one {
      left: 14px;
      top: 55%;
      animation-delay: -.7s;
    }
    #${LAYER_ID} .dhe-pumpkin-two {
      right: 22px;
      bottom: 15%;
      font-size: clamp(34px, 4vw, 58px);
      animation-delay: -2s;
    }
    #${LAYER_ID} .dhe-bat {
      left: -55px;
      top: 13%;
      font-size: clamp(20px, 2.1vw, 29px);
      opacity: .9;
      filter: drop-shadow(0 0 8px rgba(255,111,62,.48));
      animation: dhe-bat-flight 22s linear infinite;
    }
    #${LAYER_ID} .dhe-bat-two {
      top: 31%;
      font-size: 19px;
      opacity: .62;
      animation-duration: 27s;
      animation-delay: -12s;
    }
    #${LAYER_ID} .dhe-bat-three {
      top: 68%;
      font-size: 17px;
      opacity: .56;
      animation-duration: 30s;
      animation-delay: -20s;
    }
    #${LAYER_ID} .dhe-ember {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #ff9a35;
      box-shadow: 0 0 7px 2px rgba(255,122,24,.62), 0 0 17px rgba(255,81,20,.35);
      animation: dhe-ember-rise var(--dhe-duration, 8s) ease-in-out infinite;
      animation-delay: var(--dhe-delay, 0s);
      opacity: .8;
    }
    #${LAYER_ID} .dhe-edge-glow {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: clamp(38px, 7vh, 72px);
      opacity: .2;
      background:
        radial-gradient(ellipse at 3% 100%, rgba(127,49,174,.8), transparent 42%),
        radial-gradient(ellipse at 95% 100%, rgba(255,112,24,.7), transparent 38%),
        linear-gradient(0deg, rgba(44,21,83,.55), transparent);
    }
    @keyframes dhe-ghost-float {
      0%,100% { transform: translate3d(0,0,0) rotate(-4deg); }
      50% { transform: translate3d(8px,-19px,0) rotate(5deg); }
    }
    @keyframes dhe-pumpkin-glow {
      0%,100% { transform: translateY(0) rotate(-3deg) scale(1); filter: drop-shadow(0 0 8px rgba(255,112,18,.38)); }
      50% { transform: translateY(-8px) rotate(3deg) scale(1.06); filter: drop-shadow(0 0 18px rgba(255,112,18,.82)); }
    }
    @keyframes dhe-bat-flight {
      0% { transform: translate3d(-70px,0,0) scale(.85); }
      48% { transform: translate3d(52vw,-30px,0) scale(1.08); }
      100% { transform: translate3d(calc(100vw + 120px),12px,0) scale(.9); }
    }
    @keyframes dhe-ember-rise {
      0% { transform: translate3d(0,18px,0) scale(.6); opacity: 0; }
      18% { opacity: .85; }
      75% { opacity: .7; }
      100% { transform: translate3d(12px,-85px,0) scale(1.25); opacity: 0; }
    }
    @media (max-width: 800px) {
      #${LAYER_ID} .dhe-web { width: 82px; height: 82px; opacity: .34; }
      #${LAYER_ID} .dhe-moon { top: 13%; right: 5%; width: 44px; }
      #${LAYER_ID} .dhe-ghost-one { left: 6px; top: 19%; font-size: 27px; }
      #${LAYER_ID} .dhe-ghost-two { right: 8px; top: 55%; font-size: 25px; }
      #${LAYER_ID} .dhe-ghost-three { display: none; }
      #${LAYER_ID} .dhe-pumpkin-one { left: 5px; top: 68%; font-size: 36px; }
      #${LAYER_ID} .dhe-pumpkin-two { right: 12px; bottom: 19%; font-size: 36px; }
      #${LAYER_ID} .dhe-bat-three { display: none; }
      #${LAYER_ID} .dhe-edge-glow { height: 34px; }
    }
    @media (max-width: 480px) {
      #${LAYER_ID} .dhe-ghost-two { top: 66%; }
      #${LAYER_ID} .dhe-pumpkin-one { top: 74%; }
      #${LAYER_ID} .dhe-pumpkin-two { bottom: 22%; }
      #${LAYER_ID} .dhe-moon { opacity: .17; }
    }
    @media (prefers-reduced-motion: reduce) {
      #${LAYER_ID} .dhe-item { animation: none !important; }
    }
  `;

  function removeDecorations() {
    if (layer) {
      layer.remove();
      layer = null;
    }
    if (style) {
      style.remove();
      style = null;
    }
    if (expiryTimer !== null) {
      window.clearTimeout(expiryTimer);
      expiryTimer = null;
    }
  }

  function createDecorations() {
    if (layer || Date.now() >= CUTOFF) return;

    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);

    layer = document.createElement("div");
    layer.id = LAYER_ID;
    layer.setAttribute("aria-hidden", "true");

    const decorations = [
      ["dhe-web dhe-web-left", ""],
      ["dhe-web dhe-web-right", ""],
      ["dhe-moon", ""],
      ["dhe-ghost dhe-ghost-one", "👻"],
      ["dhe-ghost dhe-ghost-two", "👻"],
      ["dhe-ghost dhe-ghost-three", "👻"],
      ["dhe-pumpkin dhe-pumpkin-one", "🎃"],
      ["dhe-pumpkin dhe-pumpkin-two", "🎃"],
      ["dhe-bat", "🦇"],
      ["dhe-bat dhe-bat-two", "🦇"],
      ["dhe-bat dhe-bat-three", "🦇"]
    ];

    decorations.forEach(([className, content]) => {
      const item = document.createElement("span");
      item.className = "dhe-item " + className;
      item.textContent = content;
      layer.appendChild(item);
    });

    const edgeGlow = document.createElement("div");
    edgeGlow.className = "dhe-edge-glow";
    layer.appendChild(edgeGlow);

    // Sparse, randomly positioned embers. These never receive pointer events.
    for (let i = 0; i < 24; i += 1) {
      const ember = document.createElement("span");
      ember.className = "dhe-item dhe-ember";
      ember.style.left = (2 + Math.random() * 96).toFixed(2) + "%";
      ember.style.top = (10 + Math.random() * 82).toFixed(2) + "%";
      ember.style.setProperty("--dhe-duration", (6 + Math.random() * 7).toFixed(2) + "s");
      ember.style.setProperty("--dhe-delay", (-Math.random() * 12).toFixed(2) + "s");
      layer.appendChild(ember);
    }

    document.body.appendChild(layer);
  }

  function syncSeason() {
    if (Date.now() >= CUTOFF) {
      removeDecorations();
      return;
    }
    createDecorations();
    if (expiryTimer !== null) window.clearTimeout(expiryTimer);
    expiryTimer = window.setTimeout(syncSeason, Math.max(250, CUTOFF - Date.now() + 100));
  }

  if (Date.now() >= CUTOFF) return;
  syncSeason();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncSeason();
  });
  window.addEventListener("pageshow", syncSeason);
})();
