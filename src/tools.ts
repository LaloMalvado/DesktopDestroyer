/* eslint-disable */
// @ts-nocheck
import { Audio } from "./audio";
import { Effects } from "./effects";
import { Bugs } from "./bugs";

type Tool = {
  name: string;
  init: () => void;
  resetForRun: () => void;
  hitAt: (x: number, y: number, dt?: number) => void;
  getAll: () => any[];
  start?: () => void;
  stop?: () => void;
};

type ToolsRuntime = {
  getDpr: () => number;
  getDamageCtx: () => CanvasRenderingContext2D | null;
  resetGunCooldown: () => void;
};

const noop = () => {};
let runtime: ToolsRuntime = {
  getDpr: () => 1,
  getDamageCtx: () => null,
  resetGunCooldown: noop,
};

export function configureToolsRuntime(partial: Partial<ToolsRuntime>) {
  runtime = { ...runtime, ...partial };
}
function R() { return runtime; }

// ====== HERRAMIENTAS (nombres largos) ======
export const hammerTool: Tool = {
  name: "hammer",
  init(){},
  resetForRun(){},
  hitAt(x, y) {
    const { getDpr, getDamageCtx } = R();
    const dpr = typeof getDpr === "function" ? getDpr() : 1;
    const damageCtx = typeof getDamageCtx === "function" ? getDamageCtx() : null;

    Effects.spawnHit(x, y, { dpr });
    if (Audio?.playHammer) Audio.playHammer();

    if (damageCtx) {
      const RR = 46 * dpr;
      const grd = damageCtx.createRadialGradient(x, y, 1, x, y, RR);
      grd.addColorStop(0, "rgba(40,40,45,.6)");
      grd.addColorStop(1, "rgba(40,40,45,0)");
      damageCtx.fillStyle = grd;
      damageCtx.beginPath();
      damageCtx.arc(x, y, RR, 0, Math.PI * 2);
      damageCtx.fill();
      damageCtx.strokeStyle = "rgba(20,20,30,.55)";
      damageCtx.lineWidth = 1.5 * dpr;
      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * Math.PI * 2;
        const len = (40 + Math.random() * 90) * dpr;
        damageCtx.beginPath();
        damageCtx.moveTo(x, y);
        damageCtx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        damageCtx.stroke();
      }
    }

    Effects.addShake(3 * dpr, 120);
    Bugs.hitAt(x, y, "hammer");
  },
  getAll(){ return []; },
};

export const flameTool: Tool = {
  name: "flame",
  init(){},
  resetForRun(){ if (Audio?.stopFlame) Audio.stopFlame(); },
  start(){ if (Audio?.startFlame) Audio.startFlame(); },
  stop(){ if (Audio?.stopFlame) Audio.stopFlame(); },
  hitAt(x, y, dt = 0) {
    const { getDpr } = R();
    const dpr = typeof getDpr === "function" ? getDpr() : 1;
    Effects.spawnFlame(x, y, { dpr });
    Bugs.hitAt(x, y, "flame", { dt });
  },
  getAll(){ return []; },
};

export const sprayTool: Tool = {
  name: "spray",
  init(){},
  resetForRun(){ if (Audio?.stopSpray) Audio.stopSpray(); },
  start(){ if (Audio?.startSpray) Audio.startSpray(); },
  stop(){ if (Audio?.stopSpray) Audio.stopSpray(); },
  hitAt(x, y, dt = 0) {
    const { getDpr, getDamageCtx } = R();
    const dpr = typeof getDpr === "function" ? getDpr() : 1;
    const damageCtx = typeof getDamageCtx === "function" ? getDamageCtx() : null;
    Effects.spawnSpray(x, y, { dpr });
    if (damageCtx) {
      const RR = 130 * dpr;
      const g = damageCtx.createRadialGradient(x, y, 8, x, y, RR);
      g.addColorStop(0, "rgba(80,255,120,.12)");
      g.addColorStop(1, "rgba(80,255,120,0)");
      damageCtx.save();
      damageCtx.globalCompositeOperation = "lighter";
      damageCtx.fillStyle = g;
      damageCtx.beginPath();
      damageCtx.arc(x, y, RR, 0, Math.PI * 2);
      damageCtx.fill();
      damageCtx.restore();
    }
    Bugs.hitAt(x, y, "spray", { dt });
  },
  getAll(){ return []; },
};

export const gunTool: Tool = {
  name: "gun",
  init(){},
  resetForRun(){
    const r = R().resetGunCooldown;
    if (typeof r === "function") r();
  },
  start(){}, stop(){},
  hitAt(x, y) {
    const { getDpr, getDamageCtx } = R();
    const dpr = typeof getDpr === "function" ? getDpr() : 1;
    const damageCtx = typeof getDamageCtx === "function" ? getDamageCtx() : null;
    if (Audio?.playGun) Audio.playGun();
    if (damageCtx) {
      damageCtx.save();
      damageCtx.globalCompositeOperation = "destination-out";
      damageCtx.beginPath();
      damageCtx.arc(x, y, 4.2 * dpr, 0, Math.PI * 2);
      damageCtx.fill();
      damageCtx.restore();
    }
    Effects.spawnGun(x, y, { dpr });
    Effects.addShake(3 * dpr, 60);
    Bugs.hitAt(x, y, "gun");
  },
  getAll(){ return []; },
};

// Mapa por tecla (sin usar símbolos en llamadas)
const toolsByKey: Record<string, Tool> = {
  h: hammerTool, f: flameTool, i: sprayTool, g: gunTool,
};
let toolKey = "h";
export function setToolByKey(k: string){ if (toolsByKey[k]) toolKey = k; }
export function getToolKey(){ return toolKey; }
export function getTool(){ return toolsByKey[toolKey] || hammerTool; }

// ¡Clave!: initAll sin h/f/i/g
export function initAll(){
  const t = (k)=> (toolsByKey && toolsByKey[k]) || null;
  const call = (x)=> x && typeof x.init === 'function' && x.init();
  call(t('h')); call(t('f')); call(t('i')); call(t('g'));
}

// Alias globales solo por compatibilidad (no los uses internamente)
if (typeof window !== "undefined") {
  Object.assign(window, {
    h: hammerTool, f: flameTool, i: sprayTool, g: gunTool,
    setToolByKey, getTool
  });
}
