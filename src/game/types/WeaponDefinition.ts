/**
 * Simple weapon config for early gameplay.
 * Direct values, no multipliers. Easy to extend later.
 */
export type WeaponType = 'pistol' | 'musket' | 'rifle' | 'repeater';

export interface WeaponConfig {
  id: string;
  name: string;
  type: WeaponType;
  /** Direct damage per shot */
  damage: number;
  /** Attack range in pixels */
  range: number;
  /** Seconds between shots */
  fireRate: number;
  /** Reload duration in seconds (not used yet, future) */
  reloadTime: number;
  /** Projectile speed in pixels/sec */
  projectileSpeed: number;
  /** Accuracy 0-1 (1 = perfect, affects spread) */
  accuracy: number;
  /** Progression: available at this level/wave */
  unlockLevel: number;
  /** Visual reference key */
  sprite: string;
}

/** Projectile visual config (used by CombatSystem) */
export interface ProjectileConfig {
  speed: number;
  size: number;
  color: number;
  trailCount: number;
}
