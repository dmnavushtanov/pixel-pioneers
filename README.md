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
```

## 🎨 Character Animation Pipeline

The game now uses a **Cutout-Rig System** for units (`UnitRig.ts`), replacing static sprites.

### Folder Structure

Each unit (e.g., `soldier`, `grunt`) is defined in `assets/units/{unit_id}/`:

```
assets/units/soldier/
  parts/                # PNG images for each body part
    head.png
    torso.png
    weapon.png
    ...
  rig.json              # Hierarchy, pivots, z-index
  animations.json       # Animation clips & keyframes
  manifest.json         # (Optional) Asset list
```

### 1. Rig Definition (`rig.json`)

Defines the skeleton structure. Each part has:
- `parent`: Name of parent part (defaults to root).
- `image`: Filename in `parts/`.
- `pivot`: Normalized (0-1) rotation point.
- `position`: Offset from parent.
- `zIndex`: Local sorting order.
- `sockets`: Attachment points for gameplay logic (e.g., `muzzle` for projectiles).

### 2. Animations (`animations.json`)

Contains named clips (e.g., `idle`, `shoot`, `move`).
- **Tracks**: Property overrides (`rotation`, `x`, `y`, `scale`) for specific parts.
- **Keyframes**: Time-stamped values interpolated at runtime.

### 3. Procedural Fallback

If assets are missing, `UnitLoader.ts` automatically generates:
- **Placeholder Textures**: Colored shapes based on part names (e.g., distinct colors for head vs torso).
- **Default Rigs/Anims**: Procedural definitions for 'soldier' and 'grunt' ensuring the game is always playable.

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

## 🔧 Tech Stack

Phaser 3 · TypeScript · Vite · React · Tailwind CSS
