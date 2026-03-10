import Phaser from 'phaser';
import type { EnemyDefinition } from '../types';

/**
 * Enemy entity with silhouette and lane-based movement.
 */
export class EnemyUnit extends Phaser.GameObjects.Container {
  public def: EnemyDefinition;
  public currentHealth: number;
  public isDead = false;
  public attackCooldown = 0;

  private bodyGfx: Phaser.GameObjects.Container;
  private hpBar: Phaser.GameObjects.Rectangle;
  private weaponGfx: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDefinition) {
    super(scene, x, y);
    this.def = def;
    this.currentHealth = def.health;

    // Body Silhouette
    this.bodyGfx = new Phaser.GameObjects.Container(scene, 0, 0);
    
    // Head
    const head = new Phaser.GameObjects.Arc(scene, 0, -def.size * 0.8, def.size * 0.6, 0, 360, false, 0x1a1a1a);
    // Torso
    const torso = new Phaser.GameObjects.Rectangle(scene, 0, 0, def.size * 1.2, def.size * 1.5, 0x1a1a1a);
    // Legs
    const legL = new Phaser.GameObjects.Rectangle(scene, -def.size * 0.4, def.size * 0.8, def.size * 0.5, def.size * 0.8, 0x1a1a1a);
    const legR = new Phaser.GameObjects.Rectangle(scene, def.size * 0.4, def.size * 0.8, def.size * 0.5, def.size * 0.8, 0x1a1a1a);
    
    // Colored accent
    const accent = new Phaser.GameObjects.Rectangle(scene, 0, -def.size * 0.2, def.size, def.size * 0.3, def.color);

    this.bodyGfx.add([legL, legR, torso, head, accent]);

    // Weapon stub (facing left)
    this.weaponGfx = new Phaser.GameObjects.Rectangle(scene, -def.size - 4, 0, 10, 4, 0x444444).setOrigin(1, 0.5);

    // HP bar (minimalist)
    this.hpBar = new Phaser.GameObjects.Rectangle(scene, 0, -(def.size + 15), def.size * 1.5, 3, 0x44cc44);
    const hpBg = new Phaser.GameObjects.Rectangle(scene, 0, -(def.size + 15), def.size * 1.5, 3, 0x330000);

    this.add([hpBg, this.hpBar, this.bodyGfx, this.weaponGfx]);
    scene.add.existing(this);
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    const ratio = this.currentHealth / this.def.health;
    this.hpBar.setScale(ratio, 1);

    // Flash white
    this.scene.tweens.add({
      targets: this.bodyGfx,
      alpha: 0.4,
      duration: 60,
      yoyo: true
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
    
    // Add "bobbing" animation while walking
    this.bodyGfx.y = Math.sin(this.scene.time.now / 100) * 2;
  }

  playAttackAnimation() {
    this.scene.tweens.add({
      targets: this.weaponGfx,
      x: -this.def.size - 16,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  playDeath(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        y: this.y + 20,
        angle: 45,
        duration: 400,
        onComplete: () => {
          this.destroy();
          resolve();
        },
      });
    });
  }
}
