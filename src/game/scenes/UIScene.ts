import Phaser from 'phaser';
import type { BattleScene } from './BattleScene';

/**
 * UIScene: HUD overlay with gold, kills, HP, barricade HP, upgrades, and game-over.
 */
export class UIScene extends Phaser.Scene {
  private battleScene!: BattleScene;
  private goldText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private barricadeBar!: Phaser.GameObjects.Rectangle;
  private barricadeBarBg!: Phaser.GameObjects.Rectangle;
  private tierText!: Phaser.GameObjects.Text;
  private upgradeFlash!: Phaser.GameObjects.Text;
  private barricadeLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { battleScene: BattleScene }) {
    this.battleScene = data.battleScene;
  }

  create() {
    const w = this.scale.width;
    const pad = 10;
    const barW = 100;

    // === TOP-LEFT: Gold & Kills ===
    this.goldText = this.add.text(pad, pad, '💰 0', {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });

    this.killsText = this.add.text(pad, pad + 22, '☠ 0', {
      fontSize: '13px',
      color: '#cccccc',
      fontFamily: 'monospace',
    });

    this.tierText = this.add.text(pad, pad + 42, '', {
      fontSize: '11px',
      color: '#66aaff',
      fontFamily: 'monospace',
    });

    // === TOP-RIGHT: HP bars ===
    const barsX = w - pad - barW / 2;

    // Player HP
    this.add.text(w - pad - barW, pad - 2, 'SOLDIER', {
      fontSize: '8px',
      color: '#cc6666',
      fontFamily: 'monospace',
    });
    this.healthBarBg = this.add.rectangle(barsX, pad + 12, barW, 8, 0x331111);
    this.healthBar = this.add.rectangle(barsX, pad + 12, barW, 8, 0xcc3333);

    // Barricade HP
    this.barricadeLabel = this.add.text(w - pad - barW, pad + 22, 'BARRICADE', {
      fontSize: '8px',
      color: '#55aa55',
      fontFamily: 'monospace',
    });
    this.barricadeBarBg = this.add.rectangle(barsX, pad + 36, barW, 8, 0x112211);
    this.barricadeBar = this.add.rectangle(barsX, pad + 36, barW, 8, 0x55aa55);

    // Upgrade flash
    this.upgradeFlash = this.add.text(w / 2, 60, '', {
      fontSize: '18px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Fullscreen button
    const fsBtn = this.add.text(w - pad, pad + 54, '⛶', {
      fontSize: '18px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // === Event listeners ===
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

    this.battleScene.events.on('barricadeChanged', (current: number, max: number) => {
      const ratio = current / max;
      this.barricadeBar.setScale(ratio, 1);
      if (current <= 0) {
        this.barricadeLabel.setText('BARRICADE ☠');
        this.barricadeLabel.setColor('#cc3333');
      }
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

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);

    this.add.text(w / 2, h * 0.3, 'DEFENSE FALLEN', {
      fontSize: '24px',
      color: '#cc3333',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.45, `Kills: ${kills}\nGold: ${gold}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5);

    const retryBg = this.add.rectangle(w / 2, h * 0.62, 130, 36, 0xffd700)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.62, 'RETRY', {
      fontSize: '16px',
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
