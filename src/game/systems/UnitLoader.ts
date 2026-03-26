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
        { name: 'left_leg',  image: 'left_leg.png',  pivot: { x: 0.5, y: 0.09 }, position: { x: -6, y: 16 }, rotation: 2, scale: { x: 1, y: 1 }, zIndex: 4,  displaySize: { width: 15, height: 28 } },
        { name: 'right_leg', image: 'right_leg.png', pivot: { x: 0.5, y: 0.09 }, position: { x: 6, y: 15 },  rotation: -2, scale: { x: 1, y: 1 }, zIndex: 5,  displaySize: { width: 15, height: 28 } },
        { name: 'torso',     image: 'torso.png',     pivot: { x: 0.5, y: 0.84 }, position: { x: 0, y: 0 },   rotation: 0, scale: { x: 1, y: 1 }, zIndex: 10, displaySize: { width: 29, height: 36 } },
        { name: 'head',      parent: 'torso', image: 'head.png', pivot: { x: 0.45, y: 0.9 }, position: { x: 2, y: -30 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 16, displaySize: { width: 22, height: 22 } },
        { name: 'left_arm',  parent: 'torso', image: 'left_arm.png',  pivot: { x: 0.2, y: 0.16 }, position: { x: 2, y: -22 }, rotation: 28,  scale: { x: 1, y: 1 }, zIndex: 8,  displaySize: { width: 18, height: 22 } },
        { name: 'right_arm', parent: 'torso', image: 'right_arm.png', pivot: { x: 0.2, y: 0.16 }, position: { x: 10, y: -21 }, rotation: -10, scale: { x: 1, y: 1 }, zIndex: 18, displaySize: { width: 18, height: 22 } },
        { name: 'weapon',    parent: 'right_arm', image: 'weapon.png', pivot: { x: 0.24, y: 0.53 }, position: { x: 15, y: 9 }, rotation: 4, scale: { x: 1, y: 1 }, zIndex: 17, displaySize: { width: 46, height: 11 } },
      ],
      sockets: {
        muzzle: { part: 'weapon', offset: { x: 34, y: 0 } },
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
            { part: 'head', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.5, value: 0.8 }, { time: 1, value: 0 }] },
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -10 }, { time: 0.5, value: -11 }, { time: 1, value: -10 }] },
            { part: 'left_arm', property: 'rotation', keyframes: [{ time: 0, value: 28 }, { time: 0.5, value: 29 }, { time: 1, value: 28 }] },
          ],
        },
        {
          name: 'move', duration: 600, loop: true,
          tracks: [
            { part: 'right_leg', property: 'rotation', keyframes: [{ time: 0, value: 8 }, { time: 0.5, value: -10 }, { time: 1, value: 8 }] },
            { part: 'left_leg', property: 'rotation', keyframes: [{ time: 0, value: -10 }, { time: 0.5, value: 8 }, { time: 1, value: -10 }] },
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 0.25, value: -1.5 }, { time: 0.5, value: 0 }, { time: 0.75, value: -1.5 }, { time: 1, value: 0 }] },
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -8 }, { time: 0.5, value: -12 }, { time: 1, value: -8 }] },
            { part: 'left_arm', property: 'rotation', keyframes: [{ time: 0, value: 30 }, { time: 0.5, value: 24 }, { time: 1, value: 30 }] },
            { part: 'weapon', property: 'rotation', keyframes: [{ time: 0, value: 5 }, { time: 0.5, value: 3 }, { time: 1, value: 5 }] },
          ],
        },
        {
          name: 'shoot', duration: 300, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -10 }, { time: 0.12, value: -20 }, { time: 0.5, value: -12 }, { time: 1, value: -10 }] },
            { part: 'left_arm', property: 'rotation', keyframes: [{ time: 0, value: 28 }, { time: 0.12, value: 23 }, { time: 0.5, value: 26 }, { time: 1, value: 28 }] },
            { part: 'weapon', property: 'x', keyframes: [{ time: 0, value: 15 }, { time: 0.12, value: 11 }, { time: 1, value: 15 }] },
            { part: 'weapon', property: 'rotation', keyframes: [{ time: 0, value: 4 }, { time: 0.12, value: 2 }, { time: 0.5, value: 3 }, { time: 1, value: 4 }] },
            { part: 'torso', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.12, value: -3 }, { time: 0.5, value: -1 }, { time: 1, value: 0 }] },
            { part: 'torso', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 0.12, value: -2 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'reload_muzzle', duration: 2500, loop: false,
          tracks: [
            { part: 'weapon', property: 'rotation', keyframes: [{ time: 0, value: 4 }, { time: 0.15, value: 52 }, { time: 0.7, value: 56 }, { time: 1, value: 4 }] },
            { part: 'weapon', property: 'y', keyframes: [{ time: 0, value: 9 }, { time: 0.15, value: 5 }, { time: 0.7, value: 5 }, { time: 1, value: 9 }] },
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -10 }, { time: 0.15, value: -34 }, { time: 0.7, value: -38 }, { time: 1, value: -10 }] },
            { part: 'left_arm', property: 'rotation', keyframes: [{ time: 0, value: 28 }, { time: 0.15, value: -4 }, { time: 0.35, value: -10 }, { time: 0.55, value: -6 }, { time: 0.7, value: -2 }, { time: 1, value: 28 }] },
          ],
        },
        {
          name: 'reload_simple', duration: 1200, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -10 }, { time: 0.2, value: -2 }, { time: 0.5, value: -6 }, { time: 1, value: -10 }] },
            { part: 'left_arm', property: 'rotation', keyframes: [{ time: 0, value: 28 }, { time: 0.2, value: 24 }, { time: 0.5, value: 26 }, { time: 1, value: 28 }] },
            { part: 'weapon', property: 'rotation', keyframes: [{ time: 0, value: 4 }, { time: 0.2, value: 15 }, { time: 1, value: 4 }] },
          ],
        },
        {
          name: 'attack', duration: 400, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -10 }, { time: 0.3, value: -36 }, { time: 0.5, value: 8 }, { time: 1, value: -10 }] },
          ],
        },
        {
          name: 'death', duration: 600, loop: false,
          tracks: [
            { part: 'torso', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.6, value: -44 }, { time: 1, value: -78 }] },
            { part: 'head', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.5, value: -18 }, { time: 1, value: -30 }] },
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: -10 }, { time: 1, value: 26 }] },
            { part: 'left_arm', property: 'rotation', keyframes: [{ time: 0, value: 28 }, { time: 1, value: -14 }] },
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 1, value: 10 }] },
          ],
        },
      ],
    };
  }
}
