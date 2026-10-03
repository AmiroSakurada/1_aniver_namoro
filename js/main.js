import * as THREE from 'three';

// ===== PHOTOS (pairs) =====
// 3 unique photos = 3 pairs (no duplicates)
const PAIR_SOURCES = [
  { id: 'p1', src: 'photos/foto1.jpeg', pos: 'center 22%' },
  { id: 'p2', src: 'photos/foto2.jpeg', pos: 'center 28%' },
  { id: 'p3', src: 'photos/foto3.jpeg', pos: 'center 35%' },
  { id: 'p4', src: 'photos/foto4.jpeg', pos: 'center 40%' }
];

// ===== STATE =====
let cards = [];
let flipped = [];
let matchedCount = 0;
let moves = 0;
let locked = false;
let musicOn = true;
let audioCtx = null;
let themeAudio = null; // HTMLAudioElement for "Dona"

const TOTAL_PAIRS = 4;

// ===== 2D FX PARTICLES SYSTEM (DELIGHT) =====
const fxCanvas = document.getElementById('fx-canvas');
let fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
let particles = [];
let fxAnimId = null;

function resizeFxCanvas() {
  if (!fxCanvas || !fxCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxCanvas.width = window.innerWidth * dpr;
  fxCanvas.height = window.innerHeight * dpr;
  fxCtx.setTransform(1, 0, 0, 1, 0, 0);
  fxCtx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeFxCanvas);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', resizeFxCanvas);
} else {
  resizeFxCanvas();
}

function emitSparks(x, y, count = 24) {
  if (!fxCtx) return;
  const colors = ['#f0d090', '#c4a06a', '#b85c48', '#ffffff', '#e8a090'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 4.2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      size: 2.5 + Math.random() * 3.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.018 + Math.random() * 0.02,
      gravity: 0.12,
      shape: Math.random() > 0.4 ? 'petal' : 'spark',
      rot: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.12
    });
  }
  if (!fxAnimId) updateParticles();
}

function emitConfettiCelebration() {
  if (!fxCtx) return;
  const w = window.innerWidth;
  const colors = ['#f0d090', '#c4a06a', '#b85c48', '#ffffff', '#f5d5db', '#ffd700'];
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: Math.random() * w,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 2.2,
      vy: 1.5 + Math.random() * 3,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.005 + Math.random() * 0.006,
      gravity: 0.03,
      shape: 'petal',
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.08
    });
  }
  if (!fxAnimId) updateParticles();
}

function updateParticles() {
  if (!fxCtx) return;
  fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.alpha -= p.decay;
    p.rot += p.vRot;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    fxCtx.save();
    fxCtx.globalAlpha = Math.max(0, p.alpha);
    fxCtx.fillStyle = p.color;
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);

    if (p.shape === 'petal') {
      fxCtx.beginPath();
      fxCtx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, Math.PI * 2);
      fxCtx.fill();
    } else {
      fxCtx.beginPath();
      fxCtx.arc(0, 0, p.size, 0, Math.PI * 2);
      fxCtx.fill();
    }
    fxCtx.restore();
  }

  if (particles.length > 0) {
    fxAnimId = requestAnimationFrame(updateParticles);
  } else {
    fxAnimId = null;
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

// Clean SVG icons for the preview bar (no emoji)
function makeFlowerIcon(kind) {
  const c = document.createElement('canvas');
  c.width = 80; c.height = 88;
  const ctx = c.getContext('2d');
  ctx.translate(40, 36);
  if (kind === 'sunflower') {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      const g = ctx.createLinearGradient(0, -28, 0, -6);
      g.addColorStop(0, '#f0c850');
      g.addColorStop(1, '#c88810');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -16, 4, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const cg = ctx.createRadialGradient(-2, -2, 1, 0, 0, 10);
    cg.addColorStop(0, '#5a3a1c');
    cg.addColorStop(1, '#2a180c');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // lily - soft trumpet petals
    const petals = [[-8, 0, -0.4], [8, 0, 0.4], [0, -8, 0]];
    petals.forEach(([px, py, rot]) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(0, -14, 0, 8);
      g.addColorStop(0, '#fff8fa');
      g.addColorStop(0.6, '#e8c4c8');
      g.addColorStop(1, '#d4a0a8');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(-7, 0, -2, -14);
      ctx.quadraticCurveTo(0, -17, 2, -14);
      ctx.quadraticCurveTo(7, 0, 0, 8);
      ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = '#d4a040';
    ctx.beginPath();
    ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // stem
  ctx.strokeStyle = '#3a6a34';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(0, 40);
  ctx.stroke();
  return c.toDataURL('image/png');
}


// ===== DOM =====
const $ = (sel) => document.querySelector(sel);
const menu = $('#menu');
const howto = $('#howto');
const game = $('#game');
const win = $('#win');
const board = $('#board');
const bouquetPreview = $('#bouquet-preview');
const movesEl = $('#moves');
const pairsEl = $('#pairs');
const pauseOverlay = $('#pause-overlay');

// ===== SCREENS =====
function showScreen(id) {
  const next = $(id);
  const current = document.querySelector('.screen.active');
  if (current && current !== next) {
    current.classList.remove('active');
    // keep display flex briefly so opacity can fade, then hide
    setTimeout(() => {
      if (!current.classList.contains('active')) current.style.display = 'none';
    }, 320);
  }
  document.querySelectorAll('.screen').forEach(s => {
    if (s !== next && s !== current) {
      s.classList.remove('active');
      s.style.display = 'none';
    }
  });
  next.style.display = 'flex';
  void next.offsetWidth;
  next.classList.add('active');
}

// ===== AUDIO =====
// Theme: "Dona" looping softly under the game
// SFX: Web Audio (flip / match / miss / flower / win)

let themeFadeTimer = null;

function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn('AudioContext unavailable', e);
  }
  if (!themeAudio) {
    themeAudio = new Audio('assets/dona.mp3');
    themeAudio.loop = true;
    themeAudio.volume = 0;
    themeAudio.preload = 'auto';
    themeAudio.setAttribute('playsinline', 'true');
    themeAudio.setAttribute('webkit-playsinline', 'true');
    // iOS: keep element in DOM helps some browsers
    themeAudio.style.display = 'none';
    document.body.appendChild(themeAudio);
  }
}

function fadeThemeIn() {
  if (themeFadeTimer) {
    clearInterval(themeFadeTimer);
    themeFadeTimer = null;
  }
  if (!themeAudio || !musicOn) return;
  const target = 0.16;
  const steps = 20;
  let i = 0;
  // keep current volume if already partially up
  const startVol = themeAudio.volume || 0;
  themeFadeTimer = setInterval(() => {
    i++;
    if (!themeAudio || !musicOn) {
      clearInterval(themeFadeTimer);
      themeFadeTimer = null;
      return;
    }
    themeAudio.volume = Math.min(target, startVol + (i / steps) * (target - startVol));
    if (i >= steps) {
      clearInterval(themeFadeTimer);
      themeFadeTimer = null;
    }
  }, 40);
}

function tryPlayTheme() {
  if (!themeAudio || !musicOn) return;
  const p = themeAudio.play();
  if (p && p.then) {
    p.then(() => fadeThemeIn()).catch(() => {
      // wait until enough data, then retry once
      const onReady = () => {
        themeAudio.removeEventListener('canplay', onReady);
        if (musicOn) {
          themeAudio.play().then(() => fadeThemeIn()).catch(() => {});
        }
      };
      themeAudio.addEventListener('canplay', onReady);
    });
  } else {
    fadeThemeIn();
  }
}

function startTheme() {
  if (!musicOn) return;
  initAudio();
  if (!themeAudio) return;
  tryPlayTheme();
}

function stopTheme() {
  if (themeFadeTimer) {
    clearInterval(themeFadeTimer);
    themeFadeTimer = null;
  }
  if (themeAudio) {
    themeAudio.pause();
    try { themeAudio.currentTime = 0; } catch (e) {}
    themeAudio.volume = 0;
  }
}

function ensureAudioReady() {
  if (!musicOn) return false;
  initAudio();
  return !!audioCtx;
}

function playTone(freq, dur = 0.25, type = 'sine', vol = 0.14) {
  if (!ensureAudioReady()) return;
  try {
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(Math.max(0.0001, vol), t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  } catch (e) {}
}

function playMenuClick() {
  if (!ensureAudioReady()) return;
  playTone(520, 0.06, 'sine', 0.08);
  setTimeout(() => playTone(680, 0.08, 'triangle', 0.06), 40);
}

// Soft paper/card flip
function playFlipSound() {
  if (!ensureAudioReady()) return;
  try {
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.06);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    const gain = audioCtx.createGain();
    const t0 = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.22, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(t0);
    playTone(680, 0.05, 'triangle', 0.08);
  } catch (e) {}
}

// Match success – warm rising arpeggio + sparkle
function playMatchSound() {
  if (!ensureAudioReady()) return;
  const notes = [392, 494, 587, 784];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.22, 'sine', 0.15), i * 70);
  });
  setTimeout(() => playTone(1175, 0.18, 'triangle', 0.07), 280);
}

// Soft mismatch
function playMissSound() {
  if (!ensureAudioReady()) return;
  playTone(220, 0.12, 'sine', 0.05);
  setTimeout(() => playTone(196, 0.18, 'sine', 0.04), 90);
}

// Flower pop
function playFlowerSound() {
  if (!ensureAudioReady()) return;
  playTone(523, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(659, 0.15, 'triangle', 0.09), 60);
}

// Win celebration
function playWinMelody() {
  if (!ensureAudioReady()) return;
  const notes = [392, 440, 494, 523, 587, 659, 784, 880];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.32, 'sine', 0.13), i * 140);
  });
}

// ===== GAME LOGIC =====
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createDeck() {
  const deck = [];
  PAIR_SOURCES.forEach(p => {
    deck.push({ ...p, unique: p.id + 'a' });
    deck.push({ ...p, unique: p.id + 'b' });
  });
  return shuffle(deck);
}


function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}



function drawCorner(ctx, x, y, sx, sy) {
  ctx.strokeStyle = 'rgba(212,165,116,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + sy*18);
  ctx.lineTo(x, y);
  ctx.lineTo(x + sx*18, y);
  ctx.stroke();
}



function drawLeaf(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const lg = ctx.createLinearGradient(-12, 0, 12, 0);
  lg.addColorStop(0, '#2d5a28');
  lg.addColorStop(1, '#3a7a34');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Card back — tarot sun art
const CARD_BACK_URL = 'assets/tarot-sun-card-back.png';


// Fake 3D tilt on unflipped cards (CSS vars)
function setupCardTilt() {
  const boardEl = document.getElementById('board');
  if (!boardEl || boardEl.dataset.tiltBound) return;
  boardEl.dataset.tiltBound = '1';
  boardEl.addEventListener('pointermove', (e) => {
    boardEl.querySelectorAll('.card:not(.flipped):not(.matched)').forEach(card => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const clamp = (v) => Math.max(-0.5, Math.min(0.5, v));
      card.style.setProperty('--tilt-y', (clamp(px) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-x', (-clamp(py) * 8).toFixed(2) + 'deg');
    });
  });
  boardEl.addEventListener('pointerleave', () => {
    boardEl.querySelectorAll('.card').forEach(card => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

function renderBoard() {
  board.innerHTML = '';
  cards = createDeck();
  flipped = [];
  matchedCount = 0;
  moves = 0;
  locked = false;
  updateStats();
  
  // 4 slots de flores pré-alocados com elegância
  bouquetPreview.innerHTML = '';
  for (let i = 0; i < TOTAL_PAIRS; i++) {
    const slot = document.createElement('div');
    slot.className = 'bouquet-slot';
    slot.dataset.slot = i;
    slot.setAttribute('aria-label', `Flor ${i + 1} de ${TOTAL_PAIRS}`);
    bouquetPreview.appendChild(slot);
  }

  const cardBackURL = CARD_BACK_URL + '?t=' + Date.now();

  cards.forEach((card, index) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.index = index;
    el.dataset.id = card.id;
    el.innerHTML = `
      <div class="card-face card-back" style="background-image:url('${cardBackURL}'); background-size:cover; background-position:center;">
      </div>
      <div class="card-face card-front">
        <img src="${card.src}" alt="Nós" style="object-position: ${card.pos || 'center'};" loading="eager" draggable="false">
      </div>
    `;
    let lastTap = 0;
    const handle = () => {
      const now = Date.now();
      if (now - lastTap < 350) return; // debounce click+touch
      lastTap = now;
      onCardClick(index);
    };
    el.addEventListener('pointerup', handle);
    board.appendChild(el);
  });
  setupCardTilt();
}

function updateStats() {
  movesEl.textContent = `${moves} jogada${moves !== 1 ? 's' : ''}`;
  pairsEl.textContent = `${matchedCount} / ${TOTAL_PAIRS} pares`;
}

function onCardClick(index) {
  if (locked) return;
  const cardEl = board.children[index];
  if (!cardEl || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

  initAudio();
  playFlipSound();
  if (musicOn && themeAudio && themeAudio.paused) {
    tryPlayTheme();
  }

  cardEl.classList.add('flipped');
  flipped.push({ index, id: cards[index].id, el: cardEl });

  if (flipped.length === 2) {
    locked = true;
    moves++;
    updateStats();
    checkMatch();
  }
}

function checkMatch() {
  const [a, b] = flipped;
  if (a.id === b.id) {
    // Par encontrado com sucesso!
    setTimeout(() => {
      a.el.classList.add('matched');
      b.el.classList.add('matched');

      // Microinteração tátil de partículas e faíscas douradas entre as duas cartas
      try {
        const rA = a.el.getBoundingClientRect();
        const rB = b.el.getBoundingClientRect();
        const midX = (rA.left + rA.width / 2 + rB.left + rB.width / 2) / 2;
        const midY = (rA.top + rA.height / 2 + rB.top + rB.height / 2) / 2;
        emitSparks(midX, midY, 26);
      } catch (e) {}

      matchedCount++;
      updateStats();
      addFlower(matchedCount - 1);
      playMatchSound();
      flipped = [];
      locked = false;

      if (matchedCount === TOTAL_PAIRS) {
        setTimeout(endGame, 750);
      }
    }, 450);
  } else {
    playMissSound();
    setTimeout(() => {
      a.el.classList.remove('flipped');
      b.el.classList.remove('flipped');
      flipped = [];
      locked = false;
    }, 750);
  }
}

function addFlower(slotIndex) {
  const slot = bouquetPreview.children[slotIndex];
  if (!slot) return;
  const isLily = (slotIndex % 2 === 1);
  slot.classList.add('filled');
  slot.innerHTML = `
    <div class="flower-icon ${isLily ? 'lily' : 'sunflower'}">
      <img src="${isLily ? 'assets/flowers/icon-lily.png' : 'assets/flowers/icon-sun.png'}" alt="Flor" draggable="false">
    </div>
  `;
  playFlowerSound();
}

function endGame() {
  showScreen('#win');
  playWinMelody();
  emitConfettiCelebration();

  const container = document.getElementById('three-container');
  if (container) container.innerHTML = '';
  disposeThree();
  requestAnimationFrame(() => {
    try {
      initThreeBouquet();
    } catch (e) {
      render2DBouquet(container);
    }
  });
}

// ===== THREE.JS BOUQUET (CINEMATIC FLORAL DEPTH) =====
let renderer, scene, camera, animId;
let bouquetGroup, particleSystem;
let targetTiltX = 0, targetTiltY = 0;
let currentTiltX = 0, currentTiltY = 0;

function initThreeBouquet() {
  const container = $('#three-container');
  if (!container) return;
  container.innerHTML = '';

  const w = Math.max(container.clientWidth, 280);
  const h = Math.max(container.clientHeight, 240);

  let glOk = false;
  try {
    const test = document.createElement('canvas');
    glOk = !!(test.getContext('webgl2') || test.getContext('webgl') || test.getContext('experimental-webgl'));
  } catch (e) { glOk = false; }

  if (!glOk) {
    render2DBouquet(container);
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
  camera.position.set(0, 0.2, 4.4);
  camera.lookAt(0, 0, 0);

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    render2DBouquet(container);
    return;
  }
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Iluminação romântica e quente de estúdio
  scene.add(new THREE.AmbientLight(0xffeedd, 0.95));
  const mainLight = new THREE.DirectionalLight(0xfffaec, 1.4);
  mainLight.position.set(2.0, 3.5, 3.0);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xe8aa70, 0.6);
  fillLight.position.set(-2.5, 1.5, 1.0);
  scene.add(fillLight);

  const candleLight = new THREE.PointLight(0xffb86c, 0.9, 10);
  candleLight.position.set(0, 1.8, -0.5);
  scene.add(candleLight);

  bouquetGroup = new THREE.Group();
  bouquetGroup.scale.setScalar(0.01); // Inicia pequeno para florescer (grow-in)
  scene.add(bouquetGroup);

  // Halo Solar de Fundo (Aura celestial de tarô atrás das flores)
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128; haloCanvas.height = 128;
  const haloCtx = haloCanvas.getContext('2d');
  const hGrad = haloCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
  hGrad.addColorStop(0, 'rgba(255, 230, 160, 0.45)');
  hGrad.addColorStop(0.4, 'rgba(216, 170, 107, 0.25)');
  hGrad.addColorStop(0.8, 'rgba(192, 72, 104, 0.1)');
  hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  haloCtx.fillStyle = hGrad;
  haloCtx.fillRect(0, 0, 128, 128);
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const haloMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), haloMat);
  haloMesh.position.set(0, 0.45, -0.4);
  bouquetGroup.add(haloMesh);

  // Carregador de texturas com coroa volumétrica no topo (sem topo chapado)
  const texLoader = new THREE.TextureLoader();
  const flowerItems = [];

  // Configuração das camadas: base usa fundo escuro + AdditiveBlending para eliminar preto/branco
  // PNG flower layers usam alphaTest mais alto para cortar bordas sujas
  const layersConfig = [
    // 1. Buquê mestre central — foto com fundo preto, AdditiveBlending dissolve o preto
    { src: 'assets/bouquet-dark.jpg', w: 2.5, h: 3.0, x: 0, y: -0.1, z: 0, rotX: 0, rotY: 0, rotZ: 0, speed: 1.0, amp: 0.02, additive: true },

    // 2. Coroa floral do Topo (volume esférico em leque, flores PNG com alpha limpo)
    { src: 'assets/flowers/layer-lily-2.png', w: 0.95, h: 0.95, x: 0.02, y: 1.05, z: 0.32, rotX: 0.26, rotY: 0, rotZ: 0.04, speed: 1.3, amp: 0.05 },
    { src: 'assets/flowers/layer-sun-1.png', w: 0.92, h: 0.92, x: -0.52, y: 0.94, z: 0.26, rotX: 0.22, rotY: 0.24, rotZ: -0.24, speed: 1.1, amp: 0.04 },
    { src: 'assets/flowers/layer-sun-2.png', w: 0.90, h: 0.90, x: 0.54, y: 0.92, z: 0.28, rotX: 0.22, rotY: -0.25, rotZ: 0.22, speed: 1.4, amp: 0.04 },

    // 3. Ombros laterais
    { src: 'assets/flowers/layer-lily-1.png', w: 0.84, h: 0.84, x: -0.78, y: 0.65, z: 0.20, rotX: 0.15, rotY: 0.32, rotZ: -0.42, speed: 1.2, amp: 0.05 },
    { src: 'assets/flowers/layer-sun-3.png', w: 0.86, h: 0.86, x: 0.80, y: 0.62, z: 0.22, rotX: 0.15, rotY: -0.32, rotZ: 0.38, speed: 1.5, amp: 0.04 },

    // 4. Relevo frontal / meio do buquê
    { src: 'assets/flowers/layer-sun-1.png', w: 0.86, h: 0.86, x: -0.25, y: 0.28, z: 0.36, rotX: 0.08, rotY: 0.08, rotZ: 0.14, speed: 1.25, amp: 0.035 },
    { src: 'assets/flowers/layer-lily-2.png', w: 0.82, h: 0.82, x: 0.35, y: 0.22, z: 0.38, rotX: 0.08, rotY: -0.10, rotZ: -0.16, speed: 1.35, amp: 0.04 },
    { src: 'assets/flowers/layer-sun-2.png', w: 0.78, h: 0.78, x: 0.05, y: -0.18, z: 0.42, rotX: 0.05, rotY: 0, rotZ: 0.06, speed: 1.15, amp: 0.03 }
  ];

  layersConfig.forEach((cfg, idx) => {
    texLoader.load(cfg.src, (texture) => {
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;

      let mat;
      if (cfg.additive) {
        // Foto com fundo escuro: AdditiveBlending funde o preto como transparência natural
        mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.FrontSide
        });
      } else {
        // PNGs com canal alpha real
        mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.06,
          roughness: 0.5,
          metalness: 0.0,
          side: THREE.DoubleSide,
          depthWrite: false
        });
      }

      const geom = new THREE.PlaneGeometry(cfg.w, cfg.h);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.rotation.set(cfg.rotX, cfg.rotY, cfg.rotZ);
      bouquetGroup.add(mesh);

      flowerItems.push({
        mesh,
        baseX: cfg.x,
        baseY: cfg.y,
        baseZ: cfg.z,
        baseRotX: cfg.rotX,
        baseRotY: cfg.rotY,
        baseRotZ: cfg.rotZ,
        speed: cfg.speed,
        phase: idx * 0.75,
        swayAmp: cfg.amp
      });
    });
  });

  // Sistema de partículas 3D: Vagalumes e poeira estelar romântica
  const pCount = 48;
  const pGeom = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pSpeed = new Float32Array(pCount);
  const pBaseY = new Float32Array(pCount);

  for (let i = 0; i < pCount; i++) {
    pPos[i * 3 + 0] = (Math.random() - 0.5) * 3.4;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 3.0;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    pBaseY[i] = pPos[i * 3 + 1];
    pSpeed[i] = 0.4 + Math.random() * 0.8;
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

  // Canvas para gerar partícula circular suave dourada
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 32; pCanvas.height = 32;
  const pCtx = pCanvas.getContext('2d');
  const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  pGrad.addColorStop(0, 'rgba(255, 235, 175, 1)');
  pGrad.addColorStop(0.35, 'rgba(225, 180, 100, 0.75)');
  pGrad.addColorStop(1, 'rgba(225, 180, 100, 0)');
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 32, 32);
  const sparkTex = new THREE.CanvasTexture(pCanvas);

  const pMat = new THREE.PointsMaterial({
    size: 0.12,
    map: sparkTex,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  particleSystem = new THREE.Points(pGeom, pMat);
  scene.add(particleSystem);

  // Interação de inclinação tátil (mouse / touch)
  targetTiltX = 0; targetTiltY = 0;
  currentTiltX = 0; currentTiltY = 0;

  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
    targetTiltY = nx * 0.28;
    targetTiltX = -ny * 0.22;
  };
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('touchmove', onPointerMove, { passive: true });

  // Loop de animação cinematográfico a 60/120fps
  let t = 0;
  function animate() {
    animId = requestAnimationFrame(animate);
    t += 0.016;

    // Florescimento do buquê com spring natural (grow-in)
    if (bouquetGroup) {
      const targetScale = 1.0;
      const curScale = bouquetGroup.scale.x;
      const nextScale = curScale + (targetScale - curScale) * 0.06;
      bouquetGroup.scale.setScalar(nextScale);

      // Respiração orgânica suave e balanço de brisa
      const breathe = 1 + Math.sin(t * 1.4) * 0.018;
      bouquetGroup.scale.multiplyScalar(breathe);

      // Interpolação suave de inclinação (tilt lerp)
      currentTiltX += (targetTiltX - currentTiltX) * 0.08;
      currentTiltY += (targetTiltY - currentTiltY) * 0.08;

      bouquetGroup.rotation.y = currentTiltY + Math.sin(t * 0.7) * 0.06;
      bouquetGroup.rotation.x = currentTiltX + Math.sin(t * 0.5) * 0.03;
      bouquetGroup.position.y = Math.sin(t * 0.9) * 0.04;

      // Ondulação e respiração orgânica individual de cada flor
      flowerItems.forEach(item => {
        const sway = Math.sin(t * item.speed + item.phase) * item.swayAmp;
        item.mesh.rotation.z = item.baseRotZ + sway;
        item.mesh.rotation.x = item.baseRotX + Math.cos(t * item.speed * 0.8 + item.phase) * (item.swayAmp * 0.7);
        item.mesh.position.y = item.baseY + Math.sin(t * (item.speed * 1.1) + item.phase) * 0.016;
      });
    }

    // Pulso suave da vela
    candleLight.intensity = 0.85 + Math.sin(t * 3.8) * 0.12;

    // Movimento flutuante das partículas douradas
    if (particleSystem) {
      const posAttr = particleSystem.geometry.attributes.position;
      for (let i = 0; i < pCount; i++) {
        let py = posAttr.getY(i);
        py += pSpeed[i] * 0.0035;
        if (py > 2.0) py = -1.8;
        posAttr.setY(i, py);
        const px = posAttr.getX(i) + Math.sin(t * 1.5 + i) * 0.002;
        posAttr.setX(i, px);
      }
      posAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }
  animate();

  const onResize = () => {
    if (!container || !renderer || !camera) return;
    const nw = Math.max(container.clientWidth, 280);
    const nh = Math.max(container.clientHeight, 240);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  };
  window.addEventListener('resize', onResize);
}

function render2DBouquet(container) {
  if (!container) return;
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'bouquet-2d bouquet-depth';
  wrap.setAttribute('aria-label', 'Buquê de girassóis e lírios');

  const layers = [
    { src: 'assets/flowers/layer-sun-1.png', cls: 'layer layer-a' },
    { src: 'assets/flowers/layer-sun-2.png', cls: 'layer layer-b' },
    { src: 'assets/flowers/layer-sun-3.png', cls: 'layer layer-c' },
    { src: 'assets/flowers/layer-lily-1.png', cls: 'layer layer-d' },
    { src: 'assets/flowers/layer-lily-2.png', cls: 'layer layer-e' },
    { src: 'assets/bouquet.png', cls: 'layer layer-main' }
  ];
  layers.forEach((L, i) => {
    const img = document.createElement('img');
    img.src = L.src;
    img.alt = '';
    img.className = L.cls;
    img.draggable = false;
    img.style.animationDelay = (i * 0.08) + 's';
    wrap.appendChild(img);
  });

  container.appendChild(wrap);
}


function disposeThree() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  if (scene) {
    scene.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    scene = null;
  }
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
    renderer = null;
  }
  camera = null;
}

// ===== EVENTS =====

// Preload theme on first pointer so mobile has data ready
let themePreloaded = false;
function preloadThemeOnce() {
  if (themePreloaded) return;
  themePreloaded = true;
  initAudio();
  if (themeAudio) {
    try { themeAudio.load(); } catch (e) {}
  }
}
document.addEventListener('pointerdown', preloadThemeOnce, { once: true, passive: true });
document.addEventListener('touchstart', preloadThemeOnce, { once: true, passive: true });

$('#btn-start').addEventListener('click', () => {
  initAudio();
  playMenuClick();
  startTheme();
  renderBoard();
  showScreen('#game');
});

$('#btn-how').addEventListener('click', () => {
  initAudio();
  playMenuClick();
  showScreen('#howto');
});
$('#btn-back').addEventListener('click', () => {
  initAudio();
  playMenuClick();
  showScreen('#menu');
});

$('#btn-music').addEventListener('click', () => {
  musicOn = !musicOn;
  const btn = $('#btn-music');
  const label = $('#music-label');
  if (musicOn) {
    btn.classList.remove('off');
    label.textContent = 'Som ligado';
    initAudio();
    startTheme();
  } else {
    btn.classList.add('off');
    label.textContent = 'Som desligado';
    stopTheme();
  }
});

$('#btn-pause').addEventListener('click', () => {
  pauseOverlay.classList.remove('hidden');
  if (themeAudio && !themeAudio.paused) themeAudio.pause();
});

$('#btn-resume').addEventListener('click', () => {
  pauseOverlay.classList.add('hidden');
  if (musicOn) startTheme();
});

$('#btn-menu').addEventListener('click', () => {
  pauseOverlay.classList.add('hidden');
  disposeThree();
  stopTheme();
  showScreen('#menu');
});

$('#btn-replay').addEventListener('click', () => {
  disposeThree();
  renderBoard();
  showScreen('#game');
  if (musicOn) startTheme();
});

// Unlock audio on first user gesture (iOS / autoplay policies)
['click', 'touchstart'].forEach(evt => {
  document.body.addEventListener(evt, () => {
    initAudio();
  }, { once: true, passive: true });
});

// prevent pull-to-refresh etc on mobile
document.body.addEventListener('touchmove', (e) => {
  if (e.target.closest('.board') || e.target.closest('#three-container')) return;
}, { passive: true });

// expose bouquet init (module scope helper)
window.__initBouquet = initThreeBouquet;

// start
showScreen('#menu');
