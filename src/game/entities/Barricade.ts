import Phaser from 'phaser';

/**
 * DefenseLine: Visual and structural barrier representing the defended perimeter.
 * Consists of barricades, sandbags, and props that block enemies and take damage.
 */
export class Barricade extends Phaser.GameObjects.Container {
  public maxHealth: number;
  public currentHealth: number;
  public isDestroyed = false;

  /** X position of the defense line — enemies stop here */
  public defenseLineX: number;

  private props: Phaser.GameObjects.GameObject[] = [];
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private wallVisuals: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, yTop: number, yBottom: number, health = 500) {
    super(scene, 0, 0);
    this.maxHealth = health;
    this.currentHealth = health;
    this.defenseLineX = x;

    this.wallVisuals = new Phaser.GameObjects.Container(scene, x, 0);
    this.add(this.wallVisuals);

    const wallHeight = yBottom - yTop;
    const centerY = (yTop + yBottom) / 2;

    // Background wall/barricade visual
    const wall = new Phaser.GameObjects.Rectangle(scene, 0, centerY, 16, wallHeight, 0x4a4a44);
    wall.setStrokeStyle(2, 0x2a2a24);
    this.wallVisuals.add(wall);

    // Add some random props along the line
    const propCount = 8;
    for (let i = 0; i < propCount; i++) {
      const py = yTop + (i / (propCount - 1)) * wallHeight;
      const px = (Math.random() - 0.5) * 10;
      
      const propType = Math.random();
      if (propType > 0.6) {
        // Sandbags
        const bag = new Phaser.GameObjects.Arc(scene, px + 8, py, 10, 0, 360, false, 0x8b7d5b);
        bag.setScale(1.4, 0.7);
        bag.setAngle(Math.random() * 20 - 10);
        this.wallVisuals.add(bag);
      } else if (propType > 0.3) {
        // Wooden crate
        const crate = new Phaser.GameObjects.Rectangle(scene, px + 6, py, 20, 20, 0x5d4037);
        crate.setStrokeStyle(1, 0x3e2723);
        crate.setAngle(Math.random() * 15 - 7.5);
        this.wallVisuals.add(crate);
      } else {
        // Broken prop / metal piece
        const metal = new Phaser.GameObjects.Rectangle(scene, px + 10, py, 12, 12, 0x455a64);
        metal.setAngle(45);
        this.wallVisuals.add(metal);
      }
    }

    // HP bar (placed at the top of the defense line)
    const barWidth = 120;
    const barX = x;
    const barY = yTop - 25;
    this.hpBarBg = new Phaser.GameObjects.Rectangle(scene, barX, barY, barWidth, 10, 0x331111);
    this.hpBar = new Phaser.GameObjects.Rectangle(scene, barX, barY, barWidth, 10, 0x44cc44);
    this.add([this.hpBarBg, this.hpBar]);

    // Label
    const label = new Phaser.GameObjects.Text(scene, barX, barY - 14, 'DEFENSE INTEGRITY', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(label);

    scene.add.existing(this);
    this.setDepth(100); // Overlay everything
  }

  takeDamage(amount: number): boolean {
    if (this.isDestroyed) return true;
    this.currentHealth = Math.max(0, this.currentHealth - amount);

    const ratio = this.currentHealth / this.maxHealth;
    this.hpBar.setScale(ratio, 1);
    this.hpBar.setX(this.defenseLineX - (120 * (1 - ratio)) / 2);

    // Shake visual
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
}
