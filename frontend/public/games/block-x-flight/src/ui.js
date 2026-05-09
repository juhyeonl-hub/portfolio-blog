export class UI {
  constructor() {
    this.modeLabel = document.querySelector("#modeLabel");
    this.roomLabel = document.querySelector("#roomLabel");
    this.inviteInput = document.querySelector("#inviteInput");
    this.livesOut = document.querySelector("#livesOut");
    this.linesOut = document.querySelector("#linesOut");
    this.levelOut = document.querySelector("#levelOut");
    this.seedOut = document.querySelector("#seedOut");
    this.buttons = {
      single: document.querySelector("#singleBtn"),
      ai: document.querySelector("#aiBtn"),
      host: document.querySelector("#hostBtn"),
      join: document.querySelector("#joinBtn"),
    };
  }

  setMode(mode, seed, roomCode) {
    const labels = { single: "Single", ai: "VS AI", host: "Host", join: "Join" };
    this.modeLabel.textContent = labels[mode] || mode;
    this.roomLabel.textContent = roomCode || "Local";
    this.inviteInput.value = roomCode || "";
    this.seedOut.textContent = String(seed);
    for (const [key, button] of Object.entries(this.buttons)) {
      button.classList.toggle("active", key === mode);
    }
  }

  update(game) {
    this.livesOut.textContent = String(Math.max(0, game.player.lives));
    this.linesOut.textContent = String(game.player.tetris.lines);
    this.levelOut.textContent = String(game.level);
    this.seedOut.textContent = String(game.seed);
    this.roomLabel.textContent = game.roomCode || "Local";
  }
}
