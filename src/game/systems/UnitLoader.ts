import Phaser from 'phaser';
import type { RigDefinition } from '../types/RigDefinition';
import type { AnimationSet } from '../types/AnimationDefinition';

/** Standard parts shared by all unit types */
const STANDARD_PARTS = ['head.png', 'torso.png', 'left_arm.png', 'right_arm.png', 'left_leg.png', 'right_leg.png', 'weapon.png'];

/**
 * UnitLoader: Loads unit rig assets from public/assets/units/{unitId}/.
 * Falls back to procedural placeholders if JSON files are missing.
 */
export class UnitLoader {
  private scene: Phaser.Scene;
  private static cache: Map<string, { rig: RigDefinition; anims: AnimationSet }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  static preloadUnit(scene: Phaser.Scene, unitId: string, partNames: string[]) {
    const basePath = `assets/units/${unitId}/parts`;
    for (const part of partNames) {
      const key = `unit_${unitId}_${part.replace('.png', '')}`;
      if (!scene.textures.exists(key)) {
        scene.load.image(key, `${basePath}/${part}`);
      }
    }
  }

  static preloadConfigs(scene: Phaser.Scene, unitId: string) {
    scene.load.json(`rig_${unitId}`, `assets/units/${unitId}/rig.json`);
    scene.load.json(`anims_${unitId}`, `assets/units/${unitId}/animations.json`);
  }

  public loadUnit(unitId: string): { rig: RigDefinition; anims: AnimationSet } {
    if (UnitLoader.cache.has(unitId)) return UnitLoader.cache.get(unitId)!;

    let rig: RigDefinition | undefined;
    let anims: AnimationSet | undefined;

    try {
      const rigData = this.scene.cache.json.get(`rig_${unitId}`);
      if (rigData) rig = rigData as RigDefinition;
    } catch { /* fallback */ }

    try {
      const animData = this.scene.cache.json.get(`anims_${unitId}`);
      if (animData) anims = animData as AnimationSet;
    } catch { /* fallback */ }

    if (!rig) {
      console.warn(`[UnitLoader] No rig.json for ${unitId}, using procedural fallback`);
      rig = this.createFallbackRig(unitId);
    }
    if (!anims) {
      console.warn(`[UnitLoader] No animations.json for ${unitId}, using procedural fallback`);
      anims = this.createFallbackAnims();
    }

    const data = { rig, anims };
    UnitLoader.cache.set(unitId, data);
    return data;
  }

  private createFallbackRig(unitId: string): RigDefinition {
    const isBulgarian = unitId.includes('bulgarian');
    return {
      id: unitId,
      parts: [
        { name: 'left_leg',  image: 'left_leg.png',  pivot: { x: 0.5, y: 0.1 }, position: { x: -5, y: 12 },  rotation: 0, scale: { x: 1, y: 1 }, zIndex: 5,  displaySize: { width: 10, height: 24 } },
        { name: 'right_leg', image: 'right_leg.png', pivot: { x: 0.5, y: 0.1 }, position: { x: 5, y: 12 },   rotation: 0, scale: { x: 1, y: 1 }, zIndex: 6,  displaySize: { width: 10, height: 24 } },
        { name: 'torso',     image: 'torso.png',     pivot: { x: 0.5, y: 0.8 }, position: { x: 0, y: 0 },    rotation: 0, scale: { x: 1, y: 1 }, zIndex: 10, displaySize: { width: 22, height: 30 } },
        { name: 'head',      parent: 'torso', image: 'head.png', pivot: { x: 0.5, y: 0.85 }, position: { x: 0, y: -26 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 20, displaySize: { width: 18, height: 20 } },
        { name: 'left_arm',  parent: 'torso', image: 'left_arm.png',  pivot: { x: 0.7, y: 0.1 }, position: { x: -10, y: -20 }, rotation: 0,  scale: { x: 1, y: 1 }, zIndex: 8,  displaySize: { width: 10, height: 24 } },
        { name: 'right_arm', parent: 'torso', image: 'right_arm.png', pivot: { x: 0.3, y: 0.1 }, position: { x: 10, y: -20 },  rotation: -15, scale: { x: 1, y: 1 }, zIndex: 18, displaySize: { width: 10, height: 24 } },
        { name: 'weapon',    parent: 'right_arm', image: 'weapon.png', pivot: { x: 0.15, y: 0.5 }, position: { x: 4, y: 14 }, rotation: 5, scale: { x: 1, y: 1 }, zIndex: 25, displaySize: { width: 34, height: 8 } },
      ],
      sockets: {
        muzzle: { part: 'weapon', offset: { x: 30, y: 0 } },
      },
    };
  }

  private createFallbackAnims(): AnimationSet {
    return {
      animations: [
        {
          name: 'idle', duration: 1200, loop: true,
          tracks: [
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 0.5, value: -1 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'move', duration: 500, loop: true,
          tracks: [
            { part: 'right_leg', property: 'rotation', keyframes: [{ time: 0, value: 15 }, { time: 0.5, value: -15 }, { time: 1, value: 15 }] },
            { part: 'left_leg', property: 'rotation', keyframes: [{ time: 0, value: -15 }, { time: 0.5, value: 15 }, { time: 1, value: -15 }] },
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 0.25, value: -1 }, { time: 0.5, value: 0 }, { time: 0.75, value: -1 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'shoot', duration: 250, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -15 }, { time: 0.15, value: -35 }, { time: 1, value: -15 }] },
            { part: 'torso', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 0.15, value: -2 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'attack', duration: 400, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -15 }, { time: 0.3, value: -60 }, { time: 0.5, value: 10 }, { time: 1, value: -15 }] },
          ],
        },
        {
          name: 'death', duration: 600, loop: false,
          tracks: [
            { part: 'torso', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 1, value: -90 }] },
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 1, value: 15 }] },
          ],
        },
      ],
    };
  }
}
