import {
  PhoneTones,
  dtmfFrequencies,
  phoneTonePresets,
} from "../src/core/tones.ts";

class Oscillator {
  frequency = { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() };
  connect = jest.fn((node: unknown) => node);
  disconnect = jest.fn();
  start = jest.fn();
  stop = jest.fn();
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
  resume = jest.fn(async () => {
    this.state = "running";
  });
  close = jest.fn(async () => {
    this.state = "closed";
  });
  createOscillator() {
    const node = new Oscillator();
    this.oscillators.push(node);
    return node;
  }
  createGain() {
    return {
      gain: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
}
const haptics = () => ({ impact: jest.fn(), startRinging: jest.fn(), stopRinging: jest.fn() });
const audioContext = () => new Context();

beforeEach(() => {
  jest.useFakeTimers();
  Context.instances = [];
});
afterEach(() => {
  jest.useRealTimers();
  delete (globalThis as { AudioContext?: unknown }).AudioContext;
});

describe("local call tone presets", () => {
  it.each(["gentle", "classic", "minimal"] as const)(
    "plays every %s cue and stops repeats on disposal",
    async (preset) => {
      const tones = new PhoneTones();
      tones.configure({ preset, audioContext });
      tones.unlock();
      const context = Context.instances[0];
      for (const event of ["incoming", "outgoing", "ringing", "connected", "disconnected"] as const) {
        const before = context.oscillators.length;
        expect(tones.start(event)).toBe(true);
        expect(context.oscillators.length - before).toBe(
          phoneTonePresets[preset][event].steps.reduce((sum, step) => sum + step.frequencies.length, 0),
        );
      }
      tones.start("incoming");
      await jest.advanceTimersByTimeAsync(6000);
      expect(context.oscillators.length).toBeGreaterThan(5);
      tones.dispose();
      const count = context.oscillators.length;
      await jest.advanceTimersByTimeAsync(6000);
      expect(context.oscillators.length).toBe(count);
      expect(jest.getTimerCount()).toBe(0);
      expect(context.close).toHaveBeenCalledTimes(1);
    },
  );
  it("uses the browser AudioContext automatically on the web", () => {
    (globalThis as { AudioContext?: unknown }).AudioContext = Context;
    const tones = new PhoneTones();
    tones.unlock();
    tones.start("connected");
    expect(Context.instances[0].oscillators).toHaveLength(2);
    tones.dispose();
  });
  it("stays silent and reports audible when no audio engine exists (native default)", () => {
    const tones = new PhoneTones();
    tones.unlock();
    expect(tones.start("incoming")).toBe(true);
    expect(tones.audible).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
  it("reports blocked audio while the context is suspended (web autoplay)", () => {
    const tones = new PhoneTones();
    tones.configure({
      audioContext: () => {
        const context = new Context();
        context.state = "suspended";
        context.resume = jest.fn(() => new Promise<void>(() => {}));
        return context;
      },
    });
    tones.unlock();
    expect(tones.start("incoming")).toBe(false);
    tones.dispose();
  });
  it("honors per-event silence, global silence, and volume zero", () => {
    const tones = new PhoneTones();
    tones.configure({ audioContext });
    tones.unlock();
    tones.configure({ audioContext, events: { incoming: false } });
    expect(tones.start("incoming")).toBe(true);
    tones.configure(false);
    tones.start("connected");
    tones.configure({ audioContext, volume: 0 });
    tones.start("ringing");
    expect(Context.instances[0].oscillators).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
    tones.dispose();
  });
  it("plays a DTMF pair with optional haptic feedback", () => {
    const feedback = haptics();
    const tones = new PhoneTones(feedback);
    tones.configure({ haptics: true, audioContext });
    tones.unlock();
    tones.start("dtmf", "5");
    expect(Context.instances[0].oscillators.map((node) => node.frequency.value)).toEqual([770, 1336]);
    expect(feedback.impact).toHaveBeenCalledWith("light");
    tones.start("connected");
    expect(feedback.impact).toHaveBeenCalledWith("medium");
    tones.dispose();
  });
  it("vibrates for incoming calls by default on native and stops with the ring", () => {
    const feedback = haptics();
    const tones = new PhoneTones(feedback, true);
    tones.start("incoming");
    expect(feedback.startRinging).toHaveBeenCalledTimes(1);
    tones.start("connected");
    expect(feedback.stopRinging).toHaveBeenCalledTimes(1);
    const web = haptics();
    new PhoneTones(web, false).start("incoming");
    expect(web.startRinging).not.toHaveBeenCalled();
    const opted = haptics();
    const silent = new PhoneTones(opted, true);
    silent.configure({ vibrateOnIncoming: false });
    silent.start("incoming");
    expect(opted.startRinging).not.toHaveBeenCalled();
  });
  it("restarts a looping cue when reconfigured", () => {
    const tones = new PhoneTones();
    tones.configure({ audioContext });
    tones.unlock();
    tones.start("incoming");
    const before = Context.instances[0].oscillators.length;
    tones.configure({ audioContext, preset: "classic" });
    expect(Context.instances[0].oscillators.length).toBeGreaterThan(before);
    expect(jest.getTimerCount()).toBe(1);
    tones.dispose();
  });
  it("does not loop a requested tone preview", async () => {
    const tones = new PhoneTones();
    tones.configure({ audioContext });
    tones.unlock();
    tones.start("incoming", undefined, false);
    const before = Context.instances[0].oscillators.length;
    await jest.advanceTimersByTimeAsync(6000);
    expect(Context.instances[0].oscillators.length).toBe(before);
    expect(jest.getTimerCount()).toBe(0);
    tones.dispose();
  });
  it("cancels delayed sound when disposed before audio resumes", async () => {
    const tones = new PhoneTones();
    tones.configure({ audioContext });
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
    expect(dtmfFrequencies("D")).toEqual([941, 1633]);
    expect(dtmfFrequencies("12")).toEqual([]);
    expect(dtmfFrequencies("x")).toEqual([]);
  });
});
