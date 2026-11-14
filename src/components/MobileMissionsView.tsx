import React from 'react';
import { CheckCircle2, ClipboardCheck, Lock, Trophy } from 'lucide-react';
import { ACHIEVEMENTS_CATALOG } from '../data/catalogs';
import type { PlayerProfile } from '../types/game';

interface MobileMissionsViewProps {
  profile: PlayerProfile;
  onClaimTrophy: (achId: string) => void;
  onClaimAllTrophies: () => void;
}

export const MobileMissionsView: React.FC<MobileMissionsViewProps> = ({
  profile,
  onClaimTrophy,
  onClaimAllTrophies,
}) => {
  const readyCount = ACHIEVEMENTS_CATALOG.filter(
    (a) => a.check(profile) && !profile.claimedAchievements.includes(a.id),
  ).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 px-2 pb-2 pointer-events-auto max-w-2xl w-full mx-auto sheet-enter">
      <div className="hud-glass rounded-3xl border border-cyan-400/35 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div>
            <h2 className="font-orbitron text-sm sm:text-base font-black text-white neon-text-gold">
              MISSIONS &amp; TROPHIES
            </h2>
            <p className="text-[11px] text-slate-400">
              Complete flight contracts &amp; career milestones for Quantum Credits
            </p>
          </div>
          {readyCount > 0 && (
            <button
              type="button"
              onClick={onClaimAllTrophies}
              className="min-h-[40px] px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-orbitron text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer"
            >
              CLAIM ALL ({readyCount})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-3.5 space-y-4">
          {/* Active Flight Contracts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-orbitron font-bold uppercase tracking-wider text-amber-300">
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4" /> Active Flight Contracts
              </span>
              <span className="text-slate-400 text-[10px]">Auto-Paid In Flight</span>
            </div>

            {profile.contracts.map((c, idx) => {
              const pct = Math.min(100, Math.floor((c.progress / c.target) * 100));
              return (
                <div
                  key={`${c.type}-${idx}`}
                  className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800"
                >
                  <div className="flex justify-between items-center text-xs font-orbitron">
                    <span className="text-white font-bold">{c.title}</span>
                    <span className="text-amber-300 font-black tabular-nums">+₡ {c.reward}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-cyan-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 text-right tabular-nums">
                    {Math.floor(c.progress)} / {c.target} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pilot Trophies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-orbitron font-bold uppercase tracking-wider text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Pilot Trophies (
                {profile.claimedAchievements.length}/{ACHIEVEMENTS_CATALOG.length})
              </span>
            </div>

            {ACHIEVEMENTS_CATALOG.map((ach) => {
              const unlocked = ach.check(profile);
              const claimed = profile.claimedAchievements.includes(ach.id);
              const [cur, max] = ach.progress(profile);
              const pct = Math.min(100, Math.round((cur / Math.max(1, max)) * 100));

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    claimed
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : unlocked
                        ? 'border-amber-400/70 bg-amber-500/15'
                        : 'border-slate-800 bg-slate-950/80'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {claimed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : unlocked ? (
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className="font-orbitron font-black text-xs text-white">
                        {ach.name}
                      </span>
                      <span className="text-[10px] font-orbitron text-amber-300 font-bold tabular-nums">
                        +₡ {ach.reward.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{ach.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            claimed
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-amber-400 to-cyan-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-orbitron text-[10px] text-cyan-300 tabular-nums shrink-0">
                        {cur.toLocaleString()}/{max.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!unlocked || claimed}
                    onClick={() => onClaimTrophy(ach.id)}
                    className={`min-h-[44px] px-4 rounded-xl font-orbitron text-[10px] font-black uppercase tracking-wider shrink-0 transition ${
                      claimed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                        : unlocked
                          ? 'bg-amber-400 text-slate-950 active:scale-95 cursor-pointer'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {claimed ? 'CLAIMED' : unlocked ? `CLAIM +₡ ${ach.reward}` : 'LOCKED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
