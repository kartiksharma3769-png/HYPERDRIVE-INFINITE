import React from 'react';
import {
  Compass,
  Gamepad2,
  Gift,
  Hand,
  Infinity as InfinityIcon,
  Maximize2,
  Play,
  Plus,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import {
  ABILITIES_CATALOG,
  ACHIEVEMENTS_CATALOG,
  getActiveShipStats,
  MAPS_CATALOG,
} from '../data/catalogs';
import type {
  AbilityId,
  GameMode,
  LiveryId,
  LobbyTab,
  MapId,
  PlayerProfile,
  QualityPreset,
  ShipId,
  UpgradeId,
} from '../types/game';
import { MobileGarageView } from './MobileGarageView';
import { MobileMissionsView } from './MobileMissionsView';
import { MobileSupplyView } from './MobileSupplyView';

interface MobileLobbyShellProps {
  lobbyTab: LobbyTab;
  profile: PlayerProfile;
  previewShipId: ShipId;
  quality: QualityPreset;
  gameMode: GameMode;
  muted: boolean;
  lastMysteryResult: string | null;
  onSelectTab: (tab: LobbyTab) => void;
  onCycleQuality: () => void;
  onSelectGameMode: (gm: GameMode) => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenPlayStore: () => void;
  onLaunchGame: () => void;
  onPreviewShip: (shipId: ShipId) => void;
  onSelectOrBuyShip: (shipId: ShipId) => void;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
  onSelectOrBuyMap: (mapId: MapId) => void;
  onSelectOrBuyLivery: (liveryId: LiveryId) => void;
  onSelectOrBuyAbility: (abilityId: AbilityId) => void;
  onClaimInstantGrant: () => void;
  onClaimDailyCrate: () => void;
  onOpenMysteryPod: () => void;
  onClaimTrophy: (achId: string) => void;
  onClaimAllTrophies: () => void;
}

export const MobileLobbyShell: React.FC<MobileLobbyShellProps> = ({
  lobbyTab,
  profile,
  previewShipId,
  quality,
  gameMode,
  muted,
  lastMysteryResult,
  onSelectTab,
  onCycleQuality,
  onSelectGameMode,
  onToggleFullscreen,
  onToggleMute,
  onOpenSettings,
  onOpenPlayStore,
  onLaunchGame,
  onPreviewShip,
  onSelectOrBuyShip,
  onBuyUpgrade,
  onSelectOrBuyMap,
  onSelectOrBuyLivery,
  onSelectOrBuyAbility,
  onClaimInstantGrant,
  onClaimDailyCrate,
  onOpenMysteryPod,
  onClaimTrophy,
  onClaimAllTrophies,
}) => {
  const stats = getActiveShipStats(profile, profile.selectedShip);
  const mapObj = MAPS_CATALOG.find((m) => m.id === profile.selectedMap) || MAPS_CATALOG[0];
  const abObj =
    ABILITIES_CATALOG.find((a) => a.id === profile.selectedAbility) || ABILITIES_CATALOG[0];

  const claimableTrophies = ACHIEVEMENTS_CATALOG.filter(
    (a) => a.check(profile) && !profile.claimedAchievements.includes(a.id),
  ).length;

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between pointer-events-none">
      {/* 1. Compact Mobile Top Status Bar */}
      <header className="px-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1.5 pointer-events-auto">
        <div className="hud-glass rounded-2xl px-3 py-1.5 flex items-center justify-between gap-2 max-w-4xl mx-auto">
          {/* Brand & Best Score */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shrink-0">
              <Rocket className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <div className="font-orbitron text-xs sm:text-sm font-black text-white neon-text-cyan truncate">
                HYPERDRIVE
              </div>
              <div className="text-[10px] text-slate-300 font-orbitron tabular-nums truncate">
                BEST {Math.floor(profile.highScore).toLocaleString()} ·{' '}
                {Math.floor(profile.totalDistance).toLocaleString()}M
              </div>
            </div>
          </div>

          {/* Credits Capsule + Audio + Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab('SUPPLY')}
              title="Add Credits & Supply Crates"
              className="min-h-[40px] pl-2.5 pr-1.5 rounded-xl bg-slate-950/90 border border-amber-400/55 flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <span className="font-orbitron text-xs sm:text-sm font-black text-amber-300 neon-text-gold tabular-nums">
                ₡ {Math.floor(profile.credits).toLocaleString()}
              </span>
              <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label="Toggle Sound"
              className="w-11 h-11 rounded-xl bg-slate-950/75 border border-slate-700/80 flex items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Mobile Controls & Settings"
              className="w-11 h-11 rounded-xl bg-slate-950/75 border border-slate-700/80 flex items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Center Active Mobile Tab Content */}
      {lobbyTab === 'LOBBY' && (
        <div className="flex-1 flex flex-col justify-between px-2.5 pb-2 min-h-0">
          {/* Top-center 360 drag prompt + Edge Quick-Action Rails */}
          <div className="flex items-start justify-between pt-1">
            {/* Left Floating Rail */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={onCycleQuality}
                className="hud-glass w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-[8px] font-orbitron font-bold mt-0.5">{quality}</span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="hud-glass w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-emerald-300 active:scale-95 transition cursor-pointer"
              >
                {profile.controlScheme === 'GYRO' ? (
                  <Compass className="w-4 h-4" />
                ) : (
                  <Gamepad2 className="w-4 h-4" />
                )}
                <span className="text-[8px] font-orbitron font-bold mt-0.5">
                  {profile.controlScheme === 'JOYSTICK'
                    ? 'STICK'
                    : profile.controlScheme === 'SLIDE'
                      ? 'SLIDE'
                      : 'GYRO'}
                </span>
              </button>
            </div>

            {/* Center 360 Spin Prompt */}
            <div className="hud-glass px-3 py-1 rounded-full border border-cyan-400/30 text-[10px] font-orbitron text-cyan-300 tracking-wider uppercase flex items-center gap-1.5">
              <Hand className="w-3 h-3 text-amber-300" />
              SPIN 360°
            </div>

            {/* Right Floating Rail */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={onToggleFullscreen}
                aria-label="Toggle Fullscreen"
                className="hud-glass w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="text-[8px] font-orbitron font-bold mt-0.5">FULL</span>
              </button>

              <button
                type="button"
                onClick={onOpenPlayStore}
                className="hud-glass w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-emerald-300 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span className="text-[8px] font-orbitron font-bold mt-0.5">APK</span>
              </button>
            </div>
          </div>

          {/* Bottom Thumb Action Deck (Over Open 3D Hangar Floor) */}
          <div className="w-full max-w-md mx-auto space-y-2.5 pointer-events-auto">
            {/* Compact Floating Ship Nameplate */}
            <button
              type="button"
              onClick={() => onSelectTab('GARAGE')}
              className="w-full hud-glass rounded-2xl px-3.5 py-2 text-left flex items-center justify-between gap-2 active:scale-[0.99] transition cursor-pointer"
            >
              <div className="min-w-0">
                <div className="font-orbitron text-sm font-black text-white neon-text-cyan truncate">
                  {stats.ship.name}
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {mapObj.name} · {abObj.name}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 font-orbitron text-[10px] font-bold text-cyan-200 shrink-0">
                CUSTOMIZE
              </span>
            </button>

            {/* Compact Flight Mode Selector */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950/85 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => onSelectGameMode('ENDLESS')}
                className={`min-h-[44px] rounded-xl font-orbitron text-[10px] font-black uppercase flex items-center justify-center gap-1 transition cursor-pointer ${
                  gameMode === 'ENDLESS'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" /> ENDLESS
              </button>

              <button
                type="button"
                onClick={() => onSelectGameMode('TIME_ATTACK')}
                className={`min-h-[44px] rounded-xl font-orbitron text-[10px] font-black uppercase flex items-center justify-center gap-1 transition cursor-pointer ${
                  gameMode === 'TIME_ATTACK'
                    ? 'bg-pink-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" /> TIME BLITZ
              </button>

              <button
                type="button"
                onClick={() => onSelectGameMode('ZEN')}
                className={`min-h-[44px] rounded-xl font-orbitron text-[10px] font-black uppercase flex items-center justify-center gap-1 transition cursor-pointer ${
                  gameMode === 'ZEN'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> ZEN
              </button>
            </div>

            {/* Primary Thumb Launch CTA */}
            <button
              type="button"
              onClick={onLaunchGame}
              className="cyber-btn w-full min-h-[54px] bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-orbitron font-black text-base tracking-[0.2em] uppercase flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Rocket className="w-5 h-5" /> PLAY NOW
            </button>
          </div>
        </div>
      )}

      {lobbyTab === 'GARAGE' && (
        <MobileGarageView
          profile={profile}
          previewShipId={previewShipId}
          onPreviewShip={onPreviewShip}
          onSelectOrBuyShip={onSelectOrBuyShip}
          onBuyUpgrade={onBuyUpgrade}
          onSelectOrBuyMap={onSelectOrBuyMap}
          onSelectOrBuyLivery={onSelectOrBuyLivery}
          onSelectOrBuyAbility={onSelectOrBuyAbility}
        />
      )}

      {lobbyTab === 'MISSIONS' && (
        <MobileMissionsView
          profile={profile}
          onClaimTrophy={onClaimTrophy}
          onClaimAllTrophies={onClaimAllTrophies}
        />
      )}

      {lobbyTab === 'SUPPLY' && (
        <MobileSupplyView
          profile={profile}
          lastMysteryResult={lastMysteryResult}
          onClaimInstantGrant={onClaimInstantGrant}
          onClaimDailyCrate={onClaimDailyCrate}
          onOpenMysteryPod={onOpenMysteryPod}
          onOpenPlayStore={onOpenPlayStore}
        />
      )}

      {/* 3. Fixed 4-Tab Mobile Bottom Game Dock */}
      <nav className="pointer-events-auto bg-slate-950/95 border-t border-cyan-400/30 pb-safe">
        <div className="grid grid-cols-4 max-w-2xl mx-auto h-16">
          <button
            type="button"
            onClick={() => onSelectTab('LOBBY')}
            className={`relative flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              lobbyTab === 'LOBBY' ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lobbyTab === 'LOBBY' && (
              <span className="absolute top-0 w-10 h-0.5 bg-cyan-400 rounded-full" />
            )}
            <Rocket className="w-5 h-5" />
            <span className="font-orbitron text-[10px] font-bold tracking-wider">LOBBY</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('GARAGE')}
            className={`relative flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              lobbyTab === 'GARAGE' ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lobbyTab === 'GARAGE' && (
              <span className="absolute top-0 w-10 h-0.5 bg-cyan-400 rounded-full" />
            )}
            <Wrench className="w-5 h-5" />
            <span className="font-orbitron text-[10px] font-bold tracking-wider">GARAGE</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('MISSIONS')}
            className={`relative flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              lobbyTab === 'MISSIONS' ? 'text-amber-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lobbyTab === 'MISSIONS' && (
              <span className="absolute top-0 w-10 h-0.5 bg-amber-400 rounded-full" />
            )}
            <div className="relative">
              <Trophy className="w-5 h-5" />
              {claimableTrophies > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1 rounded-full bg-emerald-400 text-slate-950 font-orbitron text-[8px] font-black leading-tight">
                  {claimableTrophies}
                </span>
              )}
            </div>
            <span className="font-orbitron text-[10px] font-bold tracking-wider">MISSIONS</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('SUPPLY')}
            className={`relative flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              lobbyTab === 'SUPPLY' ? 'text-emerald-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lobbyTab === 'SUPPLY' && (
              <span className="absolute top-0 w-10 h-0.5 bg-emerald-400 rounded-full" />
            )}
            <Gift className="w-5 h-5" />
            <span className="font-orbitron text-[10px] font-bold tracking-wider">SUPPLY</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
