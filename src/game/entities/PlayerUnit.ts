import Phaser from 'phaser';
import type { UnitDefinition, UnitStats, WeaponDefinition } from '../types';
import { WEAPONS } from '../data/weapons';

/**
 * Player unit: stationary auto-attacker with visual placeholder.
 * Supports upgrade tiers and weapon swapping.
 */
export class PlayerUnit extends Phaser.GameObjects.Container {
  public def: UnitDefinition;
  public currentHealth: number;
  public kills = 0;
  public currentTier = 0;
  public effectiveStats: UnitStats;
  public weapon: WeaponDefinition;
  public attackCooldown = 0;

  private body_gfx: Phaser.GameObjects.Arc;
  private weaponGfx: Phaser.GameObjects.Rectangle;
  private glowGfx: Phaser.GameObjects.Arc;
  private tierLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, def: UnitDefinition) {
    super(scene, x, y);
    this.def = def;
    this.currentHealth = def.baseStats.maxHealth;
    this.effectiveStats = { ...def.baseStats };
    this.weapon = WEAPONS[def.weaponId];

    // Glow
    this.glowGfx = new Phaser.GameObjects.Arc(scene, 0, 0, 24, 0, 360, false, def.color, 0.2);

    // Body
    this.body_gfx = new Phaser.GameObjects.Arc(scene, 0, 0, 16, 0, 360, false, def.color);

    // Weapon stub
    this.weaponGfx = new Phaser.GameObjects.Rectangle(
      scene, 18, 0, this.weapon.length, 4, this.weapon.color
    );

    // Tier label
    this.tierLabel = new Phaser.GameObjects.Text(scene, 0, -28, def.name, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add([this.glowGfx, this.body_gfx, this.weaponGfx, this.tierLabel]);
    scene.add.existing(this);
  }

  /** Simple shoot animation: weapon recoil */
  playShootAnimation() {
    this.scene.tweens.add({
      targets: this.weaponGfx,
      x: 24,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
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

    // Visual upgrade feedback
    this.tierLabel.setText(`${this.def.name} [${tier.name}]`);
    if (tier.glowColor) {
      this.glowGfx.setFillStyle(tier.glowColor, 0.35);
      this.scene.tweens.add({
        targets: this.glowGfx,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        yoyo: true,
      });
    }
  }

  takeDamage(amount: number): boolean {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    if (this.currentHealth <= 0) return true;
    return false;
  }

  getEffectiveDamage(): number {
    return this.effectiveStats.damage * this.weapon.damageMultiplier;
  }

  getEffectiveRange(): number {
    return this.weapon.range;
  }

  getEffectiveAttackSpeed(): number {
    return this.effectiveStats.attackSpeed * (this.weapon.attackSpeed / this.def.baseStats.attackSpeed);
  }
}
