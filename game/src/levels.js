// The three floors of the Meridian Gallery. Everything is in tile coordinates
// (40 x 20 tiles, tile = 32 px, HUD bar above the floor). Walls are solid
// rectangles; shadow zones are floor the watchers see poorly; guards walk
// their waypoint loops; cameras sweep back and forth from their mount.
//
// Level flow: grab the vault and every loot piece, then slip out the exit.
// The thief starts bottom-left, the vault sits far from the start, and the
// exit is a third corner, so every level needs a real route, not a dash.
export const LEVELS = [
  {
    name: 'Floor 1 — The Meridian Gallery',
    brief: 'Lift the vault and all 5 pieces, then reach the exit.',
    thiefStart: { x: 2.5, y: 17.5 },
    exit: { x: 37.5, y: 17.5 },
    vault: { x: 36.5, y: 2.5 },
    loot: [
      { x: 5, y: 6, kind: 'gold' },
      { x: 16, y: 3, kind: 'gold' },
      { x: 23, y: 17, kind: 'gold' },
      { x: 30, y: 10, kind: 'gold' },
      { x: 24, y: 2, kind: 'diamond' },
    ],
    walls: [
      { x: 12, y: 0, w: 1, h: 7 }, // long divider, door gap at y 7-9
      { x: 12, y: 9, w: 1, h: 11 },
      { x: 2, y: 11, w: 9, h: 1 }, // cross wall, door gap at x 11-13
      { x: 13, y: 11, w: 9, h: 1 },
      { x: 27, y: 9, w: 1, h: 6 }, // right divider, gap at y 15-17
      { x: 27, y: 17, w: 1, h: 3 },
      { x: 28, y: 5, w: 6, h: 1 }, // vault antechamber, gap at x 34+
      { x: 6, y: 4, w: 2, h: 1 }, // display plinths (cover)
      { x: 18, y: 4, w: 1, h: 2 },
      { x: 20, y: 15, w: 2, h: 1 },
      { x: 33, y: 13, w: 2, h: 1 },
    ],
    shadows: [
      { x: 2, y: 2, w: 5, h: 3 },
      { x: 15, y: 14, w: 6, h: 4 },
      { x: 32, y: 7, w: 5, h: 3 },
    ],
    guards: [
      { path: [{ x: 4, y: 3 }, { x: 10, y: 3 }, { x: 10, y: 9 }, { x: 4, y: 9 }], speed: 1 },
      { path: [{ x: 24, y: 8 }, { x: 24, y: 16 }, { x: 36, y: 16 }, { x: 36, y: 8 }], speed: 1 },
      { path: [{ x: 30, y: 2 }, { x: 35, y: 2 }, { x: 35, y: 4 }, { x: 30, y: 4 }], speed: 0.9 },
    ],
    cameras: [
      { x: 13.5, y: 0.4, angle: Math.PI / 2, sweep: 1.2, speed: 0.45 },
      { x: 26.5, y: 19.6, angle: -Math.PI / 2, sweep: 1.1, speed: 0.5 },
    ],
  },
  {
    name: 'Floor 2 — The Vault Floor',
    brief: 'Four guards, three cameras, seven pieces.',
    thiefStart: { x: 2.5, y: 2.5 },
    exit: { x: 2.5, y: 17.5 },
    vault: { x: 36.5, y: 10.5 },
    loot: [
      { x: 8, y: 8, kind: 'gold' },
      { x: 8, y: 16, kind: 'gold' },
      { x: 18, y: 3, kind: 'gold' },
      { x: 18, y: 17, kind: 'gold' },
      { x: 28, y: 5, kind: 'gold' },
      { x: 28, y: 16, kind: 'diamond' },
      { x: 35, y: 17, kind: 'diamond' },
    ],
    walls: [
      { x: 12, y: 0, w: 1, h: 8 },
      { x: 12, y: 10, w: 1, h: 10 },
      { x: 24, y: 0, w: 1, h: 6 },
      { x: 24, y: 8, w: 1, h: 12 },
      { x: 4, y: 6, w: 6, h: 1 },
      { x: 14, y: 14, w: 8, h: 1 },
      { x: 26, y: 6, w: 7, h: 1 },
      { x: 30, y: 14, w: 6, h: 1 },
      { x: 16, y: 8, w: 2, h: 1 },
      { x: 6, y: 12, w: 1, h: 3 },
      { x: 33, y: 9, w: 2, h: 1 },
    ],
    shadows: [
      { x: 3, y: 14, w: 5, h: 3 },
      { x: 14, y: 2, w: 6, h: 3 },
      { x: 26, y: 8, w: 5, h: 4 },
      { x: 34, y: 14, w: 4, h: 3 },
    ],
    guards: [
      { path: [{ x: 6, y: 3 }, { x: 10.5, y: 3 }, { x: 10.5, y: 17 }, { x: 6, y: 17 }], speed: 1 },
      { path: [{ x: 15.5, y: 6 }, { x: 22, y: 6 }, { x: 22, y: 12 }, { x: 15.5, y: 12 }], speed: 1.05 },
      { path: [{ x: 25.5, y: 2 }, { x: 25.5, y: 10 }, { x: 37, y: 10 }, { x: 37, y: 2 }], speed: 1 },
      { path: [{ x: 29.5, y: 13 }, { x: 37, y: 13 }, { x: 37, y: 18 }, { x: 29.5, y: 18 }], speed: 0.95 },
    ],
    cameras: [
      { x: 13.5, y: 0.4, angle: Math.PI / 2, sweep: 1.3, speed: 0.55 },
      { x: 23.5, y: 19.6, angle: -Math.PI / 2, sweep: 1.2, speed: 0.5 },
      { x: 39.6, y: 10.5, angle: Math.PI, sweep: 1.0, speed: 0.6 },
    ],
  },
  {
    name: 'Floor 3 — The Penthouse Vault',
    brief: 'Five guards, four cameras, eight pieces.',
    thiefStart: { x: 16, y: 17.5 },
    exit: { x: 2.5, y: 2.5 },
    vault: { x: 19.5, y: 9.5 },
    loot: [
      { x: 4, y: 6, kind: 'gold' },
      { x: 4, y: 14, kind: 'gold' },
      { x: 12, y: 3, kind: 'gold' },
      { x: 12, y: 17, kind: 'gold' },
      { x: 27, y: 3, kind: 'gold' },
      { x: 35, y: 6, kind: 'diamond' },
      { x: 35, y: 14, kind: 'diamond' },
    ],
    walls: [
      { x: 9, y: 0, w: 1, h: 7 },
      { x: 9, y: 9, w: 1, h: 11 },
      { x: 31, y: 0, w: 1, h: 7 },
      { x: 31, y: 9, w: 1, h: 11 },
      { x: 14, y: 5, w: 11, h: 1 }, // vault ring, door gaps in the side walls
      { x: 14, y: 14, w: 11, h: 1 },
      { x: 14, y: 5, w: 1, h: 3 },
      { x: 14, y: 11, w: 1, h: 3 },
      { x: 24, y: 5, w: 1, h: 3 },
      { x: 24, y: 11, w: 1, h: 3 },
      { x: 4, y: 9, w: 3, h: 1 },
      { x: 33, y: 9, w: 3, h: 1 },
      { x: 18, y: 2, w: 3, h: 1 },
      { x: 18, y: 17, w: 3, h: 1 },
    ],
    shadows: [
      { x: 2, y: 4, w: 4, h: 4 },
      { x: 11, y: 8, w: 3, h: 4 },
      { x: 26, y: 8, w: 3, h: 4 },
      { x: 34, y: 4, w: 4, h: 4 },
      { x: 16, y: 16, w: 8, h: 3 },
    ],
    guards: [
      { path: [{ x: 3.5, y: 3 }, { x: 7.5, y: 3 }, { x: 7.5, y: 17 }, { x: 3.5, y: 17 }], speed: 1.1 },
      { path: [{ x: 12, y: 3 }, { x: 12, y: 17 }], speed: 1 },
      { path: [{ x: 27, y: 3 }, { x: 27, y: 17 }], speed: 1 },
      { path: [{ x: 32.5, y: 3 }, { x: 37, y: 3 }, { x: 37, y: 17 }, { x: 32.5, y: 17 }], speed: 1.05 },
      { path: [{ x: 16, y: 10 }, { x: 23, y: 10 }], speed: 0.85 },
    ],
    cameras: [
      { x: 10.5, y: 0.4, angle: Math.PI / 2, sweep: 1.2, speed: 0.6 },
      { x: 30.5, y: 0.4, angle: Math.PI / 2, sweep: 1.2, speed: 0.55 },
      { x: 19.5, y: 4.6, angle: Math.PI / 2, sweep: 1.4, speed: 0.5 },
      { x: 19.5, y: 19.6, angle: -Math.PI / 2, sweep: 1.4, speed: 0.5 },
    ],
  },
];

// Total loot value of one level (gold + diamond + vault).
export function levelLootTotal(level) {
  let total = 0;
  for (const item of level.loot) total += item.kind === 'diamond' ? 250 : 100;
  return total + 500;
}
