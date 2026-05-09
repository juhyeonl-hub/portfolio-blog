# Block X Flight

A local-first web prototype for a real-time 1v1 multitasking puzzle shooter.

## Run

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 5173
```

Then visit `http://localhost:5173/games/block-x-flight/index.html` inside the portfolio frontend.

## Current Build

- Stage 1 prototype is playable locally.
- Stage 2 foundations are included: Vs AI, Host, Join, shared seeds, room codes, item/debuff modules, and a local `BroadcastChannel` based private-room sync path for browser-tab testing.
- No public matchmaking, accounts, ranking, Steam integration, monetization, or permanent relay server.

## Controls

- Tetris: `A` / `D`, `S`, `Space`, `Q` / `E`, `Shift`
- Shooter: arrow keys
