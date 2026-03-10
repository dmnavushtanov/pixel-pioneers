import Phaser from 'phaser';
import type { BattleScene } from './BattleScene';

/**
 * UIScene: Modern game HUD overlay with resource bars, kills, and game-over state.
 */
export class UIScene extends Phaser.Scene {
  private battleScene!: BattleScene;
  private goldText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private barricadeBar!: Phaser.GameObjects.Rectangle;
  private upgradeFlash!: Phaser.GameObjects.Text;
  private waveIndicator!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { battleScene: BattleScene }) {
    this.battleScene = data.battleScene;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const pad = 20;

    // === TOP-LEFT: Resource Panel ===
    const leftPanel = this.add.container(pad, pad);
    const lpBg = this.add.rectangle(0, 0, 140, 60, 0x000000, 0.5)
      .setOrigin(0)
      .setStrokeStyle(1, 0x555555);
    leftPanel.add(lpBg);

    this.goldText = this.add.text(10, 8, '💰 0', {
      fontSize: '18px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    leftPanel.add(this.goldText);

    this.killsText = this.add.text(10, 32, '☠ 0 KILLS', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    leftPanel.add(this.killsText);

    // === TOP-RIGHT: Health Panel ===
    const rightPanel = this.add.container(w - pad, pad);
    const rpBg = this.add.rectangle(-160, 0, 160, 70, 0x000000, 0.5)
      .setOrigin(0)
      .setStrokeStyle(1, 0x555555);
    rightPanel.add(rpBg);

    // Defender HP
    this.add.text(-150, 8, 'DEFENDERS', { fontSize: '10px', color: '#ffaaaa', fontFamily: 'monospace' });
    const hBarBg = this.add.rectangle(-150, 20, 140, 10, 0x331111).setOrigin(0);
    this.healthBar = this.add.rectangle(-150, 20, 140, 10, 0xcc3333).setOrigin(0);
    rightPanel.add([hBarBg, this.healthBar]);

    // Barricade HP
    this.add.text(-150, 36, 'FRONT LINE', { fontSize: '10px', color: '#aaffaa', fontFamily: 'monospace' });
    const bBarBg = this.add.rectangle(-150, 48, 140, 10, 0x112211).setOrigin(0);
    this.barricadeBar = this.add.rectangle(-150, 48, 140, 10, 0x55aa55).setOrigin(0);
    rightPanel.add([bBarBg, this.barricadeBar]);

    // === BOTTOM: Wave Pressure Indicator ===
    const waveX = w / 2;
    const waveY = h - 30;
    this.add.text(waveX, waveY - 15, 'PRESSURE', { 
      fontSize: '10px', 
      color: '#ffffff', 
      fontFamily: 'monospace' 
    }).setOrigin(0.5);
    this.add.rectangle(waveX, waveY, 200, 4, 0x333333);
    this.waveIndicator = this.add.rectangle(waveX - 100, waveY, 0, 4, 0xff4444).setOrigin(0, 0.5);

    // Upgrade flash
    this.upgradeFlash = this.add.text(w / 2, h * 0.3, '', {
      fontSize: '24px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    // Fullscreen button
    const fsBtn = this.add.text(w - 10, h - 10, '⛶ FULLSCREEN', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // === Event listeners ===
    this.battleScene.events.on('goldChanged', (gold: number) => {
      this.goldText.setText(`💰 ${gold}`);
    });

    this.battleScene.events.on('killsChanged', (kills: number) => {
      this.killsText.setText(`☠ ${kills} KILLS`);
      // Update wave pressure based on kills (simple representation)
      const pressure = (kills % 20) / 20;
      this.waveIndicator.width = 200 * pressure;
    });

    this.battleScene.events.on('healthChanged', (current: number, max: number) => {
      const ratio = Math.max(0, current / max);
      this.healthBar.width = 140 * ratio;
    });

    this.battleScene.events.on('barricadeChanged', (current: number, max: number) => {
      const ratio = Math.max(0, current / max);
      this.barricadeBar.width = 140 * ratio;
    });

    this.battleScene.events.on('unitUpgraded', (tierName: string) => {
      this.upgradeFlash.setText(`PROMOTED TO ${tierName}!`);
      this.upgradeFlash.setAlpha(1);
      this.upgradeFlash.setScale(0.5);
      this.tweens.add({
        targets: this.upgradeFlash,
        alpha: 0,
        scale: 1.5,
        y: h * 0.2,
        duration: 2000,
        ease: 'Cubic.easeOut'
      });
    });

    this.battleScene.events.on('gameOver', (kills: number, gold: number) => {
      this.showGameOver(kills, gold);
    });
  }

  private showGameOver(kills: number, gold: number) {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(1000);

    const container = this.add.container(w / 2, h / 2).setDepth(1001);

    container.add(this.add.text(0, -60, 'DEFENSE FALLEN', {
      fontSize: '32px',
      color: '#cc3333',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    container.add(this.add.text(0, 0, `MISSION STATS\n\nENEMIES ELIMINATED: ${kills}\nRESOURCES SECURED: ${gold}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5));

    const retryBtn = this.add.rectangle(0, 80, 160, 40, 0x444444)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffd700);
    container.add(retryBtn);
    
    container.add(this.add.text(0, 80, 'REDEPLOY', {
      fontSize: '18px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    retryBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.stop('BattleScene');
      this.scene.start('BattleScene');
    });
  }
}
