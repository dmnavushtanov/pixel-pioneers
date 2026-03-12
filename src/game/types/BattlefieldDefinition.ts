/**
 * Config-driven battlefield layout system.
 * All gameplay positions come from layout.json, NOT from image analysis.
 * The background image is visual only.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A defender slot position on the battlefield */
export interface DefenderSlotDefinition {
  id: string;
  /** Normalized position (0-1) relative to world bounds */
  position: Vec2;
  /** Which lane/row this slot belongs to (0-indexed) */
  laneIndex: number;
  /** Whether this slot is unlocked by default */
  unlockedByDefault: boolean;
}

/** Enemy spawn zone definition */
export interface SpawnZoneDefinition {
  id: string;
  /** Normalized rect (0-1) where enemies can spawn */
  rect: Rect;
  /** Which lanes this zone feeds into */
  laneIndices: number[];
}

/** Barricade/defense line definition */
export interface BarricadeDefinition {
  /** Normalized X position (0-1) of the defense line */
  lineX: number;
  /** Normalized top Y (0-1) */
  topY: number;
  /** Normalized bottom Y (0-1) */
  bottomY: number;
  /** Base HP of the barricade */
  health: number;
}

/** Lane / depth row definition */
export interface LaneDefinition {
  id: string;
  index: number;
  /** Normalized Y position (0-1) */
  groundY: number;
  /** Depth scale factor for units on this lane (farther = smaller) */
  depthScale: number;
}

/** Loot drop bounds */
export interface LootBounds {
  /** Normalized rect where loot can fall */
  rect: Rect;
}

/** Optional decorative prop anchor */
export interface PropAnchor {
  id: string;
  position: Vec2;
  scale: number;
  assetKey?: string;
}

/** Camera safe area for HUD elements */
export interface CameraSafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Complete battlefield layout loaded from layout.json */
export interface BattlefieldLayout {
  id: string;
  name: string;
  /** World bounds in pixels (the design resolution) */
  worldBounds: { width: number; height: number };
  /** Background asset key (loaded in BootScene) */
  backgroundKey: string;
  /** Optional foreground overlay key */
  foregroundKey?: string;
  /** Defense line / barricade config */
  barricade: BarricadeDefinition;
  /** Defender slot positions */
  defenderSlots: DefenderSlotDefinition[];
  /** Enemy spawn zones */
  spawnZones: SpawnZoneDefinition[];
  /** Lane/depth row definitions */
  lanes: LaneDefinition[];
  /** Where loot drops can appear */
  lootBounds: LootBounds;
  /** Enemy approach stop line (normalized X 0-1) — enemies stop here to attack */
  enemyStopLineX: number;
  /** Decorative prop anchors */
  propAnchors?: PropAnchor[];
  /** Camera safe area for HUD */
  cameraSafeArea?: CameraSafeArea;
}

/** Top-level battlefield definition referencing assets and layout */
export interface BattlefieldDefinition {
  id: string;
  name: string;
  /** Folder path: e.g. "battlefields/desert_outpost" */
  folderPath: string;
  layout: BattlefieldLayout;
}
