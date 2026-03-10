import { PlayerUnit } from '../entities/PlayerUnit';
import type { EnemyUnit } from '../entities/EnemyUnit';

/**
 * UpgradeSystem: tracks kills and triggers auto-upgrades.
 */
export class UpgradeSystem {
  private onUpgrade?: (tierName: string, kills: number) => void;

  constructor(onUpgrade?: (tierName: string, kills: number) => void) {
    this.onUpgrade = onUpgrade;
  }

  registerKill(player: PlayerUnit, _enemy: EnemyUnit) {
    const prevTier = player.currentTier;
    player.addKill();
    if (player.currentTier > prevTier) {
      const tier = player.def.upgradeTiers[player.currentTier - 1];
      this.onUpgrade?.(tier.name, player.kills);
    }
  }
}
