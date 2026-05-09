import { AIOpponent } from "./ai.js";
import { attackFromLines } from "./attacks.js";
import { AudioSystem } from "./audio.js";
import { DebuffState } from "./debuffs.js";
import { applyItem } from "./items.js";
import { RoomChannel, createRoomCode } from "./network.js";
import { ShooterField } from "./shooter.js";
import { COLORS, SHAPES, TetrisField } from "./tetris.js";
import { RNG, makeSeed } from "./utils/rng.js";

const LAYOUT = {
  tetris: { x: 54, y: 74, w: 270, h: 540 },
  shooter: { x: 410, y: 74, w: 360, h: 540 },
  opponent: { x: 835, y: 74, w: 220, h: 300 },
  hold: { x: 54, y: 24, w: 112, h: 42 },
  next: { x: 212, y: 24, w: 112, h: 42 },
};

const MODE_BUTTONS = [
  { mode: "ai", label: "VS AI", x: 230, y: 330, w: 150, h: 58 },
  { mode: "host", label: "Host", x: 400, y: 330, w: 150, h: 58 },
  { mode: "join", label: "Join", x: 570, y: 330, w: 150, h: 58 },
  { mode: "single", label: "Single", x: 740, y: 330, w: 150, h: 58 },
];

export class StackFlightGame {
  constructor(canvas, input, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = input;
    this.ui = ui;
    this.audio = new AudioSystem();
    this.last = 0;
    this.paused = false;
    this.mode = "single";
    this.channel = null;
    this.state = "menu";
    this.countdown = 0;
    this.scoreSubmitted = false;
    this.seed = makeSeed();
    this.rng = new RNG(this.seed);
    this.level = 1;
    this.time = 0;
    this.finished = false;
    this.roomCode = "";
    this.remoteState = null;
    this.remoteInput = null;
    this.player = new PlayerState(this.rng, LAYOUT.shooter);
    this.ai = null;
    window.addEventListener("message", (event) => {
      if (event.origin === window.location.origin && event.data?.type === "stack-flight-score-saved") {
        this.scoreSubmitted = true;
      }
    });
    this.ui.setMode(this.mode, this.seed, this.roomCode);
    this.ui.update(this);
  }

  restart(mode = this.mode, seed = makeSeed(), roomCode = "") {
    if (this.channel) this.channel.close();
    this.paused = false;
    this.mode = mode;
    this.seed = seed >>> 0;
    this.rng = new RNG(this.seed);
    this.level = 1;
    this.time = 0;
    this.finished = false;
    this.winner = "";
    this.scoreSubmitted = false;
    this.roomCode = roomCode;
    this.remoteState = null;
    this.remoteInput = null;
    this.player = new PlayerState(this.rng, LAYOUT.shooter);
    this.ai = mode === "single" || mode === "ai" ? new AIOpponent(this.rng) : null;
    if (mode === "host") this.setupHost();
    if (mode === "join") this.setupGuest(roomCode || "LOCAL1");
    this.ui.setMode(mode, this.seed, this.roomCode);
    this.ui.update(this);
  }

  selectMode(mode, seed = makeSeed(), roomCode = "") {
    this.restart(mode, seed, roomCode);
    this.state = "countdown";
    this.countdown = 3;
  }

  setupHost() {
    this.roomCode = createRoomCode(this.rng);
    this.channel = new RoomChannel(this.roomCode, "host", (message) => {
      if (message.type === "guest-ready") this.channel.send("seed", { seed: this.seed });
      if (message.type === "guest-lines") this.player.shooter.spawnAttack(attackFromLines(message.payload.lines, this.level), this.rng);
      if (message.type === "guest-input") this.remoteInput = message.payload;
    });
    this.channel.send("seed", { seed: this.seed });
    this.ui.setMode("host", this.seed, this.roomCode);
  }

  setupGuest(code) {
    this.roomCode = code.toUpperCase();
    this.channel = new RoomChannel(this.roomCode, "guest", (message) => {
      if (message.type === "seed" && message.payload?.seed && message.payload.seed !== this.seed) {
        this.restart("join", message.payload.seed, this.roomCode);
      }
      if (message.type === "host-lines") this.player.shooter.spawnAttack(attackFromLines(message.payload.lines, this.level), this.rng);
      if (message.type === "state") this.remoteState = message.payload;
    });
    this.channel.send("guest-ready", {});
  }

  togglePause() {
    this.paused = !this.paused;
  }

  start() {
    requestAnimationFrame((time) => this.frame(time));
  }

  frame(time) {
    const dt = Math.min(0.033, (time - this.last) / 1000 || 0);
    this.last = time;
    this.handleGlobalInput();
    if (!this.paused) this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame((next) => this.frame(next));
  }

  handleGlobalInput() {
    if (this.mode === "single" && this.state === "playing" && !this.finished && this.input.consume("Escape")) {
      this.paused = !this.paused;
    }
    if (!this.paused && !this.finished) return;
    for (const click of this.input.clicks) {
      const action = overlayActionAt(click.x, click.y, this);
      if (action === "menu") this.showMenu();
      if (action === "restart") this.selectMode(this.mode);
      if (action === "resume") this.paused = false;
      if (action === "save") this.submitScore();
    }
  }

  update(dt) {
    if (this.state === "menu") {
      this.handleMenuInput();
      return;
    }
    if (this.state === "countdown") {
      this.countdown -= dt;
      if (this.countdown <= 0) this.state = "playing";
      return;
    }
    if (this.finished) return;
    this.time += dt;
    this.level = 1 + Math.floor(this.time / 24);
    this.player.update(dt, this.input, this);
    if (this.ai) this.ai.update(dt, this);
    if (this.channel && this.mode === "host") this.channel.send("state", this.snapshot());
    if (this.channel && this.mode === "join") this.channel.send("guest-input", this.input.snapshot());
    if (this.player.lives <= 0) {
      this.finished = true;
      this.winner = this.mode === "single" ? "Run complete" : "Opponent";
    }
    this.ui.update(this);
  }

  showMenu() {
    if (this.channel) this.channel.close();
    this.paused = false;
    this.finished = false;
    this.state = "menu";
    this.roomCode = "";
    this.remoteState = null;
    this.remoteInput = null;
    this.ui.setMode(this.mode, this.seed, this.roomCode);
    this.ui.update(this);
  }

  submitScore() {
    if (this.mode !== "single" || this.scoreSubmitted) return;
    window.parent?.postMessage({ type: "stack-flight-score", score: this.score(), lines: this.player.tetris.lines }, window.location.origin);
  }

  handleMenuInput() {
    for (const click of this.input.clicks) {
      const button = MODE_BUTTONS.find((item) =>
        click.x >= item.x && click.x <= item.x + item.w && click.y >= item.y && click.y <= item.y + item.h
      );
      if (button) this.selectMode(button.mode);
    }
  }

  onLineClear(lines, items) {
    if (lines > 0) {
      const attack = attackFromLines(lines, this.level);
      if (this.mode === "host") this.channel?.send("host-lines", { lines });
      else if (this.mode === "join") this.channel?.send("guest-lines", { lines });
      else if (attack) {
        window.setTimeout(() => this.player.shooter.spawnAttack(attack, this.rng), 550);
      }
      this.audio.play("clear");
    }
    for (const item of items) {
      applyItem(this.player, item, this.player);
      this.audio.play("item");
    }
  }

  snapshot() {
    return {
      seed: this.seed,
      time: this.time,
      level: this.level,
      lives: this.player.lives,
      lines: this.player.tetris.lines,
    };
  }

  score() {
    return Math.floor(this.player.tetris.lines * 120 + this.time * 8 + this.level * 75);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#11181c";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === "menu") {
      drawModeSelect(ctx);
      return;
    }

    drawPanelTitle(ctx, "TETRIS", LAYOUT.tetris);
    drawPanelTitle(ctx, "SHOOTER", LAYOUT.shooter);
    this.player.tetris.draw(ctx, LAYOUT.tetris, this.player.debuffs);
    this.player.shooter.draw(ctx, this.player);
    drawPiecePreview(ctx, "HOLD", this.player.tetris.hold, LAYOUT.hold);
    drawPiecePreview(ctx, "NEXT", this.player.tetris.nextType(), LAYOUT.next);
    drawDivider(ctx);
    drawHud(ctx, this);
    drawStatusTimers(ctx, this);
    drawOpponentPreview(ctx, LAYOUT.opponent, this);

    if (this.state === "countdown") drawCountdown(ctx, this.countdown);
    if (this.paused || this.finished) drawOverlay(ctx, this);
  }
}

class PlayerState {
  constructor(rng, shooterRect) {
    this.rng = rng;
    this.lives = 3;
    this.recovery = 0;
    this.shieldTime = 0;
    this.debuffs = new DebuffState();
    this.tetris = new TetrisField(rng);
    this.shooter = new ShooterField(shooterRect);
  }

  update(dt, input, game) {
    this.recovery = Math.max(0, this.recovery - dt);
    this.shieldTime = Math.max(0, this.shieldTime - dt);
    this.debuffs.update(dt);
    this.tetris.update(dt, input, this, game);
    this.shooter.update(dt, input, this, game);
  }

  takeLife(game) {
    if (this.recovery > 0 || this.shieldTime > 0) {
      this.shieldTime = 0;
      this.recovery = 0.8;
      return;
    }
    this.lives -= 1;
    this.recovery = 1.2;
    if (this.lives <= 0) game.finished = true;
    game.audio.play("hit");
  }

  hitStackTop() {
    if (this.recovery > 0) return;
    this.lives -= 1;
    this.recovery = 1.35;
  }

  addDebuff() {
    this.debuffs.applyRandom(this.rng);
  }
}

function drawPanelTitle(ctx, title, rect) {
  ctx.fillStyle = "#dce7e3";
  ctx.font = "700 15px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, rect.x, rect.y - 22);
}

function drawDivider(ctx) {
  ctx.fillStyle = "#2f3b42";
  ctx.fillRect(370, 74, 2, 540);
  ctx.fillRect(800, 74, 2, 540);
}

function drawHud(ctx, game) {
  ctx.fillStyle = "#dce7e3";
  ctx.font = "700 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Lives: ${"I".repeat(Math.max(0, game.player.lives))}`, 350, 28);
  ctx.fillText(`Lines: ${game.player.tetris.lines}`, 465, 28);
  ctx.fillText(`Level: ${game.level}`, 570, 28);
  if (game.mode === "single") ctx.fillText(`Score: ${game.score()}`, 675, 28);
  if (game.player.recovery > 0) {
    ctx.fillStyle = "rgba(125,250,208,0.18)";
    ctx.fillRect(LAYOUT.tetris.x, LAYOUT.tetris.y, LAYOUT.tetris.w, LAYOUT.tetris.h);
    ctx.fillRect(LAYOUT.shooter.x, LAYOUT.shooter.y, LAYOUT.shooter.w, LAYOUT.shooter.h);
  }
  if (game.player.debuffs.disruptTime > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 10; i += 1) ctx.fillRect(426, 70 + i * 55, 360, 2);
  }
}

function drawOpponentPreview(ctx, rect, game) {
  ctx.fillStyle = "#141d22";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#2f3b42";
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "#dce7e3";
  ctx.font = "700 15px sans-serif";
  ctx.fillText(game.mode === "single" ? "SCORE RUN" : game.mode === "ai" ? "AI OPPONENT" : "REMOTE", rect.x, rect.y - 22);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#aab8b4";
  const lines = game.mode === "single"
    ? [
        `Score ${game.score()}`,
        `Lines ${game.player.tetris.lines}`,
        `Level ${game.level}`,
        `Time ${Math.floor(game.time)}s`,
        "",
        "ESC pauses the run.",
        "Save after game over.",
      ]
    : [
        game.mode === "host" ? `Room ${game.roomCode}` : `Seed ${game.seed}`,
        game.remoteState ? `Remote lives ${game.remoteState.lives}` : "Private match sync is",
        game.remoteState ? `Remote lines ${game.remoteState.lines}` : "host based for local",
        game.remoteInput ? `Guest keys ${game.remoteInput.keys.length}` : "invite-code testing.",
        "",
        "Clear lines to send",
        "attack bars across.",
      ];
  lines.forEach((line, i) => ctx.fillText(line, rect.x + 18, rect.y + 34 + i * 24));
}

function drawModeSelect(ctx) {
  ctx.fillStyle = "#11181c";
  ctx.fillRect(0, 0, 1120, 640);
  ctx.textAlign = "center";
  ctx.fillStyle = "#eef5f2";
  ctx.font = "700 46px sans-serif";
  ctx.fillText("Stack Flight", 560, 170);
  ctx.fillStyle = "#aab8b4";
  ctx.font = "18px sans-serif";
  ctx.fillText("Choose a mode. The match starts after a 3 second countdown.", 560, 218);

  for (const button of MODE_BUTTONS) {
    ctx.fillStyle = "#182227";
    ctx.strokeStyle = "#40545b";
    ctx.lineWidth = 2;
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.fillStyle = "#eef5f2";
    ctx.font = "700 20px sans-serif";
    ctx.fillText(button.label, button.x + button.w / 2, button.y + 36);
  }
  ctx.fillStyle = "#7dfad0";
  ctx.font = "14px sans-serif";
  ctx.fillText("Tetris: A/D/S/Space/Q/E/Shift     Shooter: mouse move, auto fire", 560, 450);
}

function drawCountdown(ctx, countdown) {
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.fillRect(0, 0, 1120, 640);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 84px sans-serif";
  ctx.fillText(String(Math.max(1, Math.ceil(countdown))), 560, 330);
}

function drawPiecePreview(ctx, label, type, rect) {
  ctx.fillStyle = "#aab8b4";
  ctx.font = "700 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, rect.x, rect.y - 5);
  ctx.fillStyle = "#0b1114";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#2f3b42";
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  if (!type) return;
  const blocks = SHAPES[type];
  const size = 13;
  const offsetX = rect.x + rect.w / 2 - 26;
  const offsetY = rect.y + rect.h / 2 - 18;
  ctx.fillStyle = COLORS[type];
  for (const [x, y] of blocks) {
    ctx.fillRect(offsetX + x * size, offsetY + y * size, size - 1, size - 1);
  }
}

function drawStatusTimers(ctx, game) {
  const rows = [];
  const upgrades = game.player.shooter.upgrades;
  for (const [name, time] of Object.entries(upgrades)) if (time > 0) rows.push(`${name}+ ${time.toFixed(1)}s`);
  if (game.player.shieldTime > 0) rows.push(`shield ${game.player.shieldTime.toFixed(1)}s`);
  const debuffs = game.player.debuffs;
  if (debuffs.speedTime > 0) rows.push(`fall speed ${debuffs.speedTime.toFixed(1)}s`);
  if (debuffs.spawnDelayTime > 0) rows.push(`spawn delay ${debuffs.spawnDelayTime.toFixed(1)}s`);
  if (debuffs.colorTime > 0) rows.push(`color shift ${debuffs.colorTime.toFixed(1)}s`);
  if (debuffs.ghostOffTime > 0) rows.push(`ghost off ${debuffs.ghostOffTime.toFixed(1)}s`);
  if (debuffs.disruptTime > 0) rows.push(`visual noise ${debuffs.disruptTime.toFixed(1)}s`);
  if (!rows.length) return;
  ctx.fillStyle = "rgba(20,29,34,0.9)";
  ctx.fillRect(835, 400, 220, 28 + rows.length * 20);
  ctx.strokeStyle = "#2f3b42";
  ctx.strokeRect(835, 400, 220, 28 + rows.length * 20);
  ctx.fillStyle = "#dce7e3";
  ctx.font = "700 12px sans-serif";
  ctx.fillText("ACTIVE EFFECTS", 850, 420);
  ctx.fillStyle = "#7dfad0";
  ctx.font = "12px sans-serif";
  rows.forEach((row, i) => ctx.fillText(row, 850, 442 + i * 20));
}

function drawOverlay(ctx, game) {
  ctx.fillStyle = game.paused ? "#050708" : "rgba(0,0,0,0.78)";
  ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 34px sans-serif";
  const title = game.finished
    ? game.mode === "single" ? "Run complete" : `${game.winner || "Opponent"} wins`
    : "Paused";
  ctx.fillText(title, 560, 286);
  ctx.font = "16px sans-serif";
  if (game.mode === "single") {
    ctx.fillText(`Score ${game.score()}  /  Lines ${game.player.tetris.lines}`, 560, 322);
  }
  drawOverlayButtons(ctx, game);
}

function overlayButtons(game) {
  if (game.paused) {
    return [
      { action: "menu", label: "Menu", x: 374, y: 354, w: 112, h: 42 },
      { action: "resume", label: "Resume", x: 504, y: 354, w: 112, h: 42 },
      { action: "restart", label: "Restart", x: 634, y: 354, w: 112, h: 42 },
    ];
  }
  const buttons = [
    { action: "menu", label: "Menu", x: 374, y: 354, w: 112, h: 42 },
    { action: "restart", label: "Restart", x: 504, y: 354, w: 112, h: 42 },
  ];
  if (game.mode === "single") {
    buttons.push({
      action: "save",
      label: game.scoreSubmitted ? "Saved" : "Save",
      x: 634,
      y: 354,
      w: 112,
      h: 42,
      disabled: game.scoreSubmitted,
    });
  }
  return buttons;
}

function overlayActionAt(x, y, game) {
  const button = overlayButtons(game).find((item) =>
    !item.disabled && x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h
  );
  return button?.action || "";
}

function drawOverlayButtons(ctx, game) {
  for (const button of overlayButtons(game)) {
    ctx.fillStyle = button.disabled ? "#1a2024" : "#182227";
    ctx.strokeStyle = button.disabled ? "#2a3338" : "#7dfad0";
    ctx.lineWidth = 1;
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.fillStyle = button.disabled ? "#657177" : "#eef5f2";
    ctx.font = "700 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
  }
  ctx.textBaseline = "alphabetic";
}
