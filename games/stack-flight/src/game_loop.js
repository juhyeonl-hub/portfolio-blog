import { AIOpponent } from "./ai.js";
import { attackFromLines } from "./attacks.js";
import { AudioSystem } from "./audio.js";
import { DebuffState } from "./debuffs.js";
import { applyItem } from "./items.js";
import { RoomChannel, createRoomCode } from "./network.js";
import { ShooterField } from "./shooter.js";
import { TetrisField } from "./tetris.js";
import { RNG, makeSeed } from "./utils/rng.js";

const LAYOUT = {
  tetris: { x: 54, y: 74, w: 270, h: 540 },
  shooter: { x: 410, y: 74, w: 360, h: 540 },
  opponent: { x: 835, y: 74, w: 220, h: 300 },
};

export class StackFlightGame {
  constructor(canvas, input, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = input;
    this.ui = ui;
    this.audio = new AudioSystem();
    this.last = 0;
    this.paused = false;
    this.mode = "prototype";
    this.channel = null;
    this.restart("prototype");
  }

  restart(mode = this.mode, seed = makeSeed(), roomCode = "") {
    if (this.channel) this.channel.close();
    this.mode = mode;
    this.seed = seed >>> 0;
    this.rng = new RNG(this.seed);
    this.level = 1;
    this.time = 0;
    this.finished = false;
    this.winner = "";
    this.roomCode = roomCode;
    this.remoteState = null;
    this.remoteInput = null;
    this.player = new PlayerState(this.rng, LAYOUT.shooter);
    this.ai = mode === "prototype" || mode === "ai" ? new AIOpponent(this.rng) : null;
    if (mode === "host") this.setupHost();
    if (mode === "join") this.setupGuest(roomCode || "LOCAL1");
    this.ui.setMode(mode, this.seed, this.roomCode);
    this.ui.update(this);
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
    if (!this.paused) this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame((next) => this.frame(next));
  }

  update(dt) {
    if (this.finished) return;
    this.time += dt;
    this.level = 1 + Math.floor(this.time / 24);
    this.player.update(dt, this.input, this);
    if (this.ai) this.ai.update(dt, this);
    if (this.channel && this.mode === "host") this.channel.send("state", this.snapshot());
    if (this.channel && this.mode === "join") this.channel.send("guest-input", this.input.snapshot());
    if (this.player.lives <= 0) {
      this.finished = true;
      this.winner = "Opponent";
    }
    this.ui.update(this);
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

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#11181c";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    drawPanelTitle(ctx, "TETRIS", LAYOUT.tetris);
    drawPanelTitle(ctx, "SHOOTER", LAYOUT.shooter);
    this.player.tetris.draw(ctx, LAYOUT.tetris, this.player.debuffs);
    this.player.shooter.draw(ctx, this.player);
    drawDivider(ctx);
    drawHud(ctx, this);
    drawOpponentPreview(ctx, LAYOUT.opponent, this);

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
  ctx.fillText(`Lives: ${"I".repeat(Math.max(0, game.player.lives))}`, 54, 26);
  ctx.fillText(`Lines: ${game.player.tetris.lines}`, 230, 26);
  ctx.fillText(`Level: ${game.level}`, 410, 26);
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
  ctx.fillText(game.mode === "prototype" ? "SIM OPPONENT" : "REMOTE / AI", rect.x, rect.y - 22);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#aab8b4";
  const lines = [
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

function drawOverlay(ctx, game) {
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 34px sans-serif";
  ctx.fillText(game.finished ? `${game.winner || "Opponent"} wins` : "Paused", 560, 286);
  ctx.font = "16px sans-serif";
  ctx.fillText("Press Restart to play again.", 560, 322);
}
