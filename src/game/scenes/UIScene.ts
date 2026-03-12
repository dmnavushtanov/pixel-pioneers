import Phaser from 'phaser';
import type { BattleScene } from './BattleScene';
import { ACTIONS } from '../data/economy';
import type { WaveState } from '../systems/WaveSystem';

/**
 * UIScene: Full HUD with wave info, resources, action bar, and game-over screen.
 */
export class UIScene extends Phaser.Scene {
  private battleScene!: BattleScene;
  private goldText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private barricadeBar!: Phaser.GameObjects.Rectangle;
  private upgradeFlash!: Phaser.GameObjects.Text;

  // Wave HUD
  private waveText!: Phaser.GameObjects.Text;
  private waveStateText!: Phaser.GameObjects.Text;
  private enemiesText!: Phaser.GameObjects.Text;

  // Action buttons
  private actionButtons: Map<string, {
    bg: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    cooldownOverlay: Phaser.GameObjects.Rectangle;
    costLabel: Phaser.GameObjects.Text;
  }> = new Map();

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { battleScene: BattleScene }) {
    this.battleScene = data.battleScene;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const pad = 12;

    // === TOP-LEFT: Resources ===
    const leftBg = this.add.rectangle(pad, pad, 130, 50, 0x000000, 0.6).setOrigin(0).setStrokeStyle(1, 0x444444);
    this.goldText = this.add.text(pad + 8, pad + 6, '💰 0', {
      fontSize: '16px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    });
    this.killsText = this.add.text(pad + 8, pad + 28, '☠ 0', {
      fontSize: '12px', color: '#cccccc', fontFamily: 'monospace',
    });

    // === TOP-CENTER: Wave ===
    const waveBg = this.add.rectangle(w / 2, pad, 180, 50, 0x000000, 0.6).setOrigin(0.5, 0).setStrokeStyle(1, 0x444444);
    this.waveText = this.add.text(w / 2, pad + 6, 'WAVE 1', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.waveStateText = this.add.text(w / 2, pad + 24, 'PREPARING...', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    this.enemiesText = this.add.text(w / 2, pad + 38, '', {
      fontSize: '10px', color: '#ff8888', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    // === TOP-RIGHT: HP bars ===
    const rpX = w - pad - 150;
    this.add.rectangle(rpX, pad, 150, 50, 0x000000, 0.6).setOrigin(0).setStrokeStyle(1, 0x444444);
    this.add.text(rpX + 6, pad + 4, 'UNIT', { fontSize: '9px', color: '#ffaaaa', fontFamily: 'monospace' });
    this.add.rectangle(rpX + 6, pad + 16, 138, 8, 0x331111).setOrigin(0);
    this.healthBar = this.add.rectangle(rpX + 6, pad + 16, 138, 8, 0xcc3333).setOrigin(0);
    this.add.text(rpX + 6, pad + 28, 'BARRICADE', { fontSize: '9px', color: '#aaffaa', fontFamily: 'monospace' });
    this.add.rectangle(rpX + 6, pad + 38, 138, 8, 0x112211).setOrigin(0);
    this.barricadeBar = this.add.rectangle(rpX + 6, pad + 38, 138, 8, 0x55aa55).setOrigin(0);

    // === BOTTOM: Action Bar ===
    this.createActionBar(w, h);

    // Upgrade flash
    this.upgradeFlash = this.add.text(w / 2, h * 0.3, '', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    // Fullscreen
    const fsBtn = this.add.text(w - 8, h - 8, '⛶', {
      fontSize: '20px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // === Events ===
    this.battleScene.events.on('goldChanged', (gold: number) => {
      this.goldText.setText(`💰 ${gold}`);
      this.updateActionButtons();
    });
    this.battleScene.events.on('killsChanged', (kills: number) => {
      this.killsText.setText(`☠ ${kills}`);
    });
    this.battleScene.events.on('healthChanged', (current: number, max: number) => {
      this.healthBar.width = 138 * Math.max(0, current / max);
    });
    this.battleScene.events.on('barricadeChanged', (current: number, max: number) => {
      const ratio = Math.max(0, current / max);
      this.barricadeBar.width = 138 * ratio;
      if (ratio > 0.6) this.barricadeBar.setFillStyle(0x55aa55);
      else if (ratio > 0.3) this.barricadeBar.setFillStyle(0xaaaa44);
      else this.barricadeBar.setFillStyle(0xcc3333);
    });
    this.battleScene.events.on('waveState', (state: WaveState, wave: number, remaining: number, timer: number) => {
      this.waveText.setText(`WAVE ${wave}`);
      if (state === 'pre_wave') {
        this.waveStateText.setText(`INCOMING ${(timer / 1000).toFixed(1)}s`);
        this.waveStateText.setColor('#ffaa44');
        this.enemiesText.setText('');
      } else if (state === 'active') {
        this.waveStateText.setText('ENGAGE');
        this.waveStateText.setColor('#ff4444');
        this.enemiesText.setText(`${remaining} HOSTILES`);
      } else if (state === 'rest') {
        this.waveStateText.setText(`REST ${(timer / 1000).toFixed(1)}s`);
        this.waveStateText.setColor('#44ff44');
        this.enemiesText.setText('');
      } else if (state === 'defeated') {
        this.waveStateText.setText('DEFEATED');
        this.waveStateText.setColor('#cc3333');
      }
    });
    this.battleScene.events.on('unitUpgraded', (tierName: string) => {
      this.upgradeFlash.setText(`⬆ ${tierName}`);
      this.upgradeFlash.setAlpha(1).setScale(0.5).setY(this.scale.height * 0.3);
      this.tweens.add({
        targets: this.upgradeFlash, alpha: 0, scale: 1.5, y: this.scale.height * 0.2,
        duration: 2000, ease: 'Cubic.easeOut',
      });
    });
    this.battleScene.events.on('gameOver', (kills: number, gold: number, wave: number) => {
      this.showGameOver(kills, gold, wave);
    });
  }

  private createActionBar(w: number, h: number) {
    const actions = Object.values(ACTIONS);
    const btnW = 70;
    const btnH = 50;
    const gap = 8;
    const totalW = actions.length * btnW + (actions.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const y = h - btnH - 12;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const bx = startX + i * (btnW + gap);

      const bg = this.add.rectangle(bx, y, btnW, btnH, 0x222222, 0.85)
        .setOrigin(0).setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true });

      const cooldownOverlay = this.add.rectangle(bx, y, btnW, btnH, 0x000000, 0.6)
        .setOrigin(0).setVisible(false);

      const label = this.add.text(bx + btnW / 2, y + 10, `${action.icon} ${action.name}`, {
        fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0);

      const costLabel = this.add.text(bx + btnW / 2, y + 28, `${action.cost}g`, {
        fontSize: '11px', color: '#ffd700', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);

      bg.on('pointerdown', () => this.onActionPressed(action.id));

      this.actionButtons.set(action.id, { bg, label, cooldownOverlay, costLabel });
    }
  }

  private onActionPressed(actionId: string) {
    const bs = this.battleScene;
    const gold = bs.lootSystem.totalGold;
    let cost = 0;

    if (actionId === 'repair') {
      cost = bs.abilitySystem.useRepair(gold, bs.barricade);
    } else if (actionId === 'reinforce') {
      cost = bs.abilitySystem.useReinforce(gold, bs.barricade);
    } else if (actionId === 'artillery') {
      // Target the lane with most enemies
      const lanesY = bs.lanesY;
      let bestLane = lanesY[0];
      let bestCount = 0;
      for (const ly of lanesY) {
        const count = bs.waveSystem.enemies.filter(e => !e.isDead && Math.abs(e.y - ly) < 40).length;
        if (count > bestCount) { bestCount = count; bestLane = ly; }
      }
      cost = bs.abilitySystem.useArtillery(gold, bs.waveSystem.enemies, bestLane);
    }

    if (cost > 0) {
      bs.lootSystem.totalGold -= cost;
      bs.events.emit('goldChanged', bs.lootSystem.totalGold);
      this.flashActionButton(actionId);
    }
    this.updateActionButtons();
  }

  private flashActionButton(actionId: string) {
    const btn = this.actionButtons.get(actionId);
    if (!btn) return;
    btn.bg.setFillStyle(0x44ff44, 0.5);
    this.time.delayedCall(200, () => btn.bg.setFillStyle(0x222222, 0.85));
  }

  update() {
    this.updateActionButtons();
  }

  private updateActionButtons() {
    const gold = this.battleScene.lootSystem.totalGold;
    for (const [id, btn] of this.actionButtons.entries()) {
      const canUse = this.battleScene.abilitySystem.canUse(id, gold);
      const cdRatio = this.battleScene.abilitySystem.getCooldownRatio(id);

      btn.bg.setAlpha(canUse ? 1 : 0.4);
      btn.label.setAlpha(canUse ? 1 : 0.5);
      btn.costLabel.setAlpha(canUse ? 1 : 0.5);

      if (cdRatio > 0) {
        btn.cooldownOverlay.setVisible(true);
        btn.cooldownOverlay.setScale(1, cdRatio);
      } else {
        btn.cooldownOverlay.setVisible(false);
      }
    }
  }

  private showGameOver(kills: number, gold: number, wave: number) {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(1000);
    const container = this.add.container(w / 2, h / 2).setDepth(1001);

    container.add(this.add.text(0, -70, 'DEFENSE FALLEN', {
      fontSize: '28px', color: '#cc3333', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    container.add(this.add.text(0, -10, `WAVES SURVIVED: ${wave}\nENEMIES ELIMINATED: ${kills}\nRESOURCES SECURED: ${gold}`, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5));

    const retryBtn = this.add.rectangle(0, 70, 160, 40, 0x444444)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffd700);
    container.add(retryBtn);
    container.add(this.add.text(0, 70, 'REDEPLOY', {
      fontSize: '18px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    retryBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.stop('BattleScene');
      this.scene.start('BattleScene');
    });
  }
}
