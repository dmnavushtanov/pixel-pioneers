import type { BattlefieldDefinition } from '../../types/BattlefieldDefinition';
import { DESERT_OUTPOST_LAYOUT } from './desert_outpost';

/** Registry of all available battlefields */
export const BATTLEFIELDS: Record<string, BattlefieldDefinition> = {
  desert_outpost: {
    id: 'desert_outpost',
    name: 'Desert Outpost',
    folderPath: 'battlefields/desert_outpost',
    layout: DESERT_OUTPOST_LAYOUT,
  },
};

/** Current active battlefield id */
export const DEFAULT_BATTLEFIELD_ID = 'desert_outpost';

export function getBattlefield(id: string): BattlefieldDefinition {
  const bf = BATTLEFIELDS[id];
  if (!bf) throw new Error(`Battlefield "${id}" not found. Available: ${Object.keys(BATTLEFIELDS).join(', ')}`);
  return bf;
}
