import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { LootSystem } from '../systems/LootSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { PLAYER_UNIT } from '../data/units';

/**
 * BattleScene: main gameplay scene. Runs combat, enemies, loot, upgrades.
 * Launches UIScene as an overlay.
 */
export class BattleScene extends Phaser.Scene {
  public player!: PlayerUnit;
  public combatSystem!: CombatSystem;
  public enemySystem!: EnemySystem;
  public lootSystem!: LootSystem;
  public upgradeSystem!: UpgradeSystem;
  public gameOver = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0x1a1a2e);

    // Ground line
    this.add.rectangle(w / 2, h - 20, w, 2, 0x333355);

    // Player unit positioned on the left
    this.player = new PlayerUnit(this, 80, h / 2, PLAYER_UNIT);

    // Range indicator
    const rangeCircle = this.add.circle(80, h / 2, this.player.getEffectiveRange(), 0xffffff, 0.03);

    // Systems
    this.combatSystem = new CombatSystem(this);
    this.enemySystem = new EnemySystem(this);

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

    // Run combat
    const killed = this.combatSystem.update(
      this.player,
      this.enemySystem.enemies,
      delta
    );

    // Handle killed enemies
    for (const enemy of killed) {
      this.upgradeSystem.registerKill(this.player, enemy);
      this.lootSystem.spawnLoot(enemy);
      enemy.playDeath();
      this.enemySystem.removeEnemy(enemy);
      this.events.emit('killsChanged', this.player.kills);
    }

    // Emit health updates
    this.events.emit('healthChanged', this.player.currentHealth, this.player.effectiveStats.maxHealth);

    // Check player death
    if (this.player.currentHealth <= 0) {
      this.gameOver = true;
      this.events.emit('gameOver', this.player.kills, this.lootSystem.totalGold);
    }

    // Cleanup
    this.lootSystem.cleanup();
    this.enemySystem.cleanup();
  }
}
