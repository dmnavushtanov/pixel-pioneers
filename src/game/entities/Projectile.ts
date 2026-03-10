import Phaser from 'phaser';
import type { WeaponDefinition } from '../types';
import { WEAPONS } from '../data/weapons';

/**
 * Projectile entity: flies toward a target position, deals damage on hit.
 */
export class Projectile extends Phaser.GameObjects.Arc {
  public speed: number;
  public dmg: number;
  public targetX: number;
  public targetY: number;
  public alive = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    weaponDef: WeaponDefinition,
    damage: number
  ) {
    super(scene, x, y, weaponDef.projectile.size, 0, 360, false, weaponDef.projectile.color);
    this.speed = weaponDef.projectile.speed;
    this.dmg = damage;
    this.targetX = targetX;
    this.targetY = targetY;
    scene.add.existing(this);
  }

  update(_time: number, delta: number) {
    if (!this.alive) return;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * (delta / 1000);

    if (dist <= step) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.alive = false;
      this.destroy();
      return;
    }

    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }
}

export default Projectile;
