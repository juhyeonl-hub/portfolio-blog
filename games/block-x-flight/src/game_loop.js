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
  { mode: "ai", label: "VS AI", x: 230, y: 360, w: 150, h: 58 },
  { mode: "host", label: "Host", x: 400, y: 360, w: 150, h: 58 },
  { mode: "join", label: "Join", x: 570, y: 360, w: 150, h: 58 },
  { mode: "single", label: "Single", x: 740, y: 360, w: 150, h: 58 },
];

const JOIN_CODE_BUTTONS = [
  { action: "back", label: "Back", x: 410, y: 390, w: 130, h: 48 },
  { action: "join", label: "Join", x: 580, y: 390, w: 130, h: 48 },
];

const WAIT_BUTTON = { action: "cancel", label: "Cancel", x: 494, y: 470, w: 132, h: 44 };
const NAME_BOX = { x: 410, y: 260, w: 300, h: 52 };

export class BlockXFlightGame {
  constructor(canvas, input, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = input;
    this.ui = ui;
    this.audio = new AudioSystem();
    this.last = 0;
    this.paused = false;
    this.menuOpen = false;
    this.confirmExit = false;
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
    this.localName = window.localStorage.getItem("block-x-flight-player-name") ?? "Player";
    this.remoteName = "Opponent";
    this.localRestartReady = false;
    this.remoteRestartReady = false;
    this.roomCode = "";
    this.joinCode = "";
    this.waitMessage = "";
    this.hostConnected = false;
    this.guestConnected = false;
    this.seedSynced = true;
    this.remoteState = null;
    this.remoteInput = null;
    this.player = new PlayerState(this.rng, LAYOUT.shooter);
    this.ai = null;
    window.addEventListener("message", (event) => {
      if (event.origin === window.location.origin && event.data?.type === "block-x-flight-score-saved") {
        this.scoreSubmitted = true;
      }
    });
    this.ui.setMode(this.mode, this.seed, this.roomCode);
    this.ui.update(this);
  }

  restart(mode = this.mode, seed = makeSeed(), roomCode = "") {
    if (this.channel) this.channel.close();
    this.paused = false;
    this.menuOpen = false;
    this.confirmExit = false;
    this.mode = mode;
    this.seed = seed >>> 0;
    this.rng = new RNG(this.seed);
    this.level = 1;
    this.time = 0;
    this.finished = false;
    this.winner = "";
    this.remoteName = "Opponent";
    this.localRestartReady = false;
    this.remoteRestartReady = false;
    this.scoreSubmitted = false;
    this.roomCode = roomCode;
    this.waitMessage = "";
    this.hostConnected = false;
    this.guestConnected = false;
    this.seedSynced = mode !== "join";
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
    if (!this.localName.trim()) return;
    if (mode === "join" && !roomCode) {
      this.showJoinCode();
      return;
    }
    this.restart(mode, seed, roomCode);
    if (mode === "host" || mode === "join") {
      this.state = "waiting";
      this.waitMessage = mode === "host" ? "Waiting for guest..." : "Connecting to host...";
      return;
    }
    this.startCountdown();
  }

  showJoinCode() {
    if (this.channel) this.channel.close();
    this.channel = null;
    this.paused = false;
    this.menuOpen = false;
    this.confirmExit = false;
    this.state = "join-code";
    this.joinCode = "";
    this.roomCode = "";
    this.waitMessage = "";
    this.ui.setMode("join", this.seed, "");
    this.ui.update(this);
  }

  startCountdown() {
    this.state = "countdown";
    this.countdown = 3;
  }

  setupHost() {
    this.roomCode = createRoomCode(this.rng);
    this.channel = new RoomChannel(this.roomCode, "host", (message) => {
      if (message.type === "room-status") this.handleRoomStatus(message);
      if (message.type === "guest-ready") this.channel.send("seed", { seed: this.seed });
      if (message.type === "player-ready") this.handlePlayerReady(message);
      if (message.type === "guest-lines") this.player.shooter.spawnAttack(attackFromLines(message.payload.lines, this.level), this.rng);
      if (message.type === "guest-input") this.remoteInput = message.payload;
      if (message.type === "state") this.handleRemoteState(message.payload);
      if (message.type === "game-over") this.handleRemoteGameOver(message.payload);
      if (message.type === "restart-ready") this.handleRemoteRestartReady();
      if (message.type === "leave-match") this.showMenu();
    });
    this.channel.send("seed", { seed: this.seed });
    this.channel.send("host-ready", { seed: this.seed });
    this.sendPlayerReady();
    this.ui.setMode("host", this.seed, this.roomCode);
  }

  setupGuest(code) {
    this.roomCode = code.toUpperCase();
    this.channel = new RoomChannel(this.roomCode, "guest", (message) => {
      if (message.type === "room-status") this.handleRoomStatus(message);
      if (message.type === "seed" && message.payload?.seed && message.payload.seed !== this.seed) {
        this.applySeed(message.payload.seed);
      }
      if (message.type === "player-ready") this.handlePlayerReady(message);
      if (message.type === "host-lines") this.player.shooter.spawnAttack(attackFromLines(message.payload.lines, this.level), this.rng);
      if (message.type === "state") this.handleRemoteState(message.payload);
      if (message.type === "game-over") this.handleRemoteGameOver(message.payload);
      if (message.type === "restart-ready") this.handleRemoteRestartReady();
      if (message.type === "rematch-start" && message.payload?.seed) this.startRematch(message.payload.seed);
      if (message.type === "leave-match") this.showMenu();
    });
    this.channel.send("guest-ready", {});
    this.sendPlayerReady();
  }

  handleRoomStatus(message) {
    this.hostConnected = Boolean(message.hostConnected);
    this.guestConnected = Boolean(message.guestConnected);
    if (message.readyToStart) {
      this.waitMessage = "Both players connected. Starting...";
      if (this.mode === "host") this.channel?.send("seed", { seed: this.seed });
      this.sendPlayerReady();
      if ((this.mode === "host" || this.seedSynced) && this.state === "waiting") this.startCountdown();
      return;
    }
    this.waitMessage = this.mode === "host" ? "Waiting for guest..." : "Waiting for host...";
  }

  applySeed(seed) {
    this.seed = seed >>> 0;
    this.seedSynced = true;
    this.rng = new RNG(this.seed);
    this.level = 1;
    this.time = 0;
    this.finished = false;
    this.winner = "";
    this.scoreSubmitted = false;
    this.remoteState = null;
    this.remoteInput = null;
    this.player = new PlayerState(this.rng, LAYOUT.shooter);
    this.ui.setMode(this.mode, this.seed, this.roomCode);
    this.ui.update(this);
    if (this.state === "waiting" && this.hostConnected && this.guestConnected) this.startCountdown();
  }

  sendPlayerReady() {
    if (!this.channel || this.mode === "single" || this.mode === "ai") return;
    this.channel.send("player-ready", { name: this.localName });
  }

  handlePlayerReady(message) {
    const name = String(message.payload?.name || "Opponent").trim().slice(0, 16);
    this.remoteName = name || "Opponent";
  }

  handleRemoteState(payload) {
    this.remoteState = payload;
    if (payload?.name) this.remoteName = String(payload.name).slice(0, 16);
    if (!this.finished && payload?.finished) {
      this.finishMatch("win", payload.name || this.remoteName);
    }
  }

  handleRemoteGameOver(payload) {
    if (payload?.name) this.remoteName = String(payload.name).slice(0, 16);
    if (!this.finished) this.finishMatch("win", payload?.name || this.remoteName);
  }

  handleRemoteRestartReady() {
    this.remoteRestartReady = true;
    if (this.localRestartReady) this.tryStartRematch();
  }

  requestRestart() {
    if (this.mode !== "host" && this.mode !== "join") {
      this.selectMode(this.mode);
      return;
    }
    this.localRestartReady = true;
    this.channel?.send("restart-ready", { name: this.localName });
    this.tryStartRematch();
  }

  tryStartRematch() {
    if (!this.localRestartReady || !this.remoteRestartReady) return;
    if (this.mode !== "host") return;
    const seed = this.mode === "host" ? makeSeed() : this.seed;
    this.channel?.send("rematch-start", { seed });
    this.startRematch(seed);
  }

  startRematch(seed) {
    this.seed = seed >>> 0;
    this.rng = new RNG(this.seed);
    this.level = 1;
    this.time = 0;
    this.finished = false;
    this.winner = "";
    this.matchResult = "";
    this.localRestartReady = false;
    this.remoteRestartReady = false;
    this.scoreSubmitted = false;
    this.remoteState = null;
    this.remoteInput = null;
    this.player = new PlayerState(this.rng, LAYOUT.shooter);
    this.sendPlayerReady();
    this.startCountdown();
    this.ui.setMode(this.mode, this.seed, this.roomCode);
    this.ui.update(this);
  }

  togglePause() {
    this.confirmExit = false;
    if (this.mode === "single") this.paused = !this.paused;
    else this.menuOpen = !this.menuOpen;
  }

  start() {
    requestAnimationFrame((time) => this.frame(time));
  }

  frame(time) {
    const dt = Math.min(0.033, (time - this.last) / 1000 || 0);
    this.last = time;
    const handledGlobalInput = this.handleGlobalInput();
    if (!this.paused && !handledGlobalInput) this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame((next) => this.frame(next));
  }

  handleGlobalInput() {
    if (this.state === "playing" && !this.finished && this.input.consume("Escape")) {
      if (this.confirmExit) {
        this.confirmExit = false;
        return this.mode === "single";
      }
      if (this.mode === "single") {
        this.paused = !this.paused;
        return true;
      }
      this.menuOpen = !this.menuOpen;
      return false;
    }
    if (!this.paused && !this.finished && !this.menuOpen) return false;
    for (const click of this.input.clicks) {
      const action = overlayActionAt(click.x, click.y, this);
      if (action === "menu") {
        if (!this.finished && (this.paused || this.menuOpen)) this.confirmExit = true;
        else {
          if (this.mode === "host" || this.mode === "join") this.channel?.send("leave-match", { name: this.localName });
          this.showMenu();
        }
        return true;
      }
      if (action === "confirm-menu") {
        if (this.mode === "host" || this.mode === "join") this.channel?.send("leave-match", { name: this.localName });
        this.showMenu();
        return true;
      }
      if (action === "cancel-menu") {
        this.confirmExit = false;
        return true;
      }
      if (action === "restart") {
        this.requestRestart();
        return true;
      }
      if (action === "resume") {
        this.paused = false;
        this.menuOpen = false;
        this.confirmExit = false;
        return true;
      }
      if (action === "save") {
        this.submitScore();
        return true;
      }
    }
    return false;
  }

  update(dt) {
    if (this.state === "menu") {
      this.handleMenuInput();
      return;
    }
    if (this.state === "join-code") {
      this.handleJoinCodeInput();
      return;
    }
    if (this.state === "waiting") {
      this.handleWaitingInput();
      this.ui.update(this);
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
    if (this.player.lives <= 0) {
      this.finishMatch(this.mode === "single" ? "complete" : "lose", this.remoteName);
    }
    if (this.channel && this.mode === "host") this.channel.send("state", this.snapshot());
    if (this.channel && this.mode === "join") {
      this.channel.send("guest-input", this.input.snapshot());
      this.channel.send("state", this.snapshot());
    }
    this.ui.update(this);
  }

  finishMatch(result, opponentName = "Opponent") {
    if (this.finished) return;
    this.finished = true;
    this.matchResult = result;
    this.winner = result === "complete" ? "Run complete" : result === "win" ? this.localName : opponentName;
    if (result === "lose") this.channel?.send("game-over", { name: this.localName });
  }

  showMenu() {
    if (this.channel) this.channel.close();
    this.channel = null;
    this.paused = false;
    this.menuOpen = false;
    this.confirmExit = false;
    this.finished = false;
    this.winner = "";
    this.matchResult = "";
    this.remoteName = "Opponent";
    this.localRestartReady = false;
    this.remoteRestartReady = false;
    this.scoreSubmitted = false;
    this.state = "menu";
    this.countdown = 0;
    this.roomCode = "";
    this.joinCode = "";
    this.remoteState = null;
    this.remoteInput = null;
    this.waitMessage = "";
    this.hostConnected = false;
    this.guestConnected = false;
    this.seedSynced = true;
    this.seed = makeSeed();
    this.rng = new RNG(this.seed);
    this.level = 1;
    this.time = 0;
    this.player = new PlayerState(this.rng, LAYOUT.shooter);
    this.ai = null;
    this.ui.setMode(this.mode, this.seed, this.roomCode);
    this.ui.update(this);
  }

  submitScore() {
    if (this.mode !== "single" || this.scoreSubmitted) return;
    window.parent?.postMessage({ type: "block-x-flight-score", score: this.score(), lines: this.player.tetris.lines }, window.location.origin);
  }

  handleMenuInput() {
    this.handleNameInput();
    for (const click of this.input.clicks) {
      const button = MODE_BUTTONS.find((item) =>
        click.x >= item.x && click.x <= item.x + item.w && click.y >= item.y && click.y <= item.y + item.h
      );
      if (button) this.selectMode(button.mode);
    }
  }

  handleNameInput() {
    for (const token of this.input.text) {
      if (token === "Backspace") this.localName = this.localName.slice(0, -1);
      else if (/^[A-Z0-9]$/.test(token) && this.localName.length < 16) this.localName += token;
    }
    window.localStorage.setItem("block-x-flight-player-name", this.localName);
  }

  handleJoinCodeInput() {
    for (const token of this.input.text) {
      if (token === "Backspace") this.joinCode = this.joinCode.slice(0, -1);
      else if (token === "Enter" && this.joinCode.length >= 4) this.selectMode("join", makeSeed(), this.joinCode);
      else if (/^[A-Z0-9]$/.test(token) && this.joinCode.length < 8) this.joinCode += token;
    }
    for (const click of this.input.clicks) {
      const button = JOIN_CODE_BUTTONS.find((item) =>
        click.x >= item.x && click.x <= item.x + item.w && click.y >= item.y && click.y <= item.y + item.h
      );
      if (button?.action === "back") this.showMenu();
      if (button?.action === "join" && this.joinCode.length >= 4) this.selectMode("join", makeSeed(), this.joinCode);
    }
  }

  handleWaitingInput() {
    if (this.input.consume("Escape")) this.showMenu();
    for (const click of this.input.clicks) {
      if (
        click.x >= WAIT_BUTTON.x && click.x <= WAIT_BUTTON.x + WAIT_BUTTON.w &&
        click.y >= WAIT_BUTTON.y && click.y <= WAIT_BUTTON.y + WAIT_BUTTON.h
      ) {
        this.showMenu();
      }
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
      name: this.localName.trim(),
      time: this.time,
      level: this.level,
      lives: this.player.lives,
      lines: this.player.tetris.lines,
      finished: this.finished,
      result: this.matchResult,
      tetris: this.player.tetris.snapshot(),
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
      drawModeSelect(ctx, this.localName);
      return;
    }
    if (this.state === "join-code") {
      drawJoinCode(ctx, this.joinCode);
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
    if (this.state === "waiting") drawWaiting(ctx, this);
    if (this.paused || this.finished || this.menuOpen) drawOverlay(ctx, this);
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
    if (this.lives <= 0) game.finishMatch(game.mode === "single" ? "complete" : "lose", game.remoteName);
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
  ctx.fillText(game.mode === "single" ? "SCORE RUN" : game.mode === "ai" ? "AI OPPONENT" : game.remoteName.toUpperCase(), rect.x, rect.y - 22);
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
        game.remoteState ? `${game.remoteName} lives ${game.remoteState.lives}` : "Private match sync is",
        game.remoteState ? `${game.remoteName} lines ${game.remoteState.lines}` : "host based for local",
        game.remoteRestartReady ? `${game.remoteName} ready` : game.localRestartReady ? "Waiting for rematch" : "Connected match.",
        "",
        "Clear lines to send",
        "attack bars across.",
      ];
  lines.forEach((line, i) => ctx.fillText(line, rect.x + 18, rect.y + 34 + i * 24));

  if (game.remoteState?.tetris) {
    drawMiniTetris(ctx, game.remoteState.tetris, { x: rect.x, y: 390, w: rect.w, h: 205 }, game.remoteName);
  }
}

function drawModeSelect(ctx, playerName) {
  const canStart = Boolean(playerName.trim());
  ctx.fillStyle = "#11181c";
  ctx.fillRect(0, 0, 1120, 640);
  ctx.textAlign = "center";
  ctx.fillStyle = "#eef5f2";
  ctx.font = "700 46px sans-serif";
  ctx.fillText("Block X Flight", 560, 170);
  ctx.fillStyle = "#aab8b4";
  ctx.font = "18px sans-serif";
  ctx.fillText("Choose a mode. The match starts after a 3 second countdown.", 560, 218);

  ctx.fillStyle = "#0b1114";
  ctx.strokeStyle = "#40545b";
  ctx.lineWidth = 2;
  ctx.fillRect(NAME_BOX.x, NAME_BOX.y, NAME_BOX.w, NAME_BOX.h);
  ctx.strokeRect(NAME_BOX.x, NAME_BOX.y, NAME_BOX.w, NAME_BOX.h);
  ctx.fillStyle = "#7dfad0";
  ctx.font = "700 12px sans-serif";
  ctx.fillText("PLAYER NAME", 560, 278);
  ctx.fillStyle = "#eef5f2";
  ctx.font = "700 22px sans-serif";
  const displayName = playerName.slice(0, 16);
  if (displayName) {
    ctx.fillText(displayName, 560, 308);
  } else {
    ctx.fillStyle = "#5f6b70";
    ctx.fillText("NAME REQUIRED", 560, 308);
  }
  if (Math.floor(performance.now() / 500) % 2 === 0) {
    const width = ctx.measureText(displayName).width;
    const caretX = displayName ? 560 + width / 2 + 7 : 560;
    ctx.fillStyle = "#7dfad0";
    ctx.fillRect(caretX, 289, 2, 24);
  }
  ctx.fillStyle = canStart ? "#7f8f8a" : "#ff9b4d";
  ctx.font = "12px sans-serif";
  ctx.fillText(canStart ? "Type to edit. Backspace deletes." : "Enter a name to start.", 560, 342);

  for (const button of MODE_BUTTONS) {
    ctx.fillStyle = canStart ? "#182227" : "#12191d";
    ctx.strokeStyle = canStart ? "#40545b" : "#2a3338";
    ctx.lineWidth = 2;
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.fillStyle = canStart ? "#eef5f2" : "#657177";
    ctx.font = "700 20px sans-serif";
    ctx.fillText(button.label, button.x + button.w / 2, button.y + 36);
  }
  ctx.fillStyle = "#7dfad0";
  ctx.font = "14px sans-serif";
  ctx.fillText("Tetris: A/D/S/Space/Q/E/Shift     Shooter: Arrow keys, auto fire", 560, 472);
}

function drawJoinCode(ctx, code) {
  ctx.fillStyle = "#11181c";
  ctx.fillRect(0, 0, 1120, 640);
  ctx.textAlign = "center";
  ctx.fillStyle = "#eef5f2";
  ctx.font = "700 42px sans-serif";
  ctx.fillText("Join Private Match", 560, 170);
  ctx.fillStyle = "#aab8b4";
  ctx.font = "17px sans-serif";
  ctx.fillText("Enter the host invite code, then press Join or Enter.", 560, 218);

  ctx.fillStyle = "#0b1114";
  ctx.strokeStyle = "#7dfad0";
  ctx.lineWidth = 2;
  ctx.fillRect(390, 270, 340, 64);
  ctx.strokeRect(390, 270, 340, 64);
  ctx.fillStyle = code ? "#eef5f2" : "#5f6b70";
  ctx.font = "700 30px monospace";
  ctx.fillText(code || "CODE", 560, 311);

  for (const button of JOIN_CODE_BUTTONS) {
    const disabled = button.action === "join" && code.length < 4;
    ctx.fillStyle = disabled ? "#151b1f" : "#182227";
    ctx.strokeStyle = disabled ? "#2a3338" : "#7dfad0";
    ctx.lineWidth = 2;
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.fillStyle = disabled ? "#657177" : "#eef5f2";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(button.label, button.x + button.w / 2, button.y + 31);
  }
}

function drawWaiting(ctx, game) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, 1120, 640);
  ctx.textAlign = "center";
  ctx.fillStyle = "#eef5f2";
  ctx.font = "700 36px sans-serif";
  ctx.fillText(game.mode === "host" ? "Private Match Ready" : "Joining Match", 560, 230);
  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#aab8b4";
  ctx.fillText(game.waitMessage || "Checking room status...", 560, 276);

  ctx.fillStyle = "#0b1114";
  ctx.strokeStyle = "#40545b";
  ctx.lineWidth = 2;
  ctx.fillRect(410, 318, 300, 70);
  ctx.strokeRect(410, 318, 300, 70);
  ctx.fillStyle = "#7dfad0";
  ctx.font = "700 14px sans-serif";
  ctx.fillText("INVITE CODE", 560, 344);
  ctx.fillStyle = "#eef5f2";
  ctx.font = "700 30px monospace";
  ctx.fillText(game.roomCode || "--------", 560, 374);

  ctx.font = "15px sans-serif";
  ctx.fillStyle = game.hostConnected ? "#7dfad0" : "#657177";
  ctx.fillText(`Host ${game.hostConnected ? "connected" : "waiting"}`, 475, 430);
  ctx.fillStyle = game.guestConnected ? "#7dfad0" : "#657177";
  ctx.fillText(`Guest ${game.guestConnected ? "connected" : "waiting"}`, 645, 430);

  ctx.fillStyle = "#182227";
  ctx.strokeStyle = "#7dfad0";
  ctx.lineWidth = 1;
  ctx.fillRect(WAIT_BUTTON.x, WAIT_BUTTON.y, WAIT_BUTTON.w, WAIT_BUTTON.h);
  ctx.strokeRect(WAIT_BUTTON.x, WAIT_BUTTON.y, WAIT_BUTTON.w, WAIT_BUTTON.h);
  ctx.fillStyle = "#eef5f2";
  ctx.font = "700 15px sans-serif";
  ctx.fillText(WAIT_BUTTON.label, WAIT_BUTTON.x + WAIT_BUTTON.w / 2, WAIT_BUTTON.y + 28);
}

function drawCountdown(ctx, countdown) {
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.fillRect(0, 0, 1120, 640);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 84px sans-serif";
  ctx.fillText(String(Math.max(1, Math.ceil(countdown))), 560, 330);
}

function drawMiniTetris(ctx, snapshot, rect, label) {
  ctx.fillStyle = "#141d22";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#2f3b42";
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "#dce7e3";
  ctx.font = "700 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${label} FIELD`, rect.x + 12, rect.y + 18);

  const board = { x: rect.x + 58, y: rect.y + 28, w: 104, h: 168 };
  const cell = Math.min(board.w / 10, board.h / 20);
  const startX = board.x + (board.w - cell * 10) / 2;
  const startY = board.y + (board.h - cell * 20) / 2;
  ctx.fillStyle = "#0b1114";
  ctx.fillRect(startX, startY, cell * 10, cell * 20);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let y = 0; y < 20; y += 1) {
    for (let x = 0; x < 10; x += 1) {
      const type = snapshot.grid?.[y]?.[x];
      if (type) {
        ctx.fillStyle = COLORS[type] || "#dce7e3";
        ctx.fillRect(startX + x * cell + 1, startY + y * cell + 1, cell - 1, cell - 1);
      }
    }
  }
  for (const block of snapshot.current?.blocks || []) {
    const x = snapshot.current.x + block.x;
    const y = snapshot.current.y + block.y;
    if (x >= 0 && x < 10 && y >= 0 && y < 20) {
      ctx.fillStyle = COLORS[snapshot.current.type] || "#dce7e3";
      ctx.fillRect(startX + x * cell + 1, startY + y * cell + 1, cell - 1, cell - 1);
    }
  }
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
  ctx.fillStyle = game.paused ? "#050708" : game.menuOpen ? "rgba(0,0,0,0.46)" : "rgba(0,0,0,0.78)";
  ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 34px sans-serif";
  const title = game.confirmExit
    ? "Leave match?"
    : game.finished
    ? game.mode === "single" ? "Run complete" : game.matchResult === "win" ? "You win" : "You lose"
    : game.menuOpen ? "Menu" : "Paused";
  ctx.fillText(title, 560, 286);
  ctx.font = "16px sans-serif";
  if (game.confirmExit) {
    ctx.fillText("Your current run will be forfeited.", 560, 322);
  } else if (game.mode === "single") {
    ctx.fillText(`Score ${game.score()}  /  Lines ${game.player.tetris.lines}`, 560, 322);
  } else if (game.finished) {
    const detail = game.matchResult === "win"
      ? `${game.remoteName} was defeated.`
      : `${game.remoteName} wins.`;
    ctx.fillText(detail, 560, 322);
    if (game.localRestartReady || game.remoteRestartReady) {
      const ready = [
        game.localRestartReady ? "You ready" : "You not ready",
        game.remoteRestartReady ? `${game.remoteName} ready` : `${game.remoteName} not ready`,
      ].join("  /  ");
      ctx.fillText(ready, 560, 426);
    }
  } else if (game.menuOpen) {
    ctx.fillText("Match continues in the background.", 560, 322);
  }
  drawOverlayButtons(ctx, game);
}

function overlayButtons(game) {
  if (game.confirmExit) {
    return [
      { action: "cancel-menu", label: "Cancel", x: 430, y: 354, w: 112, h: 42 },
      { action: "confirm-menu", label: "Leave", x: 578, y: 354, w: 112, h: 42 },
    ];
  }
  if (game.paused || game.menuOpen) {
    return [
      { action: "menu", label: "Menu", x: 374, y: 354, w: 112, h: 42 },
      { action: "resume", label: game.paused ? "Resume" : "Close", x: 504, y: 354, w: 112, h: 42 },
      { action: "restart", label: "Restart", x: 634, y: 354, w: 112, h: 42 },
    ];
  }
  const buttons = [
    { action: "menu", label: "Menu", x: 330, y: 354, w: 112, h: 42 },
    { action: "restart", label: "Restart", x: 504, y: 354, w: 112, h: 42 },
  ];
  if (game.mode === "single") {
    buttons.push({
      action: "save",
      label: game.scoreSubmitted ? "Saved" : "Save",
      x: 678,
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
