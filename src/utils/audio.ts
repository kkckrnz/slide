/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer for tactile sliding puzzle feedback

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public haptics: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Satisfying physical tile slide "clack"
   */
  public playSlide(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary acoustic wooden body resonance
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Pitch drop simulates tile sliding into wooden slot
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);

      // Subtle click transient (high-frequency snap)
      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'sine';
      snap.frequency.setValueAtTime(800, now);
      snap.frequency.exponentialRampToValueAtTime(300, now + 0.02);

      snapGain.gain.setValueAtTime(0.15, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      snap.connect(snapGain);
      snapGain.connect(ctx.destination);

      snap.start(now);
      snap.stop(now + 0.02);

      this.triggerHaptic('light');
    } catch {
      // AudioContext may be blocked before first user gesture
    }
  }

  /**
   * Sound played when a tile slides into its correct home spot
   */
  public playHomeSnap(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.04); // E5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      this.triggerHaptic('medium');
    } catch {
      // safe fallback
    }
  }

  /**
   * Celebration arpeggio upon winning the puzzle
   */
  public playVictory(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 440.0, time: 0.00 }, // A4
        { freq: 554.37, time: 0.10 }, // C#5
        { freq: 659.25, time: 0.20 }, // E5
        { freq: 880.0, time: 0.32 }, // A5
        { freq: 1108.73, time: 0.44 }, // C#6
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.3, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.35);
      });

      this.triggerHaptic('victory');
    } catch {
      // safe fallback
    }
  }

  /**
   * Rapid clicks during shuffle
   */
  public playShuffle(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // safe fallback
    }
  }

  /**
   * Device haptic vibration (on mobile devices supporting it)
   */
  public triggerHaptic(type: 'light' | 'medium' | 'victory'): void {
    if (!this.haptics || typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      if (type === 'light') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate([15, 30, 20]);
      } else if (type === 'victory') {
        navigator.vibrate([30, 60, 40, 80, 80]);
      }
    } catch {
      // vibrate might throw on some browsers
    }
  }
}

export const soundManager = new SoundEffects();
