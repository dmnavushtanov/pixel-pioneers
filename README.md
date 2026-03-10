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
├── game/                       # All Phaser game code (decoupled from React)
│   ├── config.ts               # Phaser game config + bootstrap function
│   ├── data/                   # Static game data configs
│   │   ├── enemies.ts          # Enemy type definitions (grunt, brute, runner)
│   │   ├── units.ts            # Player unit definition + upgrade tiers
│   │   └── weapons.ts          # Weapon configs (musket, rifle)
│   ├── entities/               # Game object classes (Phaser GameObjects)
│   │   ├── Barricade.ts        # Defense line with integrity bar and props
│   │   ├── DefenderSlot.ts     # Station for player units with cover visuals
│   │   ├── EnemyUnit.ts        # Enemy with silhouette, movement, and HP bar
│   │   ├── LootDrop.ts         # Tappable gold coin with bounce animation
│   │   ├── PlayerUnit.ts       # Defender silhouette with auto-attack and upgrades
│   │   └── Projectile.ts       # Bullet with muzzle flash and impact effects
│   ├── scenes/                 # Phaser scenes (game screens)
│   │   ├── BootScene.ts        # Asset loading + loading bar
│   │   ├── MenuScene.ts        # Title screen + play/fullscreen buttons
│   │   ├── BattleScene.ts      # Main loop (lanes, slots, systems orchestration)
│   │   └── UIScene.ts          # Modern HUD (resource panel, health panel, pressure)
│   ├── systems/                # Game logic systems
│   │   ├── CombatSystem.ts     # Multi-unit targeting, projectiles, damage
│   │   ├── EnemySystem.ts      # Lane-based wave spawning + swarm movement
│   │   ├── LootSystem.ts       # Loot drops + tap-to-collect
│   │   ├── UpgradeSystem.ts    # Kill tracking + tier progression
│   │   ├── AnimationSystem.ts  # Stub for future cutout-rig animations
│   │   └── index.ts            # System barrel export
│   └── types/                  # TypeScript interfaces
└── ...                         # Standard React + shadcn scaffolding
```

## 📁 File Details

### Entities (`src/game/entities/`)

| File | Purpose |
|------|---------|
| `Barricade.ts` | Represents the front line. Visualized with layered sandbags and crates. |
| `DefenderSlot.ts` | Fixed positions for defenders. Provides visual cover and depth layering. |
| `PlayerUnit.ts` | Cartoon-style silhouette with weapon recoil and tier-based glow effects. |
| `EnemyUnit.ts` | Swarm units with bobbing walk animations and colored team accents. |

### Systems (`src/game/systems/`)

| File | Purpose |
|------|---------|
| `CombatSystem.ts` | Manages multi-defender auto-targeting, world-space projectiles, and impact effects. |
| `EnemySystem.ts` | Handles randomized lane-based spawning and difficulty scaling. |
| `LootSystem.ts` | Manages coin drops on death and resource collection events. |

### Scenes (`src/game/scenes/`)

| File | Purpose |
|------|---------|
| `BattleScene.ts` | Sets up the side-view battlefield with 3 lanes and 3 defender slots. |
| `UIScene.ts` | HUD with overlay panels for resources, integrity bars, and wave pressure. |

## 🎨 Animation Architecture (Future-Ready)

The codebase supports **cutout-rig animation** where each unit has:
- `RigDefinition`: Part hierarchy (head, torso, arms, etc.) with pivots.
- `AnimationSet`: Named tracks for rotation, translation, and scaling.

## 🚀 Running

```bash
npm install
npm run dev
```

## 📱 Mobile Features

- **Responsive**: Landscape layout designed for mobile readability.
- **Fullscreen**: Native browser fullscreen support.
- **Touch-First**: High-readability UI and tap-to-collect mechanics.

## 🔧 Tech Stack

Phaser 3 · TypeScript · Vite · React · Tailwind CSS
