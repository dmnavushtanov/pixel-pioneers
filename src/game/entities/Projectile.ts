import Phaser from 'phaser';

/**
 * Projectile entity: flies toward a target position, deals damage on hit.
 * Now decoupled from weapon type — receives speed/size/color directly.
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
    projectileSpeed: number,
    damage: number,
    size = 3,
    color = 0xffdd44,
  ) {
    super(scene, x, y, size, 0, 360, false, color);
    this.speed = projectileSpeed;
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
