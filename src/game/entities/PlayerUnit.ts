import Phaser from 'phaser';
import type { UnitDefinition, UnitStats, WeaponDefinition } from '../types';
import { WEAPONS } from '../data/weapons';

/**
 * Player unit: stationary auto-attacker with visual silhouette.
 */
export class PlayerUnit extends Phaser.GameObjects.Container {
  public def: UnitDefinition;
  public currentHealth: number;
  public kills = 0;
  public currentTier = 0;
  public effectiveStats: UnitStats;
  public weapon: WeaponDefinition;
  public attackCooldown = 0;

  private bodyGfx: Phaser.GameObjects.Container;
  private weaponGfx: Phaser.GameObjects.Rectangle;
  private glowGfx: Phaser.GameObjects.Arc;
  private tierLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, def: UnitDefinition) {
    super(scene, x, y);
    this.def = def;
    this.currentHealth = def.baseStats.maxHealth;
    this.effectiveStats = { ...def.baseStats };
    this.weapon = WEAPONS[def.weaponId];

    // Glow for tier upgrades
    this.glowGfx = new Phaser.GameObjects.Arc(scene, 0, 0, 30, 0, 360, false, def.color, 0.15);

    // Character Silhouette (Cartoon style)
    this.bodyGfx = new Phaser.GameObjects.Container(scene, 0, 0);
    
    // Head
    const head = new Phaser.GameObjects.Arc(scene, 0, -18, 10, 0, 360, false, 0x111111);
    // Torso
    const torso = new Phaser.GameObjects.Rectangle(scene, 0, 0, 20, 28, 0x111111);
    // Legs
    const legL = new Phaser.GameObjects.Rectangle(scene, -6, 14, 8, 14, 0x111111);
    const legR = new Phaser.GameObjects.Rectangle(scene, 6, 14, 8, 14, 0x111111);
    
    // Add colored accent (team color)
    const accent = new Phaser.GameObjects.Rectangle(scene, 0, -2, 16, 6, def.color);

    this.bodyGfx.add([legL, legR, torso, head, accent]);

    // Weapon stub
    this.weaponGfx = new Phaser.GameObjects.Rectangle(
      scene, 12, 0, this.weapon.length, 6, 0x333333
    ).setOrigin(0, 0.5);

    // Tier label
    this.tierLabel = new Phaser.GameObjects.Text(scene, 0, -45, def.name, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#00000088'
    }).setOrigin(0.5);

    this.add([this.glowGfx, this.bodyGfx, this.weaponGfx, this.tierLabel]);
    scene.add.existing(this);
  }

  playShootAnimation() {
    this.scene.tweens.add({
      targets: this.weaponGfx,
      x: 8,
      duration: 50,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    // Slight body kickback
    this.scene.tweens.add({
      targets: this.bodyGfx,
      x: -2,
      duration: 50,
      yoyo: true,
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
    // Heal on upgrade
    this.currentHealth = this.effectiveStats.maxHealth;

    // Visual upgrade feedback
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
    
    // Flash effect
    this.scene.tweens.add({
      targets: this.bodyGfx,
      alpha: 0.5,
      duration: 50,
      yoyo: true
    });

    return this.currentHealth <= 0;
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
