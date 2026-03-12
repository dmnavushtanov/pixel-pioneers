import Phaser from 'phaser';
import { ACTIONS, ECONOMY } from '../data/economy';
import type { EnemyUnit } from '../entities/EnemyUnit';
import type { Barricade } from '../entities/Barricade';

export interface AbilityState {
  id: string;
  cooldownRemaining: number;
}

/**
 * AbilitySystem: manages player-activated abilities with gold cost and cooldowns.
 */
export class AbilitySystem {
  private scene: Phaser.Scene;
  public abilities: Map<string, AbilityState> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (const key of Object.keys(ACTIONS)) {
      this.abilities.set(key, { id: key, cooldownRemaining: 0 });
    }
  }

  update(delta: number) {
    for (const state of this.abilities.values()) {
      if (state.cooldownRemaining > 0) {
        state.cooldownRemaining = Math.max(0, state.cooldownRemaining - delta);
      }
    }
  }

  canUse(actionId: string, gold: number): boolean {
    const config = ACTIONS[actionId];
    const state = this.abilities.get(actionId);
    if (!config || !state) return false;
    return gold >= config.cost && state.cooldownRemaining <= 0;
  }

  useRepair(gold: number, barricade: Barricade): number {
    if (!this.canUse('repair', gold)) return 0;
    const config = ACTIONS.repair;
    const state = this.abilities.get('repair')!;
    state.cooldownRemaining = config.cooldownMs;
    barricade.repair(ECONOMY.repairAmount);
    return config.cost;
  }

  useReinforce(gold: number, barricade: Barricade): number {
    if (!this.canUse('reinforce', gold)) return 0;
    const config = ACTIONS.reinforce;
    const state = this.abilities.get('reinforce')!;
    state.cooldownRemaining = config.cooldownMs;
    barricade.reinforce(ECONOMY.reinforceAmount);
    return config.cost;
  }

  useArtillery(gold: number, enemies: EnemyUnit[], targetLaneY: number): number {
    if (!this.canUse('artillery', gold)) return 0;
    const config = ACTIONS.artillery;
    const state = this.abilities.get('artillery')!;
    state.cooldownRemaining = config.cooldownMs;

    const killed: EnemyUnit[] = [];
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dy = Math.abs(enemy.y - targetLaneY);
      if (dy < ECONOMY.artilleryRadius) {
        const dead = enemy.takeDamage(ECONOMY.artilleryDamage);
        if (dead) killed.push(enemy);
      }
    }

    // Visual: explosion effects along the lane
    for (let i = 0; i < 5; i++) {
      const ex = 300 + Math.random() * (this.scene.scale.width - 400);
      const ey = targetLaneY + (Math.random() - 0.5) * ECONOMY.artilleryRadius;
      this.scene.time.delayedCall(i * 120, () => {
        const blast = this.scene.add.circle(ex, ey, 20, 0xff6600, 0.9).setDepth(500);
        this.scene.tweens.add({
          targets: blast,
          alpha: 0,
          scale: 3,
          duration: 400,
          onComplete: () => blast.destroy(),
        });
      });
    }

    return config.cost;
  }

  getCooldownRatio(actionId: string): number {
    const config = ACTIONS[actionId];
    const state = this.abilities.get(actionId);
    if (!config || !state || config.cooldownMs === 0) return 0;
    return state.cooldownRemaining / config.cooldownMs;
  }
}
