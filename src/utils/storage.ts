import { createContract } from '../data/catalogs';
import type { PlayerProfile } from '../types/game';

export const SAVE_KEY = 'hyperdrive_infinite_profile_v2';

export function createDefaultProfile(): PlayerProfile {
  return {
    credits: 1200,
    highScore: parseInt(localStorage.getItem('hyperdrive_best') || '0', 10) || 0,
    totalDistance: 0,
    unlockedShips: ['VALKYRIE'],
    selectedShip: 'VALKYRIE',
    unlockedMaps: ['CYBER_GRID', 'DYNAMIC_WARP'],
    selectedMap: 'CYBER_GRID',
    unlockedLiveries: ['STEALTH', 'ORBITAL'],
    selectedLivery: 'STEALTH',
    unlockedAbilities: ['EMP'],
    selectedAbility: 'EMP',
    upgrades: {
      thrusters: 1,
      handling: 1,
      nitro: 1,
      shield: 1,
      magnet: 1,
      telemetry: 1,
    },
    contracts: [createContract(0), createContract(1), createContract(2)],
    controlScheme: 'JOYSTICK',
    sensitivity: 1.0,
    haptics: true,
    nitroToggleMode: false,
    showTouchHud: true,
    claimedAchievements: [],
    lastDailyClaim: 0,
  };
}

export function loadProfile(): PlayerProfile {
  const base = createDefaultProfile();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const merged: PlayerProfile = {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
    };
    if (!Array.isArray(merged.contracts) || merged.contracts.length < 3) {
      merged.contracts = [createContract(0), createContract(1), createContract(2)];
    }
    if (!Array.isArray(merged.claimedAchievements)) {
      merged.claimedAchievements = [];
    }
    if (typeof merged.sensitivity !== 'number' || Number.isNaN(merged.sensitivity)) {
      merged.sensitivity = 1.0;
    }
    return merged;
  } catch {
    return base;
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
    localStorage.setItem('hyperdrive_best', String(Math.floor(profile.highScore)));
  } catch {
    // Ignore quota/private-mode storage errors gracefully
  }
}

export function triggerHaptic(enabled: boolean, pattern: number | number[] = 18): void {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore platforms without Vibration API support
  }
}
