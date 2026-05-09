export function makeSeed() {
  return Math.floor(Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}

export class RNG {
  constructor(seed) {
    this.seed = seed >>> 0;
  }

  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(max) {
    return Math.floor(this.next() * max);
  }

  choice(list) {
    return list[this.int(list.length)];
  }
}
