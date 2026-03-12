import Phaser from 'phaser';
import { EnemyUnit } from '../entities/EnemyUnit';
import { ENEMY_TYPES } from '../data/enemies';

/**
 * EnemySystem: handles wave spawning and movement across lanes.
 * Spawn positions and stop line come from battlefield config.
 */
export class EnemySystem {
  private scene: Phaser.Scene;
  public enemies: EnemyUnit[] = [];
  private spawnTimer = 0;
  private spawnInterval = 3000;
  private spawnCount = 0;
  private stopLineX: number;
  private lanesY: number[];
  private spawnMinX: number;
  private spawnMaxX: number;

  constructor(scene: Phaser.Scene, stopLineX: number, lanesY: number[], spawnMinX: number, spawnMaxX: number) {
    this.scene = scene;
    this.stopLineX = stopLineX;
    this.lanesY = lanesY;
    this.spawnMinX = spawnMinX;
    this.spawnMaxX = spawnMaxX;
  }

  update(delta: number, _targetX: number, _targetY: number) {
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      this.spawnCount++;
      this.spawnInterval = Math.max(800, 3000 - Math.floor(this.spawnCount / 5) * 200);
      this.spawnTimer = this.spawnInterval;
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      if (enemy.x > this.stopLineX + enemy.def.size + 10) {
        enemy.moveToward(this.stopLineX, enemy.y, delta);
      } else {
        enemy.y += Math.sin(this.scene.time.now / 200) * 0.1;
      }

      enemy.setDepth(enemy.y / 10);
    }
  }

  private spawnWave() {
    const count = Phaser.Math.Between(1, 3);
    for (let i = 0; i < count; i++) {
      const type = ENEMY_TYPES[Phaser.Math.Between(0, ENEMY_TYPES.length - 1)];
      const lane = Phaser.Math.Between(0, this.lanesY.length - 1);

      const x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
      const y = this.lanesY[lane] + Phaser.Math.Between(-15, 15);

      const enemy = new EnemyUnit(this.scene, x, y, type);
      this.enemies.push(enemy);
    }
  }

  removeEnemy(enemy: EnemyUnit) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  cleanup() {
    // handled by removeEnemy + playDeath
  }
}
