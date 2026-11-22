// Screenshot staging: ?shot=cover|patrol|vault|getaway (with &seed=N) puts the
// world into a readable, dramatic state instead of running the loop — the
// thief mid-room, guards mid-patrol with cones sweeping, a camera cone
// crossing the floor, loot and the vault in view, the alarm meter alive.
// Each shot is painted twice and then sets window.__shotReady.
import { HUD_H, TILE } from './config.js';
import { SCREEN_PLAY } from './render.js';
import { loadLevel } from './world.js';

// Place the thief in tile coordinates and face them toward a point.
function placeThief(world, tx, ty, faceX, faceY) {
  world.thief.x = tx * TILE;
  world.thief.y = HUD_H + ty * TILE;
  world.thief.faceX = faceX;
  world.thief.faceY = faceY;
}

// Advance the guards and cameras a fixed number of seconds so patrols read
// mid-stride and the cones sit at interesting angles.
function advanceGuards(world, seconds) {
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds / dt); i += 1) {
    for (const guard of world.guards) {
      const target = guard.path[guard.targetIndex];
      const dx = target.x - guard.x;
      const dy = target.y - guard.y;
      const dist = Math.hypot(dx, dy);
      const step = Math.min(guard.speed * dt, dist);
      if (dist > 0.5) {
        guard.x += (dx / dist) * step;
        guard.y += (dy / dist) * step;
        guard.angle = Math.atan2(dy, dx);
      } else {
        guard.targetIndex = (guard.targetIndex + 1) % guard.path.length;
      }
    }
    for (const cam of world.cameras) {
      cam.phase += dt * cam.speed;
      cam.angle = cam.baseAngle + Math.sin(cam.phase) * (cam.sweep / 2);
    }
  }
}

function bankLoot(world, amount, pieces) {
  world.loot.collected = amount;
  world.loot.pieces = pieces;
  world.state.loot = amount;
  world.state.pieces = pieces;
}

export function stageShot(name, world) {
  // Patrol plays on floor 2, the vault shot on floor 3, the rest on floor 1.
  const levelIndex = name === 'vault' ? 2 : name === 'patrol' ? 1 : 0;
  loadLevel(world, levelIndex);

  if (name === 'cover') {
    // The fullest frame: thief crossing the gallery, cones sweeping, a camera
    // cone crossing the floor, gold in reach, vault ahead, alarm hot.
    placeThief(world, 19, 13, 1, 0);
    advanceGuards(world, 9);
    world.alarm.value = 58;
    world.loot.items[0].taken = true; // one gold already pocketed
    bankLoot(world, 100, 1);
    world.state.alarm = 58;
  } else if (name === 'patrol') {
    // Floor 2: the thief in a shadow pool at a cone's edge, alarm climbing.
    placeThief(world, 27, 11, -1, 0);
    advanceGuards(world, 5);
    world.alarm.value = 31;
    world.loot.items[0].taken = true;
    world.loot.items[1].taken = true;
    bankLoot(world, 200, 2);
    world.state.alarm = 31;
  } else if (name === 'vault') {
    // Floor 3: the thief cracking the penthouse vault while a camera sweeps.
    placeThief(world, 19.5, 12.5, 0, -1);
    advanceGuards(world, 7);
    world.alarm.value = 72;
    world.loot.items[0].taken = true;
    world.loot.items[1].taken = true;
    world.loot.items[2].taken = true;
    bankLoot(world, 300, 3);
    world.loot.vault.progress = 0.6; // the crack ring two-thirds full
    world.state.alarm = 72;
    world.spotted = true;
  } else if (name === 'getaway') {
    // Floor 1, all loot taken: the exit glowing green, the thief slipping out.
    placeThief(world, 35, 17.5, 1, 0);
    advanceGuards(world, 12);
    for (const item of world.loot.items) item.taken = true;
    world.loot.vault.opened = true;
    bankLoot(world, 1150, 6);
    world.alarm.value = 44;
    world.state.alarm = 44;
    world.message = 'Vault cracked — $500. Now reach the exit!';
    world.messageTimer = 10;
  } else {
    placeThief(world, 10, 10, 1, 0);
  }
  return { screen: SCREEN_PLAY };
}
