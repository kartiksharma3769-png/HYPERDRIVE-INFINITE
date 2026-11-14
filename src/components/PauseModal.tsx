import React from 'react';
import {
  Compass,
  Gamepad2,
  Hand,
  Home,
  Play,
  RotateCw,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import type { ControlScheme, PlayerProfile, QualityPreset } from '../types/game';

interface PauseModalProps {
  visible: boolean;
  profile: PlayerProfile;
  quality: QualityPreset;
  onSelectControlScheme: (scheme: ControlScheme) => void;
  onChangeSensitivity: (sens: number) => void;
  onSelectQuality: (q: QualityPreset) => void;
  onResume: () => void;
  onOpenSettings: () => void;
  onRestart: () => void;
  onReturnMainMenu: () => void;
}

const QUALITIES: QualityPreset[] = ['LOW', 'HIGH', 'ULTRA'];

export const PauseModal: React.FC<PauseModalProps> = ({
  visible,
  profile,
  quality,
  onSelectControlScheme,
  onChangeSensitivity,
  onSelectQuality,
  onResume,
  onOpenSettings,
  onRestart,
  onReturnMainMenu,
}) => {
  if (!visible) return null;

  const sensPct = Math.round(profile.sensitivity * 100);

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4 modal-backdrop">
      <div className="hud-glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-safe border-t sm:border border-cyan-400/50 space-y-4 max-h-[88vh] overflow-y-auto custom-scroll sheet-enter">
        <div className="w-10 h-1 bg-slate-600/80 rounded-full mx-auto sm:hidden" />

        <div className="text-center">
          <div className="text-[10px] tracking-[0.26em] text-cyan-400 uppercase font-bold">
            Flight Paused
          </div>
          <h2 className="font-orbitron text-xl font-black text-white neon-text-cyan">
            INTERCEPTOR ON HOLD
          </h2>
        </div>

        {/* Live Mobile Control Scheme + Sensitivity */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
          <div className="text-[10px] font-orbitron uppercase tracking-widest text-cyan-300 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Touch Control Mode
            </span>
            <span className="text-amber-300 tabular-nums">SENS {sensPct}%</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectControlScheme('JOYSTICK')}
              className={`min-h-[48px] px-1 rounded-xl font-orbitron text-[10px] font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                profile.controlScheme === 'JOYSTICK'
                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              <Gamepad2 className="w-4 h-4 mb-0.5 text-cyan-300" />
              STICK
            </button>

            <button
              type="button"
              onClick={() => onSelectControlScheme('SLIDE')}
              className={`min-h-[48px] px-1 rounded-xl font-orbitron text-[10px] font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                profile.controlScheme === 'SLIDE'
                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              <Hand className="w-4 h-4 mb-0.5 text-emerald-300" />
              SLIDE
            </button>

            <button
              type="button"
              onClick={() => onSelectControlScheme('GYRO')}
              className={`min-h-[48px] px-1 rounded-xl font-orbitron text-[10px] font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                profile.controlScheme === 'GYRO'
                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              <Compass className="w-4 h-4 mb-0.5 text-amber-300" />
              GYRO
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label
              htmlFor="pause-sens-slider"
              className="text-[10px] font-orbitron text-slate-400 uppercase"
            >
              Sensitivity
            </label>
            <input
              id="pause-sens-slider"
              type="range"
              min={50}
              max={180}
              value={sensPct}
              onChange={(e) => onChangeSensitivity(Number(e.target.value) / 100)}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Graphics Quality Switcher */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2">
          <span className="text-[10px] font-orbitron text-cyan-300 font-bold uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Graphics
          </span>
          <div className="flex items-center gap-1.5">
            {QUALITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSelectQuality(q)}
                className={`min-h-[36px] px-2.5 rounded-lg font-orbitron text-[10px] font-bold border transition cursor-pointer ${
                  quality === q
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onResume}
            className="cyber-btn w-full min-h-[50px] bg-cyan-400 text-slate-950 font-orbitron font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" /> RESUME FLIGHT
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-400/40 text-cyan-300 font-orbitron font-bold text-[11px] uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> SETTINGS
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-orbitron font-bold text-[11px] uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> RESTART
            </button>
          </div>

          <button
            type="button"
            onClick={onReturnMainMenu}
            className="w-full min-h-[46px] rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-orbitron font-bold text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> EXIT TO LOBBY (SAVE ₡)
          </button>
        </div>
      </div>
    </div>
  );
};
