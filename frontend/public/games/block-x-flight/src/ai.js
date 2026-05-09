import { attackFromLines } from "./attacks.js";

export class AIOpponent {
  constructor(rng) {
    this.rng = rng;
    this.timer = 3;
    this.lines = 0;
  }

  update(dt, game) {
    this.timer -= dt;
    const interval = Math.max(1.15, 3.4 - game.level * 0.13);
    if (this.timer > 0) return;
    this.timer = interval + this.rng.next() * 1.2;
    const clear = this.rng.next() > 0.72 ? 2 : 1;
    const spec = attackFromLines(clear, game.level);
    if (spec) game.player.shooter.spawnAttack(spec, this.rng);
  }
}
