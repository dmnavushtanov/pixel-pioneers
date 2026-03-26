import Phaser from 'phaser';
import type { RigDefinition, RigPartDefinition } from '../types/RigDefinition';
import type { AnimationSet, AnimationClip } from '../types/AnimationDefinition';

/** Default display sizes for parts when not specified in rig.json */
const DEFAULT_PART_SIZES: Record<string, { width: number; height: number }> = {
  head:      { width: 22, height: 22 },
  torso:     { width: 29, height: 36 },
  left_arm:  { width: 18, height: 22 },
  right_arm: { width: 18, height: 22 },
  left_leg:  { width: 15, height: 28 },
  right_leg: { width: 15, height: 28 },
  weapon:    { width: 46, height: 11 },
};

/**
 * UnitRig: Renders a cutout character from RigDefinition + optional AnimationSet.
 * Handles hierarchy, pivots, display sizing, and animation playback.
 */
export class UnitRig extends Phaser.GameObjects.Container {
  public rig: RigDefinition;
  private animsData?: AnimationSet;
  private parts: Map<string, Phaser.GameObjects.Image> = new Map();
  private partDefs: Map<string, RigPartDefinition> = new Map();
  private currentAnim?: AnimationClip;
  private animTime = 0;
  private animPlaying = false;
  private basePose: Map<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number }> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number, rig: RigDefinition, anims?: AnimationSet) {
    super(scene, x, y);
    this.rig = rig;
    this.animsData = anims;

    const sortedParts = [...rig.parts].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    for (const part of sortedParts) {
      const textureKey = `unit_${rig.id}_${part.name}`;
      let image: Phaser.GameObjects.Image;

      if (scene.textures.exists(textureKey)) {
        image = new Phaser.GameObjects.Image(scene, 0, 0, textureKey);
      } else {
        // Fallback colored rect
        const gfx = scene.add.graphics();
        gfx.setVisible(false);
        const hash = part.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const color = 0x888888 + (hash % 100) * 0x010101;
        const ds = part.displaySize ?? DEFAULT_PART_SIZES[part.name] ?? { width: 20, height: 20 };
        gfx.fillStyle(color);
        if (part.name.includes('head')) gfx.fillCircle(ds.width / 2, ds.height / 2, ds.width / 2);
        else gfx.fillRect(0, 0, ds.width, ds.height);
        gfx.generateTexture(textureKey, ds.width, ds.height);
        gfx.destroy();
        image = new Phaser.GameObjects.Image(scene, 0, 0, textureKey);
      }

      // Apply display size — scale large PNGs down to gameplay size
      const ds = part.displaySize ?? DEFAULT_PART_SIZES[part.name];
      if (ds) {
        image.setDisplaySize(ds.width, ds.height);
      }

      image.setOrigin(part.pivot.x, part.pivot.y);

      this.parts.set(part.name, image);
      this.partDefs.set(part.name, part);
      this.add(image);

      this.basePose.set(part.name, {
        x: part.position.x,
        y: part.position.y,
        rotation: part.rotation,
        scaleX: part.scale.x,
        scaleY: part.scale.y,
      });
    }

    this.updateLayout();
  }

  private updateLayout() {
    const processed = new Set<string>();
    const roots = Array.from(this.partDefs.values()).filter(p => !p.parent);

    for (const root of roots) {
      this.applyTransform(root, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
      processed.add(root.name);
    }

    let safeCounter = 0;
    while (processed.size < this.partDefs.size && safeCounter++ < 100) {
      for (const part of this.partDefs.values()) {
        if (processed.has(part.name)) continue;
        if (part.parent && processed.has(part.parent)) {
          const parentImg = this.parts.get(part.parent)!;
          this.applyTransform(part, {
            x: parentImg.x,
            y: parentImg.y,
            rotation: parentImg.rotation,
            scaleX: 1, // Don't compound scale — displaySize handles sizing
            scaleY: 1,
          });
          processed.add(part.name);
        }
      }
    }
  }

  private applyTransform(
    part: RigPartDefinition,
    parentCtx: { x: number; y: number; rotation: number; scaleX: number; scaleY: number }
  ) {
    const img = this.parts.get(part.name);
    if (!img) return;

    const base = this.basePose.get(part.name)!;

    const localX = this.getAnimValueOr(part.name, 'x', base.x);
    const localY = this.getAnimValueOr(part.name, 'y', base.y);
    const localRotDeg = this.getAnimValueOr(part.name, 'rotation', base.rotation);

    const localRot = Phaser.Math.DegToRad(localRotDeg);
    const totalRot = parentCtx.rotation + localRot;

    const rad = parentCtx.rotation;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const tx = localX * cos - localY * sin;
    const ty = localX * sin + localY * cos;

    img.setPosition(parentCtx.x + tx, parentCtx.y + ty);
    img.setRotation(totalRot);
  }

  private getAnimValueOr(partName: string, prop: string, defaultValue: number): number {
    if (!this.currentAnim) return defaultValue;
    const track = this.currentAnim.tracks.find(t => t.part === partName && t.property === prop);
    if (!track || track.keyframes.length === 0) return defaultValue;

    let t = this.animTime / this.currentAnim.duration;
    t = Math.max(0, Math.min(1, t));

    let k1 = track.keyframes[0];
    let k2 = track.keyframes[0];
    for (let i = 0; i < track.keyframes.length; i++) {
      if (track.keyframes[i].time <= t) k1 = track.keyframes[i];
      if (track.keyframes[i].time >= t) { k2 = track.keyframes[i]; break; }
    }
    if (k1 === k2) return k1.value;
    const dur = k2.time - k1.time;
    if (dur <= 0) return k1.value;
    const progress = (t - k1.time) / dur;
    return k1.value + (k2.value - k1.value) * progress;
  }

  play(animName: string) {
    if (!this.animsData) return;
    const clip = this.animsData.animations.find(a => a.name === animName);
    if (!clip) return;
    if (this.currentAnim === clip && this.animPlaying) return;
    this.currentAnim = clip;
    this.animTime = 0;
    this.animPlaying = true;
  }

  update(delta: number) {
    if (this.animPlaying && this.currentAnim) {
      this.animTime += delta;
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

  public getSocketWorldPosition(socketName: string): { x: number; y: number } | null {
    const socket = this.rig.sockets[socketName];
    if (!socket) return null;
    const part = this.parts.get(socket.part);
    if (!part) return null;

    const rad = part.rotation;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Socket offset is in display-space pixels
    const ox = socket.offset.x;
    const oy = socket.offset.y;
    const tx = ox * cos - oy * sin;
    const ty = ox * sin + oy * cos;

    const worldMatrix = this.getWorldTransformMatrix();
    const localX = part.x + tx;
    const localY = part.y + ty;

    return {
      x: worldMatrix.tx + localX * worldMatrix.a + localY * worldMatrix.c,
      y: worldMatrix.ty + localX * worldMatrix.b + localY * worldMatrix.d,
    };
  }
}
