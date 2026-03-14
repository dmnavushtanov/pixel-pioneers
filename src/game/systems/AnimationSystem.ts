/**
 * AnimationSystem: placeholder for future cutout-rig animation playback.
 * Currently provides simple tween-based animations.
 * Will be extended to parse RigDefinition + AnimationDefinition files.
 */

import type { RigDefinition } from '../types/RigDefinition';
import type { AnimationSet } from '../types/AnimationDefinition';

export class AnimationSystem {
  private rigs: Map<string, RigDefinition> = new Map();
  private animSets: Map<string, AnimationSet> = new Map();

  registerRig(rig: RigDefinition) {
    this.rigs.set(rig.id, rig);
  }

  registerAnimations(unitId: string, set: AnimationSet) {
    this.animSets.set(unitId, set);
  }

  play(_unitId: string, _animationName: string) {
    console.log(`[AnimationSystem] Play ${_animationName} on ${_unitId} (stub)`);
  }

  getRig(id: string): RigDefinition | undefined {
    return this.rigs.get(id);
  }
}
