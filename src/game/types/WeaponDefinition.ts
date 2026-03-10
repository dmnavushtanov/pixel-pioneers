/**
 * Defines a weapon's combat properties and visual representation.
 * Weapons affect damage, range, attack speed, and projectile behavior.
 */
export interface WeaponDefinition {
  id: string;
  name: string;
  /** Damage multiplier applied to unit base damage */
  damageMultiplier: number;
  /** Override unit range (pixels) */
  range: number;
  /** Override unit attack speed (attacks/sec) */
  attackSpeed: number;
  /** Projectile config for ranged weapons */
  projectile: ProjectileConfig;
  /** Placeholder visual */
  color: number;
  /** Length of weapon placeholder graphic */
  length: number;
  /** Future: reference to weapon sprite in rig */
  rigPartId?: string;
}

export interface ProjectileConfig {
  speed: number; // pixels per second
  size: number; // radius in pixels
  color: number;
  /** Trail particles count (0 = no trail) */
  trailCount: number;
}
