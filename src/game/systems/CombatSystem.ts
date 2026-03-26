import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { EnemyUnit } from '../entities/EnemyUnit';
import { Projectile } from '../entities/Projectile';
import { Barricade } from '../entities/Barricade';
import type { WeaponVisualGroup } from '../types/WeaponDefinition';

/**
 * CombatSystem: multiple defenders auto-attack from cover,
 * enemies assault the barricade then defenders.
 * Shooting feedback uses muzzle flash + smoke + hit effects instead of visible projectiles.
 */
export class CombatSystem {
  private scene: Phaser.Scene;
  public projectiles: Projectile[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(defenders: PlayerUnit[], enemies: EnemyUnit[], delta: number, barricade: Barricade): EnemyUnit[] {
    const killed: EnemyUnit[] = [];

    // Defenders auto-attack
    for (const defender of defenders) {
      if (defender.currentHealth <= 0) continue;
      if (defender.isReloading) continue;

      defender.attackCooldown -= delta / 1000;
      if (defender.attackCooldown <= 0) {
        const target = this.findClosestEnemy(defender, enemies);
        if (target) {
          defender.attackCooldown = defender.weapon.fireRate;
          defender.playShootAnimation();

          const muzzle = defender.getMuzzlePosition();
          
          // Weapon-appropriate visual feedback
          this.createShotFeedback(muzzle.x, muzzle.y, target.x, target.y, defender.weapon.visualGroup, defender.weapon.smokeLevel, defender.weapon.recoilAmount);

          // Apply accuracy spread
          const spread = (1 - defender.weapon.accuracy) * 30;
          const spreadX = target.x + (Math.random() - 0.5) * spread;
          const spreadY = target.y + (Math.random() - 0.5) * spread;

          // Create nearly invisible projectile (just for hit detection)
          const proj = new Projectile(
            this.scene,
            muzzle.x,
            muzzle.y,
            spreadX,
            spreadY,
            defender.weapon.projectileSpeed,
            defender.getEffectiveDamage(),
            1,         // tiny size
            0xffdd44,
            0.15,      // nearly invisible
          );
          this.projectiles.push(proj);

          // Start reload after every shot — duration depends on weapon type
          defender.startReload(defender.weapon.reloadTime);
        }
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(0, delta);
      if (!p.alive) {
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          const dx = p.targetX - enemy.x;
          const dy = p.targetY - enemy.y;
          if (Math.sqrt(dx * dx + dy * dy) < enemy.def.size + 10) {
            const dead = enemy.takeDamage(p.dmg);
            if (dead) killed.push(enemy);
            this.createHitEffect(p.targetX, p.targetY);
            break;
          }
        }
        this.projectiles.splice(i, 1);
      }
    }

    // Enemy melee attacks
    const defenseX = barricade.defenseLineX;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const atLine = enemy.x <= defenseX + enemy.def.size + 15;
      if (atLine) {
        enemy.attackCooldown -= delta / 1000;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1 / enemy.def.attackSpeed;
          enemy.playAttackAnimation();
          if (!barricade.isDestroyed) {
            barricade.takeDamage(enemy.def.damage);
          } else {
            const targetDefender = this.findClosestDefender(enemy, defenders);
            if (targetDefender) targetDefender.takeDamage(enemy.def.damage);
          }
        }
      }
    }

    return killed;
  }

  /** Create weapon-appropriate shooting feedback */
  private createShotFeedback(
    mx: number, my: number,
    tx: number, ty: number,
    visualGroup: WeaponVisualGroup,
    smokeLevel: number,
    recoilAmount: number
  ) {
    // Muzzle flash — all weapons
    this.createMuzzleFlash(mx, my, visualGroup);

    // Smoke — scaled by weapon type
    if (smokeLevel > 0.2) {
      this.createGunSmoke(mx, my, smokeLevel, visualGroup);
    }

    // Delayed hit spark at target area
    const dist = Math.sqrt((tx - mx) ** 2 + (ty - my) ** 2);
    const delay = Math.max(30, dist / 8);
    this.scene.time.delayedCall(delay, () => {
      this.createHitSpark(tx + (Math.random() - 0.5) * 10, ty + (Math.random() - 0.5) * 10);
    });
  }

  private createMuzzleFlash(x: number, y: number, visualGroup: WeaponVisualGroup) {
    const isBlackPowder = visualGroup === 'muzzle_loading';
    const flashSize = isBlackPowder ? 10 : 6;
    const flashColor = isBlackPowder ? 0xff8800 : 0xffcc44;
    const duration = isBlackPowder ? 100 : 50;

    // Main flash
    const flash = this.scene.add.circle(x, y, flashSize, flashColor, 0.9).setDepth(200);
    this.scene.tweens.add({
      targets: flash, alpha: 0, scale: 1.8, duration,
      onComplete: () => flash.destroy(),
    });

    // Secondary bright core
    const core = this.scene.add.circle(x, y, flashSize * 0.4, 0xffffff, 1).setDepth(201);
    this.scene.tweens.add({
      targets: core, alpha: 0, scale: 2, duration: duration * 0.6,
      onComplete: () => core.destroy(),
    });
  }

  private createGunSmoke(x: number, y: number, smokeLevel: number, visualGroup: WeaponVisualGroup) {
    const count = visualGroup === 'muzzle_loading' ? 5 : 2;
    const spreadRange = visualGroup === 'muzzle_loading' ? 20 : 10;
    
    for (let i = 0; i < count; i++) {
      const sx = x + (Math.random() - 0.3) * spreadRange;
      const sy = y + (Math.random() - 0.5) * 8;
      const size = (3 + Math.random() * 5) * smokeLevel;
      const smokeAlpha = (0.3 + Math.random() * 0.3) * smokeLevel;
      
      const smoke = this.scene.add.circle(sx, sy, size, 0xaaaaaa, smokeAlpha).setDepth(199);
      this.scene.tweens.add({
        targets: smoke,
        alpha: 0,
        scale: 2 + Math.random(),
        x: sx + 10 + Math.random() * 15,
        y: sy - 5 - Math.random() * 10,
        duration: 400 + Math.random() * 300,
        onComplete: () => smoke.destroy(),
      });
    }
  }

  private createHitSpark(x: number, y: number) {
    // Dust/dirt hit effect
    const spark = this.scene.add.circle(x, y, 3, 0xddcc88, 0.7).setDepth(200);
    this.scene.tweens.add({
      targets: spark, alpha: 0, scale: 2.5, duration: 120,
      onComplete: () => spark.destroy(),
    });

    // Small dust particles
    for (let i = 0; i < 3; i++) {
      const px = x + (Math.random() - 0.5) * 10;
      const py = y + (Math.random() - 0.5) * 8;
      const dust = this.scene.add.circle(px, py, 1.5, 0x998866, 0.5).setDepth(199);
      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        x: px + (Math.random() - 0.5) * 12,
        y: py - 3 - Math.random() * 6,
        duration: 200 + Math.random() * 150,
        onComplete: () => dust.destroy(),
      });
    }
  }

  private createHitEffect(x: number, y: number) {
    // Blood/impact flash on enemy hit
    const impact = this.scene.add.circle(x, y, 4, 0xcc4444, 0.6).setDepth(200);
    this.scene.tweens.add({
      targets: impact, alpha: 0, scale: 2, duration: 100,
      onComplete: () => impact.destroy(),
    });
  }

  private findClosestEnemy(defender: PlayerUnit, enemies: EnemyUnit[]): EnemyUnit | null {
    let closest: EnemyUnit | null = null;
    let minDist = defender.getEffectiveRange();
    const worldPos = defender.getWorldTransformMatrix();

    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = worldPos.tx - e.x;
      const dy = worldPos.ty - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) { minDist = d; closest = e; }
    }
    return closest;
  }

  private findClosestDefender(enemy: EnemyUnit, defenders: PlayerUnit[]): PlayerUnit | null {
    let closest: PlayerUnit | null = null;
    let minDist = 99999;
    for (const d of defenders) {
      if (d.currentHealth <= 0) continue;
      const wp = d.getWorldTransformMatrix();
      const dx = enemy.x - wp.tx;
      const dy = enemy.y - wp.ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; closest = d; }
    }
    return closest;
  }
}
