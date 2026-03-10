import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { EnemyUnit } from '../entities/EnemyUnit';
import { Projectile } from '../entities/Projectile';

/**
 * CombatSystem: handles auto-attack targeting, projectile spawning, and damage.
 */
export class CombatSystem {
  private scene: Phaser.Scene;
  public projectiles: Projectile[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(player: PlayerUnit, enemies: EnemyUnit[], delta: number): EnemyUnit[] {
    const killed: EnemyUnit[] = [];

    // Player auto-attack
    player.attackCooldown -= delta / 1000;
    if (player.attackCooldown <= 0) {
      const target = this.findClosestEnemy(player, enemies);
      if (target) {
        player.attackCooldown = 1 / player.getEffectiveAttackSpeed();
        player.playShootAnimation();
        const proj = new Projectile(
          this.scene,
          player.x + 18,
          player.y,
          target.x,
          target.y,
          player.weapon,
          player.getEffectiveDamage()
        );
        this.projectiles.push(proj);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(0, delta);
      if (!p.alive) {
        // Check hit on enemies
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          const dx = p.targetX - enemy.x;
          const dy = p.targetY - enemy.y;
          if (Math.sqrt(dx * dx + dy * dy) < enemy.def.size + 5) {
            const dead = enemy.takeDamage(p.dmg);
            if (dead) killed.push(enemy);
            break;
          }
        }
        this.projectiles.splice(i, 1);
      }
    }

    // Enemy attacks on player
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < enemy.def.size + 20) {
        enemy.attackCooldown -= delta / 1000;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1 / enemy.def.attackSpeed;
          player.takeDamage(enemy.def.damage);
        }
      }
    }

    return killed;
  }

  private findClosestEnemy(player: PlayerUnit, enemies: EnemyUnit[]): EnemyUnit | null {
    let closest: EnemyUnit | null = null;
    let minDist = player.getEffectiveRange();
    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }
}
