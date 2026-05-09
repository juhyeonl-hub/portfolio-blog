export const ITEM_TYPES = ["damage", "rate", "pierce", "shield", "debuff"];

export function maybeCreateItem(rng, level) {
  const chance = Math.min(0.08 + level * 0.01, 0.18);
  if (rng.next() > chance) return null;
  return rng.choice(ITEM_TYPES);
}

export function applyItem(player, itemType, opponent) {
  if (!itemType) return;
  if (itemType === "damage") player.shooter.addUpgrade("damage", 10);
  if (itemType === "rate") player.shooter.addUpgrade("rate", 10);
  if (itemType === "pierce") player.shooter.addUpgrade("pierce", 8);
  if (itemType === "shield") player.shieldTime = Math.max(player.shieldTime, 6);
  if (itemType === "debuff" && opponent) opponent.addDebuff();
}
