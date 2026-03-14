export type EasingType = 'Linear' | 'Quad.In' | 'Quad.Out' | 'Quad.InOut' | 'Back.In' | 'Back.Out' | 'Back.InOut';

export interface Keyframe {
  time: number; // 0-1 normalized or ms
  value: number;
  ease?: EasingType;
}

export interface AnimationTrack {
  part: string;
  property: 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY' | 'alpha';
  keyframes: Keyframe[];
}

export interface AnimationClip {
  name: string;
  duration: number; // in ms
  loop: boolean;
  tracks: AnimationTrack[];
}

export interface AnimationSet {
  animations: AnimationClip[];
}
