
document.addEventListener("DOMContentLoaded", () => {

  const WEIGHT_STEPS = [400, 200, 300, 500, 700, 900];

  const RADIUS = 40;

  const textContainers = document.querySelectorAll(
    ".article-page p, .article-page h1, .article-page h2"

  );

  textContainers.forEach((el) => wrapWordsAndChars(el));

  function wrapWordsAndChars(rootEl) {
    const walker = document.createTreeWalker(
      rootEl,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode;
      const text = textNode.textContent;
      const frag = document.createDocumentFragment();

      let currentWordChars = [];

      function flushWord() {
        if (currentWordChars.length === 0) return;

        const wordSpan = document.createElement("span");
        wordSpan.className = "rot-word";

        currentWordChars.forEach((ch) => {
          const charSpan = document.createElement("span");
          charSpan.className = "rot-char";
          charSpan.textContent = ch;

          charSpan.dataset.weightIndex = "0";
          charSpan.dataset.insideRadius = "0"; 

          charSpan.style.fontWeight = WEIGHT_STEPS[0];

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

         initOrbs();
         function initOrbs() {
  const orbs = Array.from(document.querySelectorAll(".orb"));
  if (!orbs.length) return;

  const state = [];


  const vw = window.innerWidth;
  const vh = window.innerHeight;

  orbs.forEach((el, index) => {
    const size = el.offsetWidth || 320;

    state.push({
      el,
      size,
      
      x: (vw / (orbs.length + 1)) * (index + 1) - size / 2,
      y: (vh / (orbs.length + 1)) * (index + 1) - size / 2,

      vx: (Math.random() * 0.4 + 0.2) * (Math.random() < 0.5 ? -1 : 1),
      vy: (Math.random() * 0.4 + 0.2) * (Math.random() < 0.5 ? -1 : 1),
    });
  });

  let lastTime = performance.now();

  function frame(now) {
    const dt = (now - lastTime) || 16;
    lastTime = now;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    state.forEach((orb) => {
      const speedScale = dt * 0.08;

      orb.x += orb.vx * speedScale;
      orb.y += orb.vy * speedScale;


      if (orb.x <= -orb.size * 0.2 || orb.x + orb.size >= vw + orb.size * 0.2) {
        orb.vx *= -1;
      }
      if (orb.y <= -orb.size * 0.2 || orb.y + orb.size >= vh + orb.size * 0.2) {
        orb.vy *= -1;
      }

      orb.el.style.transform = `translate(${orb.x}px, ${orb.y}px)`;
    });

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);


  window.addEventListener("resize", () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    state.forEach((orb, index) => {
      const size = orb.size;
      orb.x = Math.min(Math.max(orb.x, -size * 0.2), vw - size * 0.8);
      orb.y = Math.min(Math.max(orb.y, -size * 0.2), vh - size * 0.8);
    });
  });
}


  }


  const chars = document.querySelectorAll(".rot-char");

  document.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = cx - mouseX;
      const dy = cy - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const inside = dist <= RADIUS;
      const wasInside = char.dataset.insideRadius === "1";

      if (inside && !wasInside) {
        char.dataset.insideRadius = "1";
        bumpWeight(char);
      } else if (!inside && wasInside) {
        char.dataset.insideRadius = "0";
      }
    });
  });

  function bumpWeight(char) {
    let currentIndex = Number(char.dataset.weightIndex) || 0;

    if (currentIndex < WEIGHT_STEPS.length - 1) {
      currentIndex += 1;
    }

    char.dataset.weightIndex = String(currentIndex);
    char.style.fontWeight = WEIGHT_STEPS[currentIndex];

    if (char._rotTimerId) {
      clearTimeout(char._rotTimerId);
    }

    char._rotTimerId = setTimeout(() => {
      char.dataset.weightIndex = "0";
      char.style.fontWeight = WEIGHT_STEPS[0];
      char._rotTimerId = null;
    }, 5000);
  }
});
