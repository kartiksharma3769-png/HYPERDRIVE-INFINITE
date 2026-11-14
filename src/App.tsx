import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CyberSoundEngine } from './audio/CyberSoundEngine';
import { GameOverModal } from './components/GameOverModal';
import { HudOverlay } from './components/HudOverlay';
import { MobileLobbyShell } from './components/MobileLobbyShell';
import { PauseModal } from './components/PauseModal';
import { PlayStoreModal } from './components/PlayStoreModal';
import { SettingsModal } from './components/SettingsModal';
import {
  ABILITIES_CATALOG,
  ACHIEVEMENTS_CATALOG,
  createContract,
  LIVERIES_CATALOG,
  MAPS_CATALOG,
  SHIPS_CATALOG,
  UPGRADES_CATALOG,
} from './data/catalogs';
import { HyperdriveEngine } from './engine/HyperdriveEngine';
import type {
  AbilityId,
  CalloutMessage,
  ContractType,
  ControlScheme,
  GameMode,
  HudTelemetry,
  LiveryId,
  LobbyTab,
  MapId,
  PlayerProfile,
  QualityPreset,
  ShipId,
  UpgradeId,
} from './types/game';
import { loadProfile, saveProfile, triggerHaptic } from './utils/storage';

const INITIAL_TELEMETRY: HudTelemetry = {
  mode: 'MENU',
  gameMode: 'ENDLESS',
  cameraMode: 'CHASE',
  quality: 'ULTRA',
  score: 0,
  distance: 0,
  runCredits: 0,
  speedKmh: 452,
  combo: 1,
  comboTimer: 0,
  nitro: 100,
  isBoosting: false,
  isCloaked: false,
  shieldCharges: 1,
  maxShieldCharges: 1,
  timeRemaining: 60,
  abilityCooldown: 0,
  abilityMaxCooldown: 14,
  abilityActiveTimer: 0,
  activeBiomeName: 'NEO-CYBER GRID',
  sectorIndex: 1,
  endReason: 'HULL INTEGRITY COMPROMISED',
  isNewRecord: false,
  gyroAngle: 0,
  isNitroLatched: false,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<HyperdriveEngine | null>(null);
  const soundRef = useRef<CyberSoundEngine | null>(null);

  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const profileRef = useRef<PlayerProfile>(profile);

  const [telemetry, setTelemetry] = useState<HudTelemetry>(INITIAL_TELEMETRY);
  const [lobbyTab, setLobbyTab] = useState<LobbyTab>('LOBBY');
  const [previewShipId, setPreviewShipId] = useState<ShipId>(profile.selectedShip);
  const [muted, setMuted] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playStoreOpen, setPlayStoreOpen] = useState(false);
  const [lastMysteryResult, setLastMysteryResult] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [callouts, setCallouts] = useState<CalloutMessage[]>([]);
  const calloutSeqRef = useRef(0);

  const turntableDraggingRef = useRef(false);
  const prevDragXRef = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  }, []);

  const pushCallout = useCallback((text: string, colorClass: string) => {
    const id = ++calloutSeqRef.current;
    setCallouts((prev) => [...prev.slice(-4), { id, text, colorClass }]);
    window.setTimeout(() => {
      setCallouts((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  }, []);

  const commitProfile = useCallback(
    (updater: (prev: PlayerProfile) => PlayerProfile) => {
      setProfile((prev) => {
        const next = updater(prev);
        profileRef.current = next;
        saveProfile(next);
        engineRef.current?.updateProfile(next);
        return next;
      });
    },
    [],
  );

  // Mount Three.js Engine & Web Audio Synthesizer once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const sound = new CyberSoundEngine();
    soundRef.current = sound;

    const engine = new HyperdriveEngine(mount, profileRef.current, sound, {
      onTelemetry: (next) => {
        setTelemetry(next);
      },
      onCallout: (text, colorClass) => {
        pushCallout(text, colorClass);
      },
      onContractAdvance: (type: ContractType, amount: number) => {
        const cur = profileRef.current;
        let completedReward = 0;
        let updatedAny = false;
        const nextContracts = cur.contracts.map((c) => {
          if (c.type !== type) return c;
          updatedAny = true;
          const nextProg = c.progress + amount;
          if (nextProg >= c.target) {
            completedReward += c.reward;
            return createContract(Math.floor(Math.random() * 10));
          }
          return { ...c, progress: nextProg };
        });

        if (!updatedAny) return;

        const nextProfile: PlayerProfile = {
          ...cur,
          credits: cur.credits + completedReward,
          contracts: nextContracts,
        };
        profileRef.current = nextProfile;
        setProfile(nextProfile);

        if (completedReward > 0) {
          saveProfile(nextProfile);
          sound.playPickup('buy');
          pushCallout(`CONTRACT COMPLETE! +₡ ${completedReward}`, 'text-amber-300 neon-text-gold');
        }
        engineRef.current?.updateProfile(nextProfile);
      },
      onRunComplete: ({ score, distance, runCredits, isNewRecord }) => {
        commitProfile((prev) => ({
          ...prev,
          credits: prev.credits + runCredits,
          totalDistance: prev.totalDistance + distance,
          highScore: isNewRecord ? score : prev.highScore,
        }));
      },
      onContextLostChange: (lost) => {
        setContextLost(lost);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      sound.dispose();
      engineRef.current = null;
      soundRef.current = null;
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [commitProfile, pushCallout]);

  // Keyboard Flight Controls (also works when playing on tablets / external keyboards)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const engine = engineRef.current;
      if (!engine) return;

      if (code === 'ArrowLeft' || code === 'KeyA') engine.setKey('left', true);
      if (code === 'ArrowRight' || code === 'KeyD') engine.setKey('right', true);
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        if (telemetry.mode === 'PLAYING') {
          e.preventDefault();
          engine.triggerJump();
        }
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight') engine.setKey('nitro', true);
      if (code === 'KeyE') engine.triggerAbility();
      if (code === 'KeyC') engine.cycleCamera();
      if (code === 'Escape' || code === 'KeyP') {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else if (playStoreOpen) {
          setPlayStoreOpen(false);
        } else if (telemetry.mode === 'PLAYING') {
          engine.pauseGame();
        } else if (telemetry.mode === 'PAUSED') {
          engine.resumeGame();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const engine = engineRef.current;
      if (!engine) return;
      if (code === 'ArrowLeft' || code === 'KeyA') engine.setKey('left', false);
      if (code === 'ArrowRight' || code === 'KeyD') engine.setKey('right', false);
      if (code === 'ShiftLeft' || code === 'ShiftRight') engine.setKey('nitro', false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [playStoreOpen, settingsOpen, telemetry.mode]);

  // Device Orientation Gyroscope Handler
  useEffect(() => {
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (profileRef.current.controlScheme !== 'GYRO') return;
      const rawAngle = window.innerWidth > window.innerHeight ? e.beta || 0 : e.gamma || 0;
      engineRef.current?.setGyroInput(rawAngle);
    };
    window.addEventListener('deviceorientation', onDeviceOrientation);
    return () => window.removeEventListener('deviceorientation', onDeviceOrientation);
  }, []);

  // 360° Turntable Drag Listeners on Canvas
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (telemetry.mode !== 'MENU') return;
    turntableDraggingRef.current = true;
    prevDragXRef.current = e.clientX;
  };

  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (!turntableDraggingRef.current) return;
      const dx = e.clientX - prevDragXRef.current;
      prevDragXRef.current = e.clientX;
      engineRef.current?.addTurntableDrag(dx);
    };
    const onWindowPointerUp = () => {
      turntableDraggingRef.current = false;
    };
    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
    };
  }, []);

  // Mobile Tab & Navigation Handlers
  const handleSelectLobbyTab = (tab: LobbyTab) => {
    soundRef.current?.init();
    triggerHaptic(profile.haptics, 10);
    setLobbyTab(tab);

    if (tab === 'GARAGE') {
      setPreviewShipId(profileRef.current.selectedShip);
      engineRef.current?.setMenuView('MARKETPLACE');
      engineRef.current?.setPreviewShip(profileRef.current.selectedShip);
    } else {
      engineRef.current?.setMenuView('MAIN');
      engineRef.current?.setPreviewShip(profileRef.current.selectedShip);
    }
  };

  const handleToggleMute = () => {
    const sound = soundRef.current;
    if (!sound) return;
    sound.init();
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleLaunchGame = () => {
    soundRef.current?.init();
    triggerHaptic(profile.haptics, 18);
    setLobbyTab('LOBBY');
    engineRef.current?.startGame();
  };

  const handleReturnToLobby = () => {
    if (telemetry.mode === 'PLAYING' || telemetry.mode === 'PAUSED') {
      const earned = engineRef.current?.getCurrentRunCredits() || 0;
      if (earned > 0) {
        commitProfile((prev) => ({
          ...prev,
          credits: prev.credits + earned,
        }));
      }
    }
    setLobbyTab('LOBBY');
    setPreviewShipId(profileRef.current.selectedShip);
    engineRef.current?.returnToMenu('MAIN');
  };

  const handleOpenGarageFromGameOver = () => {
    setLobbyTab('GARAGE');
    setPreviewShipId(profileRef.current.selectedShip);
    engineRef.current?.returnToMenu('MARKETPLACE');
    engineRef.current?.setPreviewShip(profileRef.current.selectedShip);
  };

  const handleSelectQuality = (q: QualityPreset) => {
    engineRef.current?.applyQuality(q);
    showToast(`GRAPHICS PRESET: ${q}`);
  };

  const handleCycleQuality = () => {
    const next = engineRef.current?.cycleQuality();
    if (next) showToast(`GRAPHICS PRESET: ${next}`);
  };

  const handleSelectGameMode = (gm: GameMode) => {
    triggerHaptic(profile.haptics, 10);
    engineRef.current?.setGameMode(gm);
  };

  const handlePreviewShip = (shipId: ShipId) => {
    setPreviewShipId(shipId);
    engineRef.current?.setPreviewShip(shipId);
  };

  const handleSelectOrBuyShip = (shipId: ShipId) => {
    soundRef.current?.init();
    const ship = SHIPS_CATALOG.find((s) => s.id === shipId);
    if (!ship) return;
    setPreviewShipId(shipId);

    if (profile.unlockedShips.includes(shipId)) {
      commitProfile((prev) => ({ ...prev, selectedShip: shipId }));
      engineRef.current?.setPreviewShip(shipId);
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 15);
      showToast(`${ship.name} EQUIPPED!`);
    } else if (profile.credits >= ship.cost) {
      commitProfile((prev) => ({
        ...prev,
        credits: prev.credits - ship.cost,
        unlockedShips: [...prev.unlockedShips, shipId],
        selectedShip: shipId,
      }));
      engineRef.current?.setPreviewShip(shipId);
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, [18, 25, 18]);
      showToast(`UNLOCKED ${ship.name}!`);
    } else {
      showToast('INSUFFICIENT CREDITS — CLAIM GRANT IN SUPPLY');
    }
  };

  const handleBuyUpgrade = (upgradeId: UpgradeId) => {
    soundRef.current?.init();
    const u = UPGRADES_CATALOG.find((item) => item.id === upgradeId);
    if (!u) return;
    const tier = profile.upgrades[upgradeId] || 1;
    if (tier >= 5) return;
    const cost = u.baseCost * tier;
    if (profile.credits >= cost) {
      commitProfile((prev) => ({
        ...prev,
        credits: prev.credits - cost,
        upgrades: { ...prev.upgrades, [upgradeId]: tier + 1 },
      }));
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 15);
      showToast(`${u.name} UPGRADED TO TIER ${tier + 1}!`);
    } else {
      showToast('INSUFFICIENT QUANTUM CREDITS');
    }
  };

  const handleSelectOrBuyMap = (mapId: MapId) => {
    soundRef.current?.init();
    const m = MAPS_CATALOG.find((item) => item.id === mapId);
    if (!m) return;
    if (profile.unlockedMaps.includes(mapId)) {
      commitProfile((prev) => ({ ...prev, selectedMap: mapId }));
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 12);
      showToast(`SECTOR SET TO ${m.name}`);
    } else if (profile.credits >= m.cost) {
      commitProfile((prev) => ({
        ...prev,
        credits: prev.credits - m.cost,
        unlockedMaps: [...prev.unlockedMaps, mapId],
        selectedMap: mapId,
      }));
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 20);
      showToast(`SECTOR UNLOCKED: ${m.name}`);
    } else {
      showToast('INSUFFICIENT QUANTUM CREDITS');
    }
  };

  const handleSelectOrBuyLivery = (liveryId: LiveryId) => {
    soundRef.current?.init();
    const l = LIVERIES_CATALOG.find((item) => item.id === liveryId);
    if (!l) return;
    if (profile.unlockedLiveries.includes(liveryId)) {
      commitProfile((prev) => ({ ...prev, selectedLivery: liveryId }));
      engineRef.current?.setLivery(liveryId);
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 12);
      showToast(`LIVERY APPLIED: ${l.name}`);
    } else if (profile.credits >= l.cost) {
      commitProfile((prev) => ({
        ...prev,
        credits: prev.credits - l.cost,
        unlockedLiveries: [...prev.unlockedLiveries, liveryId],
        selectedLivery: liveryId,
      }));
      engineRef.current?.setLivery(liveryId);
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 18);
      showToast(`UNLOCKED LIVERY: ${l.name}`);
    } else {
      showToast('INSUFFICIENT QUANTUM CREDITS');
    }
  };

  const handleSelectOrBuyAbility = (abilityId: AbilityId) => {
    soundRef.current?.init();
    const a = ABILITIES_CATALOG.find((item) => item.id === abilityId);
    if (!a) return;
    if (profile.unlockedAbilities.includes(abilityId)) {
      commitProfile((prev) => ({ ...prev, selectedAbility: abilityId }));
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 12);
      showToast(`TECH EQUIPPED: ${a.name}`);
    } else if (profile.credits >= a.cost) {
      commitProfile((prev) => ({
        ...prev,
        credits: prev.credits - a.cost,
        unlockedAbilities: [...prev.unlockedAbilities, abilityId],
        selectedAbility: abilityId,
      }));
      soundRef.current?.playPickup('buy');
      triggerHaptic(profile.haptics, 18);
      showToast(`UNLOCKED TECH: ${a.name}`);
    } else {
      showToast('INSUFFICIENT QUANTUM CREDITS');
    }
  };

  // Supply & Trophies Handlers
  const handleClaimInstantGrant = () => {
    soundRef.current?.init();
    commitProfile((prev) => ({ ...prev, credits: prev.credits + 2500 }));
    soundRef.current?.playPickup('buy');
    triggerHaptic(profile.haptics, 20);
    showToast('+₡ 2,500 HYPERION GRANT ADDED!');
  };

  const handleClaimDailyCrate = () => {
    soundRef.current?.init();
    const nowDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    if (profile.lastDailyClaim === nowDay) {
      showToast('DAILY STIPEND ALREADY CLAIMED TODAY — USE GRANT OR PODS!');
      return;
    }
    commitProfile((prev) => ({
      ...prev,
      lastDailyClaim: nowDay,
      credits: prev.credits + 1500,
    }));
    soundRef.current?.playPickup('buy');
    triggerHaptic(profile.haptics, 25);
    showToast('DAILY SUPPLY CRATE CLAIMED (+₡ 1,500)!');
  };

  const handleOpenMysteryPod = () => {
    soundRef.current?.init();
    if (profile.credits < 500) {
      showToast('NEED ₡ 500 — CLAIM FREE RESEARCH GRANT ABOVE!');
      return;
    }
    const roll = Math.random();
    let prize = 950;
    let rewardText = 'SUPPLY POD OPENED: +₡ 950 CREDITS!';
    if (roll < 0.18) {
      prize = 5000;
      rewardText = 'JACKPOT! +₡ 5,000 QUANTUM CORE!';
    } else if (roll < 0.5) {
      prize = 1800;
      rewardText = 'RARE DROP! +₡ 1,800 CREDITS!';
    }
    commitProfile((prev) => ({
      ...prev,
      credits: prev.credits - 500 + prize,
    }));
    soundRef.current?.playPickup('portal');
    triggerHaptic(profile.haptics, [20, 30, 20]);
    setLastMysteryResult(rewardText);
    showToast(rewardText);
  };

  const handleClaimTrophy = (achId: string) => {
    const ach = ACHIEVEMENTS_CATALOG.find((a) => a.id === achId);
    if (!ach || profile.claimedAchievements.includes(achId) || !ach.check(profile)) return;
    commitProfile((prev) => ({
      ...prev,
      claimedAchievements: [...prev.claimedAchievements, achId],
      credits: prev.credits + ach.reward,
    }));
    soundRef.current?.playPickup('buy');
    triggerHaptic(profile.haptics, 20);
    showToast(`TROPHY CLAIMED: +₡ ${ach.reward}!`);
  };

  const handleClaimAllTrophies = () => {
    soundRef.current?.init();
    const ready = ACHIEVEMENTS_CATALOG.filter(
      (a) => a.check(profile) && !profile.claimedAchievements.includes(a.id),
    );
    if (ready.length === 0) {
      showToast('NO UNCLAIMED TROPHIES READY YET');
      return;
    }
    const totalReward = ready.reduce((sum, a) => sum + a.reward, 0);
    const readyIds = ready.map((a) => a.id);
    commitProfile((prev) => ({
      ...prev,
      claimedAchievements: [...prev.claimedAchievements, ...readyIds],
      credits: prev.credits + totalReward,
    }));
    soundRef.current?.playPickup('buy');
    triggerHaptic(profile.haptics, [20, 25, 20]);
    showToast(`CLAIMED ${ready.length} TROPHIES (+₡ ${totalReward.toLocaleString()})!`);
  };

  // Mobile Settings Handlers
  const handleSelectControlScheme = (scheme: ControlScheme) => {
    engineRef.current?.recenterGyro();
    commitProfile((prev) => ({ ...prev, controlScheme: scheme }));
    triggerHaptic(profile.haptics, 12);
  };

  const handleChangeSensitivity = (sens: number) => {
    const clamped = Math.max(0.5, Math.min(1.8, sens));
    commitProfile((prev) => ({ ...prev, sensitivity: clamped }));
  };

  const handleToggleHaptics = () => {
    const next = !profile.haptics;
    commitProfile((prev) => ({ ...prev, haptics: next }));
    if (next) triggerHaptic(true, 22);
    showToast(`HAPTIC VIBRATION ${next ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleToggleNitroMode = () => {
    const next = !profile.nitroToggleMode;
    engineRef.current?.setNitroLatched(false);
    engineRef.current?.setKey('nitro', false);
    commitProfile((prev) => ({ ...prev, nitroToggleMode: next }));
    showToast(`NITRO MODE: ${next ? 'ONE-TAP TOGGLE' : 'PRESS & HOLD'}`);
  };

  const handleToggleTouchHud = () => {
    const next = !profile.showTouchHud;
    commitProfile((prev) => ({ ...prev, showTouchHud: next }));
    showToast(`ARCADE TOUCH PAD ${next ? 'VISIBLE' : 'HIDDEN'}`);
  };

  const handleRequestGyroPermission = async () => {
    try {
      const doe = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof doe?.requestPermission === 'function') {
        const res = await doe.requestPermission();
        if (res === 'granted') {
          engineRef.current?.recenterGyro();
          showToast('GYRO SENSOR AUTHORIZED');
        } else {
          showToast('MOTION PERMISSION DENIED');
        }
      } else {
        engineRef.current?.recenterGyro();
        showToast('GYRO SENSOR ACTIVE');
      }
    } catch {
      showToast('MOTION PERMISSION DENIED');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030409]">
      {/* Isolated 3D WebGL Viewport Container */}
      <div
        ref={canvasMountRef}
        onPointerDown={handleCanvasPointerDown}
        className="fixed inset-0 w-full h-full z-[1]"
      />

      {/* WebGL Context Loss Fallback Banner */}
      {contextLost && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-6 text-center">
          <div className="hud-glass max-w-md rounded-2xl p-6 border border-amber-400/50 space-y-2">
            <h2 className="font-orbitron text-lg font-black text-amber-300">
              WEBGL RENDERER SUSPENDED
            </h2>
            <p className="text-sm text-slate-300">
              Graphics context was paused by the browser. Restoring 3D viewport automatically...
            </p>
          </div>
        </div>
      )}

      {/* Atmospheric Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[5] scanlines opacity-35" />

      {/* Mobile Toast Notification Banner */}
      <div
        className={`fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[60] pointer-events-none transition-all duration-300 max-w-[92vw] ${
          toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
      >
        <div className="hud-glass px-4 py-2 rounded-full border border-amber-400/60 text-amber-300 font-orbitron text-[11px] font-bold tracking-wider shadow-[0_0_20px_rgba(255,170,0,0.35)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMsg || ''}</span>
        </div>
      </div>

      {/* In-Game Mobile Flight HUD Overlay */}
      <HudOverlay
        visible={
          telemetry.mode === 'PLAYING' ||
          telemetry.mode === 'PAUSED' ||
          telemetry.mode === 'GAMEOVER'
        }
        telemetry={telemetry}
        profile={profile}
        muted={muted}
        callouts={callouts}
        onCycleCamera={() => engineRef.current?.cycleCamera()}
        onRecenterGyro={() => {
          engineRef.current?.recenterGyro();
          showToast('GYRO HORIZON RE-CENTERED');
        }}
        onToggleMute={handleToggleMute}
        onPause={() => engineRef.current?.pauseGame()}
        onJump={() => engineRef.current?.triggerJump()}
        onTriggerAbility={() => engineRef.current?.triggerAbility()}
        onAnalogSteer={(val) => engineRef.current?.setAnalogSteer(val)}
        onNitroHold={(active) => engineRef.current?.setKey('nitro', active)}
        onNitroToggle={() => engineRef.current?.toggleNitroLatch()}
      />

      {/* Persistent Mobile Game Lobby Shell (LOBBY | GARAGE | MISSIONS | SUPPLY) */}
      {telemetry.mode === 'MENU' && (
        <MobileLobbyShell
          lobbyTab={lobbyTab}
          profile={profile}
          previewShipId={previewShipId}
          quality={telemetry.quality}
          gameMode={telemetry.gameMode}
          muted={muted}
          lastMysteryResult={lastMysteryResult}
          onSelectTab={handleSelectLobbyTab}
          onCycleQuality={handleCycleQuality}
          onSelectGameMode={handleSelectGameMode}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenPlayStore={() => setPlayStoreOpen(true)}
          onLaunchGame={handleLaunchGame}
          onPreviewShip={handlePreviewShip}
          onSelectOrBuyShip={handleSelectOrBuyShip}
          onBuyUpgrade={handleBuyUpgrade}
          onSelectOrBuyMap={handleSelectOrBuyMap}
          onSelectOrBuyLivery={handleSelectOrBuyLivery}
          onSelectOrBuyAbility={handleSelectOrBuyAbility}
          onClaimInstantGrant={handleClaimInstantGrant}
          onClaimDailyCrate={handleClaimDailyCrate}
          onOpenMysteryPod={handleOpenMysteryPod}
          onClaimTrophy={handleClaimTrophy}
          onClaimAllTrophies={handleClaimAllTrophies}
        />
      )}

      {/* Mobile Pause Bottom-Sheet */}
      <PauseModal
        visible={telemetry.mode === 'PAUSED'}
        profile={profile}
        quality={telemetry.quality}
        onSelectControlScheme={handleSelectControlScheme}
        onChangeSensitivity={handleChangeSensitivity}
        onSelectQuality={handleSelectQuality}
        onResume={() => engineRef.current?.resumeGame()}
        onOpenSettings={() => setSettingsOpen(true)}
        onRestart={handleLaunchGame}
        onReturnMainMenu={handleReturnToLobby}
      />

      {/* Mobile Game Over Bottom-Sheet */}
      <GameOverModal
        visible={telemetry.mode === 'GAMEOVER'}
        telemetry={telemetry}
        profile={profile}
        onRestart={handleLaunchGame}
        onOpenGarage={handleOpenGarageFromGameOver}
        onReturnLobby={handleReturnToLobby}
      />

      {/* Mobile & Flight Settings Bottom-Sheet */}
      <SettingsModal
        open={settingsOpen}
        profile={profile}
        onClose={() => setSettingsOpen(false)}
        onSelectControlScheme={handleSelectControlScheme}
        onChangeSensitivity={handleChangeSensitivity}
        onToggleHaptics={handleToggleHaptics}
        onToggleNitroMode={handleToggleNitroMode}
        onToggleTouchHud={handleToggleTouchHud}
        onRequestGyroPermission={handleRequestGyroPermission}
        onSaveAndApply={() => {
          setSettingsOpen(false);
          showToast('MOBILE FLIGHT CONFIG SAVED');
        }}
      />

      {/* Google Play APK & iOS App Store Build Kit Bottom-Sheet */}
      <PlayStoreModal
        open={playStoreOpen}
        onClose={() => setPlayStoreOpen(false)}
        onCopySuccess={() => showToast('CAPACITOR BUILD COMMANDS COPIED!')}
      />
    </div>
  );
}
