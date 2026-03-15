import type { UnitDefinition, UnitStats, UpgradeTier } from '../types';

export const PLAYER_UNIT: UnitDefinition = {
  id: 'bulgarian_rifleman',
  name: 'Rifleman',
  rigId: 'bulgarian_rifleman',
  baseStats: {
    maxHealth: 100,
    damage: 5,
    attackSpeed: 1,
    range: 280,
    moveSpeed: 0,
  },
  color: 0x6b4c2a,
  weaponId: 'flintlock_musket',
  upgradeTiers: [
    {
      killThreshold: 5,
      name: 'Veteran',
      statMultipliers: { damage: 1.3, attackSpeed: 1.1 },
      glowColor: 0x8b6c3a,
    },
    {
      killThreshold: 15,
      name: 'Elite',
      statMultipliers: { damage: 1.6, attackSpeed: 1.3, maxHealth: 1.2 },
      glowColor: 0xab8c5a,
    },
    {
      killThreshold: 30,
      name: 'Champion',
      statMultipliers: { damage: 2.0, attackSpeed: 1.5, maxHealth: 1.5 },
      glowColor: 0xffdd88,
    },
  ],
};
