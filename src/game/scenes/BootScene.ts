import Phaser from 'phaser';
import { UnitLoader } from '../systems/UnitLoader';

/** Standard parts shared by all unit types */
const STANDARD_PARTS = ['head.png', 'torso.png', 'left_arm.png', 'right_arm.png', 'left_leg.png', 'right_leg.png', 'weapon.png'];

/** All unit IDs that need preloading */
const UNIT_IDS = [
  'bulgarian_rifleman',
  'ottoman_rifleman',
];

/**
 * BootScene: preload unit assets and show loading bar.
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

    // Preload all unit assets
    for (const unitId of UNIT_IDS) {
      UnitLoader.preloadUnit(this, unitId, STANDARD_PARTS);
      UnitLoader.preloadConfigs(this, unitId);
    }
  }

  create() {
    this.scene.start('MenuScene');
  }
}
