import { Injectable, signal, OnDestroy } from '@angular/core';

export type TimerState = 'normal' | 'warn' | 'danger' | 'expired';

@Injectable({ providedIn: 'root' })
export class TimerService implements OnDestroy {
  elapsed   = signal(0);
  remaining = signal(0);
  state     = signal<TimerState>('normal');
  display   = signal('00:00');
  active    = signal(false);

  private interval: ReturnType<typeof setInterval> | null = null;
  private limitSeconds = 0;
  private onExpire?: () => void;

  start(limitSeconds: number, onExpire?: () => void) {
    this.stop();
    this.limitSeconds = limitSeconds;
    this.elapsed.set(0);
    this.remaining.set(limitSeconds);
    this.state.set('normal');
    this.active.set(limitSeconds > 0);
    this.onExpire = onExpire;

    if (limitSeconds <= 0) return;

    this.display.set(this.fmt(limitSeconds));
    this.interval = setInterval(() => {
      const e = this.elapsed() + 1;
      const r = limitSeconds - e;
      this.elapsed.set(e);
      this.remaining.set(r > 0 ? r : 0);
      this.display.set(this.fmt(r > 0 ? r : 0));

      if (r <= 0)           { this.state.set('expired'); this.stop(); this.onExpire?.(); }
      else if (r <= 20)     { this.state.set('danger'); }
      else if (r <= 60)     { this.state.set('warn'); }
      else                  { this.state.set('normal'); }
    }, 1000);
  }

  stop() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }

  getElapsed(): number { return this.elapsed(); }

  private fmt(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  ngOnDestroy() { this.stop(); }
}
