// The thief: one hooded figure, moved by the player, blocked by walls,
// carrying the loot and the tools. Position is in canvas pixels, y measured
// from the top of the whole canvas (HUD bar included).
import { HUD_H, THIEF_RADIUS, THIEF_SPEED, TILE } from './config.js';

export function createThief(startTile) {
  return {
    x: startTile.x * TILE,
    y: HUD_H + startTile.y * TILE,
    radius: THIEF_RADIUS,
    faceX: 0,
    faceY: 1,
    moving: false,
    smokeLeft: 2,
  };
}

export function resetThief(thief, startTile) {
  thief.x = startTile.x * TILE;
  thief.y = HUD_H + startTile.y * TILE;
  thief.faceX = 0;
  thief.faceY = 1;
  thief.moving = false;
  thief.smokeLeft = 2;
}

// Move with axis-separated collision so the thief slides along walls
// instead of sticking on corners.
export function moveThief(thief, dir, dt, collides) {
  const stepX = dir.x * THIEF_SPEED * dt;
  const stepY = dir.y * THIEF_SPEED * dt;
  thief.moving = dir.x !== 0 || dir.y !== 0;
  if (thief.moving) {
    thief.faceX = dir.x;
    thief.faceY = dir.y;
  }
  if (stepX !== 0 && !collides(thief.x + stepX, thief.y, thief.radius)) thief.x += stepX;
  if (stepY !== 0 && !collides(thief.x, thief.y + stepY, thief.radius)) thief.y += stepY;
}

// Tile coordinates of the thief, for shadow checks and the HUD.
export function thiefTile(thief) {
  return { x: thief.x / TILE, y: (thief.y - HUD_H) / TILE };
}
