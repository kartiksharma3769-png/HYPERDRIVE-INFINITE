import type {
  AbilitySpec,
  AchievementSpec,
  CameraMode,
  ComputedShipStats,
  ContractItem,
  LiverySpec,
  MapId,
  MapSpec,
  PlayerProfile,
  ShipId,
  ShipSpec,
  UpgradeSpec,
} from '../types/game';

export const CONFIG = {
  laneWidth: 16,
  hoverHeight: 1.15,
  jumpVelocity: 17.5,
  gravity: 44.0,
  nitroMultiplier: 1.55,
} as const;

export const CAMERA_MODES: CameraMode[] = ['CHASE', 'CLOSE', 'COCKPIT'];

export const SHIPS_CATALOG: ShipSpec[] = [
  {
    id: 'VALKYRIE',
    name: 'VALKYRIE MK-IV',
    role: 'BALANCED INTERCEPTOR',
    cost: 0,
    baseSpeed: 58,
    maxSpeed: 108,
    handling: 30,
    nitroCap: 100,
    shieldLayers: 1,
    creditMult: 1.0,
    desc: 'Variable-sweep aerospace interceptor with active elevons and twin vector-thrust afterburners.',
  },
  {
    id: 'PHANTOM',
    name: 'PHANTOM X-99',
    role: 'STEALTH RECON FIGHTER',
    cost: 1800,
    baseSpeed: 64,
    maxSpeed: 118,
    handling: 36,
    nitroCap: 110,
    shieldLayers: 1,
    creditMult: 1.15,
    desc: 'Forward-swept agility demonstrator with tri-plasma exhaust array and razor-sharp lateral response.',
  },
  {
    id: 'TITAN',
    name: 'TITAN-V GUNSHIP',
    role: 'HEAVY ARMORED CORVETTE',
    cost: 3400,
    baseSpeed: 56,
    maxSpeed: 112,
    handling: 27,
    nitroCap: 125,
    shieldLayers: 2,
    creditMult: 1.25,
    desc: 'Twin-boom orbital heavy corvette equipped with 2-layer Aegis shielding and quad turbine nacelles.',
  },
  {
    id: 'SERAPHIM',
    name: 'SERAPHIM SOLAR-WING',
    role: 'HYPERSONIC DART',
    cost: 5200,
    baseSpeed: 70,
    maxSpeed: 128,
    handling: 35,
    nitroCap: 135,
    shieldLayers: 1,
    creditMult: 1.4,
    desc: 'Needle-nose hypersonic interceptor powered by a suspended annular fusion ring drive.',
  },
  {
    id: 'OMEGA',
    name: 'OMEGA SINGULARITY',
    role: 'QUANTUM PROTOTYPE',
    cost: 8000,
    baseSpeed: 75,
    maxSpeed: 138,
    handling: 39,
    nitroCap: 150,
    shieldLayers: 2,
    creditMult: 1.65,
    desc: 'Experimental gravimetric flagship with levitating wing pylons and a spinning singularity core.',
  },
];

export const UPGRADES_CATALOG: UpgradeSpec[] = [
  {
    id: 'thrusters',
    name: 'ION THRUSTER OVERCLOCK',
    baseCost: 400,
    desc: 'Increases base cruise speed and Mach terminal velocity (+6% per tier).',
  },
  {
    id: 'handling',
    name: 'AERO-SERVO ACTUATORS',
    baseCost: 380,
    desc: 'Boosts lateral banking response and dodge speed (+7% per tier).',
  },
  {
    id: 'nitro',
    name: 'CRYO-NITRO CAPACITOR',
    baseCost: 420,
    desc: 'Reduces Hyper-Nitro burn rate and speeds up passive recharge.',
  },
  {
    id: 'shield',
    name: 'AEGIS SHIELD MATRIX',
    baseCost: 550,
    desc: 'Extends post-impact invulnerability and adds +1 starting shield at Tier 4+.',
  },
  {
    id: 'magnet',
    name: 'GRAVITON TRACTOR BEAM',
    baseCost: 460,
    desc: 'Automatically pulls nearby Energy Cores & Shields toward your hull.',
  },
  {
    id: 'telemetry',
    name: 'QUANTUM TELEMETRY CORE',
    baseCost: 500,
    desc: 'Increases Quantum Credits (₡) earned from all pickups and distance (+12%/tier).',
  },
];

export const MAPS_CATALOG: MapSpec[] = [
  {
    id: 'CYBER_GRID',
    name: 'NEO-CYBER GRID',
    cost: 0,
    creditMult: 1.0,
    fogColor: 0x040816,
    gridColor: 0x00f3ff,
    accentColor: 0xff007f,
    desc: 'High-contrast synthwave megastructure highway.',
  },
  {
    id: 'DYNAMIC_WARP',
    name: 'DYNAMIC WARP CYCLER',
    cost: 0,
    creditMult: 1.15,
    fogColor: 0x050716,
    gridColor: 0x00f3ff,
    accentColor: 0xffaa00,
    desc: 'Automatically warps across all planetary sectors every 1,000 meters.',
  },
  {
    id: 'CRIMSON_FOUNDRY',
    name: 'CRIMSON FOUNDRY',
    cost: 1400,
    creditMult: 1.25,
    fogColor: 0x160408,
    gridColor: 0xff2a55,
    accentColor: 0xffaa00,
    desc: 'Volcanic orbital smelter sector with high-energy plasma hazards.',
  },
  {
    id: 'CRYO_GLACIER',
    name: 'CRYO-GLACIER ORBITAL',
    cost: 2400,
    creditMult: 1.35,
    fogColor: 0x03131e,
    gridColor: 0x38bdf8,
    accentColor: 0xa855f7,
    desc: 'Sub-zero crystalline highway suspended inside an ice ring.',
  },
  {
    id: 'SOLAR_CORONA',
    name: 'SOLAR DYSON CORONA',
    cost: 3600,
    creditMult: 1.5,
    fogColor: 0x180e02,
    gridColor: 0xfbbf24,
    accentColor: 0xef4444,
    desc: 'Blazing golden collector array harvesting stellar plasma.',
  },
  {
    id: 'QUANTUM_VOID',
    name: 'QUANTUM SINGULARITY',
    cost: 5000,
    creditMult: 1.75,
    fogColor: 0x0d031c,
    gridColor: 0xc084fc,
    accentColor: 0x00f3ff,
    desc: 'Deep-space event horizon with maximum 1.75x Credit payout.',
  },
];

export const LIVERIES_CATALOG: LiverySpec[] = [
  {
    id: 'STEALTH',
    name: 'STEALTH TITANIUM',
    cost: 0,
    primary: 0x1e293b,
    secondary: 0x0f172a,
    trim: 0x00f3ff,
    metalness: 0.85,
    roughness: 0.22,
  },
  {
    id: 'ORBITAL',
    name: 'ORBITAL WHITE',
    cost: 0,
    primary: 0xf1f5f9,
    secondary: 0x334155,
    trim: 0x38bdf8,
    metalness: 0.65,
    roughness: 0.25,
  },
  {
    id: 'CRIMSON',
    name: 'CRIMSON SPEC-OPS',
    cost: 900,
    primary: 0x991b1b,
    secondary: 0x111827,
    trim: 0xfbbf24,
    metalness: 0.8,
    roughness: 0.24,
  },
  {
    id: 'GOLD_HYPERION',
    name: 'AURUM HYPERION',
    cost: 1600,
    primary: 0xf59e0b,
    secondary: 0x1e1b4b,
    trim: 0x00f3ff,
    metalness: 0.94,
    roughness: 0.15,
  },
  {
    id: 'CHROME',
    name: 'MIRROR CHROME',
    cost: 2200,
    primary: 0xe2e8f0,
    secondary: 0x475569,
    trim: 0xec4899,
    metalness: 0.98,
    roughness: 0.08,
  },
  {
    id: 'NEBULA',
    name: 'QUANTUM VIOLET',
    cost: 2800,
    primary: 0x581c87,
    secondary: 0x090d16,
    trim: 0x22d3ee,
    metalness: 0.88,
    roughness: 0.18,
  },
];

export const ABILITIES_CATALOG: AbilitySpec[] = [
  {
    id: 'EMP',
    name: 'EMP SHOCKWAVE',
    cost: 0,
    cooldown: 14,
    duration: 0.8,
    desc: 'Emits a 140m electromagnetic blast that vaporizes all obstacles ahead.',
  },
  {
    id: 'CLOAK',
    name: 'PHASE CLOAK',
    cost: 2000,
    cooldown: 16,
    duration: 5.0,
    desc: 'Shifts your hull into quantum phase for 5.0s, passing safely through all hazards.',
  },
  {
    id: 'VORTEX',
    name: 'GRAVITON VORTEX',
    cost: 3200,
    cooldown: 18,
    duration: 6.5,
    desc: 'Generates a full-track singularity magnet and doubles Credit pickups for 6.5s.',
  },
];

export const ACHIEVEMENTS_CATALOG: AchievementSpec[] = [
  {
    id: 'first_flight',
    name: 'MACH-1 INITIATE',
    desc: 'Fly a total career distance of 2,500 Meters.',
    reward: 800,
    check: (p) => p.totalDistance >= 2500,
    progress: (p) => [Math.min(2500, Math.floor(p.totalDistance)), 2500],
  },
  {
    id: 'score_25k',
    name: 'HYPERION ACE',
    desc: 'Reach a single-run High Score of 25,000+ points.',
    reward: 1200,
    check: (p) => p.highScore >= 25000,
    progress: (p) => [Math.min(25000, p.highScore), 25000],
  },
  {
    id: 'fleet_collector',
    name: 'FLEET COMMANDER',
    desc: 'Unlock at least 3 Aerospace Interceptors in the Shipyard.',
    reward: 2000,
    check: (p) => p.unlockedShips.length >= 3,
    progress: (p) => [p.unlockedShips.length, 3],
  },
  {
    id: 'sector_explorer',
    name: 'STAR CHART NAVIGATOR',
    desc: 'Unlock at least 3 Planetary Sector Maps.',
    reward: 1800,
    check: (p) => p.unlockedMaps.length >= 4,
    progress: (p) => [Math.max(1, p.unlockedMaps.length - 1), 3],
  },
  {
    id: 'max_engineer',
    name: 'CHIEF AEROSPACE ENGINEER',
    desc: 'Upgrade any ship engineering system to Max Tier (Lv.5).',
    reward: 2500,
    check: (p) => Object.values(p.upgrades).some((v) => v >= 5),
    progress: (p) => [Math.max(...Object.values(p.upgrades)), 5],
  },
];

const CONTRACT_TEMPLATES: Omit<ContractItem, 'progress'>[] = [
  { type: 'distance', title: 'PATROL 1,500 METERS', target: 1500, reward: 450 },
  { type: 'nearmiss', title: 'SCORE 5 NEAR-MISSES', target: 5, reward: 500 },
  { type: 'cores', title: 'COLLECT 10 ENERGY CORES', target: 10, reward: 420 },
  { type: 'portals', title: 'FLY THROUGH 3 WARP PORTALS', target: 3, reward: 480 },
  { type: 'ability', title: 'TRIGGER TACTICAL TECH 2x', target: 2, reward: 400 },
];

export function createContract(typeIndex: number): ContractItem {
  const tpl = CONTRACT_TEMPLATES[typeIndex % CONTRACT_TEMPLATES.length];
  return { ...tpl, progress: 0 };
}

export function getActiveShipStats(
  profile: PlayerProfile,
  shipId: ShipId = profile.selectedShip,
): ComputedShipStats {
  const ship = SHIPS_CATALOG.find((s) => s.id === shipId) || SHIPS_CATALOG[0];
  const up = profile.upgrades;
  const speedMult = 1 + (up.thrusters - 1) * 0.06;
  const handleMult = 1 + (up.handling - 1) * 0.07;
  const nitroBurnRate = Math.max(12, 26 - (up.nitro - 1) * 3.0);
  const nitroRegenRate = 9 + (up.nitro - 1) * 2.5;
  const bonusShield = up.shield >= 4 ? 1 : 0;
  const invulnDuration = 1.6 + (up.shield - 1) * 0.35;
  const magnetRadius = 3.2 + (up.magnet - 1) * 2.6;
  const creditMultiplier = ship.creditMult * (1 + (up.telemetry - 1) * 0.12);

  return {
    ship,
    baseSpeed: ship.baseSpeed * speedMult,
    maxSpeed: ship.maxSpeed * speedMult,
    handling: ship.handling * handleMult,
    nitroBurnRate,
    nitroRegenRate,
    maxShields: ship.shieldLayers + bonusShield,
    invulnDuration,
    magnetRadius,
    creditMultiplier,
  };
}

const CYCLABLE_MAPS = MAPS_CATALOG.filter((m) => m.id !== 'DYNAMIC_WARP');

export function resolveActiveSector(selectedMapId: MapId, distance: number): { map: MapSpec; sectorIndex: number } {
  const selected = MAPS_CATALOG.find((m) => m.id === selectedMapId) || MAPS_CATALOG[0];
  if (selected.id === 'DYNAMIC_WARP') {
    const idx = Math.floor(distance / 1000) % CYCLABLE_MAPS.length;
    return { map: CYCLABLE_MAPS[idx], sectorIndex: idx + 1 };
  }
  const idx = Math.max(0, MAPS_CATALOG.findIndex((m) => m.id === selected.id));
  return { map: selected, sectorIndex: idx + 1 };
}
