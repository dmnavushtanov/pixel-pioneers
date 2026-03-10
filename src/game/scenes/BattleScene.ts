import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { Barricade } from '../entities/Barricade';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { LootSystem } from '../systems/LootSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { PLAYER_UNIT } from '../data/units';

/**
 * BattleScene: left-side barricade defense.
 * Player stands behind barricade, enemies assault from the right.
 */
export class BattleScene extends Phaser.Scene {
  public player!: PlayerUnit;
  public barricade!: Barricade;
  public combatSystem!: CombatSystem;
  public enemySystem!: EnemySystem;
  public lootSystem!: LootSystem;
  public upgradeSystem!: UpgradeSystem;
  public gameOver = false;

  /** X coordinate of the defense line */
  public defenseLineX = 0;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background — dark battlefield
    this.add.rectangle(w / 2, h / 2, w, h, 0x12121e);

    // Ground
    this.add.rectangle(w / 2, h - 12, w, 24, 0x1a1a14);
    // Dirt texture lines
    for (let i = 0; i < 8; i++) {
      const lx = Math.random() * w;
      this.add.rectangle(lx, h - 10 + Math.random() * 8, 30 + Math.random() * 40, 1, 0x2a2a1e);
    }

    // Defense line at ~25% from left
    this.defenseLineX = Math.floor(w * 0.22);

    // Dashed defense line visual
    const lineSegments = Math.floor(h / 16);
    for (let i = 0; i < lineSegments; i++) {
      if (i % 2 === 0) {
        this.add.rectangle(this.defenseLineX, i * 16 + 8, 2, 12, 0x334455, 0.3);
      }
    }

    // "No man's land" zone shading
    this.add.rectangle(
      this.defenseLineX + (w - this.defenseLineX) / 2,
      h / 2, w - this.defenseLineX, h, 0x1a0a0a, 0.15
    );

    // Barricade
    const barricadeTop = 40;
    const barricadeBottom = h - 40;
    this.barricade = new Barricade(this, this.defenseLineX, barricadeTop, barricadeBottom, 500);

    // Player behind barricade
    const playerX = this.defenseLineX - 40;
    this.player = new PlayerUnit(this, playerX, h / 2, PLAYER_UNIT);

    // Range indicator (only into the battlefield)
    this.add.circle(playerX, h / 2, this.player.getEffectiveRange(), 0xffffff, 0.02);

    // Systems
    this.combatSystem = new CombatSystem(this);
    this.enemySystem = new EnemySystem(this, this.defenseLineX);

    this.lootSystem = new LootSystem(this, (gold) => {
      this.events.emit('goldChanged', gold);
    });

    this.upgradeSystem = new UpgradeSystem((tierName, kills) => {
      this.events.emit('unitUpgraded', tierName, kills);
    });

    this.gameOver = false;

    // Launch UI overlay
    this.scene.launch('UIScene', { battleScene: this });
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;

    // Update enemy spawning and movement
    this.enemySystem.update(delta, this.player.x, this.player.y);

    // Run combat (enemies attack barricade/player)
    const killed = this.combatSystem.update(
      this.player,
      this.enemySystem.enemies,
      delta,
      this.barricade
    );

    // Handle killed enemies
    for (const enemy of killed) {
      this.upgradeSystem.registerKill(this.player, enemy);
      this.lootSystem.spawnLoot(enemy);
      enemy.playDeath();
      this.enemySystem.removeEnemy(enemy);
      this.events.emit('killsChanged', this.player.kills);
    }

    // Emit HUD updates
    this.events.emit('healthChanged', this.player.currentHealth, this.player.effectiveStats.maxHealth);
    this.events.emit('barricadeChanged', this.barricade.currentHealth, this.barricade.maxHealth);

    // Check defeat: player dead
    if (this.player.currentHealth <= 0) {
      this.gameOver = true;
      this.events.emit('gameOver', this.player.kills, this.lootSystem.totalGold);
    }

    // Cleanup
    this.lootSystem.cleanup();
    this.enemySystem.cleanup();
  }
}
