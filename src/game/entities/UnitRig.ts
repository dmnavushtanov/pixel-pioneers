import Phaser from 'phaser';
import type { RigDefinition, RigPartDefinition } from '../types/RigDefinition';
import type { AnimationSet, AnimationClip, AnimationTrack } from '../types/AnimationDefinition';

/**
 * UnitRig: Renders a cutout character from RigDefinition + optional AnimationSet.
 * Handles hierarchy, pivots, and basic animation playback.
 */
export class UnitRig extends Phaser.GameObjects.Container {
  public rig: RigDefinition;
  private animsData?: AnimationSet;
  private parts: Map<string, Phaser.GameObjects.Image> = new Map();
  private partDefs: Map<string, RigPartDefinition> = new Map();
  private currentAnim?: AnimationClip;
  private animTime = 0;
  private animPlaying = false;
  private basePose: Map<string, { x: number, y: number, rotation: number, scaleX: number, scaleY: number }> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number, rig: RigDefinition, anims?: AnimationSet) {
    super(scene, x, y);
    this.rig = rig;
    this.animsData = anims;

    // 1. Sort parts by z-index
    const sortedParts = [...rig.parts].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // 2. Create images for each part
    for (const part of sortedParts) {
      // Try to load texture, fallback to generated rect if missing
      const textureKey = `unit_${rig.id}_${part.name}`; // e.g. unit_soldier_head
      let image: Phaser.GameObjects.Image;

      if (scene.textures.exists(textureKey)) {
        image = new Phaser.GameObjects.Image(scene, 0, 0, textureKey);
      } else {
        // Create a fallback colored rect texture on the fly if needed
        const gfx = scene.add.graphics();
        gfx.setVisible(false);
        // Generate a random color based on part name hash for variety
        const hash = part.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const color = 0x888888 + (hash % 100) * 0x111111;
        gfx.fillStyle(color);
        gfx.fillRect(0, 0, 32, 32);
        gfx.generateTexture(textureKey, 32, 32);
        image = new Phaser.GameObjects.Image(scene, 0, 0, textureKey);
      }
      
      // Set pivot (0-1 to pixel)
      image.setOrigin(part.pivot.x, part.pivot.y);
      
      // Store reference
      this.parts.set(part.name, image);
      this.partDefs.set(part.name, part);
      this.add(image);

      // Store base pose
      this.basePose.set(part.name, {
        x: part.position.x,
        y: part.position.y,
        rotation: part.rotation,
        scaleX: part.scale.x,
        scaleY: part.scale.y
      });
    }

    // 3. Initial layout (apply base pose)
    this.updateLayout();
  }

  /**
   * Applies transforms based on hierarchy.
   */
  private updateLayout() {
    const processed = new Set<string>();
    const queue = Array.from(this.partDefs.values()).filter(p => !p.parent);

    // Initial transform for roots
    for (const root of queue) {
        this.applyTransform(root, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
        processed.add(root.name);
    }

    // Process children (multi-pass to handle depth)
    let safeCounter = 0;
    while (processed.size < this.partDefs.size && safeCounter++ < 100) {
        for (const part of this.partDefs.values()) {
            if (processed.has(part.name)) continue;
            if (part.parent && processed.has(part.parent)) {
                const parentImg = this.parts.get(part.parent)!;
                
                const parentState = {
                    x: parentImg.x,
                    y: parentImg.y,
                    rotation: parentImg.rotation, // radians
                    scaleX: parentImg.scaleX,
                    scaleY: parentImg.scaleY
                };
                
                this.applyTransform(part, parentState);
                processed.add(part.name);
            }
        }
    }
  }

  private applyTransform(part: RigPartDefinition, parentCtx: { x: number, y: number, rotation: number, scaleX: number, scaleY: number }) {
    const img = this.parts.get(part.name);
    if (!img) return;

    // Base pose
    const base = this.basePose.get(part.name)!;
    
    // Animation deltas
    const hasAnim = (prop: string) => this.currentAnim?.tracks.some(t => t.part === part.name && t.property === prop);

    const localX = hasAnim('x') ? this.getAnimValue(part.name, 'x', base.x) : base.x;
    const localY = hasAnim('y') ? this.getAnimValue(part.name, 'y', base.y) : base.y;
    const localRotDeg = hasAnim('rotation') ? this.getAnimValue(part.name, 'rotation', base.rotation) : base.rotation;
    const localSX = hasAnim('scaleX') ? this.getAnimValue(part.name, 'scaleX', base.scaleX) : base.scaleX;
    const localSY = hasAnim('scaleY') ? this.getAnimValue(part.name, 'scaleY', base.scaleY) : base.scaleY;
    
    // Local transform
    const localRot = Phaser.Math.DegToRad(localRotDeg);
    const totalRot = parentCtx.rotation + localRot;
    
    const totalScaleX = parentCtx.scaleX * localSX;
    const totalScaleY = parentCtx.scaleY * localSY;

    // Position: rotate offset by parent rotation
    const rad = parentCtx.rotation;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Apply parent scale to local position offset
    const rx = localX * parentCtx.scaleX;
    const ry = localY * parentCtx.scaleY;
    
    const tx = rx * cos - ry * sin;
    const ty = rx * sin + ry * cos;

    img.setPosition(parentCtx.x + tx, parentCtx.y + ty);
    img.setRotation(totalRot);
    img.setScale(totalScaleX, totalScaleY);
  }

  play(animName: string) {
    if (!this.animsData) return;
    const clip = this.animsData.animations.find(a => a.name === animName);
    if (!clip) {
      // console.warn(`Animation ${animName} not found`);
      return;
    }
    
    if (this.currentAnim === clip && this.animPlaying) return;

    this.currentAnim = clip;
    this.animTime = 0;
    this.animPlaying = true;
  }

  update(delta: number) {
    if (this.animPlaying && this.currentAnim) {
      this.animTime += delta;
      
      // Loop check
      if (this.animTime >= this.currentAnim.duration) {
        if (this.currentAnim.loop) {
          this.animTime %= this.currentAnim.duration;
        } else {
          this.animTime = this.currentAnim.duration;
          this.animPlaying = false;
        }
      }
      
      this.updateLayout();
    }
  }

  private getAnimValue(partName: string, prop: string, defaultValue: number): number {
    if (!this.currentAnim) return defaultValue;

    const track = this.currentAnim.tracks.find(t => t.part === partName && t.property === prop);
    if (!track || track.keyframes.length === 0) return defaultValue;

    let t = this.animTime / this.currentAnim.duration;
    if (t < 0) t = 0;
    if (t > 1) t = 1;

    let k1 = track.keyframes[0];
    let k2 = track.keyframes[0];

    for (let i = 0; i < track.keyframes.length; i++) {
        if (track.keyframes[i].time <= t) {
            k1 = track.keyframes[i];
        }
        if (track.keyframes[i].time >= t) {
            k2 = track.keyframes[i];
            break;
        }
    }

    if (k1 === k2) return k1.value;

    const duration = k2.time - k1.time;
    if (duration <= 0) return k1.value;

    const progress = (t - k1.time) / duration;
    // Todo: easing
    return k1.value + (k2.value - k1.value) * progress;
  }

  public getSocketWorldPosition(socketName: string): { x: number, y: number } | null {
    const socket = this.rig.sockets[socketName];
    if (!socket) return null;

    const part = this.parts.get(socket.part);
    if (!part) return null;

    // Part world transform (approximated from container local)
    // We need to apply part's transform to the socket offset
    
    const rad = part.rotation;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const ox = socket.offset.x * part.scaleX;
    const oy = socket.offset.y * part.scaleY;

    const tx = ox * cos - oy * sin;
    const ty = ox * sin + oy * cos;

    // Convert to world space
    // Since this UnitRig is a Container, we need its world transform
    const worldMatrix = this.getWorldTransformMatrix();
    
    const localX = part.x + tx;
    const localY = part.y + ty;

    const worldX = worldMatrix.tx + localX * worldMatrix.a + localY * worldMatrix.c;
    const worldY = worldMatrix.ty + localX * worldMatrix.b + localY * worldMatrix.d;

    return { x: worldX, y: worldY };
  }
}
