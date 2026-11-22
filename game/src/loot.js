// Loot, the vault and the getaway exit. Loot is grabbed by walking over it;
// the vault takes a two-second crack at close range (stand still, watch the
// ring fill); the exit only opens once the vault and every loot piece are
// taken, so the getaway pays off the planning.
import { HUD_H, LOOT_DIAMOND, LOOT_GOLD, LOOT_VAULT, TILE } from './config.js';

export function createLoot(level) {
  return {
    items: level.loot.map((item) => ({
      x: item.x * TILE,
      y: HUD_H + item.y * TILE,
      kind: item.kind,
      value: item.kind === 'diamond' ? LOOT_DIAMOND : LOOT_GOLD,
      taken: false,
      sparkle: Math.random() * Math.PI * 2,
    })),
    vault: {
      x: level.vault.x * TILE,
      y: HUD_H + level.vault.y * TILE,
      value: LOOT_VAULT,
      opened: false,
      progress: 0, // 0..1 crack progress while the thief stands close
    },
    exit: { x: level.exit.x * TILE, y: HUD_H + level.exit.y * TILE },
    collected: 0, // loot value banked this level
    pieces: 0, // pieces taken (vault counts as one piece)
  };
}

export function lootTotalPieces(level) {
  return level.loot.length + 1; // pieces + the vault
}

// Returns { gained, vaultOpened, escaped } for this step.
export function updateLoot(loot, thief, dt, vaultRange = 46, grabRange = 26, exitRange = 30) {
  const result = { gained: 0, vaultOpened: false, escaped: false };
  for (const item of loot.items) {
    if (item.taken) continue;
    if (Math.hypot(thief.x - item.x, thief.y - item.y) < grabRange) {
      item.taken = true;
      loot.collected += item.value;
      loot.pieces += 1;
      result.gained += item.value;
    }
  }
  const vault = loot.vault;
  if (!vault.opened) {
    const near = Math.hypot(thief.x - vault.x, thief.y - vault.y) < vaultRange;
    if (near && !thief.moving) {
      vault.progress += dt / 2; // two seconds of still cracking
      if (vault.progress >= 1) {
        vault.opened = true;
        loot.collected += vault.value;
        loot.pieces += 1;
        result.gained += vault.value;
        result.vaultOpened = true;
      }
    } else {
      vault.progress = Math.max(0, vault.progress - dt / 2);
    }
  }
  const allTaken = loot.pieces >= loot.items.length + 1;
  if (allTaken && Math.hypot(thief.x - loot.exit.x, thief.y - loot.exit.y) < exitRange) {
    result.escaped = true;
  }
  return result;
}

export function allLootTaken(loot) {
  return loot.pieces >= loot.items.length + 1;
}
