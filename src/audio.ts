// @ts-nocheck

const STORAGE_KEY = 'dd_muted';
const VOLUME_BOOST = 3;

let audioSupported = typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
let audioCtx = null;
let masterGain = null;
let comp = null;
let noiseBuf = null;
let flameNode = null;
let flameGain = null;
let sprayNode = null;
let sprayGain = null;
let gunNode = null;
let initialized = false;
let audioMuted = false;

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch (e) {
    return null;
  }
}

function readStoredMuted() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored === null) return null;
    if (stored === '1' || stored === 'true') return true;
    if (stored === '0' || stored === 'false') return false;
  } catch (e) {}
  return null;
}

function writeStoredMuted(value) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch (e) {}
}

const storedMuted = readStoredMuted();
if (typeof storedMuted === 'boolean') {
  audioMuted = storedMuted;
}

function ensureContext() {
  if (!audioSupported) return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      audioSupported = false;
      return null;
    }
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = audioMuted ? 0 : 0.8 * VOLUME_BOOST;
    comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 20;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    masterGain.connect(comp);
    comp.connect(audioCtx.destination);
  }
  return audioCtx;
}

function makeNoiseBuffer() {
  if (!audioCtx) return null;
  if (noiseBuf) return noiseBuf;
  const sr = audioCtx.sampleRate;
  const len = sr * 2;
  const buf = audioCtx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return noiseBuf;
}

function startFlameInternal() {
  if (!audioCtx || flameNode) return;
  const src = audioCtx.createBufferSource();
  src.buffer = makeNoiseBuffer();
  if (!src.buffer) return;
  src.loop = true;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 520;
  bp.Q.value = 0.9;
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  const gn = audioCtx.createGain();
  gn.gain.value = 0;
  src.connect(bp);
  bp.connect(lp);
  lp.connect(gn);
  gn.connect(masterGain);
  src.start();
  flameNode = src;
  flameGain = gn;
  const now = audioCtx.currentTime;
  flameGain.gain.linearRampToValueAtTime(Math.min(0.42 * VOLUME_BOOST, 2), now + 0.08);
}

function stopFlameInternal() {
  if (!audioCtx || !flameGain) return;
  const now = audioCtx.currentTime;
  flameGain.gain.cancelScheduledValues(now);
  flameGain.gain.linearRampToValueAtTime(0, now + 0.08);
  const s = flameNode;
  setTimeout(() => {
    try {
      s && s.stop();
    } catch (e) {}
  }, 140);
  flameNode = null;
  flameGain = null;
}

function startSprayInternal() {
  if (!audioCtx || sprayNode) return;
  const src = audioCtx.createBufferSource();
  src.buffer = makeNoiseBuffer();
  if (!src.buffer) return;
  src.loop = true;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1100;
  bp.Q.value = 0.9;
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  const gn = audioCtx.createGain();
  gn.gain.value = 0;
  src.connect(bp);
  bp.connect(lp);
  lp.connect(gn);
  gn.connect(masterGain);
  src.start();
  sprayNode = src;
  sprayGain = gn;
  const now = audioCtx.currentTime;
  sprayGain.gain.linearRampToValueAtTime(Math.min(0.42 * VOLUME_BOOST, 2), now + 0.08);
}

function stopSprayInternal() {
  if (!audioCtx || !sprayGain) return;
  const now = audioCtx.currentTime;
  sprayGain.gain.cancelScheduledValues(now);
  sprayGain.gain.linearRampToValueAtTime(0, now + 0.06);
  const s = sprayNode;
  setTimeout(() => {
    try {
      s && s.stop();
    } catch (e) {}
  }, 120);
  sprayNode = null;
  sprayGain = null;
}

function playHammerInternal() {
  if (!audioCtx) return;
  const n = audioCtx.createBufferSource();
  n.buffer = makeNoiseBuffer();
  if (!n.buffer) return;
  const low = audioCtx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 180;
  const g = audioCtx.createGain();
  g.gain.value = 1.2 * VOLUME_BOOST;
  n.connect(low);
  low.connect(g);
  g.connect(masterGain);
  const th = audioCtx.createOscillator();
  th.type = 'sine';
  th.frequency.value = 75;
  const tg = audioCtx.createGain();
  tg.gain.value = 0.9 * VOLUME_BOOST;
  th.connect(tg);
  tg.connect(masterGain);
  const t = audioCtx.currentTime;
  n.start();
  th.start();
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  n.stop(t + 0.16);
  th.stop(t + 0.18);
}

function playGunInternal() {
  if (!audioCtx) return;
  const src = audioCtx.createBufferSource();
  src.buffer = makeNoiseBuffer();
  if (!src.buffer) return;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200 + Math.random() * 800;
  bp.Q.value = 4;
  const g = audioCtx.createGain();
  g.gain.value = 0.6 * VOLUME_BOOST;
  src.connect(bp);
  bp.connect(g);
  g.connect(masterGain);
  const t = audioCtx.currentTime;
  gunNode = src;
  src.onended = () => {
    if (gunNode === src) gunNode = null;
  };
  src.start();
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  src.stop(t + 0.05);
}

export const Audio = {
  init() {
    if (initialized || !audioSupported) {
      initialized = initialized || audioSupported;
      return;
    }
    initialized = true;
    ensureContext();
  },
  playHammer() {
    if (audioMuted) return;
    if (!ensureContext()) return;
    playHammerInternal();
  },
  startFlame() {
    if (audioMuted) return;
    if (!ensureContext()) return;
    startFlameInternal();
  },
  stopFlame() {
    if (!audioCtx) return;
    stopFlameInternal();
  },
  startSpray() {
    if (audioMuted) return;
    if (!ensureContext()) return;
    startSprayInternal();
  },
  stopSpray() {
    if (!audioCtx) return;
    stopSprayInternal();
  },
  startGun() {
    if (audioMuted) return;
    if (!ensureContext()) return;
    playGunInternal();
  },
  stopGun() {
    if (!gunNode) return;
    try {
      gunNode.stop();
    } catch (e) {}
    gunNode = null;
  },
  setMuted(m) {
    audioMuted = !!m;
    if (masterGain) masterGain.gain.value = audioMuted ? 0 : 0.8 * VOLUME_BOOST;
    writeStoredMuted(audioMuted);
  },
  toggleMuted() {
    this.setMuted(!audioMuted);
    return audioMuted;
  },
  isMuted() {
    return audioMuted;
  }
};

if (typeof window !== 'undefined') window.Audio = Audio;
