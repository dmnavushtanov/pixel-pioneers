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
│   ├── PlayerUnit.ts        # Defender with UnitRig + weapon + reload
│   ├── Projectile.ts        # Nearly-invisible projectile (hit detection only)
│   └── UnitRig.ts           # Cutout character renderer
├── scenes/                  # Boot, Menu, Battle, UI
├── systems/
│   ├── UnitLoader.ts        # Asset loader & procedural fallback
│   ├── CombatSystem.ts      # Targeting, muzzle flash, smoke, hit effects
│   ├── WaveSystem.ts        # Spawning logic
│   ├── UpgradeSystem.ts     # Kill-based progression
│   ├── LootSystem.ts        # Gold drops & collection
│   ├── AbilitySystem.ts     # Player abilities (artillery, repair)
│   └── AnimationSystem.ts   # Animation utilities
└── types/
    ├── RigDefinition.ts     # Part hierarchy, sockets, displaySize
    ├── AnimationDefinition.ts # Keyframe animation tracks
    ├── WeaponDefinition.ts  # WeaponConfig + visual groups + reload styles
    ├── UnitDefinition.ts    # Unit stats, upgrades
    ├── EnemyDefinition.ts   # Enemy stats, loot
    ├── BattlefieldDefinition.ts # Layout types
    └── UnitRenderDefinition.ts  # Future render modes

public/assets/
├── units/                   # Unit cutout part assets
│   ├── bulgarian_rifleman/
│   │   ├── parts/           # PNG body parts
│   │   ├── rig.json         # Skeleton hierarchy + displaySize
│   │   ├── animations.json  # Animation clips (idle, move, shoot, reload_muzzle, reload_simple, death)
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

Weapons use a **simple flat config** (`WeaponConfig`). Each weapon belongs to a **visual behavior group** that determines shooting feel, smoke, recoil, and reload style.

### `WeaponConfig` Interface

```typescript
interface WeaponConfig {
  id: string;
  name: string;
  type: WeaponType;          // 'pistol' | 'musket' | 'rifle' | 'repeater'
  damage: number;
  range: number;
  fireRate: number;           // Seconds between shots
  reloadTime: number;         // Reload duration in seconds
  projectileSpeed: number;
  accuracy: number;           // 0-1 (affects spread)
  unlockLevel: number;
  sprite: string;
  visualGroup: WeaponVisualGroup;  // 'muzzle_loading' | 'breech_single_shot' | 'repeater'
  smokeLevel: number;         // 0-1 smoke intensity
  recoilAmount: number;       // 0-1 recoil strength
  reloadStyle: ReloadStyle;   // 'barrel' | 'breech' | 'lever' | 'none'
}
```

### Weapon Visual Groups

| Group | Weapons | Behavior |
|-------|---------|----------|
| `muzzle_loading` | Flintlock Pistol, Flintlock Musket, Caplock Musket | Heavy smoke, strong muzzle flash, barrel reload animation, long reload pause |
| `breech_single_shot` | Krynka, Peabody-Martini | Medium smoke, strong single-shot feel, breech reload, shorter reload |
| `repeater` | Winchester 1866 | Light smoke, fast fire rhythm, lever reload, quick reset |

### Available Weapons (ordered by progression)

| Weapon | Type | Damage | Range | Fire Rate | Accuracy | Smoke | Recoil | Reload Style | Unlock |
|--------|------|--------|-------|-----------|----------|-------|--------|-------------|--------|
| Flintlock Pistol | pistol | 8 | 180 | 1.2s | 0.60 | 0.9 | 0.8 | barrel | 0 |
| Flintlock Musket | musket | 14 | 260 | 1.8s | 0.65 | 1.0 | 0.9 | barrel | 1 |
| Caplock Musket | musket | 16 | 280 | 1.5s | 0.70 | 0.8 | 0.7 | barrel | 3 |
| Krynka Rifle | rifle | 22 | 340 | 1.4s | 0.80 | 0.5 | 0.6 | breech | 5 |
| Winchester 1866 | repeater | 12 | 300 | 0.6s | 0.75 | 0.3 | 0.4 | lever | 8 |
| Peabody-Martini | rifle | 30 | 380 | 1.6s | 0.85 | 0.4 | 0.5 | breech | 12 |

### Shooting Visual Feedback

Bullets are **nearly invisible** — combat readability comes from:
1. **Muzzle flash** — bright flash at weapon tip (bigger/warmer for black powder)
2. **Gun smoke** — smoke particles (more for muzzle-loading, less for modern rifles)
3. **Hit spark** — dust/dirt effect at target location (delayed by distance)
4. **Recoil** — weapon kickback animation on torso + arm
5. **Hit effect** — red impact flash on enemy when hit

### Reload System

**Muzzle-loading weapons** (`reloadStyle: 'barrel'`):
1. Unit fires → shoot animation plays
2. Reload state activates → `isReloading = true`
3. `reload_muzzle` clip plays: weapon tilts upward, left arm moves to barrel area
4. After `reloadTime` seconds, unit returns to idle
5. Can fire again

**Breech/lever weapons** (`reloadStyle: 'breech' | 'lever'`):
- No explicit reload state (handled by `fireRate` timing)
- `reload_simple` clip available for future use

### How to Add a New Weapon

1. Add entry to `WEAPONS` in `src/game/data/weapons.ts`
2. Set `visualGroup`, `smokeLevel`, `recoilAmount`, `reloadStyle`
3. Set `unlockLevel` for progression placement
4. Done — visual behavior is automatic based on group

---

## 🎨 Character Rig System

### How It Works

The game uses a **cutout-rig system** (`UnitRig.ts`) that renders characters from separate PNG body parts arranged by a JSON skeleton.

### Key Concept: `displaySize`

Each rig part specifies a `displaySize` (width × height in pixels). This is critical because:
- Source PNGs can be any resolution (e.g., 512×512 from AI generation)
- `displaySize` scales them to gameplay-appropriate sizes (~60px total unit height)
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
| `head` | 16×18 | Lower-center (neck) | Head with headwear |
| `torso` | 20×26 | Lower-center (waist) | Body/jacket |
| `left_arm` | 8×20 | Upper (shoulder) | Support arm |
| `right_arm` | 8×20 | Upper (shoulder) | Weapon arm |
| `left_leg` | 8×22 | Top (hip) | Left leg |
| `right_leg` | 8×22 | Top (hip) | Right leg |
| `weapon` | 30×6 | Left-center (grip) | Rifle/melee |

### Rig Hierarchy

```
root
 ├─ torso (pivot: waist, position: 0,0)
 │   ├─ head (pivot: neck, position: 0,-22)
 │   ├─ left_arm (pivot: shoulder, position: -8,-18, rotation: 15°)
 │   ├─ right_arm (pivot: shoulder, position: 8,-18, rotation: -20°)
 │   │   └─ weapon (pivot: grip, position: 2,12, rotation: 10°)
 ├─ left_leg (pivot: hip, position: -4,14)
 └─ right_leg (pivot: hip, position: 4,14)
```

### Animation Clips

| Clip | Duration | Loop | Purpose |
|------|----------|------|---------|
| `idle` | 1500ms | Yes | Subtle breathing, slight arm sway |
| `move` | 600ms | Yes | Alternating legs + torso bob |
| `shoot` | 300ms | No | Arm recoil + weapon kickback + torso lean |
| `reload_muzzle` | 2500ms | No | Weapon tilts up, left arm moves to barrel (muzzle-loaders only) |
| `reload_simple` | 1200ms | No | Brief weapon tilt + arm reset (breech/lever weapons) |
| `death` | 600ms | No | Torso collapse + limb spread |
| `attack` | 400ms | No | Melee arm swing |

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

Battlefields are **config-driven**. All gameplay positions come from `layout.json` — the background is rendered procedurally.

### Battlefield Visual Design

The battlefield renders:
- **Sky gradient** — warm blue-to-tan transition at top
- **Ground** — earthy brown field with gradient
- **Horizon** — distant hills/treeline silhouette
- **Dust texture** — subtle ground spots for depth
- **Lane hints** — very subtle darker ground strips
- **Barricade area** — scuff marks and debris
- **Props** — sandbags, barrels, crates near the defense line

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
- Weapon-specific sound effects
- Separate hat/beard parts for distinct silhouettes
- Upper/lower arm/leg splits for smoother animation
- Rider + horse split rig
- Background image support for battlefields
- Battlefield selection screen
- Special weapon abilities (bayonet charge, etc.)
