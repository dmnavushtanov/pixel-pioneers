import Phaser from 'phaser';

/**
 * Loot drop: a tappable gold coin that bounces on spawn.
 */
export class LootDrop extends Phaser.GameObjects.Container {
  public goldValue: number;
  public collected = false;
  private coin: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, gold: number) {
    super(scene, x, y);
    this.goldValue = gold;

    this.coin = new Phaser.GameObjects.Arc(scene, 0, 0, 10, 0, 360, false, 0xffd700);
    this.label = new Phaser.GameObjects.Text(scene, 0, -16, `${gold}`, {
      fontSize: '12px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add([this.coin, this.label]);
    this.setSize(24, 24);
    this.setInteractive();

    scene.add.existing(this);

    // Bounce-in animation
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      y: y - 10,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Auto-despawn after 8 seconds
    scene.time.delayedCall(8000, () => {
      if (!this.collected) this.fadeOut();
    });
  }

  collect(): number {
    if (this.collected) return 0;
    this.collected = true;
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      y: this.y - 30,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
    return this.goldValue;
  }

  private fadeOut() {
    this.collected = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => this.destroy(),
    });
  }
}
