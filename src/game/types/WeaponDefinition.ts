/**
 * Simple weapon config for early gameplay.
 * Direct values, no multipliers. Easy to extend later.
 */
export type WeaponType = 'pistol' | 'musket' | 'rifle' | 'repeater';

/** Visual behavior group for shooting/reload feel */
export type WeaponVisualGroup = 'muzzle_loading' | 'breech_single_shot' | 'repeater';

/** Reload animation style */
export type ReloadStyle = 'barrel' | 'breech' | 'lever' | 'none';

export interface WeaponConfig {
  id: string;
  name: string;
  type: WeaponType;
  /** Direct damage per shot */
  damage: number;
  /** Attack range in pixels */
  range: number;
  /** Seconds between shots (includes reload) */
  fireRate: number;
  /** Reload duration in seconds */
  reloadTime: number;
  /** Projectile speed in pixels/sec */
  projectileSpeed: number;
  /** Accuracy 0-1 (1 = perfect, affects spread) */
  accuracy: number;
  /** Progression: available at this level/wave */
  unlockLevel: number;
  /** Visual reference key */
  sprite: string;
  /** Visual behavior group */
  visualGroup: WeaponVisualGroup;
  /** Smoke intensity 0-1 */
  smokeLevel: number;
  /** Recoil strength 0-1 */
  recoilAmount: number;
  /** Reload animation style */
  reloadStyle: ReloadStyle;
}

/** Projectile visual config (used by CombatSystem) */
export interface ProjectileConfig {
  speed: number;
  size: number;
  color: number;
  trailCount: number;
}
