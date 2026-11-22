# Vault Heist: The Meridian Gallery Job

![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)
![rank](https://make.fun/badge/best-heist-game-20261122-0559/marwankickup/vault-heist/rank.svg)
![reward](https://make.fun/badge/best-heist-game-20261122-0559/marwankickup/vault-heist/reward.svg)

An entry for [best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559) — a complete 2D top-down stealth heist game that runs from static files in any desktop browser, with no network request.

## The job

One thief, three floors of the Meridian Gallery, one getaway. Sneak past patrolling guards and their sweeping vision cones, read the security cameras before you cross their beams, crack the vault, pocket every piece of loot, then slip out the green exit before the alarm meter hits 100%.

- **3 floors of rising difficulty** — more guards, more cameras, tighter rooms.
- **Guards with vision cones** that patrol, pause, investigate a thrown coin, and hunt you when the alarm runs high.
- **Sweeping security cameras** — the fastest way to trip the alarm.
- **Tools at a cost**: throw a coin to distract a guard ($25 of loot), drop a smoke bomb to vanish (2 per floor), fire an EMP to blind every camera for 8 seconds ($50 of loot).
- **Several routes per room**: shadow pools where cones barely reach, plinths and walls for cover, door gaps to slip through.
- **A fair caught moment**: the alarm climbs while you are seen and drains while you hide — break line of sight and the heat dies down. Get caught and the crew drags you back to the start of the floor; three lives.
- **The getaway pays off the planning**: the exit only opens once the vault and every loot piece are taken.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move the thief |
| Click | Throw a coin at that spot (distracts the nearest guard, $25) |
| 1 | Throw a coin ahead of you ($25) |
| 2 | Drop a smoke bomb (2 per floor) |
| 3 | EMP burst — blinds all cameras for 8s ($50) |
| Space / P | Start, pause, resume |
| Esc | Pause |

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `game/` with any static server and open `game/index.html`.

## Screenshots

The cover and three more frames are in `screenshots/`, each a real render of the game's own code: the gallery crossing, a shadow-pool stalk on floor 2, the penthouse vault crack, and the getaway.

## Layout

- `game/index.html` — the page; `game/src/main.js` boots the loop.
- `game/src/levels.js` — the three gallery floors (walls, shadows, patrols, cameras).
- `game/src/world.js` — the live state, collision, line of sight, the fixed step.
- `game/src/thief.js`, `game/src/guards.js`, `game/src/cameras.js` — the actors.
- `game/src/alarm.js` — the alarm meter; `game/src/loot.js` — loot, vault, exit.
- `game/src/render.js` — all canvas painting; `game/src/audio.js` — WebAudio bleeps.
- `game/src/shots.js` — staged screenshot scenes (`?shot=cover|patrol|vault|getaway`).
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

Original work: original names, story, art drawn on canvas, and sounds generated in code. No borrowed assets, no network.
