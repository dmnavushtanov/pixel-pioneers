import Phaser from 'phaser';
import type { EnemyDefinition } from '../types';
import { UnitRig } from './UnitRig';
import { UnitLoader } from '../systems/UnitLoader';

/**
 * Enemy entity with cutout rig animation.
 */
export class EnemyUnit extends Phaser.GameObjects.Container {
  public def: EnemyDefinition;
  public currentHealth: number;
  public isDead = false;
  public attackCooldown = 0;

  private rig?: UnitRig;
  private hpBar: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDefinition) {
    super(scene, x, y);
    this.def = def;
    this.currentHealth = def.health;

    this.hpBar = new Phaser.GameObjects.Rectangle(scene, 0, -52, 34, 4, 0x44cc44);
    const hpBg = new Phaser.GameObjects.Rectangle(scene, 0, -52, 34, 4, 0x330000);

    this.add([hpBg, this.hpBar]);
    scene.add.existing(this);

    this.loadRig();
  }

  private loadRig() {
    const loader = new UnitLoader(this.scene);
    const rigId = this.def.rigId ?? 'ottoman_rifleman';
    const data = loader.loadUnit(rigId);
    
    this.rig = new UnitRig(this.scene, 0, 0, data.rig, data.anims);
    this.rig.setScale(-1, 1); // Face left at full gameplay scale
    this.addAt(this.rig, 0);
    this.rig.play('move');
  }

  update(delta: number) {
    if (this.rig) {
      this.rig.update(delta);
    }
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    const ratio = this.currentHealth / this.def.health;
    this.hpBar.setScale(ratio, 1);

    if (this.rig) {
      this.scene.tweens.add({
        targets: this.rig,
        alpha: 0.4,
        duration: 60,
        yoyo: true
      });
    }

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
    
    if (dist < 5) {
      if (this.rig) this.rig.play('idle');
      return;
    }
    
    if (this.rig) this.rig.play('move');

    const step = this.def.moveSpeed * (delta / 1000);
    this.x += (dx / dist) * Math.min(step, dist);
    this.y += (dy / dist) * Math.min(step, dist);
  }

  playAttackAnimation() {
    if (this.rig) {
      this.rig.play('attack');
    }
  }

  playDeath(): Promise<void> {
    // Play death animation on rig
    if (this.rig) {
      this.rig.play('death');
    }
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        y: this.y + 20,
        duration: 600,
        onComplete: () => {
          this.destroy();
          resolve();
        },
      });
    });
  }
}
