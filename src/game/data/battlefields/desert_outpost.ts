import type { BattlefieldLayout } from '../../types/BattlefieldDefinition';

/**
 * Desert Outpost — default battlefield layout.
 * All positions are normalized (0-1) relative to worldBounds.
 * BattleScene converts them to pixel coords at runtime.
 */
export const DESERT_OUTPOST_LAYOUT: BattlefieldLayout = {
  id: 'desert_outpost',
  name: 'Desert Outpost',
  worldBounds: { width: 800, height: 450 },
  backgroundKey: 'bg_desert_outpost',

  barricade: {
    lineX: 0.25,
    topY: 0.22,
    bottomY: 0.88,
    health: 1000,
  },

  defenderSlots: [
    {
      id: 'slot_0',
      position: { x: 0.18, y: 0.32 },
      laneIndex: 0,
      unlockedByDefault: true,
    },
    {
      id: 'slot_1',
      position: { x: 0.16, y: 0.52 },
      laneIndex: 1,
      unlockedByDefault: true,
    },
    {
      id: 'slot_2',
      position: { x: 0.18, y: 0.72 },
      laneIndex: 2,
      unlockedByDefault: true,
    },
  ],

  spawnZones: [
    {
      id: 'spawn_right',
      rect: { x: 0.9, y: 0.2, width: 0.15, height: 0.7 },
      laneIndices: [0, 1, 2],
    },
  ],

  lanes: [
    { id: 'lane_top', index: 0, groundY: 0.32, depthScale: 0.85 },
    { id: 'lane_mid', index: 1, groundY: 0.52, depthScale: 1.0 },
    { id: 'lane_bot', index: 2, groundY: 0.72, depthScale: 1.1 },
  ],

  lootBounds: {
    rect: { x: 0.25, y: 0.2, width: 0.6, height: 0.7 },
  },

  enemyStopLineX: 0.27,

  propAnchors: [
    { id: 'barrel_1', position: { x: 0.22, y: 0.42 }, scale: 1.0 },
    { id: 'crate_1', position: { x: 0.23, y: 0.62 }, scale: 0.9 },
  ],

  cameraSafeArea: {
    top: 0.05,
    bottom: 0.95,
    left: 0.02,
    right: 0.98,
  },
};
