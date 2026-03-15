export interface Vec2 {
  x: number;
  y: number;
}

export interface RigPartDefinition {
  name: string;
  parent?: string; // Root if undefined
  image: string; // Filename in parts/ folder
  pivot: Vec2; // 0-1 normalized relative to image size
  position: Vec2; // Offset from parent pivot
  rotation: number; // Base rotation in degrees
  scale: Vec2; // Base scale
  zIndex: number; // distinct from scene depth, for local sorting
  layer?: 'back' | 'body' | 'front'; // Gross sorting group
  /** Target display size in pixels — images are scaled to fit */
  displaySize?: { width: number; height: number };
}

export interface RigDefinition {
  id: string;
  parts: RigPartDefinition[];
  sockets: {
    [key: string]: {
      part: string; // Attached to which part
      offset: Vec2; // Offset from part pivot
    };
  };
}
