
function setupHeroStateObserver(){
  const hero = document.getElementById("hero");
  const conv = document.querySelector(".conversation");
  if (!hero || !conv || !("IntersectionObserver" in window)) return;

  const body = document.body;

  const io = new IntersectionObserver((entries) => {
    const e = entries[0];
    const heroOnScreen = e.isIntersecting && e.intersectionRatio > 0.15;

    if (body.classList.contains("is-forced-conversation")) {
      body.classList.remove("in-hero");
      return;
    }

    body.classList.toggle("in-hero", heroOnScreen);

    if (heroOnScreen) body.classList.remove("in-conversation");
  }, { threshold: [0, 0.15, 0.3, 0.6, 1] });

  io.observe(hero);
}

document.addEventListener("DOMContentLoaded", () => {
  resetHighlightIfNotInConversation();

  setupQuestionTimeline();
  setupConversationBackgroundObserver();
  setupScrollSpeakerBandObserver();
  setupSentencePlayback();    
  setupHeroCursorReveal();   
  setupHeroStateObserver();   
});



function setupHeroCursorReveal() {
  const hero = document.querySelector(".hero--reveal");
  const over = document.getElementById("heroOver");
  const canvas = document.getElementById("heroReveal");
  const conv = document.querySelector(".conversation");

  if (!hero || !over || !canvas) return;

  const REVEAL_RADIUS_PX = 110;
  const HOLD_MS = 1400;
  const CELL = 7;

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;

  let w = 0, h = 0;
  let rafId = null;

  const stamps = []; 

  function resize() {
    const r = hero.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));

    canvas.width = w;
    canvas.height = h;

    canvas.style.display = "none";
  }

  function clearMask() {
    over.style.webkitMaskImage = "none";
    over.style.maskImage = "none";
  }

  function addStamp(clientX, clientY) {
    const r = hero.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    if (x < 0 || x > r.width || y < 0 || y > r.height) return;
    stamps.push({ x, y, t: performance.now() });
  }

  function drawMask(now) {
    if (
      document.body.classList.contains("in-conversation") ||
      document.body.classList.contains("is-forced-conversation")
    ) {
      stamps.length = 0;
      clearMask();
      return;
    }

    for (let i = stamps.length - 1; i >= 0; i--) {
      if (now - stamps[i].t > HOLD_MS) stamps.splice(i, 1);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);

    if (!stamps.length) {
      clearMask();
      return;
    }

    ctx.globalCompositeOperation = "destination-out";

    const rr = REVEAL_RADIUS_PX;
    const rr2 = rr * rr;

    for (const s of stamps) {
      const cx = s.x;
      const cy = s.y;

      const minX = Math.floor((cx - rr) / CELL) * CELL;
      const maxX = Math.ceil((cx + rr) / CELL) * CELL;
      const minY = Math.floor((cy - rr) / CELL) * CELL;
      const maxY = Math.ceil((cy + rr) / CELL) * CELL;

      for (let y = minY; y <= maxY; y += CELL) {
        for (let x = minX; x <= maxX; x += CELL) {
          const dx = x + CELL * 0.5 - cx;
          const dy = y + CELL * 0.5 - cy;
          if (dx * dx + dy * dy <= rr2) {
            ctx.fillRect(x, y, CELL, CELL);
          }
        }
      }
    }

    const url = canvas.toDataURL("image/png");

    over.style.webkitMaskImage = `url(${url})`;
    over.style.webkitMaskRepeat = "no-repeat";
    over.style.webkitMaskSize = "100% 100%";
    over.style.webkitMaskPosition = "center";

    over.style.maskImage = `url(${url})`;
    over.style.maskRepeat = "no-repeat";
    over.style.maskSize = "100% 100%";
    over.style.maskPosition = "center";
  }

  function tick(now) {
    drawMask(now);
    rafId = requestAnimationFrame(tick);
  }

  over.addEventListener("pointermove", (e) => addStamp(e.clientX, e.clientY));
  over.addEventListener("pointerdown", (e) => addStamp(e.clientX, e.clientY));
  window.addEventListener("resize", resize);

  if (conv && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          stamps.length = 0;
          clearMask();
        }
      },
      { threshold: 0.01 }
    );
    io.observe(conv);
  }

  resize();
  rafId = requestAnimationFrame(tick);
}


function resetHighlightIfNotInConversation() {
  const body = document.body;
  if (!body.classList.contains("in-conversation")) {
    body.removeAttribute("data-active-speaker");
    body.dataset.playing = "0";
    body.dataset.speakerLock = "0";
    body.dataset.lastScrollSpeaker = "";
  }
}

function setActiveSpeaker(speaker) {
  const body = document.body;

  if (!body.classList.contains("in-conversation") && !body.classList.contains("is-forced-conversation")) {
    body.removeAttribute("data-active-speaker");
    return;
  }
  if (!speaker) return;
  body.setAttribute("data-active-speaker", speaker);
}


function setupQuestionTimeline() {
  const nodes = document.querySelectorAll(".timeline-node");
  const body = document.body;

  let isProgrammaticJump = false;
  let settleTimer = null;

function lockToMeher() {
  body.dataset.speakerLock = "1";
  setActiveSpeaker("meher");
  body.dataset.lastScrollSpeaker = "meher";
}

  function beginProgrammaticJump() {
    isProgrammaticJump = true;

    const markSettled = () => {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        isProgrammaticJump = false;
      }, 160);
    };

    markSettled();
    window.addEventListener("scroll", markSettled, { passive: true, once: true });
  }

  function unlockOnUserScroll() {
    if (isProgrammaticJump) return;
    if (body.dataset.speakerLock === "1") body.dataset.speakerLock = "0";
  }


window.addEventListener("wheel", unlockOnUserScroll, { passive: true });
window.addEventListener("touchmove", unlockOnUserScroll, { passive: true });

window.addEventListener("keydown", (e) => {
  const keys = ["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "];
  if (keys.includes(e.key)) unlockOnUserScroll();
});


  nodes.forEach((node) => {
    node.addEventListener("click", () => {
      const targetSelector = node.getAttribute("data-target");
      if (!targetSelector) return;

      const target = document.querySelector(targetSelector);
      if (!target) return;

      lockToMeher();
      beginProgrammaticJump();

      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const offset = window.innerHeight * 0.55;

      window.scrollTo({ top: absoluteTop - offset, behavior: "smooth" });
    });
  });
}



function setupConversationBackgroundObserver() {
  const conv = document.querySelector(".conversation");
  if (!conv) return;

  const body = document.body;

  const ENTER_Y = 80;
  const EXIT_Y = 240;

  function update() {
    if (body.classList.contains("is-forced-conversation")) {
      body.classList.add("in-conversation");
      return;
    }

    const convTop = conv.getBoundingClientRect().top;
    const isIn = body.classList.contains("in-conversation");

    if (!isIn && convTop <= ENTER_Y) {
      body.classList.add("in-conversation");
    } else if (isIn && convTop > EXIT_Y) {
      body.classList.remove("in-conversation");
      body.removeAttribute("data-active-speaker");
      body.dataset.playing = "0";
      body.dataset.speakerLock = "0";
      window.dispatchEvent(new CustomEvent("playback:forceStop"));
    }
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}



function setupScrollSpeakerBandObserver() {
  const turns = Array.from(document.querySelectorAll(".turn[data-speaker]"));
  if (!turns.length || !("IntersectionObserver" in window)) return;

  const body = document.body;

  const BAND_TOP = 0.82;
  const BAND_BOTTOM = 0.90;
  const TARGET_Y = (BAND_TOP + BAND_BOTTOM) / 2;

  const MIN_SWITCH_GAP_MS = 120;
  let currentSpeaker = null;
  let lastSwitchAt = 0;

  const observer = new IntersectionObserver(
    (entries) => {
      const inConversation =
        body.classList.contains("in-conversation") || body.classList.contains("is-forced-conversation");
      if (!inConversation) return;

      if (body.dataset.playing === "1") return;
      if (body.dataset.speakerLock === "1") return;

      const targetYpx = window.innerHeight * TARGET_Y;

      const intersecting = entries.filter((e) => e.isIntersecting);
      if (!intersecting.length) return;

      let best = null;
      let bestDist = Infinity;

      for (const e of intersecting) {
        const dist = Math.abs(e.boundingClientRect.top - targetYpx);
        if (dist < bestDist) {
          bestDist = dist;
          best = e;
        }
      }

      if (!best) return;

      const nextSpeaker = best.target.getAttribute("data-speaker");
      if (!nextSpeaker) return;

      const now = performance.now();
      if (nextSpeaker !== currentSpeaker && now - lastSwitchAt < MIN_SWITCH_GAP_MS) return;

      if (nextSpeaker !== currentSpeaker) {
        currentSpeaker = nextSpeaker;
        lastSwitchAt = now;
        setActiveSpeaker(nextSpeaker);
        body.dataset.lastScrollSpeaker = nextSpeaker;
      }
    },
    {
      root: null,
      rootMargin: `-${Math.round(BAND_TOP * 100)}% 0px -${Math.round((1 - BAND_BOTTOM) * 100)}% 0px`,
      threshold: 0,
    }
  );

  turns.forEach((t) => observer.observe(t));
}


function buildSentenceCues(root) {
  const paragraphs = root.querySelectorAll(".col p");
  const created = [];

  const MERGE_IF_WORDS_LTE = 10;

  function countWords(str) {
    const t = (str || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  function mergeShortWithNext(parts) {
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      const s = (parts[i] || "").trim();
      if (!s) continue;

      const words = countWords(s);

      if (words <= MERGE_IF_WORDS_LTE && i < parts.length - 1) {
        const next = (parts[i + 1] || "").trim();
        if (next) {
          out.push(`${s} ${next}`);
          i++; 
          continue;
        }
      }

      out.push(s);
    }
    return out;
  }

  paragraphs.forEach((p) => {
    const original = (p.textContent || "").trim();
    if (!original) return;

    const turn = p.closest(".turn[data-speaker]");
    const speaker = turn ? turn.getAttribute("data-speaker") : "";

    const sentences = original
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?])\s+(?=[“"‘'\(\[]?[A-Z0-9])/g);

    const partsRaw = sentences.length ? sentences : [original];

    const parts = mergeShortWithNext(partsRaw);

    p.textContent = "";

    parts.forEach((s, idx) => {
      const span = document.createElement("span");
      span.className = "cue-sentence";
      span.textContent = s;
      if (speaker) span.dataset.speaker = speaker;

      p.appendChild(span);

      if (idx < parts.length - 1) p.appendChild(document.createTextNode(" "));
      created.push(span);
    });
  });

  return created;
}


function setupSentencePlayback() {
  const playBtn = document.getElementById("audioPlayBtn");
  const scrub = document.getElementById("playbackScrub");
  const transcript = document.querySelector(".transcript");
  const conv = document.querySelector(".conversation");
  const audioBar = document.querySelector(".audio-bar");

  if (!playBtn || !scrub || !transcript) return;

  if (audioBar) audioBar.style.pointerEvents = "auto";

  const sentenceEls = buildSentenceCues(transcript);
  if (!sentenceEls.length) return;

  let isPlaying = false;
  let currentIndex = 0;
  let timerId = null;

  const MS_PER_WORD = 170;
  const MIN_MS = 700;
  const MAX_MS = 5200;
  const EXTRA_MS = 180;

  const TARGET_Y = 0.66; 

const FOLLOW_START_INDEX = 4;


  function forceConversationOn() {
    document.body.classList.add("is-forced-conversation");
    document.body.classList.add("in-conversation");
  }

  function forceConversationOff() {
    document.body.classList.remove("is-forced-conversation");
  }

  function setButtonLabel() {
    playBtn.textContent = isPlaying ? "Pause" : currentIndex === 0 ? "Play" : "Resume";
  }

  function clearActiveSentence() {
    const prev = transcript.querySelector(".cue-sentence.is-active");
    if (prev) prev.classList.remove("is-active");
  }

  function scrollCueIntoPosition(el, behavior = "smooth") {
    const rect = el.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const offset = window.innerHeight * TARGET_Y;

    window.scrollTo({
      top: absoluteTop - offset,
      behavior,
    });
  }

  function estimateDurationMs(el) {
    const text = (el.textContent || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const ms = words * MS_PER_WORD + EXTRA_MS;
    return Math.max(MIN_MS, Math.min(MAX_MS, ms));
  }

  function updateScrubberFromIndex() {
    const ratio = sentenceEls.length <= 1 ? 0 : currentIndex / (sentenceEls.length - 1);
    scrub.value = String(Math.round(ratio * 1000));
  }

  function setIndexFromScrubber() {
    const ratio = Number(scrub.value) / 1000;
    const idx = Math.round(ratio * (sentenceEls.length - 1));
    currentIndex = Math.max(0, Math.min(sentenceEls.length - 1, idx));
  }

  function setSpeakerFromSentence(el) {
    const speaker = el.dataset.speaker;
    if (speaker) setActiveSpeaker(speaker);
  }

function activateIndex(idx, shouldScroll = true, scrollBehavior = "smooth") {
  clearActiveSentence();
  const el = sentenceEls[idx];
  if (!el) return;

  el.classList.add("is-active");
  setSpeakerFromSentence(el);


  const allowFollowScroll = idx >= FOLLOW_START_INDEX;

  if (shouldScroll && allowFollowScroll) {
    scrollCueIntoPosition(el, scrollBehavior);
  }
}

  function finishPlayback(resetToStart = false) {
    isPlaying = false;
    document.body.dataset.playing = "0";

    if (timerId) window.clearTimeout(timerId);
    timerId = null;

    clearActiveSentence();
    if (resetToStart) currentIndex = 0;

    updateScrubberFromIndex();
    setButtonLabel();

    const restore = document.body.dataset.lastScrollSpeaker;
    if (restore) setActiveSpeaker(restore);

    forceConversationOff();
  }

  function step(scrollBehavior = "smooth") {
    if (!isPlaying) return;

    if (currentIndex >= sentenceEls.length) {
      finishPlayback(true);
      return;
    }

    activateIndex(currentIndex, true, scrollBehavior);
    updateScrubberFromIndex();

    const duration = estimateDurationMs(sentenceEls[currentIndex]);
    currentIndex += 1;
    timerId = window.setTimeout(() => step("smooth"), duration);
  }

  function play() {
    if (isPlaying) return;

    forceConversationOn();
    isPlaying = true;
    document.body.dataset.playing = "1";
    setButtonLabel();


    if (currentIndex === 0) {
      activateIndex(0, false, "auto"); 
      updateScrubberFromIndex();

      const duration = estimateDurationMs(sentenceEls[0]);
      currentIndex = 1;

      timerId = window.setTimeout(() => step("smooth"), duration);
      return;
    }


    activateIndex(currentIndex, true, "auto");
    updateScrubberFromIndex();

    const duration = estimateDurationMs(sentenceEls[currentIndex]);
    currentIndex += 1;

    timerId = window.setTimeout(() => step("smooth"), duration);
  }

  function pause() {
    isPlaying = false;
    document.body.dataset.playing = "0";

    if (timerId) window.clearTimeout(timerId);
    timerId = null;

    setButtonLabel();
    forceConversationOff();
  }

  playBtn.addEventListener("click", (e) => {
    if (e.shiftKey) {
      finishPlayback(true);
      return;
    }
    if (isPlaying) pause();
    else play();
  });

  scrub.addEventListener("pointerdown", () => pause());

  scrub.addEventListener("input", () => {
    setIndexFromScrubber();

    forceConversationOn();


    if (currentIndex === 0) {
      activateIndex(0, false, "auto"); 
      updateScrubberFromIndex();
      setButtonLabel();
      return;
    }

    activateIndex(currentIndex, true, "auto");
    updateScrubberFromIndex();
    setButtonLabel();
  });


  window.addEventListener("playback:forceStop", () => {
    finishPlayback(false);
  });

  updateScrubberFromIndex();
  setButtonLabel();
}
