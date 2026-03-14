import Phaser from 'phaser';
import type { RigDefinition, RigPartDefinition } from '../types/RigDefinition';
import type { AnimationSet } from '../types/AnimationDefinition';
import type { UnitAssetManifest } from '../types/UnitManifest';

/**
 * UnitLoader: Manages loading of unit rig assets.
 * Generates procedural placeholders if assets are missing.
 */
export class UnitLoader {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Loads a unit's assets.
   * In a real implementation, this would load manifest.json first, then the files listed.
   * For this prototype, we'll simulate loading and return generated data.
   */
  public async loadUnit(unitId: string): Promise<{ rig: RigDefinition, anims: AnimationSet }> {
    // 1. In a real app, we'd do:
    // const manifest = await this.loadJson(`assets/units/${unitId}/manifest.json`);
    // const rig = await this.loadJson(`assets/units/${unitId}/rig.json`);
    // const anims = await this.loadJson(`assets/units/${unitId}/animations.json`);
    // await this.loadImages(manifest.parts);

    // 2. For Prototype: Generate data on the fly based on ID
    // We will create distinct rigs for 'soldier' and 'grunt' to prove the system works.
    
    console.log(`[UnitLoader] Loading/Generating unit: ${unitId}`);
    
    let rig: RigDefinition;
    let anims: AnimationSet;

    if (unitId === 'soldier') {
      rig = this.createSoldierRig();
      anims = this.createSoldierAnims();
    } else if (unitId === 'grunt') {
      rig = this.createGruntRig();
      anims = this.createGruntAnims();
    } else {
      // Generic fallback
      rig = this.createGenericRig(unitId);
      anims = this.createGenericAnims();
    }

    // 3. Ensure textures exist (Procedural generation)
    this.ensureTextures(unitId, rig);

    return { rig, anims };
  }

  private ensureTextures(unitId: string, rig: RigDefinition) {
    for (const part of rig.parts) {
      const key = `unit_${unitId}_${part.name}`;
      if (!this.scene.textures.exists(key)) {
        // Generate placeholder texture
        const gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
        
        // Size based on part name approximation (or just standard)
        let w = 20, h = 30;
        let color = 0x888888;
        
        if (part.name.includes('head')) { w = 24; h = 24; color = 0xffccaa; }
        else if (part.name.includes('torso')) { w = 32; h = 40; color = unitId === 'soldier' ? 0x4488ff : 0xcc4444; }
        else if (part.name.includes('arm')) { w = 12; h = 24; color = 0x555555; }
        else if (part.name.includes('leg')) { w = 14; h = 28; color = 0x333333; }
        else if (part.name.includes('weapon')) { w = 40; h = 10; color = 0x222222; }
        
        gfx.fillStyle(color);
        if (part.name.includes('head')) gfx.fillCircle(12, 12, 12);
        else gfx.fillRect(0, 0, w, h);
        
        gfx.generateTexture(key, Math.max(w, 24), Math.max(h, 24));
      }
    }
  }

  // === SOLDIER DATA ===

  private createSoldierRig(): RigDefinition {
    return {
      id: 'soldier',
      parts: [
        { name: 'hips', image: 'hips.png', pivot: { x: 0.5, y: 0.5 }, position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 10 },
        { name: 'torso', parent: 'hips', image: 'torso.png', pivot: { x: 0.5, y: 0.9 }, position: { x: 0, y: -5 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 15 },
        { name: 'head', parent: 'torso', image: 'head.png', pivot: { x: 0.5, y: 0.9 }, position: { x: 0, y: -35 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 20 },
        { name: 'upper_arm_r', parent: 'torso', image: 'upper_arm.png', pivot: { x: 0.5, y: 0.1 }, position: { x: 12, y: -30 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 18 },
        { name: 'lower_arm_r', parent: 'upper_arm_r', image: 'lower_arm.png', pivot: { x: 0.5, y: 0.1 }, position: { x: 0, y: 20 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 19 },
        { name: 'weapon', parent: 'lower_arm_r', image: 'weapon.png', pivot: { x: 0.2, y: 0.5 }, position: { x: 0, y: 15 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 25 },
        { name: 'upper_arm_l', parent: 'torso', image: 'upper_arm.png', pivot: { x: 0.5, y: 0.1 }, position: { x: -12, y: -30 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 5 },
        { name: 'leg_r', parent: 'hips', image: 'leg.png', pivot: { x: 0.5, y: 0.1 }, position: { x: 8, y: 5 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 9 },
        { name: 'leg_l', parent: 'hips', image: 'leg.png', pivot: { x: 0.5, y: 0.1 }, position: { x: -8, y: 5 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 8 },
      ],
      sockets: {
        muzzle: { part: 'weapon', offset: { x: 40, y: -2 } }
      }
    };
  }

  private createSoldierAnims(): AnimationSet {
    return {
      animations: [
        {
          name: 'idle',
          duration: 1000,
          loop: true,
          tracks: [
            { part: 'torso', property: 'y', keyframes: [{ time: 0, value: -5 }, { time: 0.5, value: -3 }, { time: 1, value: -5 }] },
            { part: 'head', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.5, value: 2 }, { time: 1, value: 0 }] },
            { part: 'upper_arm_r', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.5, value: -5 }, { time: 1, value: 0 }] },
          ]
        },
        {
          name: 'shoot',
          duration: 200,
          loop: false,
          tracks: [
            { part: 'upper_arm_r', property: 'rotation', keyframes: [{ time: 0, value: 0 }, { time: 0.1, value: -40 }, { time: 1, value: 0 }] },
            { part: 'weapon', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 0.1, value: -10 }, { time: 1, value: 0 }] },
          ]
        }
      ]
    };
  }

  // === GRUNT DATA ===

  private createGruntRig(): RigDefinition {
    return {
      id: 'grunt',
      parts: [
        { name: 'hips', image: 'hips.png', pivot: { x: 0.5, y: 0.5 }, position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 10 },
        { name: 'torso', parent: 'hips', image: 'torso.png', pivot: { x: 0.5, y: 0.9 }, position: { x: 0, y: 0 }, rotation: 10, scale: { x: 1.1, y: 1 }, zIndex: 15 }, // Leaning forward
        { name: 'head', parent: 'torso', image: 'head.png', pivot: { x: 0.5, y: 0.8 }, position: { x: 5, y: -30 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 20 },
        { name: 'leg_r', parent: 'hips', image: 'leg.png', pivot: { x: 0.5, y: 0.1 }, position: { x: 6, y: 5 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 9 },
        { name: 'leg_l', parent: 'hips', image: 'leg.png', pivot: { x: 0.5, y: 0.1 }, position: { x: -6, y: 5 }, rotation: 0, scale: { x: 1, y: 1 }, zIndex: 8 },
        { name: 'arm_r', parent: 'torso', image: 'arm.png', pivot: { x: 0.5, y: 0.1 }, position: { x: 10, y: -25 }, rotation: -20, scale: { x: 1, y: 1 }, zIndex: 18 },
      ],
      sockets: {
        // Melee unit, maybe hit point
        hit: { part: 'arm_r', offset: { x: 0, y: 20 } }
      }
    };
  }

  private createGruntAnims(): AnimationSet {
    return {
      animations: [
        {
          name: 'idle',
          duration: 800,
          loop: true,
          tracks: [
            { part: 'torso', property: 'rotation', keyframes: [{ time: 0, value: 10 }, { time: 0.5, value: 15 }, { time: 1, value: 10 }] },
          ]
        },
        {
          name: 'move', // simple walk cycle
          duration: 600,
          loop: true,
          tracks: [
            { part: 'leg_r', property: 'rotation', keyframes: [{ time: 0, value: 20 }, { time: 0.5, value: -20 }, { time: 1, value: 20 }] },
            { part: 'leg_l', property: 'rotation', keyframes: [{ time: 0, value: -20 }, { time: 0.5, value: 20 }, { time: 1, value: -20 }] },
            { part: 'hips', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 0.25, value: -2 }, { time: 0.5, value: 0 }, { time: 0.75, value: -2 }, { time: 1, value: 0 }] }
          ]
        },
        {
            name: 'attack',
            duration: 500,
            loop: false,
            tracks: [
                { part: 'arm_r', property: 'rotation', keyframes: [{ time: 0, value: -20 }, { time: 0.4, value: -80 }, { time: 0.6, value: 20 }, { time: 1, value: -20 }] }
            ]
        }
      ]
    };
  }

  private createGenericRig(id: string): RigDefinition {
      return this.createSoldierRig(); // fallback
  }

  private createGenericAnims(): AnimationSet {
      return this.createSoldierAnims(); // fallback
  }
}
