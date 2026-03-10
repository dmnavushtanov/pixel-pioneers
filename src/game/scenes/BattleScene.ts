import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { Barricade } from '../entities/Barricade';
import { DefenderSlot } from '../entities/DefenderSlot';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { LootSystem } from '../systems/LootSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { PLAYER_UNIT } from '../data/units';

/**
 * BattleScene: 2D side-view barricade defense battlefield.
 */
export class BattleScene extends Phaser.Scene {
  public slots: DefenderSlot[] = [];
  public barricade!: Barricade;
  public combatSystem!: CombatSystem;
  public enemySystem!: EnemySystem;
  public lootSystem!: LootSystem;
  public upgradeSystem!: UpgradeSystem;
  public gameOver = false;

  public defenseLineX = 0;
  public lanesY: number[] = [];

  constructor() {
    super({ key: 'BattleScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // 1. Battlefield Composition: Layers and Lanes
    this.createBackground(w, h);
    
    // Define 3 combat lanes
    const laneHeight = h * 0.2;
    const centerY = h * 0.5;
    this.lanesY = [
      centerY - laneHeight,
      centerY,
      centerY + laneHeight
    ];

    // Defense line at ~25% from left
    this.defenseLineX = Math.floor(w * 0.25);

    // 2. Barricade / Defense Line
    this.barricade = new Barricade(this, this.defenseLineX, this.lanesY[0] - 40, this.lanesY[2] + 40, 1000);

    // 3. Defender Layout: Support multiple slots
    this.slots = [];
    for (let i = 0; i < 3; i++) {
      const slotX = this.defenseLineX - 50 - (i % 2 === 0 ? 0 : 20); // Zig-zag placement
      const slot = new DefenderSlot(this, slotX, this.lanesY[i], i, i);
      slot.setUnit(PLAYER_UNIT);
      this.slots.push(slot);
    }

    // 4. Systems
    this.combatSystem = new CombatSystem(this);
    this.enemySystem = new EnemySystem(this, this.defenseLineX, this.lanesY);

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

  private createBackground(w: number, h: number) {
    // Background — dark battlefield dirt/mud
    this.add.rectangle(w / 2, h / 2, w, h, 0x1e1e1a);

    // Grid-like perspective lines for depth feeling
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2a2a24, 0.4);
    for (let i = 0; i < 10; i++) {
      const ly = (h / 10) * i;
      graphics.lineBetween(0, ly, w, ly);
    }
    
    // Environmental props (broken stuff, debris)
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const scale = 0.5 + (py / h) * 0.5;
      
      const debris = this.add.circle(px, py, 2 + Math.random() * 4, 0x111111, 0.2);
      debris.setScale(scale);
      debris.setDepth(py / 10);
    }

    // "No man's land" shading
    const nml = this.add.rectangle(w * 0.6, h / 2, w * 0.7, h, 0x000000, 0.1);
    nml.setDepth(0);
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;

    // Update enemy spawning and movement
    this.enemySystem.update(delta, this.defenseLineX, 0); // targetX is defense line

    // Run combat for each defender
    const allDefenders = this.slots.map(s => s.unit).filter((u): u is PlayerUnit => u !== null);
    
    const killed = this.combatSystem.update(
      allDefenders,
      this.enemySystem.enemies,
      delta,
      this.barricade
    );

    // Handle killed enemies
    for (const enemy of killed) {
      // Find the defender who got the kill (currently combatSystem doesn't track this easily, 
      // let's just give it to the first one for now or keep a simple global kills)
      // Actually, let's just use the first defender for kill tracking in this simple refactor
      if (allDefenders.length > 0) {
        this.upgradeSystem.registerKill(allDefenders[0], enemy);
        this.events.emit('killsChanged', allDefenders[0].kills);
      }
      
      this.lootSystem.spawnLoot(enemy);
      enemy.playDeath();
      this.enemySystem.removeEnemy(enemy);
    }

    // Emit HUD updates
    const avgHealth = allDefenders.reduce((sum, d) => sum + d.currentHealth, 0);
    const maxHealth = allDefenders.reduce((sum, d) => sum + d.effectiveStats.maxHealth, 0);
    
    this.events.emit('healthChanged', avgHealth, maxHealth);
    this.events.emit('barricadeChanged', this.barricade.currentHealth, this.barricade.maxHealth);

    // Check defeat: all defenders dead or barricade gone (user choice: let's say barricade + defenders)
    const allDead = allDefenders.every(d => d.currentHealth <= 0);
    if (allDead) {
      this.gameOver = true;
      const totalKills = allDefenders.reduce((sum, d) => sum + d.kills, 0);
      this.events.emit('gameOver', totalKills, this.lootSystem.totalGold);
    }

    // Cleanup
    this.lootSystem.cleanup();
    this.enemySystem.cleanup();
  }
}
