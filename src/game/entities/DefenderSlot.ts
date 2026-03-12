import Phaser from 'phaser';
import { PlayerUnit } from './PlayerUnit';
import type { UnitDefinition } from '../types';

/**
 * DefenderSlot: a fixed position behind the barricade where a PlayerUnit is stationed.
 * Provides visual cover elements and manages the unit placed in it.
 */
export class DefenderSlot extends Phaser.GameObjects.Container {
  public slotIndex: number;
  public laneIndex: number;
  public unit: PlayerUnit | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, slotIndex: number, laneIndex: number) {
    super(scene, x, y);
    this.slotIndex = slotIndex;
    this.laneIndex = laneIndex;

    // Visual: small cover platform
    const platform = new Phaser.GameObjects.Rectangle(scene, 0, 12, 36, 8, 0x3a3a34, 0.6);
    platform.setStrokeStyle(1, 0x2a2a24);
    this.add(platform);

    // Small sandbag prop
    const sandbag = new Phaser.GameObjects.Arc(scene, 10, 8, 7, 0, 360, false, 0x8b7d5b, 0.5);
    sandbag.setScale(1.2, 0.6);
    this.add(sandbag);

    scene.add.existing(this);
    this.setDepth(y / 10 + 5);
  }

  setUnit(def: UnitDefinition) {
    if (this.unit) {
      this.unit.destroy();
    }
    this.unit = new PlayerUnit(this.scene, 0, 0, def);
    this.add(this.unit);
  }
}
