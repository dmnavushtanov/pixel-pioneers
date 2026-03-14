/**
 * Wave configuration: defines enemy spawns per wave.
 * All balance values live here — not in BattleScene.
 */

export interface EnemyGroup {
  enemyId: string;
  count: number;
  /** Ms between spawns within this group */
  spawnInterval: number;
  /** Ms delay before this group starts spawning */
  startDelay: number;
  /** Which lanes to spawn on (undefined = random) */
  laneIndices?: number[];
}

export interface WaveDefinition {
  wave: number;
  groups: EnemyGroup[];
  /** Stat scaling multiplier applied to all enemies */
  scalingMultiplier?: number;
  /** Ms of rest before this wave starts */
  preWaveDelay: number;
}

export const WAVE_DEFINITIONS: WaveDefinition[] = [
  {
    wave: 1,
    preWaveDelay: 3000,
    groups: [
      { enemyId: 'ottoman_rifleman', count: 3, spawnInterval: 1200, startDelay: 0 },
    ],
  },
  {
    wave: 2,
    preWaveDelay: 4000,
    groups: [
      { enemyId: 'ottoman_rifleman', count: 4, spawnInterval: 1000, startDelay: 0 },
      { enemyId: 'ottoman_runner', count: 2, spawnInterval: 800, startDelay: 2000 },
    ],
  },
  {
    wave: 3,
    preWaveDelay: 4000,
    groups: [
      { enemyId: 'ottoman_rifleman', count: 5, spawnInterval: 900, startDelay: 0 },
      { enemyId: 'ottoman_brute', count: 1, spawnInterval: 1000, startDelay: 3000 },
    ],
  },
  {
    wave: 4,
    preWaveDelay: 5000,
    groups: [
      { enemyId: 'ottoman_rifleman', count: 4, spawnInterval: 800, startDelay: 0 },
      { enemyId: 'ottoman_runner', count: 4, spawnInterval: 600, startDelay: 1500 },
      { enemyId: 'ottoman_brute', count: 2, spawnInterval: 2000, startDelay: 4000 },
    ],
    scalingMultiplier: 1.1,
  },
  {
    wave: 5,
    preWaveDelay: 5000,
    groups: [
      { enemyId: 'ottoman_rifleman', count: 6, spawnInterval: 700, startDelay: 0 },
      { enemyId: 'ottoman_brute', count: 3, spawnInterval: 1500, startDelay: 2000 },
      { enemyId: 'ottoman_runner', count: 5, spawnInterval: 500, startDelay: 3000 },
    ],
    scalingMultiplier: 1.2,
  },
  {
    wave: 6,
    preWaveDelay: 5000,
    groups: [
      { enemyId: 'ottoman_brute', count: 4, spawnInterval: 1200, startDelay: 0 },
      { enemyId: 'ottoman_rifleman', count: 8, spawnInterval: 600, startDelay: 1000 },
      { enemyId: 'ottoman_runner', count: 6, spawnInterval: 400, startDelay: 2000 },
    ],
    scalingMultiplier: 1.3,
  },
  {
    wave: 7,
    preWaveDelay: 6000,
    groups: [
      { enemyId: 'ottoman_rifleman', count: 10, spawnInterval: 500, startDelay: 0 },
      { enemyId: 'ottoman_brute', count: 5, spawnInterval: 1000, startDelay: 1500 },
      { enemyId: 'ottoman_runner', count: 8, spawnInterval: 400, startDelay: 3000 },
    ],
    scalingMultiplier: 1.5,
  },
];

/** Generate infinite waves beyond defined ones */
export function getWaveDefinition(waveIndex: number): WaveDefinition {
  if (waveIndex < WAVE_DEFINITIONS.length) {
    return WAVE_DEFINITIONS[waveIndex];
  }
  const baseWave = WAVE_DEFINITIONS[WAVE_DEFINITIONS.length - 1];
  const extraScale = 1 + (waveIndex - WAVE_DEFINITIONS.length + 1) * 0.15;
  return {
    wave: waveIndex + 1,
    preWaveDelay: 5000,
    scalingMultiplier: (baseWave.scalingMultiplier ?? 1) * extraScale,
    groups: baseWave.groups.map(g => ({
      ...g,
      count: Math.ceil(g.count * (1 + (waveIndex - WAVE_DEFINITIONS.length + 1) * 0.3)),
    })),
  };
}
