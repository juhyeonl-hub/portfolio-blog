import { maybeCreateItem } from "./items.js";

const W = 10;
const H = 20;
export const COLORS = {
  I: "#4dd8ff",
  O: "#ffd04d",
  T: "#b985ff",
  S: "#5ee27a",
  Z: "#ff6077",
  J: "#6397ff",
  L: "#ff9b4d",
};

export const SHAPES = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

export class TetrisField {
  constructor(rng) {
    this.rng = rng;
    this.grid = makeGrid();
    this.queue = [];
    this.hold = null;
    this.usedHold = false;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.spawnDelay = 0;
    this.lines = 0;
    this.lastClearItems = [];
    this.moveState = { dir: 0, held: 0, repeat: 0 };
    this.refillBag();
    this.spawn(1);
  }

  update(dt, input, player, game) {
    if (this.spawnDelay > 0) {
      this.spawnDelay -= dt;
      return;
    }

    const moveDelay = input.keys.has("KeyS") ? 0.035 : getFallDelay(game.level, player.debuffs.speedTime > 0);
    this.updateHorizontalMove(dt, input);
    if (input.consume("KeyQ")) this.rotate(-1);
    if (input.consume("KeyE")) this.rotate(1);
    if (input.consume("Shift")) this.swapHold(game.level);
    if (input.consume("Space")) this.hardDrop(player, game);

    this.dropTimer += dt;
    if (this.dropTimer >= moveDelay) {
      this.dropTimer = 0;
      if (!this.tryMove(0, 1)) this.lockTimer += moveDelay;
    }
    if (this.lockTimer >= 0.32) this.lock(player, game);
  }

  updateHorizontalMove(dt, input) {
    const left = input.keys.has("KeyA");
    const right = input.keys.has("KeyD");
    const dir = left === right ? 0 : left ? -1 : 1;
    if (dir === 0) {
      this.moveState = { dir: 0, held: 0, repeat: 0 };
      return;
    }
    if (this.moveState.dir !== dir) {
      this.moveState = { dir, held: 0, repeat: 0 };
      this.tryMove(dir, 0);
      return;
    }

    this.moveState.held += dt;
    this.moveState.repeat += dt;
    if (this.moveState.held < 0.15) return;
    if (this.moveState.repeat >= 0.055) {
      this.moveState.repeat = 0;
      this.tryMove(dir, 0);
    }
  }

  spawn(level) {
    if (this.queue.length < 7) this.refillBag();
    const type = this.queue.shift();
    this.current = {
      type,
      x: 3,
      y: -1,
      blocks: SHAPES[type].map(([x, y]) => ({ x, y, item: maybeCreateItem(this.rng, level) })),
    };
    this.usedHold = false;
    this.lockTimer = 0;
  }

  refillBag() {
    const bag = Object.keys(SHAPES);
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = this.rng.int(i + 1);
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }

  swapHold(level) {
    if (this.usedHold) return;
    const old = this.current.type;
    if (this.hold) {
      this.current = {
        type: this.hold,
        x: 3,
        y: -1,
        blocks: SHAPES[this.hold].map(([x, y]) => ({ x, y, item: maybeCreateItem(this.rng, level) })),
      };
    } else {
      this.spawn(level);
    }
    this.hold = old;
    this.usedHold = true;
  }

  tryMove(dx, dy) {
    this.current.x += dx;
    this.current.y += dy;
    if (this.collides()) {
      this.current.x -= dx;
      this.current.y -= dy;
      return false;
    }
    if (dy === 0) this.lockTimer = 0;
    return true;
  }

  rotate(dir) {
    if (this.current.type === "O") return;
    const old = this.current.blocks.map((b) => ({ ...b }));
    this.current.blocks = this.current.blocks.map((block) => {
      const x = block.x - 1;
      const y = block.y - 1;
      return dir > 0
        ? { ...block, x: -y + 1, y: x + 1 }
        : { ...block, x: y + 1, y: -x + 1 };
    });
    for (const kick of [0, -1, 1, -2, 2]) {
      this.current.x += kick;
      if (!this.collides()) {
        this.lockTimer = 0;
        return;
      }
      this.current.x -= kick;
    }
    this.current.blocks = old;
  }

  hardDrop(player, game) {
    while (this.tryMove(0, 1));
    this.lock(player, game);
  }

  lock(player, game) {
    for (const block of this.current.blocks) {
      const x = this.current.x + block.x;
      const y = this.current.y + block.y;
      if (y < 0) {
        player.hitStackTop();
        this.removeTopRows(4);
        this.spawnDelay = 1;
        this.spawn(game.level);
        return;
      }
      this.grid[y][x] = { type: this.current.type, item: block.item };
    }
    const cleared = this.clearLines();
    this.lines += cleared.count;
    game.onLineClear(cleared.count, cleared.items);
    this.spawnDelay = player.debuffs.spawnDelayTime > 0 ? 0.45 : 0;
    this.spawn(game.level);
    if (this.collides()) {
      player.hitStackTop();
      this.removeTopRows(4);
    }
  }

  clearLines() {
    const kept = [];
    const items = [];
    let count = 0;
    for (const row of this.grid) {
      if (row.every(Boolean)) {
        count += 1;
        for (const cell of row) if (cell.item) items.push(cell.item);
      } else {
        kept.push(row);
      }
    }
    while (kept.length < H) kept.unshift(Array(W).fill(null));
    this.grid = kept;
    return { count, items };
  }

  removeTopRows(rows) {
    this.grid.splice(0, rows);
    while (this.grid.length < H) this.grid.unshift(Array(W).fill(null));
  }

  collides() {
    return this.current.blocks.some((block) => {
      const x = this.current.x + block.x;
      const y = this.current.y + block.y;
      return x < 0 || x >= W || y >= H || (y >= 0 && this.grid[y][x]);
    });
  }

  ghostY() {
    const y = this.current.y;
    while (!this.collides()) this.current.y += 1;
    this.current.y -= 1;
    const ghost = this.current.y;
    this.current.y = y;
    return ghost;
  }

  draw(ctx, rect, debuffs) {
    const cell = rect.w / W;
    ctx.fillStyle = "#0b1114";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    drawGrid(ctx, rect, cell);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        if (this.grid[y][x]) drawCell(ctx, rect.x + x * cell, rect.y + y * cell, cell, this.grid[y][x], debuffs);
      }
    }
    if (debuffs.ghostOffTime <= 0) {
      const gy = this.ghostY();
      for (const block of this.current.blocks) {
        const x = this.current.x + block.x;
        const y = gy + block.y;
        if (y >= 0) drawCell(ctx, rect.x + x * cell, rect.y + y * cell, cell, { type: this.current.type }, debuffs, 0.18);
      }
    }
    for (const block of this.current.blocks) {
      const x = this.current.x + block.x;
      const y = this.current.y + block.y;
      if (y >= 0) drawCell(ctx, rect.x + x * cell, rect.y + y * cell, cell, { type: this.current.type, item: block.item }, debuffs);
    }
  }

  nextType() {
    return this.queue[0] || null;
  }

  snapshot() {
    return {
      grid: this.grid.map((row) => row.map((cell) => cell?.type || null)),
      current: {
        type: this.current.type,
        x: this.current.x,
        y: this.current.y,
        blocks: this.current.blocks.map((block) => ({ x: block.x, y: block.y })),
      },
      hold: this.hold,
      next: this.nextType(),
    };
  }
}

function makeGrid() {
  return Array.from({ length: H }, () => Array(W).fill(null));
}

function getFallDelay(level, debuffed) {
  const base = Math.max(0.12, 0.78 - level * 0.045);
  return debuffed ? base * 0.62 : base;
}

function drawGrid(ctx, rect, cell) {
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 1) {
    ctx.beginPath();
    ctx.moveTo(rect.x + x * cell, rect.y);
    ctx.lineTo(rect.x + x * cell, rect.y + rect.h);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 1) {
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y + y * cell);
    ctx.lineTo(rect.x + rect.w, rect.y + y * cell);
    ctx.stroke();
  }
}

function drawCell(ctx, x, y, size, cell, debuffs, alpha = 1) {
  const color = debuffs.colorTime > 0 ? "#d8d8d8" : COLORS[cell.type];
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  if (cell.item) {
    ctx.fillStyle = "#101417";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.floor(size * 0.34)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cell.item[0].toUpperCase(), x + size / 2, y + size / 2 + 1);
  }
  ctx.globalAlpha = 1;
}
