/** Local audio cues are synthesized; no files, network requests or microphone needed. */
export type PhoneToneEvent =
  "incoming" | "outgoing" | "ringing" | "connected" | "disconnected" | "dtmf";
export type PhoneTonePreset = "gentle" | "classic" | "minimal";
export interface PhoneToneOptions {
  enabled?: boolean;
  preset?: PhoneTonePreset;
  volume?: number;
  /** Optional short vibration for keypad feedback on supported devices. */
  haptics?: boolean;
  events?: Partial<Record<PhoneToneEvent, boolean>>;
}
export interface ToneStep {
  frequencies: readonly number[];
  durationMs: number;
  delayMs?: number;
}
export interface TonePattern {
  steps: readonly ToneStep[];
  repeatMs?: number;
}
export const phoneTonePresets: Readonly<
  Record<
    PhoneTonePreset,
    Readonly<Record<Exclude<PhoneToneEvent, "dtmf">, TonePattern>>
  >
> = {
  gentle: {
    incoming: {
      steps: [
        { frequencies: [523.25], durationMs: 180 },
        { frequencies: [659.25], durationMs: 220, delayMs: 230 },
      ],
      repeatMs: 2500,
    },
    outgoing: {
      steps: [{ frequencies: [440], durationMs: 180 }],
      repeatMs: 3000,
    },
    ringing: {
      steps: [{ frequencies: [440, 480], durationMs: 700 }],
      repeatMs: 3000,
    },
    connected: {
      steps: [
        { frequencies: [660], durationMs: 90 },
        { frequencies: [880], durationMs: 120, delayMs: 110 },
      ],
    },
    disconnected: {
      steps: [
        { frequencies: [440], durationMs: 100 },
        { frequencies: [330], durationMs: 140, delayMs: 120 },
      ],
    },
  },
  classic: {
    incoming: {
      steps: [{ frequencies: [440, 480], durationMs: 800 }],
      repeatMs: 2800,
    },
    outgoing: {
      steps: [{ frequencies: [350, 440], durationMs: 250 }],
      repeatMs: 3000,
    },
    ringing: {
      steps: [{ frequencies: [440, 480], durationMs: 1200 }],
      repeatMs: 4000,
    },
    connected: { steps: [{ frequencies: [1000], durationMs: 120 }] },
    disconnected: {
      steps: [
        { frequencies: [480, 620], durationMs: 200 },
        { frequencies: [480, 620], durationMs: 200, delayMs: 350 },
      ],
    },
  },
  minimal: {
    incoming: {
      steps: [{ frequencies: [740], durationMs: 150 }],
      repeatMs: 3000,
    },
    outgoing: {
      steps: [{ frequencies: [440], durationMs: 80 }],
      repeatMs: 4000,
    },
    ringing: {
      steps: [{ frequencies: [440], durationMs: 180 }],
      repeatMs: 4000,
    },
    connected: { steps: [{ frequencies: [880], durationMs: 65 }] },
    disconnected: { steps: [{ frequencies: [440], durationMs: 80 }] },
  },
};

export function dtmfFrequencies(digit: string): readonly number[] {
  const rows = ["123A", "456B", "789C", "*0#D"];
  const row = rows.findIndex((keys) => keys.includes(digit));
  return row < 0 || digit.length !== 1
    ? []
    : [
        [697, 770, 852, 941][row],
        [1209, 1336, 1477, 1633][rows[row].indexOf(digit)],
      ];
}

/** One tone owner per SIP client prevents duplicate sound across composed widgets. */
export class PhoneTones {
  private context: AudioContext | null = null;
  private options: PhoneToneOptions = {};
  private nodes = new Set<OscillatorNode>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private generation = 0;
  private loop: PhoneToneEvent | null = null;
  configure(options: PhoneToneOptions | false = {}): void {
    const next = options === false ? { enabled: false } : options;
    if (JSON.stringify(next) === JSON.stringify(this.options)) return;
    const loop = this.loop;
    this.stop();
    this.options = next;
    if (loop) this.start(loop);
  }
  unlock(): void {
    if (typeof window === "undefined" || !window.AudioContext) return;
    try {
      this.context ??= new AudioContext();
      const ctx = this.context;
      void ctx
        .resume()
        .then(() => {
          if (this.context === ctx && this.loop && !this.timer)
            this.start(this.loop);
        })
        .catch(() => {});
    } catch {
      /* Calling still works if local feedback is unsupported. */
    }
  }
  private allowed(event: PhoneToneEvent): boolean {
    return (
      this.options.enabled !== false &&
      this.options.events?.[event] !== false &&
      (this.options.volume ?? 0.35) > 0
    );
  }
  private schedule(pattern: TonePattern): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running") return;
    const volume = Math.min(1, Math.max(0, this.options.volume ?? 0.35));
    for (const step of pattern.steps)
      for (const hz of step.frequencies) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + (step.delayMs ?? 0) / 1000;
        const duration = step.durationMs / 1000;
        oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(
          (volume * 0.12) / step.frequencies.length,
          start + Math.min(0.015, duration / 4),
        );
        gain.gain.setValueAtTime(
          (volume * 0.12) / step.frequencies.length,
          start + duration * 0.75,
        );
        gain.gain.linearRampToValueAtTime(0, start + duration);
        oscillator.connect(gain).connect(ctx.destination);
        this.nodes.add(oscillator);
        oscillator.onended = () => {
          this.nodes.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + duration + 0.01);
      }
  }
  async resume(): Promise<void> {
    if (this.context) await this.context.resume();
  }
  start(event: PhoneToneEvent, digit?: string, repeat = true): boolean {
    this.stop();
    if (
      event === "dtmf" &&
      this.options.haptics &&
      typeof navigator !== "undefined"
    ) {
      try {
        navigator.vibrate?.(8);
      } catch {
        /* Optional platform affordance. */
      }
    }
    if (!this.allowed(event)) return true;
    const pattern: TonePattern =
      event === "dtmf"
        ? {
            steps: [
              { frequencies: dtmfFrequencies(digit ?? ""), durationMs: 85 },
            ],
          }
        : phoneTonePresets[this.options.preset ?? "gentle"][event];
    const token = this.generation;
    if (repeat && pattern.repeatMs) this.loop = event;
    const begin = () => {
      if (
        token !== this.generation ||
        !this.context ||
        this.context.state !== "running"
      )
        return;
      this.schedule(pattern);
      if (repeat && pattern.repeatMs)
        this.timer = setInterval(
          () => this.schedule(pattern),
          pattern.repeatMs,
        );
    };
    begin();
    // One-shot feedback can await an in-flight user-gesture resume. Stale cues are discarded.
    if ((!repeat || !pattern.repeatMs) && this.context?.state === "suspended")
      void this.context
        .resume()
        .then(begin)
        .catch(() => {});
    return this.context?.state === "running";
  }
  stop(): void {
    this.generation++;
    this.loop = null;
    clearInterval(this.timer);
    this.timer = undefined;
    this.nodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* Already stopped. */
      }
    });
    this.nodes.clear();
  }
  dispose(): void {
    this.stop();
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
