# Auto Battle — Barricade Defense Prototype

A mobile-first 2D side-view auto-battle / tower defense browser game built with **Phaser 3 + TypeScript + Vite + React**.

## 🎮 Game Concept

- **Defenders** are stationed on the left behind a **barricade line** (sandbags, crates, props).
- **Enemies** swarm from the right in large groups across **3 combat lanes**.
- **Combat** is automated: defenders auto-fire at the closest enemies in range.
- Enemies attack the **defense line** first; if breached, they attack defenders directly.
- Killed enemies **drop gold coins** — tap them to collect.
- Defenders **auto-upgrade** (Veteran → Elite → Champion) based on kill thresholds.
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
│   │   ├── enemies.ts          # Enemy type definitions
│   │   ├── units.ts            # Player unit + upgrade tiers
│   │   └── weapons.ts          # Weapon configs (musket, rifle)
│   ├── entities/
│   │   ├── Barricade.ts        # Defense line with HP and props
│   │   ├── DefenderSlot.ts     # Station for player units
│   │   ├── EnemyUnit.ts        # Enemy with silhouette + movement
│   │   ├── LootDrop.ts         # Tappable gold coin
│   │   ├── PlayerUnit.ts       # Defender with auto-attack + upgrades
│   │   └── Projectile.ts       # Bullet with effects
│   ├── scenes/
│   │   ├── BootScene.ts        # Asset loading
│   │   ├── MenuScene.ts        # Title screen
│   │   ├── BattleScene.ts      # Config-driven battlefield
│   │   └── UIScene.ts          # HUD overlay
│   ├── systems/
│   │   ├── CombatSystem.ts     # Multi-unit targeting + projectiles
│   │   ├── EnemySystem.ts      # Config-driven wave spawning
│   │   ├── LootSystem.ts       # Loot drops + tap-to-collect
│   │   ├── UpgradeSystem.ts    # Kill tracking + tier progression
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
        └── layout.json         # Example layout config (also mirrored in code)
```

## 🗺️ Battlefield System

### How It Works

Battlefields are **config-driven**. All gameplay positions (defender slots, barricade, lanes, spawn zones) come from a **layout config**, not from hardcoded scene values.

The background image is **visual only** — it does not affect gameplay positions.

### Folder Structure

Each battlefield lives in:

```
assets/battlefields/{battlefield_id}/
  background.png    # Visual background (any landscape image)
  layout.json       # Gameplay positions and bounds
  foreground.png    # (optional) overlay layer
  props.json        # (optional) decorative props
```

An example `layout.json` is at `public/battlefields/desert_outpost/layout.json`.

### Layout Config Format

All positions in `layout.json` are **normalized (0-1)** relative to `worldBounds`. BattleScene converts them to pixel coordinates at runtime based on actual screen size. This makes layouts resolution-independent.

| Field | Purpose |
|-------|---------|
| `worldBounds` | Design resolution (e.g. 800×450) |
| `backgroundKey` | Phaser asset key for the background image |
| `barricade` | Defense line X position, top/bottom Y, HP |
| `defenderSlots[]` | Position, lane index, unlock state for each slot |
| `spawnZones[]` | Rect where enemies spawn + which lanes they feed |
| `lanes[]` | Ground Y position and depth scale per lane |
| `lootBounds` | Area where loot drops can appear |
| `enemyStopLineX` | X position where enemies stop to attack |
| `propAnchors[]` | Decorative prop positions |
| `cameraSafeArea` | HUD-safe margins |

### Adding a New Battlefield

1. Create `src/game/data/battlefields/my_new_map.ts` with a `BattlefieldLayout` export
2. Register it in `src/game/data/battlefields/index.ts`
3. Optionally create `public/battlefields/my_new_map/layout.json` and `background.png`
4. Change `DEFAULT_BATTLEFIELD_ID` or pass `battlefieldId` to BattleScene

### Type Interfaces

| Interface | File | Purpose |
|-----------|------|---------|
| `BattlefieldDefinition` | `BattlefieldDefinition.ts` | Top-level battlefield with folder path + layout |
| `BattlefieldLayout` | `BattlefieldDefinition.ts` | All gameplay positions and bounds |
| `DefenderSlotDefinition` | `BattlefieldDefinition.ts` | Slot position + lane + unlock state |
| `SpawnZoneDefinition` | `BattlefieldDefinition.ts` | Enemy spawn rect + lane mappings |
| `BarricadeDefinition` | `BattlefieldDefinition.ts` | Defense line position + HP |
| `LaneDefinition` | `BattlefieldDefinition.ts` | Lane Y position + depth scale |

## 🎨 Character Renderer Architecture

### Current: Placeholder Silhouettes

Units are rendered as modular silhouette shapes (head, torso, legs, accent, weapon) built from Phaser primitives. This is designed to be replaceable.

### Future: Cutout-Rig Assets

Each unit will load from:

```
assets/units/{unit_id}/
  parts/           # Individual body part images
  rig.json         # Skeletal hierarchy + pivots
  animations.json  # Named animation tracks
```

Interfaces ready for this:
- `UnitRenderDefinition` — render mode (placeholder vs rig), colors, muzzle offset
- `UnitAssetManifest` — folder path, part keys, capability flags
- `RigDefinition` — skeletal hierarchy with named parts
- `AnimationSet` — named animation tracks with keyframes

## 📱 Mobile Features

- **Responsive**: Layout scales to any screen via normalized coordinates
- **Fullscreen**: Native browser fullscreen support
- **Touch-First**: Tap-to-collect loot, readable HUD

## 🚀 Running

```bash
npm install
npm run dev
```

## 🔧 Tech Stack

Phaser 3 · TypeScript · Vite · React · Tailwind CSS
