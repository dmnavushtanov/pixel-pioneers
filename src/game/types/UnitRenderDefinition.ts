/**
 * Future-ready unit render definition.
 * When cutout-rig assets are available, units load from:
 *   assets/units/{unit_id}/parts/
 *   assets/units/{unit_id}/rig.json
 *   assets/units/{unit_id}/animations.json
 */

export interface UnitAssetManifest {
  unitId: string;
  /** Folder path: e.g. "units/soldier" */
  folderPath: string;
  /** List of part image keys */
  partKeys: string[];
  /** Whether rig.json is available */
  hasRig: boolean;
  /** Whether animations.json is available */
  hasAnimations: boolean;
}

export interface UnitRenderDefinition {
  id: string;
  /** Render mode: 'placeholder' uses shapes, 'rig' uses cutout parts */
  mode: 'placeholder' | 'rig';
  /** For placeholder mode: body color */
  bodyColor?: number;
  /** For placeholder mode: accent color */
  accentColor?: number;
  /** For rig mode: asset manifest */
  assets?: UnitAssetManifest;
  /** Scale multiplier */
  scale: number;
  /** Muzzle point offset from unit origin */
  muzzleOffset: { x: number; y: number };
}
