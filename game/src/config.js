// Shared constants for Vault Heist: the Meridian Gallery Job.
// One screen is a 40 x 20 tile gallery floor under an 80 px HUD bar.
export const TILE = 32;
export const COLS = 40;
export const ROWS = 20;
export const HUD_H = 80;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = HUD_H + ROWS * TILE; // 720
export const STEP = 1 / 60;

export const THIEF_SPEED = 150; // px per second
export const THIEF_RADIUS = 12;
export const GUARD_SPEED = 62;
export const GUARD_HUNT_SPEED = 96;
export const GUARD_RADIUS = 13;

// Vision: how far a watcher sees, and how wide the cone is (half-angle).
export const GUARD_RANGE = 185;
export const GUARD_HALF_ANGLE = 0.62;
export const CAMERA_RANGE = 215;
export const CAMERA_HALF_ANGLE = 0.5;
// Standing in a shadow zone shrinks every watcher's range and slows the alarm.
export const SHADOW_RANGE_FACTOR = 0.55;
export const SHADOW_ALARM_FACTOR = 0.5;

export const ALARM_RISE_GUARD = 42; // per second while a guard sees the thief
export const ALARM_RISE_CAMERA = 55; // per second while a camera sees the thief
export const ALARM_DECAY = 14; // per second while nobody sees the thief
export const ALARM_HUNT_AT = 60; // guards start hunting above this
export const ALARM_MAX = 100;

export const LOOT_GOLD = 100;
export const LOOT_DIAMOND = 250;
export const LOOT_VAULT = 500;
export const COIN_COST = 25; // a thrown coin costs loot
export const EMP_COST = 50; // an EMP burst costs loot
export const SMOKE_PER_LEVEL = 2;
export const EMP_SECONDS = 8;
export const LIVES = 3;

// Loot picked up this run is banked per level; the score is the loot total.
export const BEST_KEY = 'vault-heist-best-loot';
