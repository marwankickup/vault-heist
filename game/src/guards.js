// Guards: they walk their patrol loop, pause at each waypoint, and watch a
// sweeping cone. A thrown coin pulls the nearest guard to investigate. When
// the alarm runs high they stop patrolling and hunt the thief instead.
// All angles are radians, 0 = east, measured in canvas pixels.
import {
  ALARM_HUNT_AT, GUARD_HALF_ANGLE, GUARD_HUNT_SPEED, GUARD_RANGE, GUARD_SPEED,
  HUD_H, SHADOW_RANGE_FACTOR, TILE,
} from './config.js';

export function createGuards(defs) {
  return defs.map((def) => {
    const path = def.path.map((p) => ({ x: p.x * TILE, y: HUD_H + p.y * TILE }));
    return {
      path,
      speed: GUARD_SPEED * def.speed,
      x: path[0].x,
      y: path[0].y,
      targetIndex: 1 % path.length,
      pause: 0,
      angle: 0,
      state: 'patrol', // patrol | investigate | hunt | look
      investigate: null,
      lookTimer: 0,
      seen: false, // seeing the thief this step
      spotted: 0, // seconds continuously seeing the thief (drives the "!" )
    };
  });
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the thief right now? Range, cone, line of sight, smoke.
export function guardSees(guard, thief, inShadow, blockedByWall, inSmoke) {
  if (inSmoke) return false;
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = GUARD_RANGE * (inShadow ? SHADOW_RANGE_FACTOR : 1);
  if (dist > range) return false;
  if (Math.abs(angleDiff(angleTo(guard.x, guard.y, thief.x, thief.y), guard.angle)) > GUARD_HALF_ANGLE) {
    return false;
  }
  return !blockedByWall(guard.x, guard.y, thief.x, thief.y);
}

function moveToward(guard, tx, ty, speed, dt, collides, radius) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(speed * dt, dist);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  guard.angle = angleTo(guard.x, guard.y, nx, ny);
  if (!collides(nx, guard.y, radius)) guard.x = nx;
  if (!collides(guard.x, ny, radius)) guard.y = ny;
  return dist <= speed * dt + 1;
}

export function updateGuards(guards, dt, alarm, thief, collides, radius) {
  const hunting = alarm >= ALARM_HUNT_AT;
  for (const guard of guards) {
    if (guard.state === 'investigate' && guard.investigate) {
      const arrived = moveToward(guard, guard.investigate.x, guard.investigate.y, guard.speed * 1.25, dt, collides, radius);
      if (arrived) {
        guard.state = 'look';
        guard.lookTimer = 2.5;
      }
    } else if (guard.state === 'look') {
      guard.lookTimer -= dt;
      guard.angle += dt * 1.8; // scans around, puzzled
      if (guard.lookTimer <= 0) {
        guard.state = 'patrol';
        guard.investigate = null;
      }
    } else if (hunting) {
      guard.state = 'hunt';
      moveToward(guard, thief.x, thief.y, GUARD_HUNT_SPEED, dt, collides, radius);
    } else {
      guard.state = 'patrol';
      if (guard.pause > 0) {
        guard.pause -= dt;
      } else {
        const target = guard.path[guard.targetIndex];
        const arrived = moveToward(guard, target.x, target.y, guard.speed, dt, collides, radius);
        if (arrived) {
          guard.targetIndex = (guard.targetIndex + 1) % guard.path.length;
          guard.pause = 0.8;
        }
      }
    }
    // A guard that just spotted the thief keeps facing them for a beat.
    if (guard.seen) guard.angle = angleTo(guard.x, guard.y, thief.x, thief.y);
  }
}

// Send the nearest patrolling guard to check a coin landing spot.
export function distractGuards(guards, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const guard of guards) {
    if (guard.state === 'hunt') continue;
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = guard;
    }
  }
  if (best) {
    best.state = 'investigate';
    best.investigate = { x, y };
  }
}
