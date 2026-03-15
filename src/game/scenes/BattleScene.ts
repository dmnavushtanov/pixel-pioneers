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
    // Sky gradient — warm historical atmosphere
    const skyGfx = this.add.graphics();
    skyGfx.fillGradientStyle(0x8b9dc3, 0x8b9dc3, 0xc4a882, 0xc4a882, 1);
    skyGfx.fillRect(0, 0, w, h * 0.45);
    skyGfx.setDepth(0);

    // Ground — earthy brown field
    const groundGfx = this.add.graphics();
    groundGfx.fillGradientStyle(0x6b5b3a, 0x6b5b3a, 0x5a4a2e, 0x5a4a2e, 1);
    groundGfx.fillRect(0, h * 0.35, w, h * 0.65);
    groundGfx.setDepth(0);

    // Horizon line — subtle transition
    const horizonGfx = this.add.graphics();
    horizonGfx.fillGradientStyle(0x7a6a4a, 0x7a6a4a, 0x6b5b3a, 0x6b5b3a, 0.6);
    horizonGfx.fillRect(0, h * 0.33, w, h * 0.14);
    horizonGfx.setDepth(0);

    // Distant hills / treeline silhouette
    const hillsGfx = this.add.graphics();
    hillsGfx.fillStyle(0x4a5a3a, 0.4);
    hillsGfx.beginPath();
    hillsGfx.moveTo(0, h * 0.4);
    for (let x = 0; x <= w; x += 40) {
      const hillY = h * 0.38 + Math.sin(x * 0.008) * 12 + Math.sin(x * 0.02) * 6;
      hillsGfx.lineTo(x, hillY);
    }
    hillsGfx.lineTo(w, h * 0.45);
    hillsGfx.lineTo(0, h * 0.45);
    hillsGfx.closePath();
    hillsGfx.fill();
    hillsGfx.setDepth(0);

    // Ground texture — subtle dust/dirt spots
    const dustGfx = this.add.graphics();
    dustGfx.setDepth(1);
    for (let i = 0; i < 60; i++) {
      const dx = Math.random() * w;
      const dy = h * 0.4 + Math.random() * h * 0.55;
      const radius = 1 + Math.random() * 3;
      const alpha = 0.05 + Math.random() * 0.1;
      const shade = Math.random() > 0.5 ? 0x5a4a2e : 0x7a6a4a;
      dustGfx.fillStyle(shade, alpha);
      dustGfx.fillCircle(dx, dy, radius);
    }

    // Lane readability — very subtle ground variations
    for (const lane of this.layout.lanes) {
      const ly = lane.groundY * h;
      const laneGfx = this.add.graphics();
      laneGfx.fillStyle(0x5a4a2e, 0.15);
      laneGfx.fillRect(0, ly - 15, w, 30);
      laneGfx.setDepth(1);
    }

    // Barricade-area ground scuffs
    const scuffGfx = this.add.graphics();
    scuffGfx.setDepth(1);
    const bx = this.layout.barricade.lineX * w;
    for (let i = 0; i < 12; i++) {
      const sx = bx + (Math.random() - 0.5) * 60 - 20;
      const sy = h * 0.3 + Math.random() * h * 0.5;
      scuffGfx.fillStyle(0x4a3a1e, 0.15);
      scuffGfx.fillRect(sx, sy, 8 + Math.random() * 15, 2 + Math.random() * 3);
    }

    // Simple defensive props near barricade
    if (this.layout.propAnchors) {
      for (const prop of this.layout.propAnchors) {
        const px = prop.position.x * w;
        const py = prop.position.y * h;
        this.createProp(px, py, prop.scale, prop.id);
      }
    }

    // Extra sandbags near barricade base
    for (let i = 0; i < 4; i++) {
      const sbx = bx - 30 - Math.random() * 20;
      const sby = h * 0.28 + (i / 3) * h * 0.52;
      this.createSandbag(sbx, sby);
    }
  }

  private createProp(x: number, y: number, scale: number, id: string) {
    if (id.includes('barrel')) {
      // Wooden barrel
      const barrel = this.add.graphics();
      barrel.fillStyle(0x5d4037);
      barrel.fillEllipse(x, y, 14 * scale, 18 * scale);
      barrel.lineStyle(1, 0x3e2723);
      barrel.strokeEllipse(x, y, 14 * scale, 18 * scale);
      // Bands
      barrel.lineStyle(1, 0x2a1a0a);
      barrel.lineBetween(x - 6 * scale, y - 3, x + 6 * scale, y - 3);
      barrel.lineBetween(x - 6 * scale, y + 3, x + 6 * scale, y + 3);
      barrel.setDepth(y / 10 + 2);
    } else if (id.includes('crate')) {
      // Wooden crate
      const crate = this.add.rectangle(x, y, 16 * scale, 14 * scale, 0x6d5037)
        .setStrokeStyle(1, 0x3e2723).setAngle(Math.random() * 10 - 5);
      crate.setDepth(y / 10 + 2);
      // Cross planks
      const plankGfx = this.add.graphics();
      plankGfx.lineStyle(1, 0x3e2723, 0.4);
      plankGfx.lineBetween(x - 6, y - 5, x + 6, y + 5);
      plankGfx.lineBetween(x + 6, y - 5, x - 6, y + 5);
      plankGfx.setDepth(y / 10 + 2);
    } else {
      // Generic debris
      this.add.rectangle(x, y, 10 * scale, 10 * scale, 0x5d4037, 0.5)
        .setAngle(Math.random() * 30).setDepth(y / 10 + 2);
    }
  }

  private createSandbag(x: number, y: number) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x8b7d5b, 0.7);
    gfx.fillEllipse(x, y, 18, 8);
    gfx.lineStyle(1, 0x6b5d3b, 0.5);
    gfx.strokeEllipse(x, y, 18, 8);
    gfx.setDepth(y / 10 + 3);
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
