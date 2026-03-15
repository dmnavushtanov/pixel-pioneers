import type { WeaponConfig } from '../types/WeaponDefinition';

/**
 * All available weapons, ordered by unlockLevel.
 * Players start with flintlock_pistol and can upgrade as they progress.
 */
export const WEAPONS: Record<string, WeaponConfig> = {
  flintlock_pistol: {
    id: 'flintlock_pistol',
    name: 'Flintlock Pistol',
    type: 'pistol',
    damage: 8,
    range: 180,
    fireRate: 1.2,
    reloadTime: 2.0,
    projectileSpeed: 350,
    accuracy: 0.6,
    unlockLevel: 0,
    sprite: 'weapon',
  },
  flintlock_musket: {
    id: 'flintlock_musket',
    name: 'Flintlock Musket',
    type: 'musket',
    damage: 14,
    range: 260,
    fireRate: 1.8,
    reloadTime: 3.0,
    projectileSpeed: 400,
    accuracy: 0.65,
    unlockLevel: 1,
    sprite: 'weapon',
  },
  caplock_musket: {
    id: 'caplock_musket',
    name: 'Caplock Musket',
    type: 'musket',
    damage: 16,
    range: 280,
    fireRate: 1.5,
    reloadTime: 2.5,
    projectileSpeed: 420,
    accuracy: 0.7,
    unlockLevel: 3,
    sprite: 'weapon',
  },
  krynka: {
    id: 'krynka',
    name: 'Krynka Rifle',
    type: 'rifle',
    damage: 22,
    range: 340,
    fireRate: 1.4,
    reloadTime: 2.0,
    projectileSpeed: 550,
    accuracy: 0.8,
    unlockLevel: 5,
    sprite: 'weapon',
  },
  winchester_1866: {
    id: 'winchester_1866',
    name: 'Winchester 1866',
    type: 'repeater',
    damage: 12,
    range: 300,
    fireRate: 0.6,
    reloadTime: 4.0,
    projectileSpeed: 500,
    accuracy: 0.75,
    unlockLevel: 8,
    sprite: 'weapon',
  },
  peabody_martini: {
    id: 'peabody_martini',
    name: 'Peabody-Martini',
    type: 'rifle',
    damage: 30,
    range: 380,
    fireRate: 1.6,
    reloadTime: 2.2,
    projectileSpeed: 600,
    accuracy: 0.85,
    unlockLevel: 12,
    sprite: 'weapon',
  },
};

/** Get the best weapon available at a given level */
export function getBestWeaponForLevel(level: number): WeaponConfig {
  const available = Object.values(WEAPONS)
    .filter(w => w.unlockLevel <= level)
    .sort((a, b) => b.unlockLevel - a.unlockLevel);
  return available[0] ?? WEAPONS.flintlock_pistol;
}

/** Get all weapons sorted by unlock level */
export function getWeaponProgression(): WeaponConfig[] {
  return Object.values(WEAPONS).sort((a, b) => a.unlockLevel - b.unlockLevel);
}
