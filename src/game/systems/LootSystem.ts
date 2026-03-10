import Phaser from 'phaser';
import { LootDrop } from '../entities/LootDrop';
import type { EnemyUnit } from '../entities/EnemyUnit';

/**
 * LootSystem: spawns loot drops on enemy death and handles tap-to-collect.
 */
export class LootSystem {
  private scene: Phaser.Scene;
  public drops: LootDrop[] = [];
  public totalGold = 0;

  private onGoldChange?: (gold: number) => void;

  constructor(scene: Phaser.Scene, onGoldChange?: (gold: number) => void) {
    this.scene = scene;
    this.onGoldChange = onGoldChange;
  }

  spawnLoot(enemy: EnemyUnit) {
    const { min, max } = enemy.def.goldDrop;
    const gold = min + Math.floor(Math.random() * (max - min + 1));
    const drop = new LootDrop(
      this.scene,
      enemy.x + (Math.random() - 0.5) * 20,
      enemy.y + (Math.random() - 0.5) * 20,
      gold
    );
    drop.on('pointerdown', () => {
      const collected = drop.collect();
      if (collected > 0) {
        this.totalGold += collected;
        this.onGoldChange?.(this.totalGold);
      }
    });
    this.drops.push(drop);
  }

  cleanup() {
    this.drops = this.drops.filter((d) => d.active);
  }
}
