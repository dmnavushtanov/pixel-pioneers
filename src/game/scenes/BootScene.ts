import Phaser from 'phaser';

/**
 * BootScene: preload placeholder assets and show loading bar.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Loading bar
    const barBg = this.add.rectangle(w / 2, h / 2, 200, 16, 0x222222);
    const bar = this.add.rectangle(w / 2 - 98, h / 2, 0, 12, 0xffd700);
    bar.setOrigin(0, 0.5);

    const label = this.add.text(w / 2, h / 2 - 30, 'Loading...', {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 196 * value;
    });

    this.load.on('complete', () => {
      barBg.destroy();
      bar.destroy();
      label.destroy();
    });

    // No real assets to load yet; simulate a brief load
    // Future: load rig parts, spritesheets, audio here
  }

  create() {
    this.scene.start('MenuScene');
  }
}
