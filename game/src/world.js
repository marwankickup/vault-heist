// The world: one level's live state and the fixed-step update. Geometry lives
// here — walls as rectangles, circle-vs-wall collision, segment-vs-wall line
// of sight — so the other modules stay small and single-purpose.
import {
  ALARM_MAX, COIN_COST, COLS, EMP_COST, EMP_SECONDS, HUD_H, LIVES, ROWS, SMOKE_PER_LEVEL,
  TILE, VIEW_H, VIEW_W,
} from './config.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { cameraSees, createCameras, disableCameras, updateCameras } from './cameras.js';
import { createGuards, distractGuards, guardSees, updateGuards } from './guards.js';
import { LEVELS, levelLootTotal } from './levels.js';
import { createLoot, updateLoot } from './loot.js';
import { createThief, moveThief, resetThief, thiefTile } from './thief.js';

export const EVENT_CAUGHT = 1;
export const EVENT_LEVEL_CLEAR = 2;
export const EVENT_WIN = 4;
export const EVENT_LOOT = 8;
export const EVENT_VAULT = 16;
export const EVENT_SPOTTED = 32;

// Wall rectangles in pixels, including the outer border.
function buildWalls(level) {
  const walls = [
    { x: 0, y: HUD_H, w: VIEW_W, h: TILE }, // top (under the HUD)
    { x: 0, y: VIEW_H - TILE, w: VIEW_W, h: TILE }, // bottom
    { x: 0, y: HUD_H, w: TILE, h: ROWS * TILE }, // left
    { x: VIEW_W - TILE, y: HUD_H, w: TILE, h: ROWS * TILE }, // right
  ];
  for (const wall of level.walls) {
    walls.push({ x: wall.x * TILE, y: HUD_H + wall.y * TILE, w: wall.w * TILE, h: wall.h * TILE });
  }
  return walls;
}

function buildShadows(level) {
  return level.shadows.map((s) => ({
    x: s.x * TILE, y: HUD_H + s.y * TILE, w: s.w * TILE, h: s.h * TILE,
  }));
}

function circleHitsWalls(x, y, radius, walls) {
  for (const wall of walls) {
    const nearestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const nearestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    if ((x - nearestX) ** 2 + (y - nearestY) ** 2 < radius * radius) return true;
  }
  return false;
}

// Does segment (x1,y1)-(x2,y2) cross any wall? Slab test per rectangle.
function segmentHitsWall(x1, y1, x2, y2, wall) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const slabs = [
    [wall.x - x1, dx, wall.x + wall.w - x1],
    [wall.y - y1, dy, wall.y + wall.h - y1],
  ];
  for (const [near, d, far] of slabs) {
    if (Math.abs(d) < 1e-9) {
      if (near > 0 || far < 0) return false;
    } else {
      let t0 = near / d;
      let t1 = far / d;
      if (t0 > t1) [t0, t1] = [t1, t0];
      tMin = Math.max(tMin, t0);
      tMax = Math.min(tMax, t1);
      if (tMin > tMax) return false;
    }
  }
  return tMax >= 0 && tMin <= 1;
}

export function createWorld(seed) {
  const world = {
    seed,
    levelIndex: 0,
    level: LEVELS[0],
    walls: [],
    shadows: [],
    thief: null,
    guards: [],
    cameras: [],
    loot: null,
    alarm: createAlarm(),
    lives: LIVES,
    score: 0, // total loot banked across levels
    time: 0,
    smoke: [], // { x, y, ttl } clouds that block vision
    coins: [], // thrown coins, { x, y, ttl }
    message: '',
    messageTimer: 0,
    spotted: false, // any watcher sees the thief this step
    state: { level: 0, score: 0, lives: LIVES, alarm: 0, loot: 0, pieces: 0, piecesTotal: 0 },
  };
  loadLevel(world, 0);
  return world;
}

export function loadLevel(world, index) {
  const level = LEVELS[index];
  world.levelIndex = index;
  world.level = level;
  world.walls = buildWalls(level);
  world.shadows = buildShadows(level);
  world.thief = createThief(level.thiefStart);
  world.guards = createGuards(level.guards);
  world.cameras = createCameras(level.cameras);
  world.loot = createLoot(level);
  world.alarm = createAlarm();
  world.smoke = [];
  world.coins = [];
  world.state.level = index;
  world.state.piecesTotal = level.loot.length + 1;
  world.state.pieces = 0;
  world.state.loot = 0;
  syncState(world);
}

function syncState(world) {
  world.state.score = world.score;
  world.state.lives = world.lives;
  world.state.alarm = Math.round(world.alarm.value);
  world.state.loot = world.loot.collected;
  world.state.pieces = world.loot.pieces;
}

function inShadow(world, thief) {
  const tile = thiefTile(thief);
  const px = tile.x * TILE;
  const py = HUD_H + tile.y * TILE;
  return world.shadows.some((s) => px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
}

function inSmoke(world, x, y) {
  return world.smoke.some((cloud) => Math.hypot(x - cloud.x, y - cloud.y) < 70);
}

function blockedByWall(world, x1, y1, x2, y2) {
  return world.walls.some((wall) => segmentHitsWall(x1, y1, x2, y2, wall));
}

export function resetLevel(world) {
  loadLevel(world, world.levelIndex);
  world.lives -= 1;
  syncState(world);
}

// One fixed step. dir is the movement direction, actions the input bits,
// click a canvas point the player clicked (coin throw target) or null.
export function stepWorld(world, dt, dir, actions, click) {
  const thief = world.thief;
  world.time += dt;

  moveThief(thief, dir, dt, (x, y, r) => circleHitsWalls(x, y, r, world.walls));

  // Tools: 1 or click throws a coin (costs loot), 2 drops smoke, 3 fires EMP.
  // Costs come off the combined loot pool: this floor's haul, then banked score.
  function spend(amount) {
    const fromLevel = Math.min(world.loot.collected, amount);
    world.loot.collected -= fromLevel;
    world.score -= (amount - fromLevel);
  }
  const coinTarget = click ?? (actions & 4 ? { x: thief.x + thief.faceX * 90, y: thief.y + thief.faceY * 90 } : null);
  if (coinTarget && world.score + world.loot.collected >= COIN_COST) {
    spend(COIN_COST);
    world.coins.push({ x: coinTarget.x, y: coinTarget.y, ttl: 6 });
    distractGuards(world.guards, coinTarget.x, coinTarget.y);
    world.message = 'Coin thrown — a guard goes to look.';
    world.messageTimer = 2;
  } else if (coinTarget) {
    world.message = 'Need $25 of loot to throw a coin.';
    world.messageTimer = 2;
  }
  if (actions & 8) {
    if (thief.smokeLeft > 0) {
      thief.smokeLeft -= 1;
      world.smoke.push({ x: thief.x, y: thief.y, ttl: 5 });
      world.message = 'Smoke out — their cones cannot see through it.';
      world.messageTimer = 2;
    } else {
      world.message = 'No smoke bombs left on this floor.';
      world.messageTimer = 2;
    }
  }
  if (actions & 16) {
    if (world.score + world.loot.collected >= EMP_COST) {
      spend(EMP_COST);
      disableCameras(world.cameras, EMP_SECONDS);
      world.message = `EMP burst — cameras blind for ${EMP_SECONDS}s.`;
      world.messageTimer = 2;
    } else {
      world.message = `EMP needs $${EMP_COST} of loot.`;
      world.messageTimer = 2;
    }
  }

  for (const coin of world.coins) coin.ttl -= dt;
  world.coins = world.coins.filter((c) => c.ttl > 0);
  for (const cloud of world.smoke) cloud.ttl -= dt;
  world.smoke = world.smoke.filter((c) => c.ttl > 0);
  if (world.messageTimer > 0) world.messageTimer -= dt;

  updateCameras(world.cameras, dt);

  const shadow = inShadow(world, thief);
  const smoke = inSmoke(world, thief.x, thief.y);
  const blocked = (x1, y1, x2, y2) => blockedByWall(world, x1, y1, x2, y2);

  // Vision: each watcher reports, the alarm answers.
  const watchers = [];
  for (const guard of world.guards) {
    guard.seen = guardSees(guard, thief, shadow, blocked, smoke);
    guard.spotted = guard.seen ? guard.spotted + dt : 0;
    watchers.push({ seen: guard.seen, kind: 'guard' });
  }
  for (const cam of world.cameras) {
    cam.seen = cameraSees(cam, thief, shadow, blocked, smoke);
    watchers.push({ seen: cam.seen, kind: 'camera' });
  }
  world.spotted = watchers.some((w) => w.seen);

  const caught = updateAlarm(world.alarm, watchers, dt, shadow);
  updateGuards(world.guards, dt, world.alarm.value, thief, (x, y, r) => circleHitsWalls(x, y, r, world.walls), 13);

  let events = 0;
  if (world.spotted) events |= EVENT_SPOTTED;
  const lootResult = updateLoot(world.loot, thief, dt);
  if (lootResult.gained > 0) {
    events |= EVENT_LOOT;
    world.message = `+$${lootResult.gained} loot.`;
    world.messageTimer = 1.5;
  }
  if (lootResult.vaultOpened) {
    events |= EVENT_VAULT;
    world.message = 'Vault cracked — $500. Now reach the exit!';
    world.messageTimer = 3;
  }
  if (lootResult.escaped) {
    world.score += world.loot.collected;
    if (world.levelIndex + 1 >= LEVELS.length) {
      events |= EVENT_WIN;
    } else {
      events |= EVENT_LEVEL_CLEAR;
      loadLevel(world, world.levelIndex + 1);
      world.message = `Floor clear! ${world.level.brief}`;
      world.messageTimer = 3;
    }
  }
  if (caught) {
    events |= EVENT_CAUGHT;
    world.lives -= 1;
    if (world.lives > 0) {
      loadLevel(world, world.levelIndex);
      world.message = 'Caught! The crew drags you back to the start.';
      world.messageTimer = 3;
    }
  }
  syncState(world);
  return events;
}

// Reachability sanity check used by tests: every loot piece, the vault and
// the exit must sit on open floor, not inside a wall.
export function levelSanity(level) {
  const walls = buildWalls(level);
  const points = [
    ...level.loot.map((p) => ({ x: p.x * TILE, y: HUD_H + p.y * TILE })),
    { x: level.vault.x * TILE, y: HUD_H + level.vault.y * TILE },
    { x: level.exit.x * TILE, y: HUD_H + level.exit.y * TILE },
    { x: level.thiefStart.x * TILE, y: HUD_H + level.thiefStart.y * TILE },
  ];
  return points.every((p) => !circleHitsWalls(p.x, p.y, 14, walls));
}

export { COLS, ROWS, levelLootTotal, ALARM_MAX };
