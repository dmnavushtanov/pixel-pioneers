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
    return {
      id: unitId,
      parts: [
        { name: 'left_leg',  image: 'left_leg.png',  pivot: { x: 0.5, y: 0.15 }, position: { x: -4, y: 14 },  rotation: 0, scale: { x: 1, y: 1 }, zIndex: 5,  displaySize: { width: 8, height: 22 } },
        { name: 'right_leg', image: 'right_leg.png', pivot: { x: 0.5, y: 0.15 }, position: { x: 4, y: 14 },   rotation: 0, scale: { x: 1, y: 1 }, zIndex: 6,  displaySize: { width: 8, height: 22 } },
        { name: 'torso',     image: 'torso.png',     pivot: { x: 0.5, y: 0.75 }, position: { x: 0, y: 0 },    rotation: 0, scale: { x: 1, y: 1 }, zIndex: 10, displaySize: { width: 20, height: 26 } },
        { name: 'head',      parent: 'torso', image: 'head.png', pivot: { x: 0.5, y: 0.9 }, position: { x: 0, y: -22 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 20, displaySize: { width: 16, height: 18 } },
        { name: 'left_arm',  parent: 'torso', image: 'left_arm.png',  pivot: { x: 0.6, y: 0.12 }, position: { x: -8, y: -18 }, rotation: 15,  scale: { x: 1, y: 1 }, zIndex: 8,  displaySize: { width: 8, height: 20 } },
        { name: 'right_arm', parent: 'torso', image: 'right_arm.png', pivot: { x: 0.4, y: 0.12 }, position: { x: 8, y: -18 },  rotation: -20, scale: { x: 1, y: 1 }, zIndex: 18, displaySize: { width: 8, height: 20 } },
        { name: 'weapon',    parent: 'right_arm', image: 'weapon.png', pivot: { x: 0.2, y: 0.5 }, position: { x: 2, y: 12 }, rotation: 10, scale: { x: 1, y: 1 }, zIndex: 25, displaySize: { width: 30, height: 6 } },
      ],
      sockets: {
        muzzle: { part: 'weapon', offset: { x: 26, y: 0 } },
      },
    };
  }

  private createFallbackAnims(): AnimationSet {
    return {
      animations: [
        {
          name: 'idle', duration: 1500, loop: true,
          tracks: [
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 0.5, value: -1 }, { time: 1, value: 0 }] },
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -20 }, { time: 0.5, value: -22 }, { time: 1, value: -20 }] },
          ],
        },
        {
          name: 'move', duration: 600, loop: true,
          tracks: [
            { part: 'right_leg', property: 'rotation', keyframes: [{ time: 0, value: 12 }, { time: 0.5, value: -12 }, { time: 1, value: 12 }] },
            { part: 'left_leg', property: 'rotation', keyframes: [{ time: 0, value: -12 }, { time: 0.5, value: 12 }, { time: 1, value: -12 }] },
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 0.25, value: -1.5 }, { time: 0.5, value: 0 }, { time: 0.75, value: -1.5 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'shoot', duration: 300, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -20 }, { time: 0.12, value: -35 }, { time: 1, value: -20 }] },
            { part: 'torso', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 0.12, value: -2 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'reload_muzzle', duration: 2500, loop: false,
          tracks: [
            { part: 'weapon', property: 'rotation', keyframes: [{ time: 0, value: 10 }, { time: 0.15, value: 50 }, { time: 0.7, value: 50 }, { time: 1, value: 10 }] },
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -20 }, { time: 0.15, value: -40 }, { time: 0.7, value: -40 }, { time: 1, value: -20 }] },
            { part: 'left_arm', property: 'rotation', keyframes: [{ time: 0, value: 15 }, { time: 0.15, value: -10 }, { time: 0.55, value: -10 }, { time: 1, value: 15 }] },
          ],
        },
        {
          name: 'reload_simple', duration: 1200, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -20 }, { time: 0.2, value: -10 }, { time: 0.5, value: -15 }, { time: 1, value: -20 }] },
            { part: 'weapon', property: 'rotation', keyframes: [{ time: 0, value: 10 }, { time: 0.2, value: 20 }, { time: 1, value: 10 }] },
          ],
        },
        {
          name: 'attack', duration: 400, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -20 }, { time: 0.3, value: -50 }, { time: 0.5, value: 10 }, { time: 1, value: -20 }] },
          ],
        },
        {
          name: 'death', duration: 600, loop: false,
          tracks: [
            { part: 'torso', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 1, value: -80 }] },
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 1, value: 10 }] },
          ],
        },
      ],
    };
  }
}
