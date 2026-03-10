/**
 * Defines a cutout-rig for skeletal/transform-based animation.
 * Each unit will have a parts folder with images and a rig.json.
 *
 * Parts hierarchy:
 *   torso
 *   ├── head
 *   ├── hips
 *   │   ├── leg_front
 *   │   └── leg_back
 *   ├── upper_arm_front
 *   │   └── lower_arm_front
 *   │       └── hand_front (or weapon)
 *   └── upper_arm_back
 *       └── lower_arm_back
 *           └── hand_back
 */

export type RigPartName =
  | 'head'
  | 'torso'
  | 'upper_arm_front'
  | 'lower_arm_front'
  | 'upper_arm_back'
  | 'lower_arm_back'
  | 'hand_front'
  | 'hand_back'
  | 'hips'
  | 'leg_front'
  | 'leg_back'
  | 'weapon';

export interface RigPart {
  name: RigPartName;
  /** Pivot point relative to part image (0-1) */
  pivot: { x: number; y: number };
  /** Offset from parent pivot */
  offset: { x: number; y: number };
  /** Default rotation in radians */
  defaultRotation: number;
  /** Z-order for rendering */
  zIndex: number;
  /** Child parts attached to this part */
  children?: RigPart[];
}

export interface RigDefinition {
  id: string;
  /** Root part (typically torso) */
  root: RigPart;
  /** Path to parts folder: e.g. "assets/units/soldier/parts/" */
  partsPath: string;
  /** Default scale */
  scale: number;
}
