import Phaser from 'phaser';

/**
 * MenuScene: title screen with Play button and fullscreen toggle.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Title
    this.add.text(w / 2, h * 0.25, 'AUTO BATTLE', {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.35, 'Tower Defense Prototype', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Play button
    const btnBg = this.add.rectangle(w / 2, h * 0.55, 160, 48, 0xffd700, 0.9)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(w / 2, h * 0.55, 'PLAY', {
      fontSize: '20px',
      color: '#1a1a2e',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0xffee44));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xffd700, 0.9));
    btnBg.on('pointerdown', () => {
      this.scene.start('BattleScene');
    });

    // Fullscreen button
    if (this.scale.isFullscreen !== undefined) {
      const fsBg = this.add.rectangle(w / 2, h * 0.7, 160, 36, 0x333344)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, h * 0.7, 'FULLSCREEN', {
        fontSize: '14px',
        color: '#cccccc',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      fsBg.on('pointerdown', () => {
        if (this.scale.isFullscreen) {
          this.scale.stopFullscreen();
        } else {
          this.scale.startFullscreen();
        }
      });
    }

    // Controls hint
    this.add.text(w / 2, h * 0.85, 'Tap gold coins to collect loot!', {
      fontSize: '11px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
