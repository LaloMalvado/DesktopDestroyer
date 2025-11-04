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
function getRuntime() { return runtime; }

// === Herramientas con nombres largos (mismo cuerpo que hoy) ===
const h: Tool = {
  name: "hammer",
  init(){},
  resetForRun(){},
  hitAt(x,y){
    const { getDpr, getDamageCtx } = getRuntime();
    const dpr = typeof getDpr === "function" ? getDpr() : 1;
    const damageCtx = typeof getDamageCtx === "function" ? getDamageCtx() : null;

    Effects.spawnHit(x, y, { dpr });
    if (Audio && typeof Audio.playHammer === "function") Audio.playHammer();

    if (damageCtx) {
      const R = 46 * dpr;
      const grd = damageCtx.createRadialGradient(x, y, 1, x, y, R);
      grd.addColorStop(0, "rgba(40,40,45,.6)");
      grd.addColorStop(1, "rgba(40,40,45,0)");
      damageCtx.fillStyle = grd;
      damageCtx.beginPath(); damageCtx.arc(x, y, R, 0, Math.PI * 2); damageCtx.fill();
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

const f: Tool = {
  name: "flame",
  init(){},
  resetForRun(){ if (Audio?.stopFlame) Audio.stopFlame(); },
  start(){ if (Audio?.startFlame) Audio.startFlame(); },
  stop(){ if (Audio?.stopFlame) Audio.stopFlame(); },
  hitAt(x,y,dt=0){
    const dpr = (typeof getRuntime().getDpr === "function") ? getRuntime().getDpr() : 1;
    Effects.spawnFlame(x, y, { dpr });
    Bugs.hitAt(x, y, "flame", { dt });
  },
  getAll(){ return []; },
};

const i: Tool = {
  name: "spray",
  init(){},
  resetForRun(){ if (Audio?.stopSpray) Audio.stopSpray(); },
  start(){ if (Audio?.startSpray) Audio.startSpray(); },
  stop(){ if (Audio?.stopSpray) Audio.stopSpray(); },
  hitAt(x,y,dt=0){
    const { getDpr, getDamageCtx } = getRuntime();
    const dpr = typeof getDpr === "function" ? getDpr() : 1;
    const damageCtx = typeof getDamageCtx === "function" ? getDamageCtx() : null;
    Effects.spawnSpray(x, y, { dpr });
    if (damageCtx) {
      const R = 130 * dpr;
      const g = damageCtx.createRadialGradient(x, y, 8, x, y, R);
      g.addColorStop(0, "rgba(80,255,120,.12)");
      g.addColorStop(1, "rgba(80,255,120,0)");
      damageCtx.save();
      damageCtx.globalCompositeOperation = "lighter";
      damageCtx.fillStyle = g;
      damageCtx.beginPath(); damageCtx.arc(x, y, R, 0, Math.PI * 2); damageCtx.fill();
      damageCtx.restore();
    }
    Bugs.hitAt(x, y, "spray", { dt });
  },
  getAll(){ return []; },
};

const g: Tool = {
  name: "gun",
  init(){},
  resetForRun(){ const r = getRuntime().resetGunCooldown; if (typeof r === "function") r(); },
  start(){}, stop(){},
  hitAt(x,y){
    const { getDpr, getDamageCtx } = getRuntime();
    const dpr = typeof getDpr === "function" ? getDpr() : 1;
    const damageCtx = typeof getDamageCtx === "function" ? getDamageCtx() : null;
    if (Audio?.playGun) Audio.playGun();
    if (damageCtx) {
      damageCtx.save();
      damageCtx.globalCompositeOperation = "destination-out";
      damageCtx.beginPath(); damageCtx.arc(x, y, 4.2 * dpr, 0, Math.PI * 2); damageCtx.fill();
      damageCtx.restore();
    }
    Effects.spawnGun(x, y, { dpr });
    Effects.addShake(3 * dpr, 60);
    Bugs.hitAt(x, y, "gun");
  },
  getAll(){ return []; },
};

// Mapeo por tecla (sin letras exportadas)
const toolsByKey = { h, f, i, g };
let toolKey = "h";
export function setToolByKey(k){ if (toolsByKey[k]) toolKey = k; }
export function getTool(){ return toolsByKey[toolKey] || h; }
export function getToolKey(){ return toolKey; }
export function initAll(){
  const t = toolsByKey;
  t["h"].init(); t["f"].init(); t["i"].init(); t["g"].init();
}

export const hammerTool = h;
export const flameTool  = f;
export const sprayTool  = i;
export const gunTool    = g;

// Compat global para código legado/tests
if (typeof window !== "undefined") {
  Object.assign(window, {
    h: hammerTool, f: flameTool, i: sprayTool, g: gunTool,
    setToolByKey, getTool
  });
}
