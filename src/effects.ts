// @ts-nocheck
// Efectos visuales: partículas, screenshake, etc.
const particles = [];
let shakeTimeMs = 0;
let shakeMagnitude = 0;
const BASE_SHAKE_MS = 120;

function getDpr(opts) {
  return opts && typeof opts.dpr === "number" ? opts.dpr : 1;
}

function spawnSparkParticles(x, y, count, dpr) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 120 + Math.random() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 0.08 + Math.random() * 0.12,
      age: 0,
      size: (1.5 + Math.random() * 1.8) * dpr,
      type: "spark",
    });
  }
}

export const Effects = {
  init() {
    particles.length = 0;
    shakeTimeMs = 0;
    shakeMagnitude = 0;
  },
  clear() {
    particles.length = 0;
    shakeTimeMs = 0;
    shakeMagnitude = 0;
  },
  update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    if (shakeTimeMs > 0) {
      shakeTimeMs = Math.max(0, shakeTimeMs - dt * 1000);
      if (shakeTimeMs <= 0) {
        shakeMagnitude = 0;
      }
    }
  },
  spawnHit(x, y, opts) {
    // El martillo no generaba partículas previamente; se preserva el comportamiento.
  },
  spawnFlame(x, y, opts) {
    const dpr = getDpr(opts);
    if (opts && opts.mode === "revive") {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() * 2 - 1) * 40,
          vy: (Math.random() * 2 - 1) * 40,
          life: 0.35 + Math.random() * 0.4,
          age: 0,
          size: (1.8 + Math.random() * 2.2) * dpr,
          type: "ember",
          tone: "yellow",
        });
      }
      return;
    }
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 160;
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (40 + Math.random() * 80),
        life: 0.22 + Math.random() * 0.45,
        age: 0,
        size: (2 + Math.random() * 2.4) * dpr,
        type: "flame",
      });
    }
    const tones = ["red", "orange", "yellow"];
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 0.6 - Math.PI / 3;
      const spd = 30 + Math.random() * 60;
      const tone = tones[(Math.random() * tones.length) | 0];
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        life: 0.45 + Math.random() * 0.8,
        age: 0,
        size: (1.6 + Math.random() * 2.2) * dpr,
        type: "ember",
        tone,
      });
    }
    spawnSparkParticles(x, y, 48, dpr);
  },
  spawnSpray(x, y, opts) {
    const dpr = getDpr(opts);
    for (let i = 0; i < 20; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() * 2 - 1) * 60,
        vy: (Math.random() * 2 - 1) * 60,
        life: 0.3 + Math.random() * 0.6,
        age: 0,
        size: (2 + Math.random() * 2.5) * dpr,
        type: "toxic",
      });
    }
  },
  spawnGun(x, y, opts) {
    const dpr = getDpr(opts);
    spawnSparkParticles(x, y, 8, dpr);
  },
  getParticles() {
    return particles;
  },
  addShake(magnitude, durationMs) {
    if (durationMs > shakeTimeMs) {
      shakeTimeMs = durationMs;
    }
    if (magnitude > shakeMagnitude) {
      shakeMagnitude = magnitude;
    }
  },
  getShakeOffset() {
    if (shakeTimeMs <= 0 || shakeMagnitude <= 0) {
      return { x: 0, y: 0 };
    }
    const factor = shakeTimeMs / BASE_SHAKE_MS;
    const mag = factor * shakeMagnitude;
    return {
      x: (Math.random() * 2 - 1) * mag,
      y: (Math.random() * 2 - 1) * mag,
    };
  },
};

if (typeof window !== "undefined") window.Effects = Effects;
