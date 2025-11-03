// @ts-nocheck
export const MAX_BUGS = 100;

const BASE_TYPES = {
  chori: {
    r: 10,
    hp: 25,
    spd: [45, 75],
    turn: [0.8, 1.6],
    eR: 8,
    eCd: 900,
  },
  novillo: {
    r: 17.5,
    hp: 75,
    spd: [75, 100],
    turn: [0.5, 1],
    eR: 14,
    eCd: 750,
  },
  bravio: {
    r: 25,
    hp: 125,
    spd: [70, 100],
    turn: [0.3, 0.7],
    ability: "spawn",
    cd: 3000,
    eR: 20,
    eCd: 600,
  },
  torazo: {
    r: 32.5,
    hp: 225,
    spd: [80, 110],
    turn: [0.25, 0.55],
    ability: "revive",
    cd: 5000,
    eR: 28,
    eCd: 450,
  },
};

const BugsImpl = (() => {
  let bugs = [];
  let deadCount = 0;

  let dpr = 1;
  let types = buildTypes(dpr);
  let randFn = Math.random;
  let getBounds = () => ({ width: 0, height: 0 });
  let getEatRate = () => 0.6;
  let onBugEat = () => {};
  let onBugKilled = () => {};
  let onBugRevived = () => {};
  let onBravioSpawn = () => {};
  let onTorazoRevive = () => {};

  function buildTypes(scale) {
    const map = {};
    for (const [key, info] of Object.entries(BASE_TYPES)) {
      map[key] = {
        ...info,
        r: info.r * scale,
        eR: info.eR * scale,
      };
    }
    return map;
  }

  function randRange(min, max) {
    return min + randFn() * (max - min);
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function makeBug(type) {
    const kind = types[type] ? type : "chori";
    const info = types[kind];
    const { width, height } = getBounds();
    return {
      type: kind,
      x: randRange(0, width || 0),
      y: randRange(0, height || 0),
      a: randRange(0, Math.PI * 2),
      spd: randRange(info.spd[0], info.spd[1]),
      turn: randRange(info.turn[0], info.turn[1]),
      r: info.r,
      hp: info.hp,
      maxHp: info.hp,
      dead: false,
      cd: 0,
      eat: randRange(0, info.eCd),
    };
  }

  function killBug(bug) {
    if (bug.dead) return false;
    bug.dead = true;
    bug.hp = 0;
    deadCount++;
    try {
      onBugKilled(bug);
    } catch (err) {}
    return true;
  }

  function reviveBug(bug, hp) {
    if (!bug.dead) return;
    bug.dead = false;
    bug.hp = hp;
    deadCount = Math.max(0, deadCount - 1);
    try {
      onBugRevived(bug);
    } catch (err) {}
    try {
      onTorazoRevive(bug);
    } catch (err) {}
  }

  function spawnSmart(count) {
    for (let i = 0; i < count; i++) {
      if (bugs.length >= MAX_BUGS) return;
      const roll = randFn();
      let type = "chori";
      if (roll > 0.95) type = "torazo";
      else if (roll > 0.8) type = "bravio";
      else if (roll > 0.5) type = "novillo";
      bugs.push(makeBug(type));
    }
    clampCap();
  }

  function clampCap() {
    if (bugs.length > MAX_BUGS) {
      bugs.splice(MAX_BUGS);
    }
  }

  function updateBravio(bug) {
    bug.cd = types.bravio.cd;
    const allow = Math.max(0, MAX_BUGS - bugs.length);
    const spawnN = Math.min(2, allow);
    if (spawnN <= 0) return;
    try {
      onBravioSpawn(bug.x, bug.y);
    } catch (err) {}
    for (let i = 0; i < spawnN; i++) {
      const nb = makeBug("chori");
      nb.x = bug.x + (randFn() * 2 - 1) * 30 * dpr;
      nb.y = bug.y + (randFn() * 2 - 1) * 30 * dpr;
      bugs.push(nb);
    }
    clampCap();
  }

  function updateTorazo(bug) {
    bug.cd = types.torazo.cd;
    const reviveRadius2 = (150 * dpr) * (150 * dpr);
    let best = null;
    let bestDist = Infinity;
    for (const candidate of bugs) {
      if (!candidate.dead) continue;
      const d = dist2(candidate.x, candidate.y, bug.x, bug.y);
      if (d < bestDist && d < reviveRadius2) {
        best = candidate;
        bestDist = d;
      }
    }
    if (!best) return;
    const hp = Math.max(20, Math.floor(best.maxHp * 0.4));
    reviveBug(best, hp);
  }

  return {
    init(initialConfig = {}) {
      if (typeof initialConfig.dpr === "number") {
        dpr = initialConfig.dpr;
      }
      if (typeof initialConfig.getBounds === "function") {
        getBounds = initialConfig.getBounds;
      }
      if (typeof initialConfig.rand === "function") {
        randFn = initialConfig.rand;
      }
      if (typeof initialConfig.getEatRate === "function") {
        getEatRate = initialConfig.getEatRate;
      }
      if (typeof initialConfig.onBugEat === "function") {
        onBugEat = initialConfig.onBugEat;
      }
      if (typeof initialConfig.onBugKilled === "function") {
        onBugKilled = initialConfig.onBugKilled;
      }
      if (typeof initialConfig.onBugRevived === "function") {
        onBugRevived = initialConfig.onBugRevived;
      }
      if (typeof initialConfig.onBravioSpawn === "function") {
        onBravioSpawn = initialConfig.onBravioSpawn;
      }
      if (typeof initialConfig.onTorazoRevive === "function") {
        onTorazoRevive = initialConfig.onTorazoRevive;
      }
      types = buildTypes(dpr);
    },
    clear() {
      bugs = [];
      deadCount = 0;
    },
    getAll() {
      return bugs;
    },
    countAlive() {
      let alive = 0;
      for (const bug of bugs) {
        if (!bug.dead) alive++;
      }
      return alive;
    },
    countDead() {
      return deadCount;
    },
    spawn(type, overrides = {}) {
      if (bugs.length >= MAX_BUGS) return null;
      const bug = makeBug(type);
      Object.assign(bug, overrides);
      bugs.push(bug);
      clampCap();
      return bug;
    },
    spawnInitial(n) {
      const target = Math.max(0, Math.min(MAX_BUGS, n | 0));
      if (bugs.length > target) {
        bugs.splice(target);
      } else if (bugs.length < target) {
        spawnSmart(target - bugs.length);
      }
      clampCap();
    },
    update(dt) {
      if (!dt) dt = 0;
      const { width, height } = getBounds();
      const eatRate = getEatRate ? getEatRate() : 0.6;
      for (const bug of bugs) {
        if (!bug.dead) {
          bug.a += (randFn() * 2 - 1) * bug.turn * dt;
          bug.x += Math.cos(bug.a) * bug.spd * dt;
          bug.y += Math.sin(bug.a) * bug.spd * dt;
          if (bug.x < bug.r || bug.x > width - bug.r) {
            bug.a = Math.PI - bug.a;
            bug.x = Math.max(bug.r, Math.min(width - bug.r, bug.x));
          }
          if (bug.y < bug.r || bug.y > height - bug.r) {
            bug.a = -bug.a;
            bug.y = Math.max(bug.r, Math.min(height - bug.r, bug.y));
          }
          bug.eat -= dt * 1000 * eatRate;
          if (bug.eat <= 0) {
            const info = types[bug.type] || types.chori;
            bug.eat = info.eCd * (0.7 + randFn() * 0.6);
            try {
              onBugEat(bug.x, bug.y, info.eR);
            } catch (err) {}
          }
          bug.cd -= dt * 1000;
          if (bug.type === "bravio" && bug.cd <= 0) {
            updateBravio(bug);
          }
        }
        if (bug.type === "torazo" && bug.cd <= 0) {
          updateTorazo(bug);
        }
      }
      clampCap();
    },
    hitAt(x, y, toolName, options = {}) {
      const dt = options.dt || 0;
      if (toolName === "hammer") {
        const r2 = (34 * dpr) * (34 * dpr);
        for (const bug of bugs) {
          if (bug.dead) continue;
          if (dist2(bug.x, bug.y, x, y) < r2) {
            bug.hp -= 70;
            if (bug.hp <= 0) killBug(bug);
          }
        }
      } else if (toolName === "flame") {
        const r2 = (46 * dpr) * (46 * dpr);
        for (const bug of bugs) {
          if (bug.dead) continue;
          if (dist2(bug.x, bug.y, x, y) < r2) {
            const mult = bug.type === "torazo" ? 0.5 : bug.type === "bravio" ? 0.7 : 1;
            bug.hp -= 90 * dt * mult;
            if (bug.hp <= 0) killBug(bug);
          }
        }
      } else if (toolName === "spray") {
        const radius = 130 * dpr;
        const r2 = radius * radius;
        for (const bug of bugs) {
          if (bug.dead) continue;
          if (dist2(bug.x, bug.y, x, y) <= r2) {
            bug.hp -= 180 * dt;
            if (bug.hp <= 0) killBug(bug);
          }
        }
      } else if (toolName === "gun") {
        const r2 = (10 * dpr) * (10 * dpr);
        for (const bug of bugs) {
          if (bug.dead) continue;
          if (dist2(bug.x, bug.y, x, y) < r2) {
            bug.hp -= 60;
            if (bug.hp <= 0) killBug(bug);
          }
        }
      }
    },
    clampCap,
    resetForRun() {
      const { width, height } = getBounds();
      deadCount = 0;
      for (const bug of bugs) {
        bug.dead = false;
        bug.hp = bug.maxHp;
        bug.x = randRange(0, width || 0);
        bug.y = randRange(0, height || 0);
        const info = types[bug.type] || types.chori;
        bug.eat = randRange(0, info.eCd);
      }
    },
  };
})();

export const Bugs = {
  init: BugsImpl.init,
  clear: BugsImpl.clear,
  getAll: BugsImpl.getAll,
  countAlive: BugsImpl.countAlive,
  countDead: BugsImpl.countDead,
  spawn: BugsImpl.spawn,
  spawnInitial: BugsImpl.spawnInitial,
  update: BugsImpl.update,
  hitAt: BugsImpl.hitAt,
  clampCap: BugsImpl.clampCap,
  resetForRun: BugsImpl.resetForRun,
};
