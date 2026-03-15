import Phaser from 'phaser';
import type { UnitDefinition, UnitStats } from '../types';
import type { WeaponConfig } from '../types/WeaponDefinition';
import { WEAPONS } from '../data/weapons';
import { UnitRig } from './UnitRig';
import { UnitLoader } from '../systems/UnitLoader';

/**
 * Player unit: stationary auto-attacker with cutout rig animation.
 * Supports reload state for muzzle-loading weapons.
 */
export class PlayerUnit extends Phaser.GameObjects.Container {
  public def: UnitDefinition;
  public currentHealth: number;
  public kills = 0;
  public currentTier = 0;
  public effectiveStats: UnitStats;
  public weapon: WeaponConfig;
  public attackCooldown = 0;
  public isReloading = false;

  private rig?: UnitRig;
  private glowGfx: Phaser.GameObjects.Arc;
  private tierLabel: Phaser.GameObjects.Text;
  private reloadTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: UnitDefinition) {
    super(scene, x, y);
    this.def = def;
    this.currentHealth = def.baseStats.maxHealth;
    this.effectiveStats = { ...def.baseStats };
    this.weapon = WEAPONS[def.weaponId] ?? Object.values(WEAPONS)[0];

    this.glowGfx = new Phaser.GameObjects.Arc(scene, 0, 0, 30, 0, 360, false, def.color, 0.15);
    this.tierLabel = new Phaser.GameObjects.Text(scene, 0, -55, def.name, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#00000088',
    }).setOrigin(0.5);

    this.add([this.glowGfx, this.tierLabel]);
    scene.add.existing(this);

    this.loadRig();
  }

  private loadRig() {
    const loader = new UnitLoader(this.scene);
    const rigId = this.def.rigId ?? 'bulgarian_rifleman';
    const data = loader.loadUnit(rigId);

    this.rig = new UnitRig(this.scene, 0, 0, data.rig, data.anims);
    this.addAt(this.rig, 1);
    this.rig.play('idle');
  }

  playShootAnimation() {
    if (this.rig) {
      this.rig.play('shoot');
      // Return to idle after shoot animation
      const shootDuration = this.weapon.visualGroup === 'muzzle_loading' ? 350 : 200;
      this.scene.time.delayedCall(shootDuration, () => {
        if (this.rig && !this.isReloading) this.rig.play('idle');
      });
    }
  }

  /** Start reload sequence — used by CombatSystem after firing muzzle-loaders */
  startReload(duration: number) {
    this.isReloading = true;
    this.reloadTimer = duration * 1000; // convert to ms

    // Play reload animation after a short delay (let shoot finish)
    this.scene.time.delayedCall(350, () => {
      if (this.rig && this.isReloading) {
        const clipName = this.weapon.reloadStyle === 'barrel' ? 'reload_muzzle' : 'reload_simple';
        this.rig.play(clipName);
      }
    });
  }

  update(time: number, delta: number) {
    if (this.rig) this.rig.update(delta);

    // Handle reload timer
    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        if (this.rig) this.rig.play('idle');
      }
    }
  }

  addKill() {
    this.kills++;
    this.checkUpgrade();
  }

  private checkUpgrade() {
    const tiers = this.def.upgradeTiers;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (this.kills >= tiers[i].killThreshold && this.currentTier <= i) {
        this.currentTier = i + 1;
        this.applyUpgrade(i);
        break;
      }
    }
  }

  private applyUpgrade(tierIndex: number) {
    const tier = this.def.upgradeTiers[tierIndex];
    const base = this.def.baseStats;
    this.effectiveStats = {
      maxHealth: base.maxHealth * (tier.statMultipliers.maxHealth ?? 1),
      damage: base.damage * (tier.statMultipliers.damage ?? 1),
      attackSpeed: base.attackSpeed * (tier.statMultipliers.attackSpeed ?? 1),
      range: base.range * (tier.statMultipliers.range ?? 1),
      moveSpeed: base.moveSpeed * (tier.statMultipliers.moveSpeed ?? 1),
    };
    this.currentHealth = this.effectiveStats.maxHealth;
    this.tierLabel.setText(`${this.def.name} [${tier.name}]`);
    if (tier.glowColor) {
      this.glowGfx.setFillStyle(tier.glowColor, 0.4);
      this.scene.tweens.add({
        targets: this.glowGfx,
        scale: 1.8,
        duration: 500,
        yoyo: true,
      });
    }
  }

  takeDamage(amount: number): boolean {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    if (this.rig) {
      this.scene.tweens.add({ targets: this.rig, alpha: 0.5, duration: 50, yoyo: true });
    }
    return this.currentHealth <= 0;
  }

  /** Direct weapon damage */
  getEffectiveDamage(): number {
    return this.weapon.damage + this.effectiveStats.damage;
  }

  getEffectiveRange(): number {
    return this.weapon.range;
  }

  getEffectiveAttackSpeed(): number {
    return 1 / this.weapon.fireRate;
  }

  getMuzzlePosition(): { x: number; y: number } {
    if (this.rig) {
      const socket = this.rig.getSocketWorldPosition('muzzle');
      if (socket) return socket;
    }
    const matrix = this.getWorldTransformMatrix();
    return { x: matrix.tx + 20, y: matrix.ty };
  }
}
