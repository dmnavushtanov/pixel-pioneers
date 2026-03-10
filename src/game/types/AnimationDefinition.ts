/**
 * Defines keyframe-based animations for cutout rigs.
 * Each animation is a set of tracks (one per rig part) with keyframes.
 */

import type { RigPartName } from './RigDefinition';

export interface AnimationKeyframe {
  /** Time in seconds from animation start */
  time: number;
  /** Rotation in radians (relative to default) */
  rotation?: number;
  /** Translation offset from default */
  offsetX?: number;
  offsetY?: number;
  /** Scale multiplier */
  scale?: number;
  /** Easing function name */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface AnimationTrack {
  partName: RigPartName;
  keyframes: AnimationKeyframe[];
}

export interface AnimationDefinition {
  id: string;
  name: string;
  /** Duration in seconds */
  duration: number;
  /** Whether this animation loops */
  loop: boolean;
  tracks: AnimationTrack[];
}

/**
 * A complete animation set for a unit (idle, walk, attack, death, etc.)
 */
export interface AnimationSet {
  unitId: string;
  animations: Record<string, AnimationDefinition>;
}
