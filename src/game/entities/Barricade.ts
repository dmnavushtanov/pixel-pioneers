import Phaser from 'phaser';

/**
 * Barricade: defensive structure that absorbs damage before enemies reach the player.
 * Rendered as a layered wall with HP bar.
 */
export class Barricade extends Phaser.GameObjects.Container {
  public maxHealth: number;
  public currentHealth: number;
  public isDestroyed = false;

  /** X position of the defense line — enemies stop here */
  public defenseLineX: number;

  private wallSegments: Phaser.GameObjects.Rectangle[] = [];
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private cracksOverlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, yTop: number, yBottom: number, health = 500) {
    super(scene, 0, 0);
    this.maxHealth = health;
    this.currentHealth = health;
    this.defenseLineX = x;

    const wallHeight = yBottom - yTop;
    const segmentCount = 6;
    const segH = wallHeight / segmentCount;
    const wallWidth = 18;

    // Main wall segments
    for (let i = 0; i < segmentCount; i++) {
      const segY = yTop + i * segH + segH / 2;
      // Back layer (darker)
      const back = new Phaser.GameObjects.Rectangle(scene, x - 4, segY, wallWidth + 6, segH - 2, 0x3a3a2a);
      this.add(back);
      // Front layer
      const seg = new Phaser.GameObjects.Rectangle(scene, x, segY, wallWidth, segH - 3, 0x7a6a4a);
      this.wallSegments.push(seg);
      this.add(seg);
    }

    // Sandbags at base
    for (let i = 0; i < 3; i++) {
      const bagY = yBottom - 8 - i * 12;
      const bag = new Phaser.GameObjects.Arc(scene, x + 12, bagY, 10, 0, 360, false, 0x8b7d5b);
      bag.setScale(1.3, 0.7);
      this.add(bag);
    }

    // Cracks overlay (invisible until damaged)
    this.cracksOverlay = new Phaser.GameObjects.Rectangle(
      scene, x, yTop + wallHeight / 2, wallWidth + 2, wallHeight, 0xff4444, 0
    );
    this.add(this.cracksOverlay);

    // HP bar
    const barWidth = 80;
    const barX = x;
    const barY = yTop - 16;
    this.hpBarBg = new Phaser.GameObjects.Rectangle(scene, barX, barY, barWidth, 6, 0x332222);
    this.hpBar = new Phaser.GameObjects.Rectangle(scene, barX, barY, barWidth, 6, 0x55aa55);
    this.add([this.hpBarBg, this.hpBar]);

    scene.add.existing(this);
  }

  takeDamage(amount: number): boolean {
    if (this.isDestroyed) return true;
    this.currentHealth = Math.max(0, this.currentHealth - amount);

    const ratio = this.currentHealth / this.maxHealth;
    this.hpBar.setScale(ratio, 1);
    this.hpBar.setX(this.defenseLineX - (80 * (1 - ratio)) / 2);

    // Visual damage feedback
    this.cracksOverlay.setAlpha((1 - ratio) * 0.4);

    // Color shift on wall segments
    const r = Math.floor(0x7a + (0xff - 0x7a) * (1 - ratio));
    const g = Math.floor(0x6a * ratio);
    const b = Math.floor(0x4a * ratio);
    const color = (r << 16) | (g << 8) | b;
    for (const seg of this.wallSegments) {
      seg.setFillStyle(color);
    }

    // Shake on hit
    this.scene.tweens.add({
      targets: this.wallSegments,
      x: { from: -2, to: 2 },
      duration: 50,
      yoyo: true,
      repeat: 1,
    });

    if (this.currentHealth <= 0) {
      this.isDestroyed = true;
      return true;
    }
    return false;
  }

  getHealthRatio(): number {
    return this.currentHealth / this.maxHealth;
  }
}
