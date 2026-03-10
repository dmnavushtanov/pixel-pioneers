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

    // Defenders auto-attack: target closest enemy in range
    for (const defender of defenders) {
      if (defender.currentHealth <= 0) continue;

      defender.attackCooldown -= delta / 1000;
      if (defender.attackCooldown <= 0) {
        const target = this.findClosestEnemy(defender, enemies);
        if (target) {
          defender.attackCooldown = 1 / defender.getEffectiveAttackSpeed();
          defender.playShootAnimation();
          
          // Use world coordinates since units are in containers
          const worldPos = defender.getWorldTransformMatrix();
          const wx = worldPos.tx;
          const wy = worldPos.ty;

          // Muzzle flash effect
          this.createMuzzleFlash(wx + 24, wy);

          const proj = new Projectile(
            this.scene,
            wx + 24,
            wy,
            target.x,
            target.y,
            defender.weapon,
            defender.getEffectiveDamage()
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
        // Check hit on enemies
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          const dx = p.targetX - enemy.x;
          const dy = p.targetY - enemy.y;
          // Use distance check
          if (Math.sqrt(dx * dx + dy * dy) < enemy.def.size + 10) {
            const dead = enemy.takeDamage(p.dmg);
            if (dead) killed.push(enemy);
            
            // Impact effect
            this.createImpactEffect(p.targetX, p.targetY);
            break;
          }
        }
        this.projectiles.splice(i, 1);
      }
    }

    // Enemy melee attacks: when at the defense line, attack barricade (or defenders if barricade destroyed)
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
            // Barricade down — damage a defender in the same lane (or closest)
            const targetDefender = this.findClosestDefender(enemy, defenders);
            if (targetDefender) {
              targetDefender.takeDamage(enemy.def.damage);
            }
          }
        }
      }
    }

    return killed;
  }

  private findClosestEnemy(defender: PlayerUnit, enemies: EnemyUnit[]): EnemyUnit | null {
    let closest: EnemyUnit | null = null;
    let minDist = defender.getEffectiveRange();
    
    // Convert defender world position if it's in a container
    const worldPos = defender.getWorldTransformMatrix();
    const dx_world = worldPos.tx;
    const dy_world = worldPos.ty;

    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = dx_world - e.x;
      const dy = dy_world - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  private findClosestDefender(enemy: EnemyUnit, defenders: PlayerUnit[]): PlayerUnit | null {
    let closest: PlayerUnit | null = null;
    let minDist = 99999;
    for (const d of defenders) {
      if (d.currentHealth <= 0) continue;
      const worldPos = d.getWorldTransformMatrix();
      const dx = enemy.x - worldPos.tx;
      const dy = enemy.y - worldPos.ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = d;
      }
    }
    return closest;
  }

  private createMuzzleFlash(x: number, y: number) {
    const flash = this.scene.add.circle(x, y, 10, 0xffaa00, 0.8);
    flash.setDepth(200);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.5,
      duration: 50,
      onComplete: () => flash.destroy()
    });
  }

  private createImpactEffect(x: number, y: number) {
    const impact = this.scene.add.circle(x, y, 6, 0xffffff, 0.8);
    impact.setDepth(200);
    this.scene.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 2,
      duration: 80,
      onComplete: () => impact.destroy()
    });
  }
}
