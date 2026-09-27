import { HapticIntensity } from '../types';

/**
 * Feedback engine for tactile mobile experience:
 * - Web Audio API synthesizer for tactile mechanical counter clicks
 * - Android Navigator Vibration API with intensity settings and double pulses
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
   * Crisp, loud mechanical switch tick sound engineered for loud construction/warehouse environments
   */
  public playClick(type: 'increment' | 'decrement' | 'tap' | 'reset' | 'lock' | 'unlock' = 'tap') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      if (type === 'increment') {
        // High, snappy mechanical click (ascending tone)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.035);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.045);

        // Subtle secondary metallic click
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(1600, now);
        clickGain.gain.setValueAtTime(0.08, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);
        clickOsc.start(now);
        clickOsc.stop(now + 0.015);

      } else if (type === 'decrement') {
        // Distinct descending warning tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.06);

      } else if (type === 'reset') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.12);

      } else if (type === 'lock' || type === 'unlock') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startFreq = type === 'lock' ? 440 : 880;
        const endFreq = type === 'lock' ? 220 : 1320;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.08);

      } else {
        // Tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.025);
      }
    } catch (e) {
      // Audio autoplay policy
    }
  }

  private iosSwitchLabel: HTMLLabelElement | null = null;

  /**
   * Initializes hidden switch element to trigger iOS Safari native Taptic Engine
   */
  private initIosHaptic() {
    if (typeof document === 'undefined') return;
    if (this.iosSwitchLabel && document.body.contains(this.iosSwitchLabel)) return;

    try {
      const label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.position = 'fixed';
      label.style.top = '-9999px';
      label.style.left = '-9999px';
      label.style.width = '1px';
      label.style.height = '1px';
      label.style.opacity = '0';
      label.style.pointerEvents = 'none';
      label.style.zIndex = '-9999';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.tabIndex = -1;

      label.appendChild(input);
      document.body.appendChild(label);
      this.iosSwitchLabel = label;
    } catch (_) {}
  }

  private triggerIosHaptic() {
    try {
      if (!this.iosSwitchLabel || !document.body.contains(this.iosSwitchLabel)) {
        this.initIosHaptic();
      }
      if (this.iosSwitchLabel) {
        this.iosSwitchLabel.click();
      }
    } catch (_) {}
  }

  /**
   * Tactile vibration with configurable intensity & warning double-pulse
   * Compatible with Android (Vibration API) and iOS Safari 17.4+ (Taptic Engine)
   */
  public vibrate(
    type: 'increment' | 'decrement' | 'tap' | 'double_warning' | 'lock' = 'tap',
    intensity: HapticIntensity = 'medium'
  ): boolean {
    if (typeof window === 'undefined') return false;

    // Calibrated millisecond timings for mobile ERM / LRA vibration motors
    let baseMs = 65; // Balanced crisp tactile feedback
    if (intensity === 'light') baseMs = 35; // Subtle, quick click
    else if (intensity === 'strong') baseMs = 110; // High punch for construction gloves

    let vibrationTriggered = false;

    // 1. Android / standard Web Vibration API
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (type === 'decrement' || type === 'double_warning') {
          const pauseMs = intensity === 'strong' ? 55 : 40;
          const secondMs = Math.round(baseMs * 0.9);
          vibrationTriggered = navigator.vibrate([baseMs, pauseMs, secondMs]);
          if (!vibrationTriggered) {
            vibrationTriggered = navigator.vibrate(baseMs);
          }
        } else if (type === 'lock') {
          const firstMs = Math.round(baseMs * 1.2);
          const secondMs = Math.round(baseMs * 1.5);
          vibrationTriggered = navigator.vibrate([firstMs, 40, secondMs]);
          if (!vibrationTriggered) {
            vibrationTriggered = navigator.vibrate(firstMs);
          }
        } else {
          vibrationTriggered = navigator.vibrate(baseMs);
        }
      } catch (e) {
        // Fallback to single integer duration if array pattern failed
        try {
          vibrationTriggered = navigator.vibrate(baseMs);
        } catch (_) {}
      }
    }

    // 2. iOS Taptic Engine trigger via Safari switch attribute
    // Runs on Apple devices or when standard navigator.vibrate was unavailable/unsupported
    const isAppleDevice = typeof navigator !== 'undefined' && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );

    if (isAppleDevice || !vibrationTriggered) {
      this.triggerIosHaptic();
      if (type === 'decrement' || type === 'double_warning') {
        setTimeout(() => this.triggerIosHaptic(), 120);
      }
    }

    return true;
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
