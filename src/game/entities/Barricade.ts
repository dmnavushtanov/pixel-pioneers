import Phaser from 'phaser';

/**
 * DefenseLine: Visual and structural barrier representing the defended perimeter.
 * Supports repair, reinforcement, and damage state visuals.
 */
export class Barricade extends Phaser.GameObjects.Container {
  public maxHealth: number;
  public currentHealth: number;
  public isDestroyed = false;
  public defenseLineX: number;

  private hpBar: Phaser.GameObjects.Rectangle;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private wallVisuals: Phaser.GameObjects.Container;
  private wallRect: Phaser.GameObjects.Rectangle;
  private damageOverlay: Phaser.GameObjects.Rectangle;
  private crackLines: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, yTop: number, yBottom: number, health = 500) {
    super(scene, 0, 0);
    this.maxHealth = health;
    this.currentHealth = health;
    this.defenseLineX = x;

    this.wallVisuals = new Phaser.GameObjects.Container(scene, x, 0);
    this.add(this.wallVisuals);

    const wallHeight = yBottom - yTop;
    const centerY = (yTop + yBottom) / 2;

    // Background wall
    this.wallRect = new Phaser.GameObjects.Rectangle(scene, 0, centerY, 16, wallHeight, 0x4a4a44);
    this.wallRect.setStrokeStyle(2, 0x2a2a24);
    this.wallVisuals.add(this.wallRect);

    // Damage overlay (red tint, starts invisible)
    this.damageOverlay = new Phaser.GameObjects.Rectangle(scene, 0, centerY, 18, wallHeight, 0xff0000, 0);
    this.wallVisuals.add(this.damageOverlay);

    // Crack lines graphics
    this.crackLines = new Phaser.GameObjects.Graphics(scene);
    this.wallVisuals.add(this.crackLines);

    // Props along the line
    const propCount = 8;
    for (let i = 0; i < propCount; i++) {
      const py = yTop + (i / (propCount - 1)) * wallHeight;
      const px = (Math.random() - 0.5) * 10;
      const propType = Math.random();
      if (propType > 0.6) {
        const bag = new Phaser.GameObjects.Arc(scene, px + 8, py, 10, 0, 360, false, 0x8b7d5b);
        bag.setScale(1.4, 0.7);
        bag.setAngle(Math.random() * 20 - 10);
        this.wallVisuals.add(bag);
      } else if (propType > 0.3) {
        const crate = new Phaser.GameObjects.Rectangle(scene, px + 6, py, 20, 20, 0x5d4037);
        crate.setStrokeStyle(1, 0x3e2723);
        crate.setAngle(Math.random() * 15 - 7.5);
        this.wallVisuals.add(crate);
      } else {
        const metal = new Phaser.GameObjects.Rectangle(scene, px + 10, py, 12, 12, 0x455a64);
        metal.setAngle(45);
        this.wallVisuals.add(metal);
      }
    }

    // HP bar
    const barWidth = 120;
    const barY = yTop - 25;
    this.hpBarBg = new Phaser.GameObjects.Rectangle(scene, x, barY, barWidth, 10, 0x331111);
    this.hpBar = new Phaser.GameObjects.Rectangle(scene, x, barY, barWidth, 10, 0x44cc44);
    this.add([this.hpBarBg, this.hpBar]);

    const label = new Phaser.GameObjects.Text(scene, x, barY - 14, 'DEFENSE INTEGRITY', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(label);

    scene.add.existing(this);
    this.setDepth(100);
  }

  takeDamage(amount: number): boolean {
    if (this.isDestroyed) return true;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateVisuals();

    // Shake
    this.scene.tweens.add({
      targets: this.wallVisuals,
      x: this.defenseLineX + (Math.random() * 4 - 2),
      duration: 50,
      yoyo: true,
      onComplete: () => { this.wallVisuals.setX(this.defenseLineX); }
    });

    if (this.currentHealth <= 0) {
      this.isDestroyed = true;
      this.hpBar.setFillStyle(0xcc3333);
      return true;
    }
    return false;
  }

  repair(amount: number) {
    if (this.isDestroyed) return;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.updateVisuals();

    // Green flash
    this.scene.tweens.add({
      targets: this.damageOverlay,
      fillColor: 0x00ff00,
      fillAlpha: 0.3,
      duration: 200,
      yoyo: true,
      onComplete: () => { this.updateVisuals(); }
    });
  }

  reinforce(amount: number) {
    this.maxHealth += amount;
    this.currentHealth += amount;
    this.updateVisuals();

    // Blue flash
    const flash = this.scene.add.rectangle(this.defenseLineX, this.scene.scale.height / 2, 20, this.scene.scale.height, 0x4488ff, 0.4).setDepth(500);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3,
      duration: 500,
      onComplete: () => flash.destroy(),
    });
  }

  private updateVisuals() {
    const ratio = this.currentHealth / this.maxHealth;
    this.hpBar.setScale(ratio, 1);
    this.hpBar.setX(this.defenseLineX - (120 * (1 - ratio)) / 2);

    // Damage state thresholds
    if (ratio > 0.6) {
      // Healthy
      this.wallRect.setFillStyle(0x4a4a44);
      this.damageOverlay.setAlpha(0);
    } else if (ratio > 0.3) {
      // Damaged
      this.wallRect.setFillStyle(0x5a4a34);
      this.damageOverlay.setFillStyle(0xff4400, 0.15);
      this.damageOverlay.setAlpha(1);
      this.drawCracks(2);
    } else {
      // Critical
      this.wallRect.setFillStyle(0x6a3a2a);
      this.damageOverlay.setFillStyle(0xff0000, 0.25);
      this.damageOverlay.setAlpha(1);
      this.drawCracks(5);
    }

    // Color HP bar based on ratio
    if (ratio > 0.6) this.hpBar.setFillStyle(0x44cc44);
    else if (ratio > 0.3) this.hpBar.setFillStyle(0xccaa44);
    else this.hpBar.setFillStyle(0xcc3333);
  }

  private drawCracks(count: number) {
    this.crackLines.clear();
    this.crackLines.lineStyle(1, 0x222222, 0.6);
    for (let i = 0; i < count; i++) {
      const cy = 50 + Math.random() * (this.scene.scale.height - 100);
      this.crackLines.beginPath();
      this.crackLines.moveTo(-5, cy);
      this.crackLines.lineTo(5 + Math.random() * 10, cy + (Math.random() - 0.5) * 20);
      this.crackLines.lineTo(-3 + Math.random() * 8, cy + (Math.random() - 0.5) * 30);
      this.crackLines.strokePath();
    }
  }
}
