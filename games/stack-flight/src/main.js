import { StackFlightGame } from "./game_loop.js";
import { Input } from "./input.js";
import { UI } from "./ui.js";
import { makeSeed } from "./utils/rng.js";

if (new URLSearchParams(window.location.search).get("embed") === "1") {
  document.body.classList.add("embed");
}

const canvas = document.querySelector("#game");
const input = new Input(canvas);
const ui = new UI();
const game = new StackFlightGame(canvas, input, ui);

document.querySelector("#singleBtn").addEventListener("click", () => game.selectMode("single"));
document.querySelector("#aiBtn").addEventListener("click", () => game.selectMode("ai"));
document.querySelector("#hostBtn").addEventListener("click", () => game.selectMode("host"));
document.querySelector("#joinBtn").addEventListener("click", () => {
  const code = document.querySelector("#inviteInput").value.trim().toUpperCase() || "LOCAL1";
  game.selectMode("join", makeSeed(), code);
});
document.querySelector("#copyJoinBtn").addEventListener("click", () => {
  const code = document.querySelector("#inviteInput").value.trim().toUpperCase();
  if (code) game.selectMode("join", makeSeed(), code);
});
document.querySelector("#restartBtn").addEventListener("click", () => game.selectMode(game.mode));
document.querySelector("#pauseBtn").addEventListener("click", () => game.togglePause());

game.start();
