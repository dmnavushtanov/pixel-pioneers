/**
 * AnimationSystem: placeholder for future cutout-rig animation playback.
 * Currently provides simple tween-based animations.
 * Will be extended to parse RigDefinition + AnimationDefinition files.
 */

import type { RigDefinition, AnimationDefinition, AnimationSet } from '../types';

export class AnimationSystem {
  private rigs: Map<string, RigDefinition> = new Map();
  private animSets: Map<string, AnimationSet> = new Map();

  /**
   * Register a rig for a unit type.
   * Future: load rig.json and parts images.
   */
  registerRig(rig: RigDefinition) {
    this.rigs.set(rig.id, rig);
  }

  /**
   * Register animation set for a unit.
   * Future: load animations.json.
   */
  registerAnimations(set: AnimationSet) {
    this.animSets.set(set.unitId, set);
  }

  /**
   * Play a named animation on a unit.
   * Future: will traverse rig hierarchy and apply keyframe transforms.
   */
  play(_unitId: string, _animationName: string) {
    // Placeholder: will be implemented when cutout rigs are loaded
    console.log(`[AnimationSystem] Play ${_animationName} on ${_unitId} (stub)`);
  }

  getRig(id: string): RigDefinition | undefined {
    return this.rigs.get(id);
  }
}
