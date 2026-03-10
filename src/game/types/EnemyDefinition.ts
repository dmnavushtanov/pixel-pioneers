/**
 * Defines an enemy type: stats, loot, and visual placeholder.
 */
export interface EnemyDefinition {
  id: string;
  name: string;
  health: number;
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
  /** Gold dropped on death */
  goldDrop: GoldDrop;
  /** Placeholder visual */
  color: number;
  size: number; // radius
  /** Future: rig reference */
  rigId?: string;
}

export interface GoldDrop {
  min: number;
  max: number;
}
