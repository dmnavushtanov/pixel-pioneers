import Phaser from 'phaser';
import { EnemyUnit } from '../entities/EnemyUnit';
import { ENEMY_TYPES } from '../data/enemies';

/**
 * EnemySystem: spawns waves of enemies from the right side.
 * Enemies march toward the defense line.
 */
export class EnemySystem {
  private scene: Phaser.Scene;
  public enemies: EnemyUnit[] = [];
  private spawnTimer = 0;
  private spawnInterval = 2; // seconds between spawns
  private waveCount = 0;
  private defenseLineX: number;

  constructor(scene: Phaser.Scene, defenseLineX: number) {
    this.scene = scene;
    this.defenseLineX = defenseLineX;
  }

  update(delta: number, playerX: number, playerY: number) {
    this.spawnTimer -= delta / 1000;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = this.spawnInterval;
    }

    // Move enemies toward defense line, then toward player
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        // Target the defense line X, at the enemy's current Y
        const targetX = this.defenseLineX + enemy.def.size + 5;
        if (enemy.x > targetX) {
          enemy.moveToward(targetX, enemy.y, delta);
        }
        // Once at the line, enemy is "attacking" — handled by CombatSystem
      }
    }
  }

  private spawnEnemy() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const def = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const y = 60 + Math.random() * (h - 120);
    // Spawn off-screen right
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
    this.enemies = this.enemies.filter((e) => e.active);
  }
}
