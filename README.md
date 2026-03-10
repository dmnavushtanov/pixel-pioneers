# Auto Battle — Tower Defense Prototype

A mobile-first 2D auto-battle / tower defense browser game built with **Phaser 3 + TypeScript + Vite + React**.

## 🎮 Game Concept

- A **player unit** stands on the left and **auto-attacks** enemies approaching from the right
- **Enemies** spawn in waves with increasing frequency
- Killed enemies **drop gold coins** — tap them to collect
- The player unit **auto-upgrades** at kill thresholds (Veteran → Elite → Champion)
- Game ends when the player's HP reaches zero

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
│   │   ├── EnemyUnit.ts        # Enemy with HP bar, movement, damage flash
│   │   ├── LootDrop.ts         # Tappable gold coin with bounce animation
│   │   ├── PlayerUnit.ts       # Player with auto-attack, upgrades, weapon
│   │   └── Projectile.ts       # Bullet that flies toward target
│   ├── scenes/                 # Phaser scenes (game screens)
│   │   ├── BootScene.ts        # Asset loading + loading bar
│   │   ├── MenuScene.ts        # Title screen + play/fullscreen buttons
│   │   ├── BattleScene.ts      # Main gameplay loop (orchestrates systems)
│   │   └── UIScene.ts          # HUD overlay (gold, kills, HP, game over)
│   ├── systems/                # Game logic systems (ECS-like)
│   │   ├── CombatSystem.ts     # Auto-targeting, projectiles, damage
│   │   ├── EnemySystem.ts      # Wave spawning + enemy movement
│   │   ├── LootSystem.ts       # Loot drops + tap-to-collect
│   │   ├── UpgradeSystem.ts    # Kill tracking + tier progression
│   │   ├── AnimationSystem.ts  # Stub for future cutout-rig animations
│   │   └── index.ts            # System barrel export
│   └── types/                  # TypeScript interfaces
│       ├── UnitDefinition.ts   # Player unit stats, upgrade tiers
│       ├── WeaponDefinition.ts # Weapon + projectile config
│       ├── EnemyDefinition.ts  # Enemy stats + gold drop range
│       ├── RigDefinition.ts    # Cutout-rig skeleton hierarchy
│       ├── AnimationDefinition.ts # Keyframe animation tracks
│       └── index.ts            # Type barrel export
├── pages/
│   └── Index.tsx               # React wrapper that mounts Phaser game
└── ...                         # Standard React + shadcn scaffolding
```

## 📁 File Details

### Types (`src/game/types/`)

| File | Purpose |
|------|---------|
| `UnitDefinition.ts` | `UnitDefinition` interface with base stats, color, weapon reference, and `UpgradeTier[]` for kill-based progression |
| `WeaponDefinition.ts` | `WeaponDefinition` with damage multiplier, range, attack speed, and `ProjectileConfig` (speed, size, color, trail) |
| `EnemyDefinition.ts` | `EnemyDefinition` with health, damage, speed, gold drop range, and placeholder visuals |
| `RigDefinition.ts` | `RigDefinition` for future cutout animation — defines a tree of `RigPart` nodes (head, torso, arms, legs, weapon) with pivots, offsets, z-order |
| `AnimationDefinition.ts` | `AnimationDefinition` with keyframe tracks per rig part — supports rotation, translation, scale, easing, looping |

### Data (`src/game/data/`)

| File | Purpose |
|------|---------|
| `weapons.ts` | Two weapon configs: **musket** (slow, high damage) and **rifle** (fast, moderate damage) |
| `enemies.ts` | Three enemy types: **grunt** (standard), **brute** (tanky), **runner** (fast, fragile) |
| `units.ts` | Player unit with 3 upgrade tiers at 5/15/30 kills with stat multipliers |

### Entities (`src/game/entities/`)

| File | Purpose |
|------|---------|
| `PlayerUnit.ts` | Stationary unit with auto-attack cooldown, weapon recoil animation, kill-based upgrades with glow effects |
| `EnemyUnit.ts` | Moves toward player, has HP bar, damage flash, death tween animation |
| `LootDrop.ts` | Gold coin with bounce-in animation, tap-to-collect with scale tween, auto-despawn after 8s |
| `Projectile.ts` | Flies from player to target position at weapon speed, self-destructs on arrival |

### Systems (`src/game/systems/`)

| File | Purpose |
|------|---------|
| `CombatSystem.ts` | Finds closest enemy in range, spawns projectiles on cooldown, resolves projectile hits, handles enemy melee attacks |
| `EnemySystem.ts` | Spawns random enemy types from the right edge on a timer, moves them toward player, increases difficulty every 10 spawns |
| `LootSystem.ts` | Creates `LootDrop` on enemy death, wires tap-to-collect, tracks total gold, emits change events |
| `UpgradeSystem.ts` | Registers kills on player unit, detects tier changes, emits upgrade events |
| `AnimationSystem.ts` | Stub for future cutout-rig playback — registers rigs and animation sets, provides `play()` API |

### Scenes (`src/game/scenes/`)

| File | Purpose |
|------|---------|
| `BootScene.ts` | Shows loading bar, transitions to MenuScene (ready for future asset loading) |
| `MenuScene.ts` | Title screen with PLAY button, fullscreen toggle, controls hint |
| `BattleScene.ts` | Main game loop — creates player, initializes all systems, orchestrates update cycle, emits UI events |
| `UIScene.ts` | HUD overlay running parallel to BattleScene — displays gold, kills, HP bar, upgrade flash, game-over screen with retry |

## 🎨 Animation Architecture (Future-Ready)

The codebase is designed for **cutout-rig animation** where each unit has:

```
assets/units/{unit_id}/
├── parts/
│   ├── head.png, torso.png, upper_arm_front.png, lower_arm_front.png
│   ├── hand_front.png, upper_arm_back.png, lower_arm_back.png
│   ├── hand_back.png, hips.png, leg_front.png, leg_back.png
│   └── weapon.png
├── rig.json         # RigDefinition — part hierarchy with pivots
└── animations.json  # AnimationSet — named animations with keyframe tracks
```

## 🚀 Running

```bash
npm install
npm run dev
```

## 📱 Mobile Features

- **Responsive**: Phaser `RESIZE` scale mode fills any screen
- **Fullscreen**: Toggle button on menu and in-game HUD
- **Touch**: Tap gold coins to collect, multi-touch supported

## 🔧 Tech Stack

Phaser 3 · TypeScript · Vite · React · Tailwind CSS

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
