export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, active: false };
    this.clicks = [];

    window.addEventListener("keydown", (event) => {
      const key = normalizeKey(event);
      if ([
        "KeyA",
        "KeyD",
        "KeyS",
        "Space",
        "KeyQ",
        "KeyE",
        "ShiftLeft",
        "ShiftRight",
        "Escape",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(event.code)) {
        event.preventDefault();
      }
      if (!this.keys.has(key)) this.pressed.add(key);
      this.keys.add(key);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(normalizeKey(event));
    });

    canvas.addEventListener("mousemove", (event) => {
      this.setMouse(canvas, event);
    });

    canvas.addEventListener("click", (event) => {
      this.setMouse(canvas, event);
      this.clicks.push({ x: this.mouse.x, y: this.mouse.y });
    });
  }

  setMouse(canvas, event) {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.mouse.active = true;
  }

  consume(key) {
    const had = this.pressed.has(key);
    this.pressed.delete(key);
    return had;
  }

  endFrame() {
    this.pressed.clear();
    this.clicks = [];
  }

  snapshot() {
    return {
      keys: Array.from(this.keys),
      mouse: { ...this.mouse },
    };
  }
}

function normalizeKey(event) {
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") return "Shift";
  return event.code;
}
