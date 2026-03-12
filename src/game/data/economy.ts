/**
 * Economy / spending config: costs, cooldowns, and values.
 * All balance values live here — not in scene code.
 */

export interface ActionConfig {
  id: string;
  name: string;
  icon: string;
  cost: number;
  cooldownMs: number;
  description: string;
}

export const ACTIONS: Record<string, ActionConfig> = {
  repair: {
    id: 'repair',
    name: 'REPAIR',
    icon: '🔧',
    cost: 15,
    cooldownMs: 3000,
    description: 'Restore 100 barricade HP',
  },
  reinforce: {
    id: 'reinforce',
    name: 'REINFORCE',
    icon: '🛡',
    cost: 40,
    cooldownMs: 15000,
    description: '+100 max barricade HP',
  },
  artillery: {
    id: 'artillery',
    name: 'ARTILLERY',
    icon: '💥',
    cost: 25,
    cooldownMs: 10000,
    description: 'Bombard a lane for massive damage',
  },
};

export const ECONOMY = {
  repairAmount: 100,
  reinforceAmount: 100,
  artilleryDamage: 60,
  artilleryRadius: 80,
};
