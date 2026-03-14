import Phaser from 'phaser';
import type { RigDefinition } from '../types/RigDefinition';
import type { AnimationSet } from '../types/AnimationDefinition';

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

  /**
   * Preload all part images for a unit. Call during scene preload().
   */
  static preloadUnit(scene: Phaser.Scene, unitId: string, partNames: string[]) {
    const basePath = `assets/units/${unitId}/parts`;
    for (const part of partNames) {
      const key = `unit_${unitId}_${part.replace('.png', '')}`;
      if (!scene.textures.exists(key)) {
        scene.load.image(key, `${basePath}/${part}`);
      }
    }
  }

  /**
   * Preload rig.json and animations.json for a unit.
   */
  static preloadConfigs(scene: Phaser.Scene, unitId: string) {
    scene.load.json(`rig_${unitId}`, `assets/units/${unitId}/rig.json`);
    scene.load.json(`anims_${unitId}`, `assets/units/${unitId}/animations.json`);
  }

  /**
   * After preload, call this to get rig + anims from cache.
   */
  public loadUnit(unitId: string): { rig: RigDefinition; anims: AnimationSet } {
    // Check memory cache
    if (UnitLoader.cache.has(unitId)) {
      return UnitLoader.cache.get(unitId)!;
    }

    // Try loading from preloaded JSON
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

    // Fallback to procedural if no JSON
    if (!rig) {
      console.warn(`[UnitLoader] No rig.json for ${unitId}, using procedural fallback`);
      rig = this.createFallbackRig(unitId);
    }
    if (!anims) {
      console.warn(`[UnitLoader] No animations.json for ${unitId}, using procedural fallback`);
      anims = this.createFallbackAnims();
    }

    // Ensure textures exist
    this.ensureTextures(unitId, rig);

    const data = { rig, anims };
    UnitLoader.cache.set(unitId, data);
    return data;
  }

  private ensureTextures(unitId: string, rig: RigDefinition) {
    for (const part of rig.parts) {
      const key = `unit_${unitId}_${part.name}`;
      if (!this.scene.textures.exists(key)) {
        const gfx = this.scene.add.graphics();
        gfx.setVisible(false);

        let w = 20, h = 30, color = 0x888888;
        if (part.name.includes('head')) { w = 24; h = 24; color = 0xffccaa; }
        else if (part.name.includes('torso')) { w = 32; h = 40; color = unitId.includes('bulgarian') ? 0x6b4c2a : 0x2c3e6b; }
        else if (part.name.includes('arm')) { w = 12; h = 24; color = unitId.includes('bulgarian') ? 0x5a3e1f : 0x253050; }
        else if (part.name.includes('leg')) { w = 14; h = 28; color = unitId.includes('bulgarian') ? 0x3d2b1a : 0x2a3555; }
        else if (part.name.includes('weapon')) { w = 40; h = 10; color = 0x3a2a1a; }

        gfx.fillStyle(color);
        if (part.name.includes('head')) gfx.fillCircle(12, 12, 12);
        else gfx.fillRect(0, 0, w, h);

        gfx.generateTexture(key, Math.max(w, 24), Math.max(h, 24));
        gfx.destroy();
      }
    }
  }

  private createFallbackRig(unitId: string): RigDefinition {
    return {
      id: unitId,
      parts: [
        { name: 'left_leg',  image: 'left_leg.png',  pivot: { x: 0.5, y: 0.1 }, position: { x: -6, y: 8 },  rotation: 0, scale: { x: 1, y: 1 }, zIndex: 5 },
        { name: 'right_leg', image: 'right_leg.png', pivot: { x: 0.5, y: 0.1 }, position: { x: 6, y: 8 },   rotation: 0, scale: { x: 1, y: 1 }, zIndex: 6 },
        { name: 'torso',     image: 'torso.png',     pivot: { x: 0.5, y: 0.85 }, position: { x: 0, y: 0 },  rotation: 0, scale: { x: 1, y: 1 }, zIndex: 10 },
        { name: 'head',      parent: 'torso', image: 'head.png', pivot: { x: 0.5, y: 0.9 }, position: { x: 0, y: -35 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 20 },
        { name: 'left_arm',  parent: 'torso', image: 'left_arm.png',  pivot: { x: 0.7, y: 0.1 }, position: { x: -10, y: -28 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 8 },
        { name: 'right_arm', parent: 'torso', image: 'right_arm.png', pivot: { x: 0.3, y: 0.1 }, position: { x: 10, y: -28 },  rotation: 0, scale: { x: 1, y: 1 }, zIndex: 18 },
        { name: 'weapon',    parent: 'right_arm', image: 'weapon.png', pivot: { x: 0.25, y: 0.5 }, position: { x: 5, y: 18 }, rotation: -5, scale: { x: 1, y: 1 }, zIndex: 25 },
      ],
      sockets: {
        muzzle: { part: 'weapon', offset: { x: 45, y: -3 } },
      },
    };
  }

  private createFallbackAnims(): AnimationSet {
    return {
      animations: [
        {
          name: 'idle', duration: 1000, loop: true,
          tracks: [
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 0.5, value: -2 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'move', duration: 600, loop: true,
          tracks: [
            { part: 'right_leg', property: 'rotation', keyframes: [{ time: 0, value: 15 }, { time: 0.5, value: -15 }, { time: 1, value: 15 }] },
            { part: 'left_leg', property: 'rotation', keyframes: [{ time: 0, value: -15 }, { time: 0.5, value: 15 }, { time: 1, value: -15 }] },
          ],
        },
        {
          name: 'shoot', duration: 250, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.15, value: -30 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'attack', duration: 400, loop: false,
          tracks: [
            { part: 'right_arm', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.3, value: -60 }, { time: 0.5, value: 20 }, { time: 1, value: 0 }] },
          ],
        },
        {
          name: 'death', duration: 600, loop: false,
          tracks: [
            { part: 'torso', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 1, value: -90 }] },
          ],
        },
      ],
    };
  }
}
