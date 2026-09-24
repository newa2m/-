/**
 * Feedback engine for tactile mobile experience:
 * - Web Audio API synthesizer for tactile mechanical counter clicks
 * - Android Navigator Vibration API for realistic haptic pulses
 * - Screen WakeLock API for active inventory counts
 */

class FeedbackService {
  private audioCtx: AudioContext | null = null;
  private wakeLock: any = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Crisp, subtle mechanical switch tick sound
   */
  public playClick(type: 'increment' | 'decrement' | 'tap' | 'reset' = 'tap') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'increment') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'decrement') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'reset') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (e) {
      // Audio might be blocked by browser policy until first user interaction
    }
  }

  /**
   * Tactile Android vibration pulse
   */
  public vibrate(durationMs: number | number[] = 15) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch (e) {
        // Ignored if vibration is unsupported or disabled
      }
    }
  }

  /**
   * Screen WakeLock API
   */
  public async setKeepAwake(enable: boolean) {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (enable) {
        if (!this.wakeLock) {
          this.wakeLock = await (navigator as any).wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
          });
        }
      } else {
        if (this.wakeLock) {
          await this.wakeLock.release();
          this.wakeLock = null;
        }
      }
    } catch (err) {
      // Screen wake lock not permitted or battery saver active
    }
  }
}

export const feedback = new FeedbackService();
