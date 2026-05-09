export function createRoomCode(rng) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(rng.next() * alphabet.length)];
  return code;
}

export class RoomChannel {
  constructor(code, role, onMessage) {
    this.code = code;
    this.role = role;
    this.queue = [];
    this.ws = null;
    this.channel = null;
    this.onMessage = onMessage;
    this.connectWebSocket();
    if (!this.ws && "BroadcastChannel" in window) {
      this.activateLocalFallback();
    }
  }

  send(type, payload) {
    const message = { role: this.role, type, payload, time: performance.now() };
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
      else this.queue.push(message);
      return;
    }
    if (this.channel) this.channel.postMessage(message);
  }

  close() {
    if (this.ws) this.ws.close();
    if (this.channel) this.channel.close();
  }

  connectWebSocket() {
    if (!("WebSocket" in window)) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws/block-x-flight?code=${encodeURIComponent(this.code)}&role=${encodeURIComponent(this.role)}`;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.ws = null;
      return;
    }
    this.ws.onopen = () => {
      while (this.queue.length) this.ws.send(JSON.stringify(this.queue.shift()));
    };
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.role !== this.role) this.onMessage(message);
      } catch {
        // Ignore malformed relay messages.
      }
    };
    this.ws.onerror = () => {
      this.activateLocalFallback();
    };
    this.ws.onclose = () => {
      if (!this.channel) this.activateLocalFallback();
    };
  }

  activateLocalFallback() {
    if (!("BroadcastChannel" in window) || this.channel) return;
    this.ws = null;
    this.channel = new BroadcastChannel(`block-x-flight-${this.code}`);
    this.channel.onmessage = (event) => {
      if (event.data?.role !== this.role) this.onMessage(event.data);
    };
    while (this.queue.length) this.channel.postMessage(this.queue.shift());
  }
}
