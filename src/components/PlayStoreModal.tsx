import React from 'react';
import { CheckCircle2, Copy, Play, Smartphone, Terminal, X } from 'lucide-react';

interface PlayStoreModalProps {
  open: boolean;
  onClose: () => void;
  onCopySuccess: () => void;
}

const CAPACITOR_COMMANDS = `# 1. Build production web bundle
npm run build

# 2. Install Capacitor & native platforms
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "HYPERDRIVE INFINITE" "com.hyperdrive.infinite" --web-dir=dist

# 3. Add Android & iOS native projects
npx cap add android
npx cap add ios

# 4. Sync assets & open native IDE to build signed APK / AAB / IPA
npx cap sync
npx cap open android`;

export const PlayStoreModal: React.FC<PlayStoreModalProps> = ({
  open,
  onClose,
  onCopySuccess,
}) => {
  if (!open) return null;

  const handleCopyCommands = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CAPACITOR_COMMANDS);
      } else {
        const ta = document.createElement('textarea');
        ta.value = CAPACITOR_COMMANDS;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      onCopySuccess();
    } catch {
      onCopySuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 modal-backdrop">
      <div className="hud-glass w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 pb-safe border-t sm:border border-emerald-400/50 space-y-4 max-h-[90vh] overflow-y-auto custom-scroll shadow-[0_0_50px_rgba(0,0,0,0.85)] sheet-enter">
        <div className="w-10 h-1 bg-slate-600/80 rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm sm:text-lg font-black text-white neon-text-cyan">
                ANDROID APK &amp; iOS APP KIT
              </h3>
              <p className="text-[11px] text-slate-400">
                Package this mobile game into a signed Android AAB/APK or iOS IPA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Build Kit"
            className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-orbitron font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4" /> Capacitor CLI Commands
            </span>
            <button
              type="button"
              onClick={handleCopyCommands}
              className="min-h-[40px] px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-orbitron text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> COPY
            </button>
          </div>

          <pre className="bg-slate-950/95 border border-slate-800 rounded-2xl p-3 text-[11px] font-mono text-cyan-200 overflow-x-auto custom-scroll leading-relaxed">
            {CAPACITOR_COMMANDS}
          </pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="font-orbitron text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> ANDROID PLAY CONSOLE
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Add <code className="text-cyan-300">android.permission.VIBRATE</code> for cockpit
                  haptics.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Enable <code className="text-cyan-300">hardwareAccelerated=&quot;true&quot;</code>{' '}
                  for 60fps WebGL rendering.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="font-orbitron text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> iOS APP STORE (XCODE)
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Safe-area insets (<code className="text-amber-300">viewport-fit=cover</code>) are
                  configured for Notch &amp; Dynamic Island.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Add <code className="text-amber-300">NSMotionUsageDescription</code> in{' '}
                  <code className="text-slate-200">Info.plist</code> for Tilt Gyro steering.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cyber-btn w-full min-h-[48px] bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-orbitron font-black text-xs tracking-widest uppercase cursor-pointer"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
