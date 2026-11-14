export class CyberSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private engineOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private subGain: GainNode | null = null;

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    this.engineOsc = this.ctx.createOscillator();
    this.subOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.subGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.subOsc.type = 'triangle';
    this.engineOsc.frequency.value = 65;
    this.subOsc.frequency.value = 32.5;

    this.engineGain.gain.value = 0.0001;
    this.subGain.gain.value = 0.0001;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;

    this.engineOsc.connect(filter);
    this.subOsc.connect(filter);
    filter.connect(this.engineGain);
    filter.connect(this.subGain);
    this.engineGain.connect(this.ctx.destination);
    this.subGain.connect(this.ctx.destination);

    this.engineOsc.start();
    this.subOsc.start();
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted && this.engineGain && this.subGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      this.subGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  setEngineTelemetry(speedNorm: number, isBoosting: boolean, active: boolean): void {
    if (!this.ctx || this.muted || !this.engineGain || !this.subGain || !this.engineOsc || !this.subOsc) {
      return;
    }
    const now = this.ctx.currentTime;
    if (!active) {
      this.engineGain.gain.setTargetAtTime(0.0001, now, 0.08);
      this.subGain.gain.setTargetAtTime(0.0001, now, 0.08);
      return;
    }
    const baseFreq = 62 + speedNorm * 95 + (isBoosting ? 55 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.06);
    this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.06);
    this.engineGain.gain.setTargetAtTime(isBoosting ? 0.065 : 0.035, now, 0.08);
    this.subGain.gain.setTargetAtTime(isBoosting ? 0.08 : 0.04, now, 0.08);
  }

  playJump(): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.22);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playPickup(type: 'core' | 'shield' | 'portal' | 'buy' = 'core'): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const f1 = type === 'portal' ? 520 : type === 'shield' ? 440 : type === 'buy' ? 587 : 660;
    const f2 = f1 * 1.5;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.setValueAtTime(f2, now + 0.07);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playNearMiss(combo = 1): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const base = 320 + Math.min(combo, 10) * 45;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.14);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playAbility(): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playShieldShatter(): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.32);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  playCrash(): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.55);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  dispose(): void {
    try {
      this.engineOsc?.stop();
      this.subOsc?.stop();
      this.ctx?.close();
    } catch {
      // Ignore cleanup errors
    }
    this.ctx = null;
  }
}
