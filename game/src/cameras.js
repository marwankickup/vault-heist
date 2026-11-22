// Security cameras: wall-mounted, sweeping a cone back and forth. An EMP
// burst knocks every camera out for a few seconds; otherwise they are the
// fastest way to trip the alarm, so their cones have to be read before moving.
import {
  CAMERA_HALF_ANGLE, CAMERA_RANGE, HUD_H, SHADOW_RANGE_FACTOR, TILE,
} from './config.js';

export function createCameras(defs) {
  return defs.map((def) => ({
    x: def.x * TILE,
    y: HUD_H + def.y * TILE,
    baseAngle: def.angle,
    sweep: def.sweep,
    speed: def.speed,
    phase: 0,
    angle: def.angle,
    disabled: 0, // seconds of EMP shutdown left
    seen: false,
  }));
}

export function updateCameras(cameras, dt) {
  for (const cam of cameras) {
    if (cam.disabled > 0) cam.disabled = Math.max(0, cam.disabled - dt);
    cam.phase += dt * cam.speed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * (cam.sweep / 2);
  }
}

export function cameraSees(cam, thief, inShadow, blockedByWall, inSmoke) {
  if (cam.disabled > 0 || inSmoke) return false;
  const dx = thief.x - cam.x;
  const dy = thief.y - cam.y;
  const dist = Math.hypot(dx, dy);
  const range = CAMERA_RANGE * (inShadow ? SHADOW_RANGE_FACTOR : 1);
  if (dist > range) return false;
  let diff = Math.atan2(dy, dx) - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA_HALF_ANGLE) return false;
  return !blockedByWall(cam.x, cam.y, thief.x, thief.y);
}

export function disableCameras(cameras, seconds) {
  for (const cam of cameras) cam.disabled = seconds;
}
