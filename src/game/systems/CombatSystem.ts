import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { EnemyUnit } from '../entities/EnemyUnit';
import { Projectile } from '../entities/Projectile';
import { Barricade } from '../entities/Barricade';

/**
 * CombatSystem: player auto-attacks from cover, enemies assault the barricade then player.
 */
export class CombatSystem {
  private scene: Phaser.Scene;
  public projectiles: Projectile[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(player: PlayerUnit, enemies: EnemyUnit[], delta: number, barricade: Barricade): EnemyUnit[] {
    const killed: EnemyUnit[] = [];

    // Player auto-attack: target closest enemy in range
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

    // Enemy melee attacks: when at the defense line, attack barricade (or player if barricade destroyed)
    const defenseX = barricade.defenseLineX;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const atLine = enemy.x <= defenseX + enemy.def.size + 10;
      if (atLine) {
        enemy.attackCooldown -= delta / 1000;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1 / enemy.def.attackSpeed;
          enemy.playAttackAnimation();

          if (!barricade.isDestroyed) {
            barricade.takeDamage(enemy.def.damage);
          } else {
            // Barricade down — damage player directly
            player.takeDamage(enemy.def.damage);
          }
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
