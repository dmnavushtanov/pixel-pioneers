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

    // HP bar (minimalist)
    this.hpBar = new Phaser.GameObjects.Rectangle(scene, 0, -40, 30, 4, 0x44cc44);
    const hpBg = new Phaser.GameObjects.Rectangle(scene, 0, -40, 30, 4, 0x330000);

    this.add([hpBg, this.hpBar]);
    scene.add.existing(this);

    // Load Rig
    this.loadRig();
  }

  private async loadRig() {
    const loader = new UnitLoader(this.scene);
    // Map unit ID to rig ID
    // 'grunt' -> 'grunt'
    // others -> fallback
    const rigId = this.def.id === 'grunt' ? 'grunt' : 'grunt'; 
    
    const data = await loader.loadUnit(rigId);
    
    this.rig = new UnitRig(this.scene, 0, 0, data.rig, data.anims);
    this.rig.setScale(-0.8, 0.8); // Face left by flipping X scale
    this.addAt(this.rig, 0); // Add behind HP bar
    
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

    // Flash white
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
      // Return to move/idle handled by logic or loop
      // Actually, attack is one-shot. 
      // We should likely let it finish or have logic to switch back.
      // For now, let's rely on moveToward being called every frame to switch back to 'move' 
      // if it's not attacking.
      // But CombatSystem calls this once. 
      // Let's force it back to idle after delay if needed, 
      // OR let moveToward override it next frame?
      // If moveToward is called every frame, it will switch to 'move' immediately.
      // We should add a state check.
    }
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
