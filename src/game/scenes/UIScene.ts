import Phaser from 'phaser';
import type { BattleScene } from './BattleScene';

/**
 * UIScene: HUD overlay showing gold, kills, health, upgrades, and game-over screen.
 */
export class UIScene extends Phaser.Scene {
  private battleScene!: BattleScene;
  private goldText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private tierText!: Phaser.GameObjects.Text;
  private upgradeFlash!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { battleScene: BattleScene }) {
    this.battleScene = data.battleScene;
  }

  create() {
    const w = this.scale.width;
    const pad = 12;

    // Gold display
    this.goldText = this.add.text(pad, pad, '💰 0', {
      fontSize: '18px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });

    // Kills display
    this.killsText = this.add.text(pad, pad + 28, '☠ 0', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace',
    });

    // Tier display
    this.tierText = this.add.text(pad, pad + 50, '', {
      fontSize: '12px',
      color: '#66aaff',
      fontFamily: 'monospace',
    });

    // Health bar
    this.healthBarBg = this.add.rectangle(w - pad - 60, pad + 10, 120, 12, 0x331111);
    this.healthBar = this.add.rectangle(w - pad - 60, pad + 10, 120, 12, 0xcc3333);
    this.add.text(w - pad - 100, pad + 24, 'HP', {
      fontSize: '10px',
      color: '#cc6666',
      fontFamily: 'monospace',
    });

    // Upgrade flash text (hidden by default)
    this.upgradeFlash = this.add.text(w / 2, 60, '', {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Fullscreen button in-game
    const fsBtn = this.add.text(w - pad, pad + 44, '⛶', {
      fontSize: '20px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // Listen to battle events
    this.battleScene.events.on('goldChanged', (gold: number) => {
      this.goldText.setText(`💰 ${gold}`);
    });

    this.battleScene.events.on('killsChanged', (kills: number) => {
      this.killsText.setText(`☠ ${kills}`);
    });

    this.battleScene.events.on('healthChanged', (current: number, max: number) => {
      const ratio = current / max;
      this.healthBar.setScale(ratio, 1);
    });

    this.battleScene.events.on('unitUpgraded', (tierName: string) => {
      this.tierText.setText(`★ ${tierName}`);
      this.upgradeFlash.setText(`UPGRADED: ${tierName}!`);
      this.upgradeFlash.setAlpha(1);
      this.tweens.add({
        targets: this.upgradeFlash,
        alpha: 0,
        y: 40,
        duration: 1500,
        onComplete: () => {
          this.upgradeFlash.setY(60);
        },
      });
    });

    this.battleScene.events.on('gameOver', (kills: number, gold: number) => {
      this.showGameOver(kills, gold);
    });
  }

  private showGameOver(kills: number, gold: number) {
    const w = this.scale.width;
    const h = this.scale.height;

    // Darken overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);

    this.add.text(w / 2, h * 0.3, 'GAME OVER', {
      fontSize: '28px',
      color: '#cc3333',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.45, `Kills: ${kills}\nGold: ${gold}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5);

    // Retry button
    const retryBg = this.add.rectangle(w / 2, h * 0.65, 140, 40, 0xffd700)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.65, 'RETRY', {
      fontSize: '18px',
      color: '#1a1a2e',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    retryBg.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.stop('BattleScene');
      this.scene.start('BattleScene');
    });
  }
}
