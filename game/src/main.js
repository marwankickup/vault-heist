// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between five screens: title, play,
// paused, caught and clean getaway.
//
// ?seed=N fixes the run's random seed. ?shot=cover|patrol|vault|getaway
// (with &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createAudio } from './audio.js';
import { ACTION_COIN, ACTION_CONFIRM, ACTION_EMP, ACTION_PAUSE, ACTION_SMOKE, createInput } from './input.js';
import { createRandom } from './random.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT_CAUGHT, EVENT_LEVEL_CLEAR, EVENT_LOOT, EVENT_VAULT, EVENT_WIN, loadLevel, stepWorld } from './world.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best haul then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, readBest());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each catch.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    audio.click();
    world.lives = 3;
    world.score = 0;
    world.time = 0;
    loadLevel(world, 0); // a fresh run always starts on floor 1
    screen = SCREEN_PLAY;
    announce(`Playing. ${world.level.name}.`);
  }

  function endRun(win) {
    screen = win ? SCREEN_WIN : SCREEN_OVER;
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    announce(win
      ? `Clean getaway. Total haul $${world.score}. Best $${best}.`
      : `Caught. Haul banked $${world.score}. Best $${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const actions = input.takeActions();
    const click = input.takeClick();
    const events = stepWorld(world, STEP, input.direction(), actions, click);
    if (events & EVENT_LOOT) audio.loot();
    if (events & EVENT_VAULT) audio.vault();
    if (events & EVENT_LEVEL_CLEAR) audio.win();
    if (events & EVENT_WIN) {
      audio.win();
      endRun(true);
    } else if (events & EVENT_CAUGHT) {
      audio.caught();
      if (world.lives <= 0) endRun(false);
      else announce('Caught! Back to the start of this floor.');
    }
    audio.setAlarmLevel(world.alarm.value / 100);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the alarm fill unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Vault Heist. Press Space or click to start the job.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
