// The alarm meter: 0 is calm, 100 is caught. Being seen fills it fast,
// hiding drains it slowly, so a brief glimpse is a scare and a long stare
// is a disaster. The meter is the game's tension, and the HUD shows it big.
import { ALARM_DECAY, ALARM_MAX, ALARM_RISE_CAMERA, ALARM_RISE_GUARD, SHADOW_ALARM_FACTOR } from './config.js';

export function createAlarm() {
  return { value: 0, peak: 0, rising: false };
}

// watchers: [{ seen: boolean, kind: 'guard' | 'camera' }] for this step.
export function updateAlarm(alarm, watchers, dt, inShadow) {
  let rise = 0;
  for (const w of watchers) {
    if (!w.seen) continue;
    rise += w.kind === 'camera' ? ALARM_RISE_CAMERA : ALARM_RISE_GUARD;
  }
  if (rise > 0) {
    if (inShadow) rise *= SHADOW_ALARM_FACTOR;
    alarm.value = Math.min(ALARM_MAX, alarm.value + rise * dt);
    alarm.rising = true;
  } else {
    alarm.value = Math.max(0, alarm.value - ALARM_DECAY * dt);
    alarm.rising = false;
  }
  alarm.peak = Math.max(alarm.peak, alarm.value);
  return alarm.value >= ALARM_MAX;
}

export function alarmColor(value) {
  if (value < 35) return '#3ddc84'; // calm green
  if (value < 65) return '#ffc53d'; // nervous amber
  return '#ff4d4d'; // red: run
}
