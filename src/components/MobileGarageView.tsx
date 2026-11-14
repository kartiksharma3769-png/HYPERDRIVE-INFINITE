import React, { useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  Gauge,
  Globe,
  Magnet,
  MoveHorizontal,
  Palette,
  Plane,
  Shield,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  ABILITIES_CATALOG,
  getActiveShipStats,
  LIVERIES_CATALOG,
  MAPS_CATALOG,
  SHIPS_CATALOG,
  UPGRADES_CATALOG,
} from '../data/catalogs';
import type {
  AbilityId,
  LiveryId,
  MapId,
  PlayerProfile,
  ShipId,
  UpgradeId,
} from '../types/game';

type GarageTab = 'shipyard' | 'upgrades' | 'maps' | 'custom';

interface MobileGarageViewProps {
  profile: PlayerProfile;
  previewShipId: ShipId;
  onPreviewShip: (shipId: ShipId) => void;
  onSelectOrBuyShip: (shipId: ShipId) => void;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
  onSelectOrBuyMap: (mapId: MapId) => void;
  onSelectOrBuyLivery: (liveryId: LiveryId) => void;
  onSelectOrBuyAbility: (abilityId: AbilityId) => void;
}

const UPGRADE_ICONS: Record<UpgradeId, React.ReactNode> = {
  thrusters: <Gauge className="w-4 h-4 text-cyan-400" />,
  handling: <MoveHorizontal className="w-4 h-4 text-emerald-400" />,
  nitro: <Flame className="w-4 h-4 text-amber-400" />,
  shield: <Shield className="w-4 h-4 text-purple-400" />,
  magnet: <Magnet className="w-4 h-4 text-sky-400" />,
  telemetry: <Coins className="w-4 h-4 text-yellow-400" />,
};

export const MobileGarageView: React.FC<MobileGarageViewProps> = ({
  profile,
  previewShipId,
  onPreviewShip,
  onSelectOrBuyShip,
  onBuyUpgrade,
  onSelectOrBuyMap,
  onSelectOrBuyLivery,
  onSelectOrBuyAbility,
}) => {
  const [activeTab, setActiveTab] = useState<GarageTab>('shipyard');

  const currentIdx = Math.max(
    0,
    SHIPS_CATALOG.findIndex((s) => s.id === previewShipId),
  );
  const previewStats = getActiveShipStats(profile, previewShipId);
  const ownedPreview = profile.unlockedShips.includes(previewShipId);
  const equippedPreview = profile.selectedShip === previewShipId;

  const speedPct = Math.min(100, Math.round((previewStats.maxSpeed / 165) * 100));
  const handlingPct = Math.min(100, Math.round((previewStats.handling / 50) * 100));
  const nitroPct = Math.min(100, Math.round((previewStats.ship.nitroCap / 160) * 100));
  const armorPct = Math.min(100, previewStats.maxShields * 33);

  const cycleShip = (dir: -1 | 1) => {
    const nextIdx = (currentIdx + dir + SHIPS_CATALOG.length) % SHIPS_CATALOG.length;
    onPreviewShip(SHIPS_CATALOG[nextIdx].id);
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0 pointer-events-none">
      {/* Upper 3D Stage Controls: Left/Right Ship Arrows + Compact Floating Name & Stat Strip */}
      <div className="flex flex-col justify-between flex-1 px-2 pt-1 pb-2 min-h-[175px]">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => cycleShip(-1)}
            aria-label="Previous Ship"
            className="hud-glass w-11 h-11 rounded-2xl flex items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="hud-glass px-3.5 py-1.5 rounded-2xl text-center max-w-[68%]">
            <div className="text-[9px] font-orbitron text-cyan-300 tracking-widest uppercase truncate">
              {previewStats.ship.role}
            </div>
            <div className="font-orbitron text-sm sm:text-base font-black text-white neon-text-cyan truncate">
              {previewStats.ship.name}
            </div>
          </div>

          <button
            type="button"
            onClick={() => cycleShip(1)}
            aria-label="Next Ship"
            className="hud-glass w-11 h-11 rounded-2xl flex items-center justify-center text-cyan-300 active:scale-95 transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Compact 4-Stat Strip + Instant Equip/Buy Pill right above the Garage Drawer */}
        <div className="hud-glass rounded-2xl p-2.5 pointer-events-auto flex flex-col sm:flex-row sm:items-center gap-2.5 max-w-2xl w-full mx-auto">
          <div className="grid grid-cols-4 gap-2 flex-1">
            <div>
              <div className="flex justify-between text-[9px] font-orbitron text-slate-400">
                <span>SPD</span>
                <span className="text-cyan-300 tabular-nums">
                  {Math.round(previewStats.maxSpeed * 8)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-cyan-400" style={{ width: `${speedPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-orbitron text-slate-400">
                <span>HDL</span>
                <span className="text-emerald-300 tabular-nums">
                  {Math.round(previewStats.handling)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-emerald-400" style={{ width: `${handlingPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-orbitron text-slate-400">
                <span>NTR</span>
                <span className="text-amber-300 tabular-nums">
                  {(previewStats.ship.nitroCap / previewStats.nitroBurnRate).toFixed(1)}s
                </span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-amber-400" style={{ width: `${nitroPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-orbitron text-slate-400">
                <span>SHD</span>
                <span className="text-purple-300 tabular-nums">x{previewStats.maxShields}</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-purple-400" style={{ width: `${armorPct}%` }} />
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={equippedPreview}
            onClick={() => onSelectOrBuyShip(previewShipId)}
            className={`min-h-[42px] px-4 rounded-xl font-orbitron text-[11px] font-black uppercase tracking-wider shrink-0 flex items-center justify-center gap-1.5 transition ${
              equippedPreview
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                : ownedPreview
                  ? 'bg-cyan-400 text-slate-950 active:scale-95 cursor-pointer'
                  : 'bg-amber-400 text-slate-950 active:scale-95 cursor-pointer'
            }`}
          >
            {equippedPreview ? (
              <>
                <Check className="w-3.5 h-3.5" /> EQUIPPED
              </>
            ) : ownedPreview ? (
              'EQUIP SHIP'
            ) : (
              `BUY ₡ ${previewStats.ship.cost.toLocaleString()}`
            )}
          </button>
        </div>
      </div>

      {/* Bottom Slide-Up Mobile Garage Drawer */}
      <div className="hud-glass rounded-t-3xl border-t border-cyan-400/45 pointer-events-auto flex flex-col max-h-[54vh] min-h-[260px] w-full max-w-3xl mx-auto sheet-enter">
        <div className="w-10 h-1 bg-slate-600/80 rounded-full mx-auto mt-2 mb-1.5 shrink-0" />

        {/* 4 Mobile Garage Sub-Tabs */}
        <div className="grid grid-cols-4 gap-1.5 px-3 pb-2.5 border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('shipyard')}
            className={`min-h-[44px] px-1.5 rounded-xl border font-orbitron text-[10px] font-bold uppercase transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'shipyard'
                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}
          >
            <Plane className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">SHIPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upgrades')}
            className={`min-h-[44px] px-1.5 rounded-xl border font-orbitron text-[10px] font-bold uppercase transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'upgrades'
                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">UPGRADES</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maps')}
            className={`min-h-[44px] px-1.5 rounded-xl border font-orbitron text-[10px] font-bold uppercase transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'maps'
                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">SECTORS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`min-h-[44px] px-1.5 rounded-xl border font-orbitron text-[10px] font-bold uppercase transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'custom'
                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}
          >
            <Palette className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">TECH/PAINT</span>
          </button>
        </div>

        {/* Scrollable Drawer List */}
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2.5">
          {activeTab === 'shipyard' &&
            SHIPS_CATALOG.map((ship) => {
              const owned = profile.unlockedShips.includes(ship.id);
              const equipped = profile.selectedShip === ship.id;
              const previewing = previewShipId === ship.id;
              return (
                <div
                  key={ship.id}
                  onClick={() => onPreviewShip(ship.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    previewing
                      ? 'border-cyan-400 bg-cyan-500/15'
                      : 'border-slate-800 bg-slate-950/80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron font-black text-xs sm:text-sm text-white truncate">
                        {ship.name}
                      </span>
                      <span className="text-[9px] font-orbitron px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 tabular-nums shrink-0">
                        {ship.creditMult}x ₡
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{ship.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOrBuyShip(ship.id);
                    }}
                    className={`min-h-[44px] px-3.5 rounded-xl font-orbitron text-[10px] font-black uppercase shrink-0 cursor-pointer active:scale-95 transition ${
                      equipped
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : owned
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {equipped ? 'EQUIPPED' : owned ? 'EQUIP' : `₡ ${ship.cost.toLocaleString()}`}
                  </button>
                </div>
              );
            })}

          {activeTab === 'upgrades' &&
            UPGRADES_CATALOG.map((u) => {
              const tier = profile.upgrades[u.id] || 1;
              const isMax = tier >= 5;
              const cost = u.baseCost * tier;
              return (
                <div
                  key={u.id}
                  className="p-3 rounded-2xl border border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {UPGRADE_ICONS[u.id]}
                      <span className="font-orbitron font-bold text-xs text-white truncate">
                        {u.name}
                      </span>
                      <span className="text-[10px] font-orbitron text-amber-300 font-bold tabular-nums shrink-0">
                        LV.{tier}/5
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{u.desc}</p>
                    <div className="grid grid-cols-5 gap-1 mt-1.5 max-w-[160px]">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full ${
                            i <= tier ? 'bg-cyan-400' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isMax}
                    onClick={() => onBuyUpgrade(u.id)}
                    className={`min-h-[44px] px-3.5 rounded-xl font-orbitron text-[10px] font-black uppercase shrink-0 transition ${
                      isMax
                        ? 'bg-slate-800 text-emerald-300 cursor-default'
                        : 'bg-amber-400 text-slate-950 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {isMax ? 'MAXED' : `₡ ${cost}`}
                  </button>
                </div>
              );
            })}

          {activeTab === 'maps' &&
            MAPS_CATALOG.map((m) => {
              const owned = profile.unlockedMaps.includes(m.id);
              const equipped = profile.selectedMap === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    equipped
                      ? 'border-cyan-400 bg-cyan-500/15'
                      : 'border-slate-800 bg-slate-950/80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron font-black text-xs sm:text-sm text-white truncate">
                        {m.name}
                      </span>
                      <span className="text-[9px] font-orbitron px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 tabular-nums shrink-0">
                        {m.creditMult}x ₡
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{m.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectOrBuyMap(m.id)}
                    className={`min-h-[44px] px-3.5 rounded-xl font-orbitron text-[10px] font-black uppercase shrink-0 cursor-pointer active:scale-95 transition ${
                      equipped
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : owned
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {equipped ? 'ACTIVE' : owned ? 'SELECT' : `₡ ${m.cost.toLocaleString()}`}
                  </button>
                </div>
              );
            })}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-orbitron font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> PBR Hull Liveries
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LIVERIES_CATALOG.map((l) => {
                    const owned = profile.unlockedLiveries.includes(l.id);
                    const equipped = profile.selectedLivery === l.id;
                    return (
                      <div
                        key={l.id}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                          equipped
                            ? 'border-cyan-400 bg-cyan-500/15'
                            : 'border-slate-800 bg-slate-950/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                            style={{
                              background: `linear-gradient(135deg, #${l.primary.toString(16).padStart(6, '0')}, #${l.trim.toString(16).padStart(6, '0')})`,
                            }}
                          />
                          <span className="font-orbitron font-bold text-xs text-white truncate">
                            {l.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectOrBuyLivery(l.id)}
                          className={`min-h-[40px] px-3 rounded-xl font-orbitron text-[10px] font-black uppercase shrink-0 cursor-pointer ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : owned
                                ? 'bg-cyan-400 text-slate-950'
                                : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {equipped ? 'PAINTED' : owned ? 'APPLY' : `₡ ${l.cost}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-orbitron font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Tactical Tech ([E] / TECH Button)
                </div>
                <div className="space-y-2">
                  {ABILITIES_CATALOG.map((a) => {
                    const owned = profile.unlockedAbilities.includes(a.id);
                    const equipped = profile.selectedAbility === a.id;
                    return (
                      <div
                        key={a.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          equipped
                            ? 'border-purple-400 bg-purple-500/15'
                            : 'border-slate-800 bg-slate-950/80'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-orbitron font-bold text-xs text-white">
                            {a.name}{' '}
                            <span className="text-[10px] text-purple-300">({a.cooldown}s)</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{a.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectOrBuyAbility(a.id)}
                          className={`min-h-[44px] px-3.5 rounded-xl font-orbitron text-[10px] font-black uppercase shrink-0 cursor-pointer ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : owned
                                ? 'bg-purple-400 text-slate-950'
                                : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {equipped ? 'EQUIPPED' : owned ? 'EQUIP' : `₡ ${a.cost}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
