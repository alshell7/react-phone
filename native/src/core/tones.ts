import { silentHaptics, type HapticsAdapter } from "./media.ts";

/** Local audio cues are synthesized; no files, network requests or microphone needed. */
export type PhoneToneEvent =
  | "incoming"
  | "outgoing"
  | "ringing"
  | "connected"
  | "disconnected"
  | "dtmf";
export type PhoneTonePreset = "gentle" | "classic" | "minimal";

/** Minimal Web Audio surface. Browsers and react-native-audio-api both satisfy it. */
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
}
export interface AudioNodeLike {
  connect(destination: never): unknown;
  disconnect(): void;
}
export interface OscillatorLike extends AudioNodeLike {
  frequency: AudioParamLike;
  start(when?: number): void;
  stop(when?: number): void;
}
export interface GainLike extends AudioNodeLike {
  gain: AudioParamLike;
}
export interface AudioContextLike {
  readonly state: string;
  readonly currentTime: number;
  readonly destination: unknown;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  resume(): Promise<unknown>;
  close(): Promise<unknown>;
}

export interface PhoneToneOptions {
  enabled?: boolean;
  preset?: PhoneTonePreset;
  /** 0–1, defaults to 0.35. Independent from call volume. */
  volume?: number;
  /** Short taps for keypad presses and connect/disconnect. */
  haptics?: boolean;
  /** Vibrate while an incoming call rings. Defaults to true on iOS/Android. */
  vibrateOnIncoming?: boolean;
  events?: Partial<Record<PhoneToneEvent, boolean>>;
  /**
   * Supplies a Web Audio context. Browsers use window.AudioContext automatically.
   * On iOS/Android pass react-native-audio-api: `() => new AudioContext()`.
   */
  audioContext?: () => AudioContextLike;
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

/** Standard DTMF row/column frequency pair for a keypad digit. */
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

interface ScheduledNode {
  oscillator: OscillatorLike;
  gain: GainLike;
  endsAt: number;
}

function defaultAudioContext(): (() => AudioContextLike) | undefined {
  const Context = (globalThis as { AudioContext?: new () => AudioContextLike })
    .AudioContext;
  return Context ? () => new Context() : undefined;
}

/** One tone owner per SIP client prevents duplicate sound across composed widgets. */
export class PhoneTones {
  private context: AudioContextLike | null = null;
  private options: PhoneToneOptions = {};
  private nodes = new Set<ScheduledNode>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private generation = 0;
  private loop: PhoneToneEvent | null = null;
  private vibrating = false;

  constructor(
    private readonly haptics: HapticsAdapter = silentHaptics,
    /** Native platforms vibrate for incoming calls unless disabled. */
    private readonly nativeDefaults = false,
  ) {}

  configure(options: PhoneToneOptions | false = {}): void {
    const next: PhoneToneOptions = options === false ? { enabled: false } : options;
    // JSON drops functions, so compare the audio context factory by identity.
    if (
      JSON.stringify(next) === JSON.stringify(this.options) &&
      next.audioContext === this.options.audioContext
    )
      return;
    const loop = this.loop;
    this.stop();
    this.options = next;
    if (loop) this.start(loop);
  }

  /** Create or resume the audio context. Call from a user gesture on the web. */
  unlock(): void {
    try {
      if (!this.context) {
        const factory = this.options.audioContext ?? defaultAudioContext();
        if (!factory) return;
        this.context = factory();
      }
      const ctx = this.context;
      if (ctx.state === "running") return;
      void Promise.resolve(ctx.resume())
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

  private prune(now: number): void {
    for (const node of this.nodes)
      if (node.endsAt < now) {
        this.nodes.delete(node);
        try {
          node.oscillator.disconnect();
          node.gain.disconnect();
        } catch {
          /* Already released. */
        }
      }
  }

  private schedule(pattern: TonePattern): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running") return;
    this.prune(ctx.currentTime);
    const volume = Math.min(1, Math.max(0, this.options.volume ?? 0.35));
    for (const step of pattern.steps)
      for (const hz of step.frequencies) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + (step.delayMs ?? 0) / 1000;
        const duration = step.durationMs / 1000;
        const peak = (volume * 0.12) / step.frequencies.length;
        oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(
          peak,
          start + Math.min(0.015, duration / 4),
        );
        gain.gain.setValueAtTime(peak, start + duration * 0.75);
        gain.gain.linearRampToValueAtTime(0, start + duration);
        oscillator.connect(gain as never);
        gain.connect(ctx.destination as never);
        this.nodes.add({ oscillator, gain, endsAt: start + duration + 0.05 });
        oscillator.start(start);
        oscillator.stop(start + duration + 0.01);
      }
  }

  async resume(): Promise<void> {
    if (this.context) await this.context.resume();
  }

  /** Whether audible cues can currently play (false while the web blocks autoplay). */
  get audible(): boolean {
    return !this.context || this.context.state === "running";
  }

  /**
   * Start a cue. Repeating patterns loop until stop(). Returns false only when a cue
   * should be audible but the platform is blocking audio (web autoplay policy).
   */
  start(event: PhoneToneEvent, digit?: string, repeat = true): boolean {
    this.stop();
    if (this.options.haptics) {
      if (event === "dtmf") this.haptics.impact("light");
      else if (event === "connected") this.haptics.impact("medium");
      else if (event === "disconnected") this.haptics.impact("light");
    }
    if (
      event === "incoming" &&
      repeat &&
      (this.options.vibrateOnIncoming ?? this.nativeDefaults) &&
      this.options.enabled !== false
    ) {
      this.vibrating = true;
      this.haptics.startRinging();
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
      void Promise.resolve(this.context.resume())
        .then(begin)
        .catch(() => {});
    return this.audible;
  }

  stop(): void {
    this.generation++;
    this.loop = null;
    clearInterval(this.timer);
    this.timer = undefined;
    if (this.vibrating) {
      this.vibrating = false;
      this.haptics.stopRinging();
    }
    this.nodes.forEach((node) => {
      try {
        node.oscillator.stop();
      } catch {
        /* Already stopped. */
      }
      try {
        node.oscillator.disconnect();
        node.gain.disconnect();
      } catch {
        /* Already released. */
      }
    });
    this.nodes.clear();
  }

  dispose(): void {
    this.stop();
    const ctx = this.context;
    this.context = null;
    if (ctx) void Promise.resolve(ctx.close()).catch(() => {});
  }
}
