import Phaser from 'phaser';
import type { EnemyDefinition } from '../types';

/**
 * Enemy entity with health bar, movement toward defense line, attack animation, and death.
 */
export class EnemyUnit extends Phaser.GameObjects.Container {
  public def: EnemyDefinition;
  public currentHealth: number;
  public isDead = false;
  public attackCooldown = 0;

  private body_gfx: Phaser.GameObjects.Arc;
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private weaponGfx: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDefinition) {
    super(scene, x, y);
    this.def = def;
    this.currentHealth = def.health;

    // Body
    this.body_gfx = new Phaser.GameObjects.Arc(scene, 0, 0, def.size, 0, 360, false, def.color);

    // Weapon stub (facing left toward barricade)
    this.weaponGfx = new Phaser.GameObjects.Rectangle(scene, -def.size - 4, 0, 8, 3, 0x888888);

    // HP bar
    this.hpBarBg = new Phaser.GameObjects.Rectangle(scene, 0, -(def.size + 8), def.size * 2, 4, 0x333333);
    this.hpBar = new Phaser.GameObjects.Rectangle(scene, 0, -(def.size + 8), def.size * 2, 4, 0x44cc44);

    this.add([this.body_gfx, this.weaponGfx, this.hpBarBg, this.hpBar]);
    this.setSize(def.size * 2, def.size * 2);
    scene.add.existing(this);
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    const ratio = this.currentHealth / this.def.health;
    this.hpBar.setScale(ratio, 1);
    this.hpBar.setX(-(this.def.size * (1 - ratio)));

    // Flash white
    this.body_gfx.setFillStyle(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.isDead) this.body_gfx.setFillStyle(this.def.color);
    });

    if (this.currentHealth <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  moveToward(targetX: number, targetY: number, delta: number) {
    if (this.isDead) return;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;
    const step = this.def.moveSpeed * (delta / 1000);
    this.x += (dx / dist) * Math.min(step, dist);
    this.y += (dy / dist) * Math.min(step, dist);
  }

  /** Visual melee attack animation */
  playAttackAnimation() {
    this.scene.tweens.add({
      targets: this.weaponGfx,
      x: -this.def.size - 12,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  playDeath(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        onComplete: () => {
          this.destroy();
          resolve();
        },
      });
    });
  }
}
