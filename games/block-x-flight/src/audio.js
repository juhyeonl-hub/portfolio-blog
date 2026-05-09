export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.lastShot = 0;
    window.addEventListener("pointerdown", () => this.ensure(), { once: true });
    window.addEventListener("keydown", () => this.ensure(), { once: true });
  }

  ensure() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  play(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (type === "shot" && now - this.lastShot < 0.08) return;
    if (type === "shot") this.lastShot = now;

    const settings = {
      shot: [520, 0.025, 0.03],
      clear: [760, 0.07, 0.08],
      hit: [150, 0.12, 0.12],
      item: [980, 0.08, 0.07],
    }[type] || [440, 0.05, 0.05];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = settings[0];
    osc.type = type === "hit" ? "sawtooth" : "square";
    gain.gain.setValueAtTime(settings[2], now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + settings[1]);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + settings[1]);
  }
}
