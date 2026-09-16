"use client";
import { useEffect, useState } from "react";
import { usePhone } from "./phone-provider.tsx";
import {
  getCallVisualState,
  type CallVisualState,
} from "../core/visual-state.ts";
import { resumeOnInteraction } from "../components/elevenlabs/audio-context.ts";

export interface CallActivity {
  state: CallVisualState;
  active: boolean;
  input: number;
  output: number;
  bands: number[];
}

/** Read borrowed WebRTC streams. The silent destination keeps the analyser pulled
 * by browsers without playing microphone audio or duplicating remote playback. */
export function useCallActivity(bandCount = 12): CallActivity {
  const { state, preview } = usePhone();
  const count = Math.max(1, Math.min(32, Math.round(bandCount) || 12));
  const [levels, setLevels] = useState({
    input: 0,
    output: 0,
    bands: Array<number>(count).fill(0),
  });
  const active = state.status === "active" && !state.remoteHeld;
  useEffect(() => {
    setLevels({ input: 0, output: 0, bands: Array<number>(count).fill(0) });
    if (!active) return;
    let context: AudioContext | undefined;
    let silent: GainNode | undefined;
    let resume = () => {};
    const sources: MediaStreamAudioSourceNode[] = [];
    const readers: Array<
      () => { key: "input" | "output"; level: number; bands: number[] }
    > = [];
    try {
      if (!preview) {
        context = new AudioContext();
        silent = context.createGain();
        silent.gain.value = 0;
        silent.connect(context.destination);
        for (const [key, stream] of [
          ["input", state.localStream],
          ["output", state.remoteStream],
        ] as const) {
          if (
            !stream
              ?.getAudioTracks()
              .some((track) => track.readyState === "live") ||
            (key === "input" && state.muted)
          )
            continue;
          const source = context.createMediaStreamSource(stream);
          const analyser = context.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.75;
          source.connect(analyser).connect(silent);
          sources.push(source);
          const time = new Uint8Array(analyser.fftSize);
          const frequency = new Uint8Array(analyser.frequencyBinCount);
          readers.push(() => {
            analyser.getByteTimeDomainData(time);
            analyser.getByteFrequencyData(frequency);
            const level = Math.min(
              1,
              Math.sqrt(
                time.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) /
                  time.length,
              ) * 6,
            );
            // Frequency bins covering speech (100–4000 Hz), not bin indices as Hz.
            const lo = Math.floor(
              (100 * analyser.fftSize) / context!.sampleRate,
            );
            const hi = Math.min(
              frequency.length,
              Math.ceil((4000 * analyser.fftSize) / context!.sampleRate),
            );
            const bands = Array.from({ length: count }, (_, i) => {
              const start = lo + Math.floor(((hi - lo) * i) / count);
              const end = Math.max(
                start + 1,
                lo + Math.floor(((hi - lo) * (i + 1)) / count),
              );
              let sum = 0;
              for (let j = start; j < end; j++) sum += frequency[j] ?? 0;
              return sum / (end - start) / 255;
            });
            return { key, level, bands };
          });
        }
        resume = resumeOnInteraction(context);
      }
    } catch {
      /* Unsupported visual analysis must never interrupt calling. */
    }
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (preview) {
        const t = performance.now() / 1000;
        setLevels({
          input: state.muted ? 0 : Math.abs(Math.sin(t * 2)) * 0.3,
          output: Math.abs(Math.sin(t * 1.4)) * 0.65,
          bands: Array.from(
            { length: count },
            (_, i) => Math.abs(Math.sin(t * 2 + i * 0.4)) * 0.7,
          ),
        });
      } else {
        const next = {
          input: 0,
          output: 0,
          bands: Array<number>(count).fill(0),
        };
        readers.forEach((read) => {
          const result = read();
          next[result.key] = result.level;
          next.bands = next.bands.map((n, i) => Math.max(n, result.bands[i]));
        });
        setLevels(next);
      }
    }, 50);
    return () => {
      clearInterval(timer);
      resume();
      sources.forEach((source) => source.disconnect());
      silent?.disconnect();
      void context?.close().catch(() => {});
    };
  }, [
    active,
    state.localStream,
    state.remoteStream,
    state.muted,
    preview,
    count,
  ]);
  return {
    ...levels,
    active,
    state: getCallVisualState(state, levels.input, levels.output),
  };
}
