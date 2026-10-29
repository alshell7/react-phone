import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { usePhone } from "./phone-provider.tsx";
import type { PhoneClient } from "../core/phone-client.ts";
import {
  getCallVisualState,
  type CallVisualState,
} from "../core/visual-state.ts";

export interface CallActivity {
  state: CallVisualState;
  active: boolean;
  /** Microphone activity 0–1 (zero while muted). */
  input: number;
  /** Remote party activity 0–1. */
  output: number;
  /** Speech-shaped bands derived from the current activity, 0–1 each. */
  bands: number[];
}

interface Levels {
  input: number;
  output: number;
  time: number;
}

/**
 * One poller per client, shared by every mounted visual. WebRTC statistics provide
 * audio levels on iOS, Android, and the web without tapping or duplicating audio.
 */
class LevelStore {
  levels: Levels = { input: 0, output: 0, time: 0 };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private busy = false;
  private foreground = AppState.currentState !== "background";
  private appState: { remove(): void } | undefined;
  private mode: { preview: boolean; muted: boolean; active: boolean } = {
    preview: false,
    muted: false,
    active: false,
  };

  constructor(private readonly client: PhoneClient) {}

  configure(mode: { preview: boolean; muted: boolean; active: boolean }): void {
    this.mode = mode;
    if (!mode.active) this.publish({ input: 0, output: 0, time: Date.now() });
    this.sync();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    this.sync();
    return () => {
      this.listeners.delete(listener);
      this.sync();
    };
  }

  private publish(levels: Levels): void {
    this.levels = levels;
    this.listeners.forEach((listener) => listener());
  }

  private sync(): void {
    const running = this.listeners.size > 0 && this.mode.active;
    if (running && !this.appState)
      this.appState = AppState.addEventListener("change", (next) => {
        this.foreground = next !== "background";
      });
    if (!running) {
      this.appState?.remove();
      this.appState = undefined;
    }
    if (running && !this.timer)
      this.timer = setInterval(() => void this.tick(), 80);
    else if (!running && this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async tick(): Promise<void> {
    if (this.busy || !this.foreground) return;
    const now = Date.now();
    if (this.mode.preview) {
      const t = now / 1000;
      this.publish({
        input: this.mode.muted ? 0 : Math.abs(Math.sin(t * 2)) * 0.3,
        output: Math.abs(Math.sin(t * 1.4)) * 0.65,
        time: now,
      });
      return;
    }
    this.busy = true;
    try {
      const next = await this.client.getAudioLevels();
      if (!this.mode.active) return;
      // Fast attack, gentle release keeps motion lively without flicker.
      const ease = (previous: number, value: number) =>
        value > previous ? previous * 0.3 + value * 0.7 : previous * 0.6 + value * 0.4;
      this.publish({
        input: ease(this.levels.input, next.input),
        output: ease(this.levels.output, next.output),
        time: now,
      });
    } finally {
      this.busy = false;
    }
  }
}

const stores = new WeakMap<PhoneClient, LevelStore>();
function storeFor(client: PhoneClient): LevelStore {
  let store = stores.get(client);
  if (!store) {
    store = new LevelStore(client);
    stores.set(client, store);
  }
  return store;
}

/** Deterministic, speech-shaped spectrum from a single activity level. */
export function activityBands(level: number, count: number, time: number): number[] {
  const t = time / 1000;
  return Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? 0.5 : i / (count - 1);
    const envelope = 0.25 + 0.75 * Math.exp(-((x - 0.35) ** 2) / 0.09);
    const jitter =
      0.62 + 0.38 * Math.sin(t * 7.1 + i * 1.73) * Math.sin(t * 2.3 + i * 0.61);
    return Math.max(0, Math.min(1, level * envelope * jitter * 1.35));
  });
}

/** Lifecycle state and live audio activity for custom visuals. */
export function useCallActivity(bandCount = 12): CallActivity {
  const { state, preview, client } = usePhone();
  const count = Math.max(1, Math.min(32, Math.round(bandCount) || 12));
  const active = state.status === "active" && !state.remoteHeld;
  const store = storeFor(client);
  const [levels, setLevels] = useState<Levels>(store.levels);
  useEffect(() => {
    store.configure({ preview, muted: state.muted, active });
  }, [store, preview, state.muted, active]);
  useEffect(() => {
    setLevels(store.levels);
    return store.subscribe(() => setLevels(store.levels));
  }, [store]);
  const input = active ? levels.input : 0;
  const output = active ? levels.output : 0;
  const bands = useMemo(
    () =>
      active
        ? activityBands(Math.max(input, output), count, levels.time)
        : Array<number>(count).fill(0),
    [active, input, output, count, levels.time],
  );
  return {
    input,
    output,
    bands,
    active,
    state: getCallVisualState(state, input, output),
  };
}
