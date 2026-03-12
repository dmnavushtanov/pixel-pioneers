# Auto Battle — Barricade Defense Prototype

A mobile-first 2D side-view auto-battle / tower defense browser game built with **Phaser 3 + TypeScript + Vite + React**.

## 🎮 Game Concept

- **Defenders** are stationed on the left behind a **barricade line** (sandbags, crates, props).
- **Enemies** swarm from the right in **config-driven waves** across **3 combat lanes**.
- **Combat** is automated: defenders auto-fire at the closest enemies in range.
- Enemies attack the **defense line** first; if breached, they attack defenders directly.
- Killed enemies **drop gold coins** — tap them to collect.
- **Spend gold** to repair/reinforce the barricade or call artillery strikes.
- Defenders **auto-upgrade** (Veteran → Elite → Champion) based on kill thresholds.
- **Waves** increase in difficulty with scaling multipliers and more enemy groups.
- Game ends when all defenders are defeated or the defense line is destroyed.

## 🏗️ Project Structure

```
src/
├── game/
│   ├── config.ts               # Phaser game config + bootstrap
│   ├── data/
│   │   ├── battlefields/       # Battlefield registry and configs
│   │   │   ├── index.ts        # Battlefield registry + getBattlefield()
│   │   │   └── desert_outpost.ts  # Desert Outpost layout config
│   │   ├── enemies.ts          # Enemy type definitions (grunt, brute, runner)
│   │   ├── units.ts            # Player unit + upgrade tiers
│   │   ├── weapons.ts          # Weapon configs (musket, rifle)
│   │   ├── waves.ts            # Wave definitions + procedural scaling
│   │   └── economy.ts          # Ability costs, repair/reinforce values
│   ├── entities/
│   │   ├── Barricade.ts        # Defense line with HP, repair, reinforce, damage states
│   │   ├── DefenderSlot.ts     # Station for player units
│   │   ├── EnemyUnit.ts        # Enemy with silhouette + movement
│   │   ├── LootDrop.ts         # Tappable gold coin
│   │   ├── PlayerUnit.ts       # Defender with auto-attack + upgrades
│   │   └── Projectile.ts       # Bullet with effects
│   ├── scenes/
│   │   ├── BootScene.ts        # Asset loading
│   │   ├── MenuScene.ts        # Title screen
│   │   ├── BattleScene.ts      # Config-driven battlefield orchestrator
│   │   └── UIScene.ts          # HUD: wave info, resources, action bar, game over
│   ├── systems/
│   │   ├── CombatSystem.ts     # Multi-unit targeting + projectiles
│   │   ├── WaveSystem.ts       # Config-driven wave spawning + progression
│   │   ├── LootSystem.ts       # Loot drops + tap-to-collect
│   │   ├── UpgradeSystem.ts    # Kill tracking + tier progression
│   │   ├── AbilitySystem.ts    # Player abilities: repair, reinforce, artillery
│   │   ├── AnimationSystem.ts  # Future cutout-rig animation stub
│   │   └── index.ts            # Barrel export
│   └── types/
│       ├── BattlefieldDefinition.ts  # Battlefield config interfaces
│       ├── UnitRenderDefinition.ts   # Future unit renderer types
│       ├── UnitDefinition.ts
│       ├── WeaponDefinition.ts
│       ├── EnemyDefinition.ts
│       ├── RigDefinition.ts
│       ├── AnimationDefinition.ts
│       └── index.ts
public/
└── battlefields/
    └── desert_outpost/
        └── layout.json         # Example layout config
```

## 🗺️ Battlefield System

### How It Works

Battlefields are **config-driven**. All gameplay positions come from a **layout config**, not from hardcoded scene values. The background image is **visual only**.

### Folder Structure

Each battlefield lives in:

```
assets/battlefields/{battlefield_id}/
  background.png    # Visual background (any landscape image)
  layout.json       # Gameplay positions and bounds
  foreground.png    # (optional) overlay layer
  props.json        # (optional) decorative props
```

### Layout Config Format

All positions in `layout.json` are **normalized (0-1)** relative to `worldBounds`. BattleScene converts them to pixel coordinates at runtime.

| Field | Purpose |
|-------|---------|
| `worldBounds` | Design resolution (e.g. 800×450) |
| `backgroundKey` | Phaser asset key for background |
| `barricade` | Defense line X, top/bottom Y, HP |
| `defenderSlots[]` | Position, lane index, unlock state |
| `spawnZones[]` | Rect where enemies spawn + lane mappings |
| `lanes[]` | Ground Y position and depth scale per lane |
| `lootBounds` | Area where loot drops appear |
| `enemyStopLineX` | X where enemies stop to attack |
| `propAnchors[]` | Decorative prop positions |
| `cameraSafeArea` | HUD-safe margins |

### Adding a New Battlefield

1. Create `src/game/data/battlefields/my_map.ts` with a `BattlefieldLayout` export
2. Register it in `src/game/data/battlefields/index.ts`
3. Optionally add `public/battlefields/my_map/layout.json` and `background.png`
4. Change `DEFAULT_BATTLEFIELD_ID` or pass `battlefieldId` to BattleScene

## ⚔️ Wave System

### Architecture

Waves are defined in `src/game/data/waves.ts` as config arrays. Each wave specifies:

| Field | Purpose |
|-------|---------|
| `wave` | Wave number (1-indexed display) |
| `preWaveDelay` | Ms before wave starts |
| `groups[]` | Enemy spawn groups |
| `scalingMultiplier` | Stat scaling applied to all enemies |

Each **enemy group** defines:
- `enemyId` — which enemy type to spawn
- `count` — how many
- `spawnInterval` — ms between spawns
- `startDelay` — ms before this group starts
- `laneIndices` — optional lane restriction

### Procedural Scaling

Waves beyond the defined 7 are procedurally generated with increasing enemy counts and stat multipliers.

### Wave States

`WaveSystem` cycles through: `pre_wave` → `active` → `rest` → repeat. On defeat: `defeated`.

### Tuning

Edit `src/game/data/waves.ts` to change wave composition, timing, and difficulty curve.

## 💰 Economy & Spending

### Gold Loop

Enemies drop gold → player taps to collect → spend on abilities.

### Actions (in `src/game/data/economy.ts`)

| Action | Cost | Cooldown | Effect |
|--------|------|----------|--------|
| 🔧 REPAIR | 15g | 3s | Restore 100 barricade HP |
| 🛡 REINFORCE | 40g | 15s | +100 max barricade HP |
| 💥 ARTILLERY | 25g | 10s | Bombard lane for 60 damage |

### Tuning Economy

Edit `ECONOMY` and `ACTIONS` in `src/game/data/economy.ts`.

## 🏰 Barricade Progression

The barricade has **three visual damage states**:

| State | HP Range | Visual |
|-------|----------|--------|
| Healthy | >60% | Normal gray wall |
| Damaged | 30-60% | Brown tint, 2 crack lines |
| Critical | <30% | Red tint, 5 crack lines |

**Repair** restores HP (green flash). **Reinforce** adds max HP (blue flash).

## 🎯 Active Ability: Artillery Strike

- Targets the lane with the most enemies automatically
- Deals 60 damage to all enemies within radius
- 5 sequential explosion VFX along the lane
- Cost: 25 gold, 10s cooldown

## 📊 HUD Elements

| Position | Content |
|----------|---------|
| Top-left | Gold + kill count |
| Top-center | Wave number, state (INCOMING/ENGAGE/REST), enemy count |
| Top-right | Defender HP bar, Barricade HP bar (color-coded) |
| Bottom-center | Action bar: Repair, Reinforce, Artillery |
| Bottom-right | Fullscreen toggle |

## 🎨 Character Renderer Architecture

### Current: Placeholder Silhouettes

Units use modular silhouette shapes (head, torso, legs, accent, weapon). Supports:
- Muzzle flash, recoil animation, hit flash
- Tier glow + label on upgrade
- Depth sorting by Y position

### Future: Cutout-Rig Assets

Each unit will load from `assets/units/{unit_id}/` with `parts/`, `rig.json`, `animations.json`.

## 📱 Mobile Features

- **Responsive**: Normalized coordinates scale to any screen
- **Fullscreen**: Native browser fullscreen support
- **Touch-First**: Tap-to-collect loot, action bar buttons

## 🚀 Running

```bash
npm install
npm run dev
```

## 🔧 Tech Stack

Phaser 3 · TypeScript · Vite · React · Tailwind CSS

## 🔮 What Remains Stubbed/Future-Ready

- Background image loading (currently procedural)
- Cutout-rig character assets
- Shop UI (currently simple action bar)
- Sound effects
- Save/load system
- Multiple unit types per battle
- Victory condition (max wave count)
