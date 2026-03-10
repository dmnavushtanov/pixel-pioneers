import Phaser from 'phaser';
import { EnemyUnit } from '../entities/EnemyUnit';
import { ENEMY_TYPES } from '../data/enemies';

/**
 * EnemySystem: handles wave spawning and movement across 3 lanes.
 */
export class EnemySystem {
  private scene: Phaser.Scene;
  public enemies: EnemyUnit[] = [];
  private spawnTimer = 0;
  private spawnInterval = 3000;
  private spawnCount = 0;
  private defenseLineX: number;
  private lanesY: number[];

  constructor(scene: Phaser.Scene, defenseLineX: number, lanesY: number[]) {
    this.scene = scene;
    this.defenseLineX = defenseLineX;
    this.lanesY = lanesY;
  }

  update(delta: number, _targetX: number, _targetY: number) {
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      this.spawnCount++;
      // Gradually increase difficulty
      this.spawnInterval = Math.max(800, 3000 - Math.floor(this.spawnCount / 5) * 200);
      this.spawnTimer = this.spawnInterval;
    }

    // Move enemies toward defense line
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      
      // Stop at defense line
      if (enemy.x > this.defenseLineX + enemy.def.size + 10) {
        enemy.moveToward(this.defenseLineX, enemy.y, delta);
      } else {
        // Subtle idle movement while attacking
        enemy.y += Math.sin(this.scene.time.now / 200) * 0.1;
      }
      
      // Depth sorting based on Y
      enemy.setDepth(enemy.y / 10);
    }
  }

  private spawnWave() {
    const w = this.scene.scale.width;
    
    // Spawn 1-3 enemies per wave
    const count = Phaser.Math.Between(1, 3);
    for (let i = 0; i < count; i++) {
      const type = ENEMY_TYPES[Phaser.Math.Between(0, ENEMY_TYPES.length - 1)];
      const lane = Phaser.Math.Between(0, this.lanesY.length - 1);
      
      // Add slight random offset within lane for "swarm" feel
      const x = w + 50 + Phaser.Math.Between(0, 100);
      const y = this.lanesY[lane] + Phaser.Math.Between(-15, 15);
      
      const enemy = new EnemyUnit(this.scene, x, y, type);
      this.enemies.push(enemy);
    }
  }

  removeEnemy(enemy: EnemyUnit) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
  }

  cleanup() {
    // Already handled by removeEnemy and enemy.playDeath()
  }
}
