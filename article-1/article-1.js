document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const FONT_STEPS = [
    "Redaction",
    "Redaction 20",
    "Redaction 35",
    "Redaction 50",
    "Redaction 70",
    "Redaction 100",
  ];

  /*
  (() => {
    const v = document.querySelector(".landing-video");
    if (!v) return;
    // v.play().catch(()=>{});
  })();
  */


  (() => {
    const screen = document.getElementById("phoneScreen");
    const track = document.getElementById("reelTrack");
    if (!screen || !track) return;

    const thumbFinger = document.getElementById("thumbFinger");

    const REELS = [
      "How A.I.\nand Social\nMedia\nContribute\nto ‘Brainrot’",
    ];

    let fontIdx = 0;
    let reelIdx = 0;
    let isAnimating = false;

    const uiFontFallback = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

    function makeCard(text, fontName) {
      const card = document.createElement("div");
      card.className = "reel-card";

      const inner = document.createElement("div");
      inner.className = "reel-text";
      inner.textContent = text;
      inner.style.fontFamily = `"${fontName}", ${uiFontFallback}`;

      card.appendChild(inner);
      return card;
    }

    function nextFont() {
      fontIdx = (fontIdx + 1) % FONT_STEPS.length;
      return FONT_STEPS[fontIdx];
    }

    function nextReelText() {
      reelIdx = (reelIdx + 1) % REELS.length;
      return REELS[reelIdx];
    }

    function triggerFingerTap() {
      if (!thumbFinger) return;
      thumbFinger.classList.remove("is-tapping");
      void thumbFinger.offsetWidth;
      thumbFinger.classList.add("is-tapping");
    }

    function init() {
      track.innerHTML = "";
      const current = makeCard(REELS[reelIdx], FONT_STEPS[fontIdx]);
      const next = makeCard(nextReelText(), nextFont());
      track.appendChild(current);
      track.appendChild(next);
      track.style.transform = "translateY(0px)";
    }

    function animateOneStep() {
      if (isAnimating) return;
      isAnimating = true;
      screen.classList.add("is-animating");

      triggerFingerTap();

      const h = screen.getBoundingClientRect().height;

      const anim = track.animate(
        [
          { transform: "translateY(0px)" },
          { transform: `translateY(${-h}px)` },
        ],
        {
          duration: 420,
          easing: "cubic-bezier(0.2, 0.9, 0.2, 1)",
          fill: "forwards",
        }
      );

      anim.onfinish = () => {
        track.style.transform = "translateY(0px)";
        if (track.firstElementChild) track.removeChild(track.firstElementChild);

        const newNext = makeCard(nextReelText(), nextFont());
        track.appendChild(newNext);

        isAnimating = false;
        screen.classList.remove("is-animating");
      };
    }

    screen.addEventListener("click", animateOneStep);
    screen.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        animateOneStep();
      },
      { passive: false }
    );

    screen.tabIndex = 0;
    screen.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        animateOneStep();
      }
    });

    init();
  })();


(() => {
  const canvas = document.getElementById("spiralOverlay");
  if (!canvas) return;

  const host = document.getElementById("heroStage") || canvas.parentElement;
  if (!host) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const COLOR = "#F4F19B";
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let PIX = 5;                
  const SPIRAL_COUNT = 22;    
  const OVERLAP_TOLERANCE = 0.86;
  const MAX_TRIES = 70;

  const spirals = [];
  const rand = (min, max) => min + Math.random() * (max - min);
  const nowSec = () => performance.now() / 1000;

  function resize(){
const rect = host.getBoundingClientRect();
canvas.style.width = rect.width + "px";
canvas.style.height = rect.height + "px";
canvas.width = Math.floor(rect.width * DPR);
canvas.height = Math.floor(rect.height * DPR);

    PIX = Math.max(4, Math.round(Math.min(rect.width, rect.height) / 170));
  }

  function estimateOuterRadius(baseR, turns){
    return baseR * (1 + turns);
  }

  function tooClose(candidate, others){
    for (const s of others){
      const d = Math.hypot(candidate.x - s.x, candidate.y - s.y);
      const minDist = (candidate.outerR + s.outerR) * OVERLAP_TOLERANCE;
      if (d < minDist) return true;
    }
    return false;
  }

  function edgeBiased01(power = 2.6){
    return Math.pow(Math.random(), power);
  }

  function spawnCandidate(){
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;

    const bandW = (1/3) * w;

    const useLeft = Math.random() < 0.55;
    const t = edgeBiased01(2.8); 

    const x = useLeft
      ? (0 + t * bandW)              
      : (w - t * bandW);                

    const y = rand(0.06 * h, 0.94 * h);

    let baseR, turns, thickness;

    for (let tries = 0; tries < 22; tries++){
      baseR = rand(10, 26);
      turns = rand(2.4, 4.9);
      thickness = rand(0.65, 1.05);

      const outerR = estimateOuterRadius(baseR, turns);

      const baseOk  = baseR >= (2.5 * PIX);
      const spanOk  = outerR >= (12.0 * PIX);
      const turnsOk = turns >= (baseR < (3.2 * PIX) ? 3.3 : 2.7);

      if (baseOk && spanOk && turnsOk) break;
    }

    baseR = Math.max(baseR, 2.5 * PIX);

    const speed = rand(0.006, 0.016) * (Math.random() < 0.5 ? -1 : 1);

    const fadeIn  = rand(0.35, 0.85);
    const hold    = rand(1.10, 2.20);
    const fadeOut = rand(0.45, 0.95);

    const born = nowSec();
    const alphaMax = rand(0.70, 0.92);

    const outerR = estimateOuterRadius(baseR, turns);

    return { x, y, baseR, turns, thickness, speed, rot: rand(0, Math.PI*2), alphaMax, born, fadeIn, hold, fadeOut, outerR };
  }

  function spawnNonOverlapping(existing){
    for (let i = 0; i < MAX_TRIES; i++){
      const c = spawnCandidate();
      if (!tooClose(c, existing)) return c;
    }
    return spawnCandidate();
  }

  function lifecycleAlpha(s, t){
    const age = t - s.born;
    if (age < 0) return 0;

    if (age <= s.fadeIn) return s.alphaMax * (age / s.fadeIn);

    const afterIn = age - s.fadeIn;
    if (afterIn <= s.hold) return s.alphaMax;

    const afterHold = afterIn - s.hold;
    if (afterHold <= s.fadeOut) return s.alphaMax * (1 - afterHold / s.fadeOut);

    return 0;
  }

  function drawSpiral(s, alpha){
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLOR;

    const maxTheta = Math.PI * 2 * s.turns;
    const k = s.baseR / (Math.PI * 2);

    const step = 0.085 / s.thickness;

    for (let theta = 0; theta < maxTheta; theta += step){
      const r = s.baseR + k * theta;
      const ang = theta + s.rot;

      const px = s.x + Math.cos(ang) * r;
      const py = s.y + Math.sin(ang) * r;

      if (px < -40 || px > w + 40 || py < -40 || py > h + 40) continue;

      const gx = Math.round(px / PIX) * PIX;
      const gy = Math.round(py / PIX) * PIX;

      ctx.fillRect(gx, gy, PIX, PIX);
    }
  }

  function respawnAtIndex(i){
    const copy = spirals.slice();
    copy.splice(i, 1);
    spirals[i] = spawnNonOverlapping(copy);
  }

  function tick(){
    const rect = host.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2){
      requestAnimationFrame(tick);
      return;
    }

    const t = nowSec();

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, canvas.width / DPR, canvas.height / DPR);

    for (let i = 0; i < spirals.length; i++){
      const s = spirals[i];
      s.rot += s.speed;

      const a = lifecycleAlpha(s, t);
      if (a <= 0){
        respawnAtIndex(i);
        continue;
      }
      drawSpiral(s, a);
    }

    requestAnimationFrame(tick);
  }

  resize();
  spirals.length = 0;
  for (let i = 0; i < SPIRAL_COUNT; i++){
    spirals.push(spawnNonOverlapping(spirals));
  }

  window.addEventListener("resize", () => {
    resize();
    spirals.length = 0;
    for (let i = 0; i < SPIRAL_COUNT; i++){
      spirals.push(spawnNonOverlapping(spirals));
    }
  });

  requestAnimationFrame(tick);
})();



const dock = document.getElementById("linkDock");
const dockTitle = dock?.querySelector(".link-dock-title");
const dockSubtitle = dock?.querySelector(".link-dock-subtitle");
const dockButton = dock?.querySelector(".link-dock-button");

let activeLink = null;
let hideDockTimer = null;

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function showDockForLink(a){
  if (!dock) return;

  activeLink = a;

  const title = a.dataset.previewTitle || a.textContent.trim();
  const subtitle = a.dataset.previewSubtitle || "";

  dockTitle.textContent = title;
  dockSubtitle.textContent = subtitle;

  dockButton.href = a.href;

  dock.classList.add("is-active");

  const linkRect = a.getBoundingClientRect();
  const linkCenterY = linkRect.top + linkRect.height / 2;

  const dockRect = dock.getBoundingClientRect();
  const pad = 16;

  let top = linkCenterY - dockRect.height / 2;
  top = clamp(top, pad, window.innerHeight - dockRect.height - pad);

  dock.style.top = `${top}px`;

  if (hideDockTimer) clearTimeout(hideDockTimer);
}

function hideDockSoon(){
  if (!dock) return;
  hideDockTimer = setTimeout(() => {
    dock.classList.remove("is-active");
    activeLink = null;
  }, 150);
}

document.querySelectorAll("a.link-pop").forEach((a) => {
  a.addEventListener("mouseenter", () => showDockForLink(a));
  a.addEventListener("focus", () => showDockForLink(a));
  a.addEventListener("mouseleave", hideDockSoon);
  a.addEventListener("blur", hideDockSoon);
});

window.addEventListener("scroll", () => {
  if (activeLink && dock.classList.contains("is-active")) {
    showDockForLink(activeLink);
  }
}, { passive: true });

window.addEventListener("resize", () => {
  if (activeLink && dock.classList.contains("is-active")) {
    showDockForLink(activeLink);
  }
});

 
  (() => {
    const sections = document.querySelectorAll(".article-body section");

    sections.forEach((sec) => {
      const p = sec.querySelector("p:not([data-no-dropword])");
      if (!p) return;
      if (p.dataset.dropWordDone === "1") return;
      p.dataset.dropWordDone = "1";

      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.closest("a")) return NodeFilter.FILTER_REJECT; // don't start inside a link
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const firstTextNode = walker.nextNode() ? walker.currentNode : null;
      if (!firstTextNode) return;

      const text = firstTextNode.textContent;
      const m = text.match(/^(\s*)(\S+)([\s\S]*)$/);
      if (!m) return;

      const [, lead, firstWord, rest] = m;

      const frag = document.createDocumentFragment();
      if (lead) frag.appendChild(document.createTextNode(lead));

      const span = document.createElement("span");
      span.className = "drop-word";
      span.textContent = firstWord;
      span.setAttribute("data-no-rot", "1");

      frag.appendChild(span);
      frag.appendChild(document.createTextNode(rest.startsWith(" ") ? rest : " " + rest));

      firstTextNode.parentNode.replaceChild(frag, firstTextNode);
    });
  })();


  (() => {
    const RADIUS = 40;

    const textContainers = document.querySelectorAll(".article-body p");
    textContainers.forEach((el) => wrapWordsAndChars(el));

    function wrapWordsAndChars(rootEl) {
      if (rootEl.dataset.rotWrapped === "1") return;
      rootEl.dataset.rotWrapped = "1";

      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.closest("a.link-pop")) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.closest(".drop-word, [data-no-rot='1']"))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach((textNode) => {
        const parent = textNode.parentNode;
        const text = textNode.textContent;
        const frag = document.createDocumentFragment();
        let currentWordChars = [];

        function flushWord() {
          if (!currentWordChars.length) return;

          const wordSpan = document.createElement("span");
          wordSpan.className = "rot-word";

          currentWordChars.forEach((ch) => {
            const charSpan = document.createElement("span");
            charSpan.className = "rot-char";
            charSpan.textContent = ch;

            charSpan.dataset.stepIndex = "0";
            charSpan.dataset.insideRadius = "0";
            charSpan.style.fontFamily = `"${FONT_STEPS[0]}", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
            charSpan._rotTimerId = null;

            wordSpan.appendChild(charSpan);
          });

          frag.appendChild(wordSpan);
          currentWordChars = [];
        }

        for (const ch of text) {
          if (ch === " ") {
            flushWord();
            frag.appendChild(document.createTextNode(ch));
          } else {
            currentWordChars.push(ch);
          }
        }

        flushWord();
        parent.replaceChild(frag, textNode);
      });
    }

    const chars = document.querySelectorAll(".rot-char");

    document.addEventListener("mousemove", (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      chars.forEach((char) => {
        const rect = char.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dist = Math.hypot(cx - mouseX, cy - mouseY);

        const inside = dist <= RADIUS;
        const wasInside = char.dataset.insideRadius === "1";

        if (inside && !wasInside) {
          char.dataset.insideRadius = "1";
          bumpFont(char);
        } else if (!inside && wasInside) {
          setTimeout(() => {
            char.dataset.insideRadius = "0";
          }, 180);
        }
      });
    });

    function bumpFont(char) {
      let idx = Number(char.dataset.stepIndex) || 0;
      if (idx < FONT_STEPS.length - 1) idx += 1;

      char.dataset.stepIndex = String(idx);
      char.style.fontFamily = `"${FONT_STEPS[idx]}", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;

      if (char._rotTimerId) clearTimeout(char._rotTimerId);
      char._rotTimerId = setTimeout(() => {
        char.dataset.stepIndex = "0";
        char.style.fontFamily = `"${FONT_STEPS[0]}", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
        char._rotTimerId = null;
      }, 5000);
    }
  })();


  /*
  (() => {
    const reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const h2s = document.querySelectorAll(".article-body h2");
    h2s.forEach((h2, i) => {
      let idx = 0;
      let dir = 1;
      const intervalMs = 240;
      const stagger = i * 120;

      setTimeout(() => {
        setInterval(() => {
          idx += dir;
          if (idx >= FONT_STEPS.length - 1) { idx = FONT_STEPS.length - 1; dir = -1; }
          else if (idx <= 0) { idx = 0; dir = 1; }
          h2.style.fontFamily = `"${FONT_STEPS[idx]}", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
        }, intervalMs);
      }, stagger);
    });
  })();
  */
});