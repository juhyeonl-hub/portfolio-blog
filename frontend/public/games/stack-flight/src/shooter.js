export class ShooterField {
  constructor(rect) {
    this.rect = rect;
    this.player = { x: rect.x + rect.w / 2, y: rect.y + rect.h - 54, r: 12 };
    this.shots = [];
    this.attacks = [];
    this.fireTimer = 0;
    this.hitFlash = 0;
    this.upgrades = {
      damage: 0,
      rate: 0,
      pierce: 0,
    };
  }

  addUpgrade(type, seconds) {
    this.upgrades[type] = Math.max(this.upgrades[type] || 0, seconds);
  }

  update(dt, input, player, game) {
    for (const key of Object.keys(this.upgrades)) this.upgrades[key] = Math.max(0, this.upgrades[key] - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.movePlayer(input);
    this.fireTimer -= dt;
    const fireDelay = this.upgrades.rate > 0 ? 0.115 : 0.19;
    if (this.fireTimer <= 0) {
      this.fireTimer = fireDelay;
      this.fire();
      game.audio.play("shot");
    }
    this.updateShots(dt);
    this.updateAttacks(dt, player, game);
  }

  movePlayer(input) {
    if (!input.mouse.active) return;
    const { x, y, w, h } = this.rect;
    this.player.x = clamp(input.mouse.x, x + this.player.r, x + w - this.player.r);
    this.player.y = clamp(input.mouse.y, y + this.player.r, y + h - this.player.r);
  }

  fire() {
    const spread = this.upgrades.damage > 0 ? 8 : 0;
    const shots = spread ? [-spread, spread] : [0];
    for (const offset of shots) {
      this.shots.push({
        x: this.player.x + offset,
        y: this.player.y - 14,
        vy: -520,
        r: 4,
        damage: this.upgrades.damage > 0 ? 2 : 1,
        pierce: this.upgrades.pierce > 0 ? 2 : 0,
      });
    }
  }

  updateShots(dt) {
    for (const shot of this.shots) shot.y += shot.vy * dt;
    this.shots = this.shots.filter((shot) => shot.y > this.rect.y - 12);
  }

  updateAttacks(dt, player, game) {
    for (const attack of this.attacks) {
      attack.y += attack.speed * dt;
      attack.flash = Math.max(0, attack.flash - dt);
      for (const shot of this.shots) {
        if (shot.dead) continue;
        if (shot.x >= attack.x && shot.x <= attack.x + attack.w && Math.abs(shot.y - attack.y) < attack.h / 2 + shot.r) {
          attack.hp -= shot.damage;
          attack.flash = 0.08;
          if (shot.pierce > 0) shot.pierce -= 1;
          else shot.dead = true;
        }
      }
      const playerHit =
        circleRect(this.player.x, this.player.y, this.player.r, attack.x, attack.y - attack.h / 2, attack.w, attack.h);
      if (playerHit && !attack.hit) {
        attack.hit = true;
        this.hitFlash = 0.22;
        player.takeLife(game);
      }
    }
    this.shots = this.shots.filter((shot) => !shot.dead);
    this.attacks = this.attacks.filter((attack) => attack.hp > 0 && attack.y < this.rect.y + this.rect.h + 40 && !attack.hit);
  }

  spawnAttack(spec, rng) {
    const w = Math.min(spec.width, this.rect.w - 20);
    this.attacks.push({
      x: this.rect.x + 10 + rng.next() * (this.rect.w - w - 20),
      y: this.rect.y - 10,
      w,
      h: 14 + spec.strength * 2,
      hp: spec.hp,
      maxHp: spec.hp,
      speed: spec.speed,
      strength: spec.strength,
      flash: 0,
      hit: false,
    });
  }

  draw(ctx, player) {
    const { x, y, w, h } = this.rect;
    ctx.fillStyle = "#0b1114";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#2d3b42";
    ctx.strokeRect(x, y, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let gy = y + 40; gy < y + h; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }

    for (const shot of this.shots) {
      ctx.fillStyle = shot.pierce > 0 ? "#f6ff77" : "#7dfad0";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const attack of this.attacks) {
      const hpRatio = Math.max(0, attack.hp / attack.maxHp);
      ctx.fillStyle = attack.flash > 0 ? "#fff2a8" : strengthColor(attack.strength);
      ctx.fillRect(attack.x, attack.y - attack.h / 2, attack.w, attack.h);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(attack.x, attack.y - attack.h / 2, attack.w * (1 - hpRatio), attack.h);
    }

    if (player.shieldTime > 0) {
      ctx.strokeStyle = "#7dfad0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : "#ffcf5c";
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#11181c";
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y - 17);
    ctx.lineTo(this.player.x - 7, this.player.y - 3);
    ctx.lineTo(this.player.x + 7, this.player.y - 3);
    ctx.fill();
  }
}

function strengthColor(strength) {
  if (strength >= 4) return "#ff4b60";
  if (strength === 3) return "#ff8d43";
  if (strength === 2) return "#e3cd4f";
  return "#63a7ff";
}

function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
