// The renderer: one canvas, drawn fresh every frame. The visual language is
// deliberate — dark gallery floor, warm gold loot, red danger cones, green
// exit — so safe cover, danger and loot read at a glance.
import {
  CAMERA_HALF_ANGLE, CAMERA_RANGE, GUARD_HALF_ANGLE, GUARD_RANGE, HUD_H, TILE, VIEW_H, VIEW_W,
} from './config.js';
import { alarmColor } from './alarm.js';
import { allLootTaken } from './loot.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const FLOOR_A = '#1c2138';
const FLOOR_B = '#181d31';
const WALL = '#3a4160';
const WALL_TOP = '#565e8a';

function cone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawConeEdges(ctx, x, y, angle, halfAngle, range, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;

  function drawHud(world, screen) {
    ctx.fillStyle = '#0d1020';
    ctx.fillRect(0, 0, VIEW_W, HUD_H);
    ctx.fillStyle = '#232842';
    ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

    // Left: level name and objective.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f5d76e';
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.fillText(world.level.name, 16, 28);
    ctx.fillStyle = '#aab3d6';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(world.level.brief, 16, 52);

    // Middle: loot, pieces, lives, timer.
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(`LOOT $${world.state.score + world.state.loot}`, 430, 30);
    ctx.fillStyle = '#aab3d6';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`Pieces ${world.state.pieces}/${world.state.piecesTotal}   Lives ${'♥'.repeat(Math.max(0, world.state.lives))}   ${formatTime(world.time)}`, 430, 54);

    // Tools.
    ctx.fillStyle = '#aab3d6';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`[1] Coin $25   [2] Smoke x${world.thief.smokeLeft}   [3] EMP $50`, 700, 30);
    ctx.fillText('Move WASD / arrows — click to throw a coin', 700, 54);

    // Right: the alarm meter, big and coloured by danger.
    const meterX = 1010;
    const meterW = 240;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ALARM', meterX, 22);
    ctx.fillStyle = '#2a2f4a';
    ctx.fillRect(meterX, 30, meterW, 20);
    ctx.fillStyle = alarmColor(world.state.alarm);
    ctx.fillRect(meterX, 30, (meterW * world.state.alarm) / 100, 20);
    ctx.strokeStyle = '#565e8a';
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, 30, meterW, 20);
    ctx.fillStyle = world.state.alarm >= 65 ? '#ff6b6b' : '#aab3d6';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(world.state.alarm >= 65 ? 'RUN — BREAK LINE OF SIGHT!' : `${world.state.alarm}%`, meterX, 66);
    ctx.textAlign = 'left';
  }

  function drawFloor(world) {
    for (let row = 0; row < 20; row += 1) {
      for (let col = 0; col < 40; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? FLOOR_A : FLOOR_B;
        ctx.fillRect(col * TILE, HUD_H + row * TILE, TILE, TILE);
      }
    }
    // Shadow zones: deep blue pools where cones barely reach.
    for (const s of world.shadows) {
      ctx.fillStyle = 'rgba(8, 12, 40, 0.55)';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(90, 120, 255, 0.35)';
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
      ctx.setLineDash([]);
    }
    // Walls with a lit top edge.
    for (const wall of world.walls) {
      ctx.fillStyle = WALL;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = WALL_TOP;
      ctx.fillRect(wall.x, wall.y, wall.w, 3);
    }
  }

  function drawLoot(world) {
    const now = performance.now() / 1000;
    for (const item of world.loot.items) {
      if (item.taken) continue;
      const pulse = 1 + 0.15 * Math.sin(now * 3 + item.sparkle);
      if (item.kind === 'diamond') {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#7ee7ff';
        ctx.fillRect(-8 * pulse, -8 * pulse, 16 * pulse, 16 * pulse);
        ctx.strokeStyle = '#d9f7ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8 * pulse, -8 * pulse, 16 * pulse, 16 * pulse);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 10 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#f5c542';
        ctx.fill();
        ctx.strokeStyle = '#ffe9a8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#8a6d1a';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', item.x, item.y + 4);
        ctx.textAlign = 'left';
      }
    }
    // The vault: a big steel safe with a dial; a ring fills while cracking.
    const vault = world.loot.vault;
    ctx.fillStyle = vault.opened ? '#2f6b4f' : '#4a4f6b';
    ctx.fillRect(vault.x - 22, vault.y - 22, 44, 44);
    ctx.strokeStyle = vault.opened ? '#7dffb0' : '#c9cede';
    ctx.lineWidth = 3;
    ctx.strokeRect(vault.x - 22, vault.y - 22, 44, 44);
    ctx.beginPath();
    ctx.arc(vault.x, vault.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#232842';
    ctx.fill();
    ctx.strokeStyle = '#c9cede';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = vault.opened ? '#7dffb0' : '#f5d76e';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(vault.opened ? 'OPEN' : 'VAULT', vault.x, vault.y - 28);
    ctx.textAlign = 'left';
    if (!vault.opened && vault.progress > 0) {
      ctx.beginPath();
      ctx.arc(vault.x, vault.y, 28, -Math.PI / 2, -Math.PI / 2 + vault.progress * Math.PI * 2);
      ctx.strokeStyle = '#f5d76e';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }

  function drawExit(world) {
    const exit = world.loot.exit;
    const open = allLootTaken(world.loot);
    const glow = open ? 0.5 + 0.3 * Math.sin(performance.now() / 200) : 0.15;
    ctx.fillStyle = `rgba(61, 220, 132, ${glow})`;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? '#1d7a44' : '#274a35';
    ctx.fillRect(exit.x - 20, exit.y - 20, 40, 40);
    ctx.strokeStyle = open ? '#7dffb0' : '#4a7a5c';
    ctx.lineWidth = 3;
    ctx.strokeRect(exit.x - 20, exit.y - 20, 40, 40);
    ctx.fillStyle = open ? '#d8ffe9' : '#9fc7ad';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT!' : 'EXIT', exit.x, exit.y + 4);
    ctx.fillText(open ? 'GO!' : 'LOCKED', exit.x, exit.y + 34);
    ctx.textAlign = 'left';
  }

  function drawGuards(world) {
    for (const guard of world.guards) {
      const fill = guard.seen ? 'rgba(255, 60, 60, 0.30)' : 'rgba(255, 200, 60, 0.14)';
      cone(ctx, guard.x, guard.y, guard.angle, GUARD_HALF_ANGLE, GUARD_RANGE, fill);
      drawConeEdges(ctx, guard.x, guard.y, guard.angle, GUARD_HALF_ANGLE, GUARD_RANGE,
        guard.seen ? 'rgba(255, 80, 80, 0.8)' : 'rgba(255, 200, 60, 0.45)');
      // Body: navy uniform, pale face, cap brim toward the facing.
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#2b3a67';
      ctx.fill();
      ctx.strokeStyle = '#8fa3ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(guard.x + Math.cos(guard.angle) * 6, guard.y + Math.sin(guard.angle) * 6, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f2c9a0';
      ctx.fill();
      if (guard.seen || guard.spotted > 0.25) {
        ctx.fillStyle = '#ff4d4d';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 20);
        ctx.textAlign = 'left';
      } else if (guard.state === 'investigate' || guard.state === 'look') {
        ctx.fillStyle = '#ffc53d';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 20);
        ctx.textAlign = 'left';
      }
    }
  }

  function drawCameras(world) {
    for (const cam of world.cameras) {
      const disabled = cam.disabled > 0;
      const fill = disabled ? 'rgba(120, 120, 120, 0.08)'
        : cam.seen ? 'rgba(255, 60, 60, 0.30)' : 'rgba(255, 90, 90, 0.13)';
      cone(ctx, cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE, fill);
      drawConeEdges(ctx, cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE,
        disabled ? 'rgba(150,150,150,0.4)' : 'rgba(255, 90, 90, 0.5)');
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.rotate(cam.angle);
      ctx.fillStyle = disabled ? '#555' : '#c0392b';
      ctx.fillRect(-4, -6, 14, 12);
      ctx.fillStyle = disabled ? '#777' : '#ff5a4d';
      ctx.beginPath();
      ctx.arc(11, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (disabled) {
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`EMP ${Math.ceil(cam.disabled)}s`, cam.x, cam.y - 16);
        ctx.textAlign = 'left';
      }
    }
  }

  function drawThief(world) {
    const thief = world.thief;
    // A soft shadow under the thief, then the hooded figure.
    ctx.beginPath();
    ctx.ellipse(thief.x, thief.y + 8, 12, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#151515';
    ctx.fill();
    ctx.strokeStyle = '#f5d76e';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Hood point toward the facing, face in shadow.
    ctx.beginPath();
    ctx.moveTo(thief.x + thief.faceX * 14, thief.y + thief.faceY * 14);
    ctx.lineTo(thief.x - thief.faceY * 7 - thief.faceX * 4, thief.y + thief.faceX * 7 - thief.faceY * 4);
    ctx.lineTo(thief.x + thief.faceY * 7 - thief.faceX * 4, thief.y - thief.faceX * 7 - thief.faceY * 4);
    ctx.closePath();
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(thief.x + thief.faceX * 4, thief.y + thief.faceY * 4, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f2c9a0';
    ctx.fill();
  }

  function drawEffects(world) {
    for (const cloud of world.smoke) {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 70, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180, 180, 190, 0.35)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(220, 220, 230, 0.5)';
      ctx.stroke();
    }
    for (const coin of world.coins) {
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f5c542';
      ctx.fill();
      ctx.strokeStyle = '#ffe9a8';
      ctx.stroke();
    }
    if (world.messageTimer > 0 && world.message) {
      ctx.fillStyle = 'rgba(10, 12, 26, 0.85)';
      ctx.fillRect(280, VIEW_H - 44, 720, 32);
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(world.message, 640, VIEW_H - 22);
      ctx.textAlign = 'left';
    }
    if (world.spotted) {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED!', VIEW_W / 2, HUD_H + 40);
      ctx.textAlign = 'left';
    }
  }

  function drawOverlay(title, lines, hint) {
    ctx.fillStyle = 'rgba(8, 10, 22, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d76e';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(title, VIEW_W / 2, 250);
    ctx.fillStyle = '#e8ecff';
    ctx.font = '19px system-ui, sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 300 + i * 32));
    ctx.fillStyle = '#aab3d6';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(hint, VIEW_W / 2, 300 + lines.length * 32 + 30);
    ctx.textAlign = 'left';
  }

  function draw(world, screen, best) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawHud(world, screen);
    drawFloor(world);
    drawLoot(world);
    drawExit(world);
    drawGuards(world);
    drawCameras(world);
    drawThief(world);
    drawEffects(world);

    if (screen === SCREEN_TITLE) {
      drawOverlay('VAULT HEIST', [
        'The Meridian Gallery Job — one thief, three floors, one getaway.',
        'Sneak past the guards and their cones, blind the cameras, crack the vault,',
        'grab every piece of loot, then slip out the green exit before the alarm hits 100%.',
        'Shadow pools hide you. Coins distract guards ($25). Smoke hides you. EMP blinds cameras ($50).',
        `Best haul so far: $${best}`,
      ], 'WASD / arrows to move — click to throw a coin — 1 coin, 2 smoke, 3 EMP — Space to start');
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('PAUSED', ['The gallery waits. The guards do not sleep.'], 'Space or P to resume');
    } else if (screen === SCREEN_OVER) {
      drawOverlay('CAUGHT!', [
        `The gallery guards hauled you out. Haul banked: $${world.state.score}.`,
        `Best haul so far: $${best}`,
      ], 'Space or click to try the job again');
    } else if (screen === SCREEN_WIN) {
      drawOverlay('CLEAN GETAWAY!', [
        `All three floors cleared. Total haul: $${world.state.score}.`,
        `Finished in ${formatTime(world.time)} — best haul so far: $${best}.`,
        'The Meridian Gallery never saw you coming.',
      ], 'Space or click to run the job again');
    }
  }

  return { draw };
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
