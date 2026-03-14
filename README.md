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
│   │   ├── enemies.ts          # Enemy type definitions
│   │   ├── units.ts            # Player unit + upgrade tiers
│   │   ├── weapons.ts          # Weapon configs
│   │   ├── waves.ts            # Wave definitions
│   │   └── economy.ts          # Ability costs
│   ├── entities/
│   │   ├── Barricade.ts        # Defense line
│   │   ├── DefenderSlot.ts     # Station for player units
│   │   ├── EnemyUnit.ts        # Enemy with UnitRig
│   │   ├── PlayerUnit.ts       # Defender with UnitRig
│   │   └── UnitRig.ts          # Cutout character renderer
│   ├── scenes/                 # Boot, Menu, Battle, UI
│   ├── systems/
│   │   ├── UnitLoader.ts       # Asset loader & procedural generator
│   │   ├── CombatSystem.ts     # Targeting & projectiles
│   │   ├── WaveSystem.ts       # Spawning logic
│   │   └── ...
│   └── types/
│       ├── RigDefinition.ts    # Part hierarchy & sockets
│       ├── AnimationDefinition.ts # Keyframe tracks
│       └── ...
public/
├── assets/
│   └── units/                  # Unit cutout part assets
│       ├── bulgarian_rifleman/ # Defender faction
│       │   ├── parts/          # PNG body parts
│       │   ├── rig.json        # Skeleton hierarchy
│       │   ├── animations.json # Animation clips
│       │   └── manifest.json   # Asset list
│       └── ottoman_rifleman/   # Attacker faction
│           ├── parts/
│           ├── rig.json
│           ├── animations.json
│           └── manifest.json
├── battlefields/
│   └── desert_outpost/
│       └── layout.json
```

## 🎨 Character Animation Pipeline

The game uses a **Cutout-Rig System** for units (`UnitRig.ts`), replacing static sprites.

### Unit Folder Structure

Each unit is defined in `public/assets/units/{unit_id}/`:

```
public/assets/units/bulgarian_rifleman/
  parts/                # PNG images for each body part
    head.png
    torso.png
    left_arm.png
    right_arm.png
    left_leg.png
    right_leg.png
    weapon.png
  rig.json              # Hierarchy, pivots, z-index, sockets
  animations.json       # Animation clips & keyframes
  manifest.json         # Asset list and metadata
```

### Standard Parts (7 per unit)

| Part | Purpose |
|------|---------|
| `head` | Head with headwear (kalpak/fez) |
| `torso` | Upper body with jacket |
| `left_arm` | Left arm (support arm) |
| `right_arm` | Right arm (weapon arm) |
| `left_leg` | Left leg |
| `right_leg` | Right leg |
| `weapon` | Rifle or melee weapon |

### Rig Hierarchy

```
root
 ├─ torso (pivot: lower center)
 │   ├─ head (pivot: neck area)
 │   ├─ left_arm (pivot: shoulder)
 │   ├─ right_arm (pivot: shoulder)
 │   └─ weapon (pivot: grip, child of right_arm)
 ├─ left_leg (pivot: hip)
 └─ right_leg (pivot: hip)
```

### Rig Definition (`rig.json`)

Each part has:
- `parent`: Name of parent part (root if undefined)
- `image`: Filename in `parts/`
- `pivot`: Normalized (0-1) rotation point
- `position`: Offset from parent
- `rotation`: Base rotation in degrees
- `scale`: Base scale
- `zIndex`: Local sorting order
- `sockets`: Attachment points (e.g., `muzzle` for projectiles)

### Animations (`animations.json`)

Contains named clips: `idle`, `move`, `shoot`, `attack`, `death`.
- **Tracks**: Property overrides (`rotation`, `x`, `y`, `scaleX`, `scaleY`) for specific parts
- **Keyframes**: Time-stamped values (0-1 normalized) interpolated at runtime

| Animation | Duration | Loop | Purpose |
|-----------|----------|------|---------|
| `idle` | 1000-1200ms | Yes | Subtle breathing/sway |
| `move` | 500-600ms | Yes | Walking cycle |
| `shoot` | 200-250ms | No | Recoil from weapon |
| `attack` | 400-500ms | No | Melee strike |
| `death` | 600ms | No | Fall/collapse |

### Procedural Fallback

If assets are missing, `UnitLoader.ts` automatically generates colored placeholder shapes, ensuring the game is always playable.

### How to Add a New Unit

1. Create folder: `public/assets/units/{unit_id}/parts/`
2. Add 7 PNG body part images (transparent background)
3. Create `rig.json` with part hierarchy and pivots
4. Create `animations.json` with animation clips
5. Create `manifest.json` listing all parts
6. Add the unit ID to `BootScene.ts` `UNIT_IDS` array
7. Reference `rigId` in the unit/enemy definition data

### Factions

| Faction | Color Palette | Style |
|---------|-------------|-------|
| **Bulgarian** (defenders) | Browns, muted blues, earthy | Insurgent/chetnik militia |
| **Ottoman** (attackers) | Dark blue, red piping, fez | Formal military |

## 🗺️ Battlefield System

### How It Works

Battlefields are **config-driven**. All gameplay positions come from a **layout config**.

### Layout Config (`BattlefieldLayout`)

All positions in the layout are **normalized (0-1)** relative to the world bounds.

| Field | Purpose |
|-------|---------|
| `barricade` | Defines X line, top/bottom Y bounds, and base HP. |
| `defenderSlots[]` | Positions, lane indices, and initial lock state for player units. |
| `spawnZones[]` | Rectangular areas where enemies spawn. |
| `lanes[]` | Vertical positions and depth scaling for the 3 combat lanes. |
| `enemyStopLineX` | The X coordinate where enemies stop to attack the barricade. |

## ⚔️ Wave System

### Architecture

`WaveSystem` manages the lifecycle: `pre_wave` → `active` → `rest`.
Waves are config-driven (groups, counts, intervals) with procedural scaling for infinite play.

## 💰 Economy & Spending

Enemies drop gold → Collect → Spend on:
- 🔧 **Repair**: Restore barricade HP.
- 🛡 **Reinforce**: Increase max barricade HP.
- 💥 **Artillery**: Damage all enemies in a lane.

## 🏰 Barricade Progression

Visual damage states change based on HP:
- **Healthy** (>60%): Clean wall.
- **Damaged** (30-60%): Cracks appear.
- **Critical** (<30%): Red tint, heavy damage.

## 📊 HUD Elements (`UIScene`)

- **Top-Left**: Gold balance and total kill count.
- **Top-Center**: Wave status (Number, State, Remaining enemies/Countdown).
- **Top-Right**: Defender aggregate HP and Barricade integrity bars.
- **Bottom-Center**: **Action Bar** for abilities (Repair, Reinforce, Artillery).
- **Bottom-Right**: **Speed Controls** (1x, 2x, 3x) and Fullscreen toggle.

## 🚀 Running

```bash
npm install
npm run dev
```

## 📱 Mobile Features

- **Responsive**: Normalized coordinates scale to any screen size (Landscape).
- **Fullscreen**: Interactive toggle in the HUD.
- **Touch**: Tap-to-collect loot and tactile action buttons.

## 🔮 Phase 2 Upgrades (Future)

- Separate hat/beard parts for distinct silhouettes
- Upper/lower arm split for better shooting poses
- Upper/lower leg split for smoother walk cycles
- Melee weapon secondary parts (bayonet, sword)
- Rider + horse split rig (ottoman_horseman)
- Multiple battlefield backgrounds with different layouts

## 🔧 Tech Stack

Phaser 3 · TypeScript · Vite · React · Tailwind CSS
