import type { WeaponDefinition } from '../types';

export const WEAPONS: Record<string, WeaponDefinition> = {
  musket: {
    id: 'musket',
    name: 'Musket',
    damageMultiplier: 1.5,
    range: 280,
    attackSpeed: 0.6,
    projectile: {
      speed: 400,
      size: 3,
      color: 0xffdd44,
      trailCount: 2,
    },
    color: 0x8b7355,
    length: 28,
    rigPartId: 'weapon',
  },
  rifle: {
    id: 'rifle',
    name: 'Rifle',
    damageMultiplier: 1.2,
    range: 350,
    attackSpeed: 1.2,
    projectile: {
      speed: 600,
      size: 2,
      color: 0xffaa22,
      trailCount: 3,
    },
    color: 0x555555,
    length: 34,
    rigPartId: 'weapon',
  },
};
