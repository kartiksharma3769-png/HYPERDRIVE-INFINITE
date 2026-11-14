export type ShipId = 'VALKYRIE' | 'PHANTOM' | 'TITAN' | 'SERAPHIM' | 'OMEGA';
export type UpgradeId = 'thrusters' | 'handling' | 'nitro' | 'shield' | 'magnet' | 'telemetry';
export type MapId =
  | 'CYBER_GRID'
  | 'DYNAMIC_WARP'
  | 'CRIMSON_FOUNDRY'
  | 'CRYO_GLACIER'
  | 'SOLAR_CORONA'
  | 'QUANTUM_VOID';
export type LiveryId = 'STEALTH' | 'ORBITAL' | 'CRIMSON' | 'GOLD_HYPERION' | 'CHROME' | 'NEBULA';
export type AbilityId = 'EMP' | 'CLOAK' | 'VORTEX';

export type ControlScheme = 'JOYSTICK' | 'SLIDE' | 'GYRO';
export type GameMode = 'ENDLESS' | 'TIME_ATTACK' | 'ZEN';
export type QualityPreset = 'LOW' | 'HIGH' | 'ULTRA';
export type PlayMode = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';
export type MenuView = 'MAIN' | 'MARKETPLACE' | 'PANEL';
export type LobbyTab = 'LOBBY' | 'GARAGE' | 'MISSIONS' | 'SUPPLY';
export type CameraMode = 'CHASE' | 'CLOSE' | 'COCKPIT';
export type ContractType = 'distance' | 'nearmiss' | 'cores' | 'portals' | 'ability';

export interface ShipSpec {
  id: ShipId;
  name: string;
  role: string;
  cost: number;
  baseSpeed: number;
  maxSpeed: number;
  handling: number;
  nitroCap: number;
  shieldLayers: number;
  creditMult: number;
  desc: string;
}

export interface UpgradeSpec {
  id: UpgradeId;
  name: string;
  baseCost: number;
  desc: string;
}

export interface MapSpec {
  id: MapId;
  name: string;
  cost: number;
  creditMult: number;
  fogColor: number;
  gridColor: number;
  accentColor: number;
  desc: string;
}

export interface LiverySpec {
  id: LiveryId;
  name: string;
  cost: number;
  primary: number;
  secondary: number;
  trim: number;
  metalness: number;
  roughness: number;
}

export interface AbilitySpec {
  id: AbilityId;
  name: string;
  cost: number;
  cooldown: number;
  duration: number;
  desc: string;
}

export interface ContractItem {
  type: ContractType;
  title: string;
  target: number;
  reward: number;
  progress: number;
}

export interface PlayerProfile {
  credits: number;
  highScore: number;
  totalDistance: number;
  unlockedShips: ShipId[];
  selectedShip: ShipId;
  unlockedMaps: MapId[];
  selectedMap: MapId;
  unlockedLiveries: LiveryId[];
  selectedLivery: LiveryId;
  unlockedAbilities: AbilityId[];
  selectedAbility: AbilityId;
  upgrades: Record<UpgradeId, number>;
  contracts: ContractItem[];
  controlScheme: ControlScheme;
  sensitivity: number;
  haptics: boolean;
  nitroToggleMode: boolean;
  showTouchHud: boolean;
  claimedAchievements: string[];
  lastDailyClaim: number;
}

export interface AchievementSpec {
  id: string;
  name: string;
  desc: string;
  reward: number;
  check: (p: PlayerProfile) => boolean;
  progress: (p: PlayerProfile) => [number, number];
}

export interface ComputedShipStats {
  ship: ShipSpec;
  baseSpeed: number;
  maxSpeed: number;
  handling: number;
  nitroBurnRate: number;
  nitroRegenRate: number;
  maxShields: number;
  invulnDuration: number;
  magnetRadius: number;
  creditMultiplier: number;
}

export interface HudTelemetry {
  mode: PlayMode;
  gameMode: GameMode;
  cameraMode: CameraMode;
  quality: QualityPreset;
  score: number;
  distance: number;
  runCredits: number;
  speedKmh: number;
  combo: number;
  comboTimer: number;
  nitro: number;
  isBoosting: boolean;
  isCloaked: boolean;
  shieldCharges: number;
  maxShieldCharges: number;
  timeRemaining: number;
  abilityCooldown: number;
  abilityMaxCooldown: number;
  abilityActiveTimer: number;
  activeBiomeName: string;
  sectorIndex: number;
  endReason: string;
  isNewRecord: boolean;
  gyroAngle: number;
  isNitroLatched: boolean;
}

export interface CalloutMessage {
  id: number;
  text: string;
  colorClass: string;
}
