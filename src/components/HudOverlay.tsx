import React, { useRef, useState } from 'react';
import {
  Atom,
  ChevronsUp,
  Compass,
  Flame,
  MoveHorizontal,
  Pause,
  Shield,
  Smartphone,
  Video,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { ABILITIES_CATALOG } from '../data/catalogs';
import type { CalloutMessage, HudTelemetry, PlayerProfile } from '../types/game';

interface HudOverlayProps {
  visible: boolean;
  telemetry: HudTelemetry;
  profile: PlayerProfile;
  muted: boolean;
  callouts: CalloutMessage[];
  onCycleCamera: () => void;
  onRecenterGyro: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onJump: () => void;
  onTriggerAbility: () => void;
  onAnalogSteer: (value: number) => void;
  onNitroHold: (active: boolean) => void;
  onNitroToggle: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  visible,
  telemetry,
  profile,
  muted,
  callouts,
  onCycleCamera,
  onRecenterGyro,
  onToggleMute,
  onPause,
  onJump,
  onTriggerAbility,
  onAnalogSteer,
  onNitroHold,
  onNitroToggle,
}) => {
  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyActiveRef = useRef(false);
  const joyCenterRef = useRef({ x: 0, y: 0 });
  const [joyOffset, setJoyOffset] = useState({ x: 0, y: 0 });

  const slideRef = useRef<HTMLDivElement | null>(null);
  const slideActiveRef = useRef(false);
  const slideStartYRef = useRef(0);
  const [slidePercent, setSlidePercent] = useState(50);

  // Full-screen swipe gesture zone (upper/center canvas)
  const swipeActiveRef = useRef(false);
  const swipeOriginRef = useRef({ x: 0, y: 0 });

  const abilitySpec =
    ABILITIES_CATALOG.find((a) => a.id === profile.selectedAbility) || ABILITIES_CATALOG[0];

  let abilityPct = 1;
  let abilityStatusText = 'READY';
  if (telemetry.abilityActiveTimer > 0) {
    abilityPct = 1;
    abilityStatusText = 'ACTIVE';
  } else if (telemetry.abilityCooldown > 0) {
    abilityPct = 1 - telemetry.abilityCooldown / Math.max(1, telemetry.abilityMaxCooldown);
    abilityStatusText = `${telemetry.abilityCooldown.toFixed(1)}s`;
  }

  const circum = 182;
  const dashOffset = circum * (1 - abilityPct);
  const nitroPct = Math.max(0, Math.min(100, telemetry.nitro));
  const comboPct = Math.max(0, Math.min(100, (telemetry.comboTimer / 4.5) * 100));
  const gyroPct = Math.max(10, Math.min(90, 50 + (telemetry.gyroAngle / 25) * 40));

  const handleJoyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joyRef.current) return;
    e.stopPropagation();
    joyActiveRef.current = true;
    const rect = joyRef.current.getBoundingClientRect();
    joyCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    joyRef.current.setPointerCapture(e.pointerId);
  };

  const handleJoyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joyActiveRef.current) return;
    const dx = e.clientX - joyCenterRef.current.x;
    const dy = e.clientY - joyCenterRef.current.y;
    const maxR = 44;
    const clampedX = Math.max(-maxR, Math.min(maxR, dx));
    const clampedY = Math.max(-maxR, Math.min(maxR, dy));
    setJoyOffset({ x: clampedX, y: clampedY });
    onAnalogSteer((clampedX / maxR) * profile.sensitivity);
    if (dy < -34) onJump();
  };

  const resetJoy = () => {
    joyActiveRef.current = false;
    setJoyOffset({ x: 0, y: 0 });
    onAnalogSteer(0);
  };

  const handleSlidePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!slideRef.current) return;
    e.stopPropagation();
    slideActiveRef.current = true;
    slideStartYRef.current = e.clientY;
    slideRef.current.setPointerCapture(e.pointerId);
  };

  const handleSlidePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!slideActiveRef.current || !slideRef.current) return;
    const rect = slideRef.current.getBoundingClientRect();
    const norm = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const clampedNorm = Math.max(-1, Math.min(1, norm));
    onAnalogSteer(clampedNorm * profile.sensitivity);
    setSlidePercent(Math.max(10, Math.min(90, (clampedNorm * 0.5 + 0.5) * 100)));
    if (slideStartYRef.current - e.clientY > 36) {
      onJump();
      slideStartYRef.current = e.clientY;
    }
  };

  const resetSlide = () => {
    slideActiveRef.current = false;
    setSlidePercent(50);
    onAnalogSteer(0);
  };

  const handleSwipeZoneDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!visible || telemetry.mode !== 'PLAYING') return;
    swipeActiveRef.current = true;
    swipeOriginRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSwipeZoneMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeActiveRef.current || telemetry.mode !== 'PLAYING') return;
    const dx = e.clientX - swipeOriginRef.current.x;
    const dy = swipeOriginRef.current.y - e.clientY;
    const steer = Math.max(-1, Math.min(1, dx / 75)) * profile.sensitivity;
    onAnalogSteer(steer);
    if (dy > 44) {
      onJump();
      swipeOriginRef.current.y = e.clientY;
    }
  };

  const resetSwipeZone = () => {
    if (!swipeActiveRef.current) return;
    swipeActiveRef.current = false;
    onAnalogSteer(0);
  };

  return (
    <>
      {/* Atmospheric Warp & Cloak Overlays */}
      <div
        className={`fixed inset-0 pointer-events-none z-[6] transition-opacity duration-300 ${
          visible && telemetry.isBoosting ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle, transparent 50%, rgba(0, 243, 255, 0.28) 100%)',
        }}
      />
      <div
        className={`fixed inset-0 pointer-events-none z-[6] transition-opacity duration-300 ${
          visible && telemetry.isCloaked ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(192, 132, 252, 0.35) 100%)',
        }}
      />

      {/* Floating Callouts */}
      <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
        {callouts.map((c) => (
          <div
            key={c.id}
            className={`callout-item font-orbitron font-black text-sm sm:text-lg tracking-wider uppercase ${c.colorClass}`}
          >
            {c.text}
          </div>
        ))}
      </div>

      {/* Main Mobile In-Game HUD Layer */}
      <div
        className={`fixed inset-0 pointer-events-none z-10 flex flex-col justify-between safe-pad transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Mobile Game Bar (Compact single-row footprint) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {/* Left Score + Combo + Run Credits */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="hud-glass px-2.5 py-1.5 rounded-xl">
                <div className="text-[8px] tracking-[0.16em] text-slate-400 uppercase font-bold leading-none">
                  Score
                </div>
                <div className="font-orbitron text-base sm:text-xl font-black text-white neon-text-cyan leading-tight tabular-nums">
                  {telemetry.score.toLocaleString()}
                </div>
              </div>

              <div className="hud-glass px-2.5 py-1.5 rounded-xl border border-amber-400/40">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-orbitron text-xs sm:text-sm font-black text-amber-300 neon-text-gold tabular-nums leading-none">
                    x{telemetry.combo}
                  </span>
                  <span className="font-orbitron text-[10px] font-bold text-amber-200 tabular-nums leading-none">
                    +₡{telemetry.runCredits}
                  </span>
                </div>
                <div className="w-14 h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all duration-100"
                    style={{ width: `${comboPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right Touch Action Cluster */}
            <div
              className={`flex items-center gap-1.5 shrink-0 ${
                visible ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <div className="hidden sm:flex items-center gap-2 hud-glass px-2.5 h-11 rounded-xl text-[10px] font-orbitron">
                <span className="text-cyan-300 font-bold tabular-nums">
                  {telemetry.distance.toLocaleString()}M
                </span>
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {telemetry.gameMode === 'ZEN' ? 'ZEN' : `x${telemetry.shieldCharges}`}
                </span>
              </div>

              <button
                type="button"
                onClick={onCycleCamera}
                title="Switch Camera [C]"
                className="hud-glass min-w-[44px] h-11 px-2 rounded-xl flex flex-col items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="text-[7px] font-orbitron font-bold mt-0.5">
                  {telemetry.cameraMode}
                </span>
              </button>

              {profile.controlScheme === 'GYRO' && (
                <button
                  type="button"
                  onClick={onRecenterGyro}
                  title="Recalibrate Gyro"
                  className="hud-glass min-w-[44px] h-11 px-2 rounded-xl flex flex-col items-center justify-center text-amber-300 active:scale-95 transition cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="text-[7px] font-orbitron font-bold mt-0.5">ZERO</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleMute}
                aria-label="Toggle Sound"
                className="hud-glass w-11 h-11 rounded-xl flex items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onPause}
                aria-label="Pause Game"
                className="hud-glass w-11 h-11 rounded-xl flex items-center justify-center text-amber-300 active:scale-95 transition cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Compact Sector + Shield + Blitz Clock Strip */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-orbitron">
            <div className="hud-glass px-2.5 py-1 rounded-xl flex items-center gap-2 text-cyan-200 truncate">
              <span className="truncate">
                S0{telemetry.sectorIndex} · {telemetry.activeBiomeName}
              </span>
              <span className="sm:hidden text-emerald-300 font-bold flex items-center gap-0.5 shrink-0">
                <Shield className="w-3 h-3" />
                {telemetry.gameMode === 'ZEN' ? 'ZEN' : `x${telemetry.shieldCharges}`}
              </span>
            </div>

            {telemetry.gameMode === 'TIME_ATTACK' ? (
              <div className="hud-glass px-3 py-1 rounded-xl border border-pink-500/60 text-pink-300 font-black tabular-nums shrink-0">
                ⏱ {Math.max(0, telemetry.timeRemaining).toFixed(1)}s
              </div>
            ) : (
              <div className="sm:hidden hud-glass px-2.5 py-1 rounded-xl text-white font-bold tabular-nums shrink-0">
                {telemetry.distance.toLocaleString()} M
              </div>
            )}
          </div>
        </div>

        {/* Center Touch Swipe Gesture Zone (Active only during flight) */}
        <div
          onPointerDown={handleSwipeZoneDown}
          onPointerMove={handleSwipeZoneMove}
          onPointerUp={resetSwipeZone}
          onPointerCancel={resetSwipeZone}
          className={`flex-1 touch-none ${
            visible && telemetry.mode === 'PLAYING' ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        />

        {/* Bottom Mobile Arcade Controls + Slim Telemetry Bar */}
        <div className="flex flex-col gap-2">
          {/* Slim Nitro + Tactical + Speed Strip */}
          <div className="flex items-center justify-between gap-2 max-w-3xl w-full mx-auto">
            <div className="hud-glass px-2.5 py-1.5 rounded-xl flex-1 min-w-0">
              <div className="flex items-center justify-between text-[9px] font-orbitron mb-1">
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" /> NITRO
                </span>
                <span className="text-purple-300 font-bold truncate ml-2">
                  {abilitySpec.name} · {abilityStatusText}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 transition-all duration-100"
                  style={{ width: `${nitroPct}%` }}
                />
              </div>
            </div>

            <div className="hud-glass px-3 py-1.5 rounded-xl flex items-baseline gap-1 shrink-0">
              <span className="font-orbitron text-lg sm:text-2xl font-black text-white neon-text-cyan leading-none tabular-nums">
                {telemetry.speedKmh}
              </span>
              <span className="font-orbitron text-[9px] font-bold text-cyan-400">KM/H</span>
            </div>
          </div>

          {profile.showTouchHud && (
            <div
              className={`flex items-end justify-between px-0.5 sm:px-3 pb-0.5 select-none ${
                visible ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              {/* Left Steering Pad */}
              <div className="relative flex items-center">
                {profile.controlScheme === 'JOYSTICK' && (
                  <div
                    ref={joyRef}
                    onPointerDown={handleJoyPointerDown}
                    onPointerMove={handleJoyPointerMove}
                    onPointerUp={resetJoy}
                    onPointerCancel={resetJoy}
                    className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
                  >
                    <div className="joystick-base w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center relative">
                      <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/25 pointer-events-none" />
                      <span className="absolute top-1.5 text-[8px] font-orbitron text-cyan-300/70 tracking-widest pointer-events-none">
                        ▲ JUMP
                      </span>
                      <span className="absolute left-2 text-[9px] font-orbitron text-cyan-300/60 pointer-events-none">
                        ◀
                      </span>
                      <span className="absolute right-2 text-[9px] font-orbitron text-cyan-300/60 pointer-events-none">
                        ▶
                      </span>
                      <div
                        className="joystick-nub w-12 h-12 rounded-full pointer-events-none flex items-center justify-center"
                        style={{
                          transform: `translate(${joyOffset.x}px, ${joyOffset.y}px)`,
                        }}
                      >
                        <div className="w-4 h-4 rounded-full bg-white/80" />
                      </div>
                    </div>
                  </div>
                )}

                {profile.controlScheme === 'SLIDE' && (
                  <div
                    ref={slideRef}
                    onPointerDown={handleSlidePointerDown}
                    onPointerMove={handleSlidePointerMove}
                    onPointerUp={resetSlide}
                    onPointerCancel={resetSlide}
                    className="w-40 sm:w-52 h-24 rounded-2xl hud-glass border border-cyan-400/45 flex flex-col items-center justify-center relative overflow-hidden touch-none cursor-ew-resize px-2"
                  >
                    <div className="text-[9px] font-orbitron text-cyan-300 tracking-wider uppercase pointer-events-none flex items-center gap-1">
                      <MoveHorizontal className="w-3.5 h-3.5" /> SLIDE STEER
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5 pointer-events-none">
                      SWIPE UP TO JUMP
                    </div>
                    <div className="w-4/5 h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden relative pointer-events-none">
                      <div
                        className="w-6 h-full bg-cyan-400 rounded-full absolute -translate-x-1/2 shadow-[0_0_10px_#00f3ff]"
                        style={{ left: `${slidePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {profile.controlScheme === 'GYRO' && (
                  <div className="w-40 sm:w-52 h-20 rounded-2xl hud-glass border border-amber-400/45 flex flex-col items-center justify-center px-3 touch-none">
                    <div className="flex items-center justify-between w-full text-[9px] font-orbitron text-amber-300 uppercase">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> TILT GYRO
                      </span>
                      <span className="tabular-nums">{Math.round(telemetry.gyroAngle)}°</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full my-1.5 relative overflow-hidden border border-slate-700">
                      <div
                        className="w-8 h-full bg-gradient-to-r from-amber-400 to-cyan-400 rounded-full absolute -translate-x-1/2"
                        style={{ left: `${gyroPct}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={onRecenterGyro}
                      className="text-[9px] font-orbitron text-cyan-300 underline uppercase cursor-pointer"
                    >
                      Tap to Recenter
                    </button>
                  </div>
                )}
              </div>

              {/* Right Staggered Arcade Thumb Cluster */}
              <div className="flex items-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTriggerAbility();
                  }}
                  className="arcade-touch-btn relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-purple-400/70 flex flex-col items-center justify-center text-purple-200 cursor-pointer"
                >
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                    viewBox="0 0 64 64"
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r="29"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="3"
                      strokeDasharray={circum}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Atom className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                  <span className="font-orbitron text-[8px] font-black tracking-wider mt-0.5">
                    TECH
                  </span>
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onJump();
                  }}
                  className="arcade-touch-btn w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-cyan-400/80 flex flex-col items-center justify-center text-cyan-200 cursor-pointer"
                >
                  <ChevronsUp className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300" />
                  <span className="font-orbitron text-[9px] font-black tracking-wider mt-0.5">
                    JUMP
                  </span>
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (profile.nitroToggleMode) {
                      onNitroToggle();
                    } else {
                      onNitroHold(true);
                    }
                  }}
                  onPointerUp={() => {
                    if (!profile.nitroToggleMode) onNitroHold(false);
                  }}
                  onPointerCancel={() => {
                    if (!profile.nitroToggleMode) onNitroHold(false);
                  }}
                  onPointerLeave={() => {
                    if (!profile.nitroToggleMode) onNitroHold(false);
                  }}
                  className={`arcade-touch-btn relative w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 flex flex-col items-center justify-center text-amber-200 cursor-pointer ${
                    telemetry.isNitroLatched || telemetry.isBoosting
                      ? 'touch-active border-cyan-300 shadow-[0_0_28px_rgba(0,243,255,0.6)]'
                      : 'border-amber-400/90 shadow-[0_0_25px_rgba(255,170,0,0.3)]'
                  }`}
                >
                  <Zap className="w-6 h-6 text-amber-300" />
                  <span className="font-orbitron text-[10px] font-black tracking-wider mt-0.5">
                    NITRO
                  </span>
                  <span className="text-[7px] font-orbitron text-amber-300/85 uppercase">
                    {profile.nitroToggleMode
                      ? telemetry.isNitroLatched
                        ? 'ON'
                        : 'TOGGLE'
                      : 'HOLD'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
