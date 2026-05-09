export function attackFromLines(lines, level) {
  if (lines <= 0) return null;
  return {
    hp: Math.ceil((1 + lines * 1.5) * (1 + level * 0.12)),
    speed: 74 + lines * 18 + level * 5,
    width: 72 + lines * 34,
    damage: 1,
    strength: lines,
  };
}
