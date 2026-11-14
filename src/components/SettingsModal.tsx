import React from 'react';
import { Compass, Gamepad2, Hand, SlidersHorizontal, Smartphone, X } from 'lucide-react';
import type { ControlScheme, PlayerProfile } from '../types/game';

interface SettingsModalProps {
  open: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onSelectControlScheme: (scheme: ControlScheme) => void;
  onChangeSensitivity: (sens: number) => void;
  onToggleHaptics: () => void;
  onToggleNitroMode: () => void;
  onToggleTouchHud: () => void;
  onRequestGyroPermission: () => void;
  onSaveAndApply: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  profile,
  onClose,
  onSelectControlScheme,
  onChangeSensitivity,
  onToggleHaptics,
  onToggleNitroMode,
  onToggleTouchHud,
  onRequestGyroPermission,
  onSaveAndApply,
}) => {
  if (!open) return null;

  const sensPct = Math.round(profile.sensitivity * 100);
  const needsIosGyroPrompt =
    typeof window !== 'undefined' &&
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 modal-backdrop">
      <div className="hud-glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 pb-safe border-t sm:border border-cyan-400/50 space-y-4 max-h-[90vh] overflow-y-auto custom-scroll sheet-enter">
        <div className="w-10 h-1 bg-slate-600/80 rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-black text-white neon-text-cyan">
                MOBILE &amp; FLIGHT SETTINGS
              </h3>
              <p className="text-[11px] text-slate-400">
                Touch Controls, Gyroscope &amp; Haptics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Control Scheme */}
        <div className="space-y-2">
          <label className="text-xs font-orbitron uppercase tracking-wider text-cyan-300 font-bold block">
            1. Mobile Steering Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSelectControlScheme('JOYSTICK')}
              className={`min-h-[82px] p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                profile.controlScheme === 'JOYSTICK'
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-slate-700 bg-slate-900/70'
              }`}
            >
              <Gamepad2 className="w-5 h-5 text-cyan-300 mb-1" />
              <div className="font-orbitron text-[11px] font-bold text-white">JOYSTICK</div>
              <div className="text-[10px] text-slate-300 leading-tight mt-0.5">
                Thumbstick + pad
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectControlScheme('SLIDE')}
              className={`min-h-[82px] p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                profile.controlScheme === 'SLIDE'
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-slate-700 bg-slate-900/70'
              }`}
            >
              <Hand className="w-5 h-5 text-emerald-300 mb-1" />
              <div className="font-orbitron text-[11px] font-bold text-white">SLIDE PAD</div>
              <div className="text-[10px] text-slate-300 leading-tight mt-0.5">
                Drag + swipe jump
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectControlScheme('GYRO')}
              className={`min-h-[82px] p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                profile.controlScheme === 'GYRO'
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-slate-700 bg-slate-900/70'
              }`}
            >
              <Compass className="w-5 h-5 text-amber-300 mb-1" />
              <div className="font-orbitron text-[11px] font-bold text-white">TILT GYRO</div>
              <div className="text-[10px] text-slate-300 leading-tight mt-0.5">
                Tilt steering wheel
              </div>
            </button>
          </div>

          {profile.controlScheme === 'GYRO' && needsIosGyroPrompt && (
            <button
              type="button"
              onClick={onRequestGyroPermission}
              className="w-full min-h-[44px] rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-200 font-orbitron text-[11px] font-bold uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" /> ENABLE iOS MOTION SENSOR PERMISSION
            </button>
          )}
        </div>

        {/* 2. Sensitivity Slider */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between text-xs font-orbitron">
            <label htmlFor="settings-sens-slider" className="text-slate-300 font-bold">
              STEERING &amp; TILT SENSITIVITY
            </label>
            <span className="text-cyan-300 font-bold tabular-nums">{sensPct}%</span>
          </div>
          <input
            id="settings-sens-slider"
            type="range"
            min={50}
            max={180}
            value={sensPct}
            onChange={(e) => onChangeSensitivity(Number(e.target.value) / 100)}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* 3. Mobile Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onToggleHaptics}
            className="min-h-[58px] p-3 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-between text-left active:scale-[0.99] transition cursor-pointer"
          >
            <div>
              <div className="font-orbitron text-xs font-bold text-white">HAPTIC VIBRATION</div>
              <div className="text-[10px] text-slate-400">Vibrate on boost &amp; impacts</div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg font-orbitron text-[10px] font-bold border ${
                profile.haptics
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-slate-800 text-slate-400 border-slate-600'
              }`}
            >
              {profile.haptics ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleNitroMode}
            className="min-h-[58px] p-3 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-between text-left active:scale-[0.99] transition cursor-pointer"
          >
            <div>
              <div className="font-orbitron text-xs font-bold text-white">NITRO BUTTON MODE</div>
              <div className="text-[10px] text-slate-400">Hold vs One-Tap Toggle</div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg font-orbitron text-[10px] font-bold border ${
                profile.nitroToggleMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
              }`}
            >
              {profile.nitroToggleMode ? 'TOGGLE' : 'HOLD'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleTouchHud}
            className="min-h-[58px] p-3 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-between text-left sm:col-span-2 active:scale-[0.99] transition cursor-pointer"
          >
            <div>
              <div className="font-orbitron text-xs font-bold text-white">
                ON-SCREEN ARCADE TOUCH PAD
              </div>
              <div className="text-[10px] text-slate-400">
                Display virtual joystick &amp; arcade buttons during flight
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg font-orbitron text-[10px] font-bold border ${
                profile.showTouchHud
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-slate-800 text-slate-400 border-slate-600'
              }`}
            >
              {profile.showTouchHud ? 'VISIBLE' : 'HIDDEN'}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onSaveAndApply}
          className="cyber-btn w-full min-h-[50px] bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-orbitron font-black text-xs sm:text-sm tracking-widest uppercase cursor-pointer"
        >
          SAVE &amp; APPLY CONFIG
        </button>
      </div>
    </div>
  );
};
