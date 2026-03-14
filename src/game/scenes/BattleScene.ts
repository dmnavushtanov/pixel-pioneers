import Phaser from 'phaser';
import { PlayerUnit } from '../entities/PlayerUnit';
import { Barricade } from '../entities/Barricade';
import { DefenderSlot } from '../entities/DefenderSlot';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { LootSystem } from '../systems/LootSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { AbilitySystem } from '../systems/AbilitySystem';
import { PLAYER_UNIT } from '../data/units';
import { getBattlefield, DEFAULT_BATTLEFIELD_ID } from '../data/battlefields';
import type { BattlefieldLayout } from '../types/BattlefieldDefinition';

/**
 * BattleScene: config-driven barricade defense battlefield with wave progression.
 * Orchestrates systems — does not contain gameplay rules.
 */
export class BattleScene extends Phaser.Scene {
  public slots: DefenderSlot[] = [];
  public barricade!: Barricade;
  public combatSystem!: CombatSystem;
  public waveSystem!: WaveSystem;
  public lootSystem!: LootSystem;
  public upgradeSystem!: UpgradeSystem;
  public abilitySystem!: AbilitySystem;
  public gameOver = false;

  public defenseLineX = 0;
  public lanesY: number[] = [];
  
  private timeScale = 1;
  private layout!: BattlefieldLayout;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data?: { battlefieldId?: string }) {
    const id = data?.battlefieldId ?? DEFAULT_BATTLEFIELD_ID;
    this.layout = getBattlefield(id).layout;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const layout = this.layout;

    // 1. Background
    this.createBackground(w, h);

    // 2. Lanes from config
    this.lanesY = layout.lanes
      .sort((a, b) => a.index - b.index)
      .map(lane => Math.floor(lane.groundY * h));

    // 3. Defense line
    this.defenseLineX = Math.floor(layout.barricade.lineX * w);

    // 4. Barricade
    const barricadeTopY = Math.floor(layout.barricade.topY * h);
    const barricadeBottomY = Math.floor(layout.barricade.bottomY * h);
    this.barricade = new Barricade(this, this.defenseLineX, barricadeTopY, barricadeBottomY, layout.barricade.health);

    // 5. Defender slots
    this.slots = [];
    for (const slotDef of layout.defenderSlots) {
      if (!slotDef.unlockedByDefault) continue;
      const slotX = Math.floor(slotDef.position.x * w);
      const slotY = Math.floor(slotDef.position.y * h);
      const slot = new DefenderSlot(this, slotX, slotY, layout.defenderSlots.indexOf(slotDef), slotDef.laneIndex);
      slot.setUnit(PLAYER_UNIT);
      this.slots.push(slot);
    }

    // 6. Spawn zones
    const spawnZone = layout.spawnZones[0];
    const spawnMinX = Math.floor(spawnZone.rect.x * w);
    const spawnMaxX = Math.floor((spawnZone.rect.x + spawnZone.rect.width) * w);
    const enemyStopX = Math.floor(layout.enemyStopLineX * w);

    // 7. Systems
    this.combatSystem = new CombatSystem(this);
    this.waveSystem = new WaveSystem(this, enemyStopX, this.lanesY, spawnMinX, spawnMaxX);
    this.lootSystem = new LootSystem(this, (gold) => {
      this.events.emit('goldChanged', gold);
    });
    this.upgradeSystem = new UpgradeSystem((tierName, kills) => {
      this.events.emit('unitUpgraded', tierName, kills);
    });
    this.abilitySystem = new AbilitySystem(this);

    this.gameOver = false;

    // Game speed control
    this.events.on('changeSpeed', (multiplier: number) => {
      this.timeScale = multiplier;
      this.time.timeScale = multiplier;
      this.tweens.timeScale = multiplier;
    });

    // Launch UI overlay
    this.scene.launch('UIScene', { battleScene: this });
  }

  private createBackground(w: number, h: number) {
    this.add.rectangle(w / 2, h / 2, w, h, 0x1e1e1a);
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2a2a24, 0.4);
    for (let i = 0; i < 10; i++) {
      const ly = (h / 10) * i;
      graphics.lineBetween(0, ly, w, ly);
    }
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const scale = 0.5 + (py / h) * 0.5;
      const debris = this.add.circle(px, py, 2 + Math.random() * 4, 0x111111, 0.2);
      debris.setScale(scale);
      debris.setDepth(py / 10);
    }
    const nml = this.add.rectangle(w * 0.6, h / 2, w * 0.7, h, 0x000000, 0.1);
    nml.setDepth(0);

    if (this.layout.propAnchors) {
      for (const prop of this.layout.propAnchors) {
        const px = prop.position.x * w;
        const py = prop.position.y * h;
        const propGfx = this.add.rectangle(px, py, 14, 14, 0x5d4037, 0.4);
        propGfx.setStrokeStyle(1, 0x3e2723);
        propGfx.setAngle(Math.random() * 30 - 15);
        propGfx.setScale(prop.scale);
        propGfx.setDepth(py / 10);
      }
    }
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return;

    // Apply manual time scaling to delta for systems
    const scaledDelta = delta * this.timeScale;

    // Update systems
    this.waveSystem.update(scaledDelta);
    this.abilitySystem.update(scaledDelta);

    const allDefenders = this.slots.map(s => s.unit).filter((u): u is PlayerUnit => u !== null);

    const killed = this.combatSystem.update(
      allDefenders,
      this.waveSystem.enemies,
      scaledDelta,
      this.barricade
    );

    for (const enemy of killed) {
      if (allDefenders.length > 0) {
        this.upgradeSystem.registerKill(allDefenders[0], enemy);
        this.events.emit('killsChanged', allDefenders[0].kills);
      }
      this.lootSystem.spawnLoot(enemy);
      enemy.playDeath();
      this.waveSystem.removeEnemy(enemy);
    }

    // Emit state to HUD
    const avgHealth = allDefenders.reduce((sum, d) => sum + d.currentHealth, 0);
    const maxHealth = allDefenders.reduce((sum, d) => sum + d.effectiveStats.maxHealth, 0);
    this.events.emit('healthChanged', avgHealth, maxHealth);
    this.events.emit('barricadeChanged', this.barricade.currentHealth, this.barricade.maxHealth);
    this.events.emit('waveState', this.waveSystem.state, this.waveSystem.currentWave + 1, this.waveSystem.enemiesRemaining, this.waveSystem.stateTimer);

    // Check game over
    const allDead = allDefenders.every(d => d.currentHealth <= 0);
    if (allDead || this.barricade.isDestroyed) {
      this.gameOver = true;
      this.waveSystem.setDefeated();
      const totalKills = allDefenders.reduce((sum, d) => sum + d.kills, 0);
      this.events.emit('gameOver', totalKills, this.lootSystem.totalGold, this.waveSystem.currentWave + 1);
    }

    this.lootSystem.cleanup();
    this.waveSystem.cleanup();
  }
}
