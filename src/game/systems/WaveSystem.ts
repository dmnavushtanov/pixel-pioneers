import Phaser from 'phaser';
import { EnemyUnit } from '../entities/EnemyUnit';
import { ENEMY_TYPES } from '../data/enemies';
import { getWaveDefinition, type WaveDefinition, type EnemyGroup } from '../data/waves';

export type WaveState = 'pre_wave' | 'active' | 'rest' | 'defeated' | 'victory';

interface GroupTracker {
  group: EnemyGroup;
  spawned: number;
  timer: number;
  delayRemaining: number;
}

/**
 * WaveSystem: config-driven wave spawning replacing the old EnemySystem.
 */
export class WaveSystem {
  private scene: Phaser.Scene;
  public enemies: EnemyUnit[] = [];

  public currentWave = 0;
  public state: WaveState = 'pre_wave';
  public stateTimer = 0;
  public enemiesRemaining = 0;

  private stopLineX: number;
  private lanesY: number[];
  private spawnMinX: number;
  private spawnMaxX: number;

  private waveDef: WaveDefinition | null = null;
  private groupTrackers: GroupTracker[] = [];
  private totalToSpawn = 0;
  private totalSpawned = 0;

  constructor(scene: Phaser.Scene, stopLineX: number, lanesY: number[], spawnMinX: number, spawnMaxX: number) {
    this.scene = scene;
    this.stopLineX = stopLineX;
    this.lanesY = lanesY;
    this.spawnMinX = spawnMinX;
    this.spawnMaxX = spawnMaxX;
    this.startPreWave();
  }

  private startPreWave() {
    this.waveDef = getWaveDefinition(this.currentWave);
    this.state = 'pre_wave';
    this.stateTimer = this.waveDef.preWaveDelay;
  }

  private startWave() {
    if (!this.waveDef) return;
    this.state = 'active';
    this.groupTrackers = this.waveDef.groups.map(g => ({
      group: g,
      spawned: 0,
      timer: 0,
      delayRemaining: g.startDelay,
    }));
    this.totalToSpawn = this.waveDef.groups.reduce((s, g) => s + g.count, 0);
    this.totalSpawned = 0;
    this.enemiesRemaining = this.totalToSpawn;
  }

  update(delta: number) {
    if (this.state === 'defeated' || this.state === 'victory') return;

    if (this.state === 'pre_wave') {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) this.startWave();
      return;
    }

    if (this.state === 'rest') {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) this.startPreWave();
      return;
    }

    // Active wave — spawn enemies from groups
    const scaling = this.waveDef?.scalingMultiplier ?? 1;
    for (const tracker of this.groupTrackers) {
      if (tracker.spawned >= tracker.group.count) continue;
      if (tracker.delayRemaining > 0) {
        tracker.delayRemaining -= delta;
        continue;
      }
      tracker.timer -= delta;
      if (tracker.timer <= 0) {
        this.spawnEnemy(tracker.group.enemyId, scaling, tracker.group.laneIndices);
        tracker.spawned++;
        this.totalSpawned++;
        tracker.timer = tracker.group.spawnInterval;
      }
    }

    // Move enemies
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      if (enemy.x > this.stopLineX + enemy.def.size + 10) {
        enemy.moveToward(this.stopLineX, enemy.y, delta);
      } else {
        enemy.y += Math.sin(this.scene.time.now / 200) * 0.1;
      }
      enemy.setDepth(enemy.y / 10);
    }

    // Check wave complete
    this.enemiesRemaining = (this.totalToSpawn - this.totalSpawned) + this.enemies.filter(e => !e.isDead).length;
    if (this.totalSpawned >= this.totalToSpawn && this.enemies.filter(e => !e.isDead).length === 0) {
      this.currentWave++;
      this.state = 'rest';
      this.stateTimer = 3000;
    }
  }

  private spawnEnemy(enemyId: string, scaling: number, laneIndices?: number[]) {
    const baseDef = ENEMY_TYPES.find(e => e.id === enemyId) ?? ENEMY_TYPES[0];
    const def = scaling !== 1 ? {
      ...baseDef,
      health: Math.round(baseDef.health * scaling),
      damage: Math.round(baseDef.damage * scaling),
    } : baseDef;

    const lane = laneIndices
      ? laneIndices[Phaser.Math.Between(0, laneIndices.length - 1)]
      : Phaser.Math.Between(0, this.lanesY.length - 1);

    const x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
    const y = this.lanesY[lane] + Phaser.Math.Between(-15, 15);
    const enemy = new EnemyUnit(this.scene, x, y, def);
    this.enemies.push(enemy);
  }

  removeEnemy(enemy: EnemyUnit) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  setDefeated() { this.state = 'defeated'; }
  setVictory() { this.state = 'victory'; }

  cleanup() { /* handled by removeEnemy + playDeath */ }
}
