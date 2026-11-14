import React from 'react';
import { AlertTriangle, Home, RotateCw, Wrench } from 'lucide-react';
import type { HudTelemetry, PlayerProfile } from '../types/game';

interface GameOverModalProps {
  visible: boolean;
  telemetry: HudTelemetry;
  profile: PlayerProfile;
  onRestart: () => void;
  onOpenGarage: () => void;
  onReturnLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  telemetry,
  profile,
  onRestart,
  onOpenGarage,
  onReturnLobby,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4 modal-backdrop">
      <div className="hud-glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe border-t sm:border border-pink-500/45 space-y-4 text-center sheet-enter">
        <div className="w-10 h-1 bg-slate-600/80 rounded-full mx-auto sm:hidden" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 font-orbitron text-[10px] font-bold tracking-widest uppercase">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{telemetry.endReason}</span>
        </div>

        <h2 className="font-orbitron text-2xl sm:text-3xl font-black text-white neon-text-pink">
          FLIGHT TERMINATED
        </h2>

        {telemetry.isNewRecord && (
          <div className="py-1.5 px-4 rounded-xl bg-amber-400/20 border border-amber-300 text-amber-200 font-orbitron text-xs font-black tracking-widest uppercase">
            ★ NEW PERSONAL RECORD ACHIEVED ★
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Final Score</div>
            <div className="font-orbitron text-lg font-black text-cyan-300 mt-0.5 tabular-nums">
              {telemetry.score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Distance</div>
            <div className="font-orbitron text-lg font-black text-white mt-0.5 tabular-nums">
              {telemetry.distance.toLocaleString()} M
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-400/40">
            <div className="text-[9px] text-amber-300 uppercase font-bold">Credits Earned</div>
            <div className="font-orbitron text-lg font-black text-amber-300 mt-0.5 tabular-nums">
              +₡ {telemetry.runCredits.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[9px] text-slate-400 uppercase font-bold">High Score</div>
            <div className="font-orbitron text-lg font-black text-emerald-300 mt-0.5 tabular-nums">
              {Math.floor(profile.highScore).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onRestart}
            className="cyber-btn w-full min-h-[52px] bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-orbitron font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" /> PLAY AGAIN
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenGarage}
              className="min-h-[46px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-orbitron font-black text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-4 h-4" /> GARAGE
            </button>

            <button
              type="button"
              onClick={onReturnLobby}
              className="min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-orbitron font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" /> LOBBY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
