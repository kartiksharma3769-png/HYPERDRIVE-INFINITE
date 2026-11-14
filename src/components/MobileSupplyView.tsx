import React from 'react';
import { Dices, Gift, Play, Smartphone, Zap } from 'lucide-react';
import type { PlayerProfile } from '../types/game';

interface MobileSupplyViewProps {
  profile: PlayerProfile;
  lastMysteryResult: string | null;
  onClaimInstantGrant: () => void;
  onClaimDailyCrate: () => void;
  onOpenMysteryPod: () => void;
  onOpenPlayStore: () => void;
}

export const MobileSupplyView: React.FC<MobileSupplyViewProps> = ({
  profile,
  lastMysteryResult,
  onClaimInstantGrant,
  onClaimDailyCrate,
  onOpenMysteryPod,
  onOpenPlayStore,
}) => {
  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const dailyClaimedToday = profile.lastDailyClaim === currentDay;

  return (
    <div className="flex-1 flex flex-col min-h-0 px-2 pb-2 pointer-events-auto max-w-2xl w-full mx-auto sheet-enter">
      <div className="hud-glass rounded-3xl border border-amber-400/40 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 shrink-0">
          <h2 className="font-orbitron text-sm sm:text-base font-black text-white neon-text-gold">
            ORBITAL SUPPLY VAULT
          </h2>
          <p className="text-[11px] text-slate-400">
            Claim daily stipends, open mystery pods, or package for Google Play &amp; iOS
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-3.5 space-y-3">
          {/* Instant Research Grant */}
          <div className="bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-blue-500/20 border border-emerald-400/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-400/20 border border-emerald-300 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="font-orbitron text-xs sm:text-sm font-black text-white">
                  HYPERION RESEARCH GRANT
                </div>
                <div className="text-[11px] text-slate-300">
                  Unlimited instant funding drop to unlock ships &amp; upgrades.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClaimInstantGrant}
              className="min-h-[44px] w-full sm:w-auto px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-orbitron text-xs font-black uppercase tracking-wider shrink-0 active:scale-95 transition cursor-pointer"
            >
              CLAIM +₡ 2,500
            </button>
          </div>

          {/* Daily Stipend Crate */}
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-purple-500/20 border border-amber-400/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron text-xs sm:text-sm font-black text-white">
                    DAILY PILOT CRATE
                  </span>
                  <span className="text-[10px] font-orbitron text-amber-300 font-bold">
                    {dailyClaimedToday ? '· CLAIMED TODAY' : '· READY'}
                  </span>
                </div>
                <div className="text-[11px] text-amber-100/90">
                  Daily orbital login stipend (+₡ 1,500 Quantum Credits).
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClaimDailyCrate}
              className="min-h-[44px] w-full sm:w-auto px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-orbitron text-xs font-black uppercase tracking-wider shrink-0 active:scale-95 transition cursor-pointer"
            >
              CLAIM +₡ 1,500
            </button>
          </div>

          {/* Mystery Quantum Supply Pod */}
          <div className="bg-gradient-to-r from-purple-500/20 via-fuchsia-500/15 to-cyan-500/20 border border-purple-400/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-400/20 border border-purple-300 flex items-center justify-center shrink-0">
                <Dices className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <div className="font-orbitron text-xs sm:text-sm font-black text-white">
                  QUANTUM MYSTERY POD
                </div>
                <div
                  className={`text-[11px] ${
                    lastMysteryResult ? 'text-amber-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  {lastMysteryResult
                    ? `LAST DROP: ${lastMysteryResult}`
                    : 'Roll for ₡ 950 to ₡ 5,000 Quantum Jackpot!'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenMysteryPod}
              className="min-h-[44px] w-full sm:w-auto px-4 rounded-xl bg-gradient-to-r from-purple-400 to-cyan-400 text-slate-950 font-orbitron text-xs font-black uppercase tracking-wider shrink-0 active:scale-95 transition cursor-pointer"
            >
              OPEN (₡ 500)
            </button>
          </div>

          {/* Native Android APK / iOS Build Kit */}
          <div className="bg-slate-950/85 border border-cyan-400/35 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <div className="font-orbitron text-xs sm:text-sm font-black text-white">
                  ANDROID APK &amp; iOS APP BUILD KIT
                </div>
                <div className="text-[11px] text-slate-400">
                  Capacitor CLI export guide for Google Play &amp; App Store.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPlayStore}
              className="min-h-[44px] w-full sm:w-auto px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 font-orbitron text-xs font-black uppercase tracking-wider shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> OPEN KIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
