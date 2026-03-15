# Auto Battle — Barricade Defense Prototype

A mobile-first 2D side-view auto-battle / tower defense browser game built with **Phaser 3 + TypeScript + Vite + React**.

## 🎮 Game Concept

- **Defenders** are stationed on the left behind a **barricade line**.
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
src/game/
├── config.ts                # Phaser game config + bootstrap
├── data/
│   ├── battlefields/        # Battlefield registry and configs
│   ├── enemies.ts           # Enemy type definitions
│   ├── units.ts             # Player unit + upgrade tiers
│   ├── weapons.ts           # Weapon configs (WeaponConfig[])
│   ├── waves.ts             # Wave definitions
│   └── economy.ts           # Ability costs
├── entities/
│   ├── Barricade.ts         # Destructible defense line
│   ├── DefenderSlot.ts      # Station for player units
│   ├── EnemyUnit.ts         # Enemy with UnitRig
│   ├── PlayerUnit.ts        # Defender with UnitRig + weapon
│   ├── Projectile.ts        # Generic projectile
│   └── UnitRig.ts           # Cutout character renderer
├── scenes/                  # Boot, Menu, Battle, UI
├── systems/
│   ├── UnitLoader.ts        # Asset loader & procedural fallback
│   ├── CombatSystem.ts      # Targeting, projectiles, melee
│   ├── WaveSystem.ts        # Spawning logic
│   ├── UpgradeSystem.ts     # Kill-based progression
│   ├── LootSystem.ts        # Gold drops & collection
│   ├── AbilitySystem.ts     # Player abilities (artillery, repair)
│   └── AnimationSystem.ts   # Animation utilities
└── types/
    ├── RigDefinition.ts     # Part hierarchy, sockets, displaySize
    ├── AnimationDefinition.ts # Keyframe animation tracks
    ├── WeaponDefinition.ts  # WeaponConfig + ProjectileConfig
    ├── UnitDefinition.ts    # Unit stats, upgrades
    ├── EnemyDefinition.ts   # Enemy stats, loot
    ├── BattlefieldDefinition.ts # Layout types
    └── UnitRenderDefinition.ts  # Future render modes

public/assets/
├── units/                   # Unit cutout part assets
│   ├── bulgarian_rifleman/
│   │   ├── parts/           # PNG body parts
│   │   ├── rig.json         # Skeleton hierarchy + displaySize
│   │   ├── animations.json  # Animation clips
│   │   └── manifest.json    # Asset list
│   └── ottoman_rifleman/
│       └── ... (same structure)
└── battlefields/
    └── desert_outpost/
        └── layout.json
```

---

## 🔫 Weapon System

### How It Works

Weapons use a **simple flat config** (`WeaponConfig`). No multipliers, no deep inheritance — just direct values.

### `WeaponConfig` Interface

```typescript
interface WeaponConfig {
  id: string;           // Internal key
  name: string;         // Display name
  type: WeaponType;     // 'pistol' | 'musket' | 'rifle' | 'repeater'
  damage: number;       // Damage per shot
  range: number;        // Attack range (pixels)
  fireRate: number;     // Seconds between shots
  reloadTime: number;   // Reload duration (future use)
  projectileSpeed: number; // Pixels/sec
  accuracy: number;     // 0-1 (1 = perfect, affects spread)
  unlockLevel: number;  // Available at this wave/level
  sprite: string;       // Visual key reference
}
```

### Available Weapons (ordered by progression)

| Weapon | Type | Damage | Range | Fire Rate | Accuracy | Unlock |
|--------|------|--------|-------|-----------|----------|--------|
| Flintlock Pistol | pistol | 8 | 180 | 1.2s | 0.60 | 0 |
| Flintlock Musket | musket | 14 | 260 | 1.8s | 0.65 | 1 |
| Caplock Musket | musket | 16 | 280 | 1.5s | 0.70 | 3 |
| Krynka Rifle | rifle | 22 | 340 | 1.4s | 0.80 | 5 |
| Winchester 1866 | repeater | 12 | 300 | 0.6s | 0.75 | 8 |
| Peabody-Martini | rifle | 30 | 380 | 1.6s | 0.85 | 12 |

### Weapon Progression

- `getBestWeaponForLevel(level)` — returns the best weapon available at a given wave
- `getWeaponProgression()` — returns all weapons sorted by unlock level
- Units reference weapons by `weaponId` in their definition

### How Combat Uses Weapons

1. `PlayerUnit.weapon` holds the equipped `WeaponConfig`
2. `getEffectiveDamage()` = weapon.damage + unit base damage
3. `getEffectiveAttackSpeed()` = weapon.fireRate (seconds between shots)
4. `getEffectiveRange()` = weapon.range
5. `CombatSystem` applies accuracy as projectile spread
6. `Projectile` receives speed/damage directly — decoupled from weapon type

### How to Add a New Weapon

1. Add entry to `WEAPONS` in `src/game/data/weapons.ts`
2. Set `unlockLevel` for progression placement
3. Reference by `weaponId` in unit definitions
4. Done — no other files need changes

### Future Extensions (not built yet)

- Weapon switching during combat
- Visual weapon sprites per weapon type
- Reload animation timing
- Weapon-specific sound effects
- Special weapon abilities (bayonet charge, etc.)

---

## 🎨 Character Rig System

### How It Works

The game uses a **cutout-rig system** (`UnitRig.ts`) that renders characters from separate PNG body parts arranged by a JSON skeleton.

### Key Concept: `displaySize`

Each rig part specifies a `displaySize` (width × height in pixels). This is critical because:
- Source PNGs can be any resolution (e.g., 512×512 from AI generation)
- `displaySize` scales them to gameplay-appropriate sizes (~80px total unit height)
- Positions/offsets in `rig.json` are in **display-space pixels**, not source pixels

### Unit Folder Structure

```
public/assets/units/{unit_id}/
  parts/              # Transparent PNGs (any source resolution)
    head.png
    torso.png
    left_arm.png
    right_arm.png
    left_leg.png
    right_leg.png
    weapon.png
  rig.json            # Hierarchy, pivots, positions, displaySize, sockets
  animations.json     # Named animation clips with keyframe tracks
  manifest.json       # Asset metadata
```

### Standard Parts (7 per unit)

| Part | Display Size | Pivot Point | Purpose |
|------|-------------|-------------|---------|
| `head` | 18×20 | Lower-center (neck) | Head with headwear |
| `torso` | 22×30 | Lower-center (waist) | Body/jacket |
| `left_arm` | 10×24 | Upper-right (shoulder) | Support arm |
| `right_arm` | 10×24 | Upper-left (shoulder) | Weapon arm |
| `left_leg` | 10×24 | Top-center (hip) | Left leg |
| `right_leg` | 10×24 | Top-center (hip) | Right leg |
| `weapon` | 34×8 | Left-center (grip) | Rifle/melee |

### Rig Hierarchy

```
root
 ├─ torso (pivot: waist)
 │   ├─ head (pivot: neck)
 │   ├─ left_arm (pivot: shoulder)
 │   ├─ right_arm (pivot: shoulder)
 │   │   └─ weapon (pivot: grip)
 ├─ left_leg (pivot: hip)
 └─ right_leg (pivot: hip)
```

### `rig.json` Format

```json
{
  "id": "bulgarian_rifleman",
  "parts": [
    {
      "name": "torso",
      "image": "torso.png",
      "pivot": { "x": 0.5, "y": 0.8 },
      "position": { "x": 0, "y": 0 },
      "rotation": 0,
      "scale": { "x": 1, "y": 1 },
      "zIndex": 10,
      "displaySize": { "width": 22, "height": 30 }
    },
    {
      "name": "weapon",
      "parent": "right_arm",
      "image": "weapon.png",
      "pivot": { "x": 0.15, "y": 0.5 },
      "position": { "x": 4, "y": 14 },
      "rotation": 5,
      "scale": { "x": 1, "y": 1 },
      "zIndex": 25,
      "displaySize": { "width": 34, "height": 8 }
    }
  ],
  "sockets": {
    "muzzle": { "part": "weapon", "offset": { "x": 30, "y": 0 } }
  }
}
```

### Sockets

Sockets are named attachment points on parts. The `muzzle` socket on the weapon part determines where projectiles spawn. Offsets are in **display-space pixels** relative to the part's position.

### Animations (`animations.json`)

| Clip | Duration | Loop | Tracks |
|------|----------|------|--------|
| `idle` | 1200ms | Yes | Subtle torso breathing |
| `move` | 500ms | Yes | Alternating legs + torso bob |
| `shoot` | 250ms | No | Arm recoil + torso kickback |
| `attack` | 400ms | No | Melee arm swing |
| `death` | 600ms | No | Torso rotation + fall |

Tracks animate individual part properties (`rotation`, `x`, `y`, `scaleX`, `scaleY`, `alpha`) using normalized keyframes (time 0-1).

### Procedural Fallback

If rig/animation JSON files are missing, `UnitLoader` generates colored placeholder shapes with default hierarchy and animations. The game is always playable without art assets.

### How to Add a New Unit

1. Create `public/assets/units/{unit_id}/parts/` with 7 transparent PNGs
2. Create `rig.json` — copy from existing unit, adjust `displaySize` and positions
3. Create `animations.json` — copy from existing, tweak keyframes
4. Create `manifest.json` — list part filenames
5. Add unit ID to `UNIT_IDS` in `src/game/scenes/BootScene.ts`
6. Reference `rigId: '{unit_id}'` in unit/enemy data definitions

---

## 🗺️ Battlefield System

### How It Works

Battlefields are **config-driven**. All gameplay positions come from `layout.json` — the background image is visual only.

### Battlefield Folder Structure

```
public/battlefields/{battlefield_id}/
  background.png      # Visual backdrop (any resolution)
  layout.json         # All gameplay positions (normalized 0-1)
```

### Layout Config (Normalized Coordinates)

All positions are **0-1 normalized** relative to screen dimensions.

| Field | Purpose |
|-------|---------|
| `barricade` | X line, top/bottom Y, base HP |
| `defenderSlots[]` | Position, lane, unlock state |
| `spawnZones[]` | Enemy spawn rectangles |
| `lanes[]` | Ground Y positions + depth scale |
| `enemyStopLineX` | Where enemies stop to attack |
| `lootBounds` | Gold drop collection area |
| `propAnchors` | Decorative element positions |

### How to Add a New Battlefield

1. Create folder: `public/battlefields/{id}/`
2. Add `layout.json` with normalized positions
3. Register in `src/game/data/battlefields/index.ts`
4. Change `DEFAULT_BATTLEFIELD_ID` or pass `battlefieldId` to BattleScene

---

## ⚔️ Wave System

`WaveSystem` manages lifecycle: `pre_wave` → `active` → `rest` → next wave.

Waves defined in `src/game/data/waves.ts` with enemy groups, counts, intervals. After defined waves, procedural scaling generates infinite waves.

## 💰 Economy & Abilities

Gold from enemy drops → spend on:
- 🔧 **Repair** (15g): Restore barricade HP
- 🛡 **Reinforce** (40g): Increase max barricade HP  
- 💥 **Artillery** (25g): Damage all enemies in densest lane

Costs/cooldowns configured in `src/game/data/economy.ts`.

## 🏰 Barricade

Visual damage states: Healthy (>60%) → Damaged (30-60%) → Critical (<30%).
Repairable and reinforceable via gold spending.

## 📊 HUD (`UIScene`)

- **Top-Left**: Gold + kills
- **Top-Center**: Wave number, state, enemy count
- **Top-Right**: Unit HP + barricade integrity bars
- **Bottom-Center**: Action bar (Repair, Reinforce, Artillery)
- **Bottom-Right**: Speed controls (1x, 2x, 3x) + fullscreen

## 🚀 Running

```bash
npm install
npm run dev
```

## 📱 Mobile Features

- Responsive normalized coordinates scale to any landscape screen
- Fullscreen toggle
- Touch: tap-to-collect loot, tactile action buttons

## 🔮 Future Upgrades

- Weapon switching / shop UI
- Separate hat/beard parts for distinct silhouettes
- Upper/lower arm/leg splits for smoother animation
- Rider + horse split rig
- Multiple battlefield backgrounds
- Sound effects
- Battlefield selection screen
