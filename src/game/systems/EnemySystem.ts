import Phaser from 'phaser';
import { EnemyUnit } from '../entities/EnemyUnit';
import { ENEMY_TYPES } from '../data/enemies';

/**
 * EnemySystem: spawns waves of enemies from the right side.
 */
export class EnemySystem {
  private scene: Phaser.Scene;
  public enemies: EnemyUnit[] = [];
  private spawnTimer = 0;
  private spawnInterval = 2; // seconds between spawns
  private waveCount = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number, playerX: number, playerY: number) {
    this.spawnTimer -= delta / 1000;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = this.spawnInterval;
    }

    // Move enemies toward player
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        enemy.moveToward(playerX, playerY, delta);
      }
    }
  }

  private spawnEnemy() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const def = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const y = 80 + Math.random() * (h - 160);
    const enemy = new EnemyUnit(this.scene, w + 30, y, def);
    this.enemies.push(enemy);
    this.waveCount++;

    // Increase difficulty over time
    if (this.waveCount % 10 === 0 && this.spawnInterval > 0.5) {
      this.spawnInterval *= 0.9;
    }
  }

  removeEnemy(enemy: EnemyUnit) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  cleanup() {
    // Remove destroyed enemies
    this.enemies = this.enemies.filter((e) => e.active);
  }
}
