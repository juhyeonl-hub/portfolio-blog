export class DebuffState {
  constructor() {
    this.speedTime = 0;
    this.spawnDelayTime = 0;
    this.colorTime = 0;
    this.ghostOffTime = 0;
    this.disruptTime = 0;
  }

  applyRandom(rng) {
    const type = rng.choice(["speed", "spawn", "color", "ghost", "disrupt"]);
    if (type === "speed") this.speedTime = 6;
    if (type === "spawn") this.spawnDelayTime = 4;
    if (type === "color") this.colorTime = 8;
    if (type === "ghost") this.ghostOffTime = 8;
    if (type === "disrupt") this.disruptTime = 5;
  }

  update(dt) {
    this.speedTime = Math.max(0, this.speedTime - dt);
    this.spawnDelayTime = Math.max(0, this.spawnDelayTime - dt);
    this.colorTime = Math.max(0, this.colorTime - dt);
    this.ghostOffTime = Math.max(0, this.ghostOffTime - dt);
    this.disruptTime = Math.max(0, this.disruptTime - dt);
  }
}
