/**
 * Defines a player unit's base stats, visuals, and progression.
 * Units auto-attack and auto-upgrade based on kill thresholds.
 */
export interface UnitDefinition {
  id: string;
  name: string;
  /** Base stats before upgrades */
  baseStats: UnitStats;
  /** Color used for placeholder rendering */
  color: number;
  /** Upgrade thresholds: at N kills, apply stat multipliers */
  upgradeTiers: UpgradeTier[];
  /** Reference to rig definition for future cutout animation */
  rigId?: string;
  /** Weapon currently equipped */
  weaponId: string;
}

export interface UnitStats {
  maxHealth: number;
  damage: number;
  attackSpeed: number; // attacks per second
  range: number; // pixels
  moveSpeed: number; // pixels per second
}

export interface UpgradeTier {
  killThreshold: number;
  name: string;
  /** Multipliers applied to base stats */
  statMultipliers: Partial<UnitStats>;
  /** Visual indicator color shift */
  glowColor?: number;
}
