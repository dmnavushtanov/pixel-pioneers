import type { UnitDefinition } from '../types';

export const PLAYER_UNIT: UnitDefinition = {
  id: 'soldier',
  name: 'Soldier',
  baseStats: {
    maxHealth: 100,
    damage: 10,
    attackSpeed: 1,
    range: 280,
    moveSpeed: 0, // stationary tower-defense style
  },
  color: 0x4488ff,
  weaponId: 'musket',
  upgradeTiers: [
    {
      killThreshold: 5,
      name: 'Veteran',
      statMultipliers: { damage: 1.3, attackSpeed: 1.1 },
      glowColor: 0x66aaff,
    },
    {
      killThreshold: 15,
      name: 'Elite',
      statMultipliers: { damage: 1.6, attackSpeed: 1.3, maxHealth: 1.2 },
      glowColor: 0xaaccff,
    },
    {
      killThreshold: 30,
      name: 'Champion',
      statMultipliers: { damage: 2.0, attackSpeed: 1.5, maxHealth: 1.5 },
      glowColor: 0xffdd88,
    },
  ],
};
