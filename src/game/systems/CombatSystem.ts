import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { EnemyUnit } from '../entities/EnemyUnit';
import { Projectile } from '../entities/Projectile';
import { Barricade } from '../entities/Barricade';

/**
 * CombatSystem: multiple defenders auto-attack from cover,
 * enemies assault the barricade then defenders.
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

      defender.attackCooldown -= delta / 1000;
      if (defender.attackCooldown <= 0) {
        const target = this.findClosestEnemy(defender, enemies);
        if (target) {
          defender.attackCooldown = defender.weapon.fireRate;
          defender.playShootAnimation();

          const muzzle = defender.getMuzzlePosition();
          this.createMuzzleFlash(muzzle.x, muzzle.y);

          // Apply accuracy spread
          const spread = (1 - defender.weapon.accuracy) * 30;
          const spreadX = target.x + (Math.random() - 0.5) * spread;
          const spreadY = target.y + (Math.random() - 0.5) * spread;

          const proj = new Projectile(
            this.scene,
            muzzle.x,
            muzzle.y,
            spreadX,
            spreadY,
            defender.weapon.projectileSpeed,
            defender.getEffectiveDamage(),
            3,
            0xffdd44,
          );
          this.projectiles.push(proj);
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
            this.createImpactEffect(p.targetX, p.targetY);
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

  private createMuzzleFlash(x: number, y: number) {
    const flash = this.scene.add.circle(x, y, 6, 0xffaa00, 0.8).setDepth(200);
    this.scene.tweens.add({
      targets: flash, alpha: 0, scale: 1.5, duration: 50,
      onComplete: () => flash.destroy(),
    });
  }

  private createImpactEffect(x: number, y: number) {
    const impact = this.scene.add.circle(x, y, 4, 0xffffff, 0.8).setDepth(200);
    this.scene.tweens.add({
      targets: impact, alpha: 0, scale: 2, duration: 80,
      onComplete: () => impact.destroy(),
    });
  }
}
