import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PhoneTones,
  dtmfFrequencies,
  phoneTonePresets,
} from "../src/core/tones.ts";

class Oscillator {
  frequency = { value: 0 };
  onended?: () => void;
  connect = vi.fn((node: unknown) => node);
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn((time?: number) => {
    if (time === undefined) this.onended?.();
  });
}
class Context {
  static instances: Context[] = [];
  state = "running";
  currentTime = 0;
  destination = {};
  oscillators: Oscillator[] = [];
  constructor() {
    Context.instances.push(this);
  }
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
  createOscillator() {
    const node = new Oscillator();
    this.oscillators.push(node);
    return node;
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  Context.instances = [];
  vi.stubGlobal("AudioContext", Context);
  vi.stubGlobal("window", { AudioContext: Context });
  vi.stubGlobal("navigator", { vibrate: vi.fn() });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("local call tone presets", () => {
  it.each(["gentle", "classic", "minimal"] as const)(
    "plays every %s cue and stops repeats on disposal",
    async (preset) => {
      const tones = new PhoneTones();
      tones.configure({ preset });
      tones.unlock();
      await Promise.resolve();
      const context = Context.instances[0];
      for (const event of [
        "incoming",
        "outgoing",
        "ringing",
        "connected",
        "disconnected",
      ] as const) {
        const before = context.oscillators.length;
        expect(tones.start(event)).toBe(true);
        expect(context.oscillators.length - before).toBe(
          phoneTonePresets[preset][event].steps.reduce(
            (sum, step) => sum + step.frequencies.length,
            0,
          ),
        );
      }
      tones.start("incoming");
      await vi.advanceTimersByTimeAsync(6000);
      tones.dispose();
      const count = context.oscillators.length;
      await vi.advanceTimersByTimeAsync(6000);
      expect(context.oscillators.length).toBe(count);
      expect(vi.getTimerCount()).toBe(0);
      expect(context.close).toHaveBeenCalledOnce();
    },
  );
  it("honors per-event silence, global silence, and volume zero", () => {
    const tones = new PhoneTones();
    tones.unlock();
    tones.configure({ events: { incoming: false } });
    expect(tones.start("incoming")).toBe(true);
    tones.configure(false);
    tones.start("connected");
    tones.configure({ volume: 0 });
    tones.start("ringing");
    expect(Context.instances[0].oscillators).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    tones.dispose();
  });
  it("plays a DTMF pair with optional haptic feedback", () => {
    const tones = new PhoneTones();
    tones.configure({ haptics: true });
    tones.unlock();
    tones.start("dtmf", "5");
    expect(
      Context.instances[0].oscillators.map((node) => node.frequency.value),
    ).toEqual([770, 1336]);
    expect(navigator.vibrate).toHaveBeenCalledWith(8);
    tones.dispose();
  });
  it("does not loop a requested tone preview", async () => {
    const tones = new PhoneTones();
    tones.unlock();
    tones.start("incoming", undefined, false);
    const before = Context.instances[0].oscillators.length;
    await vi.advanceTimersByTimeAsync(6000);
    expect(Context.instances[0].oscillators.length).toBe(before);
    expect(vi.getTimerCount()).toBe(0);
    tones.dispose();
  });
  it("cancels delayed sound when disposed before audio resumes", async () => {
    const tones = new PhoneTones();
    tones.unlock();
    const context = Context.instances[0];
    context.state = "suspended";
    tones.start("connected");
    tones.dispose();
    await Promise.resolve();
    expect(context.oscillators).toHaveLength(0);
  });
  it("validates keypad frequencies", () => {
    expect(dtmfFrequencies("#")).toEqual([941, 1477]);
    expect(dtmfFrequencies("12")).toEqual([]);
    expect(dtmfFrequencies("x")).toEqual([]);
  });
});
