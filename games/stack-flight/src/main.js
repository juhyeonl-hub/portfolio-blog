import { StackFlightGame } from "./game_loop.js";
import { Input } from "./input.js";
import { UI } from "./ui.js";
import { makeSeed } from "./utils/rng.js";

const canvas = document.querySelector("#game");
const input = new Input(canvas);
const ui = new UI();
const game = new StackFlightGame(canvas, input, ui);

document.querySelector("#prototypeBtn").addEventListener("click", () => game.restart("prototype"));
document.querySelector("#aiBtn").addEventListener("click", () => game.restart("ai"));
document.querySelector("#hostBtn").addEventListener("click", () => game.restart("host"));
document.querySelector("#joinBtn").addEventListener("click", () => {
  const code = document.querySelector("#inviteInput").value.trim().toUpperCase() || "LOCAL1";
  game.restart("join", makeSeed(), code);
});
document.querySelector("#copyJoinBtn").addEventListener("click", () => {
  const code = document.querySelector("#inviteInput").value.trim().toUpperCase();
  if (code) game.restart("join", makeSeed(), code);
});
document.querySelector("#restartBtn").addEventListener("click", () => game.restart(game.mode));
document.querySelector("#pauseBtn").addEventListener("click", () => game.togglePause());

game.start();
