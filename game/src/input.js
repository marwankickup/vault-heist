// Keyboard and mouse input: WASD or arrows to move, 1/2/3 for tools,
// a click throws a coin at that spot, Space or click confirms on menus.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_COIN = 4;
export const ACTION_SMOKE = 8;
export const ACTION_EMP = 16;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let click = null; // { x, y } in canvas pixels, consumed by the world each step

  function keyDown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    keys.add(event.key.toLowerCase());
    if (event.key === ' ' || event.key === 'Enter') actions |= ACTION_CONFIRM;
    if (event.key === 'p' || event.key === 'Escape') actions |= ACTION_PAUSE;
    if (event.key === '1') actions |= ACTION_COIN;
    if (event.key === '2') actions |= ACTION_SMOKE;
    if (event.key === '3') actions |= ACTION_EMP;
  }

  function keyUp(event) {
    keys.delete(event.key.toLowerCase());
  }

  function pointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointerDown);

  // Movement direction this frame, normalised, in canvas pixels.
  function direction() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.sqrt(2);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  function takeClick() {
    const taken = click;
    click = null;
    return taken;
  }

  return { direction, takeActions, takeClick };
}
