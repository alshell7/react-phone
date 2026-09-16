"use client";
import type { ReactElement } from "react";
import { usePhone } from "../react/phone-provider.tsx";
import {
  LiveWaveform,
  type LiveWaveformProps,
} from "./elevenlabs/live-waveform.tsx";

export interface CallWaveformProps extends Omit<
  LiveWaveformProps,
  "stream" | "active" | "processing"
> {
  /** Defaults to remote audio; choose local to visualize the microphone. */
  source?: "remote" | "local";
}

/** ElevenLabs Live Waveform connected to the existing WebRTC audio stream. */
export function CallWaveform({
  source = "remote",
  ...props
}: CallWaveformProps): ReactElement {
  const { state, preview } = usePhone();
  const active =
    state.status === "active" && !state.remoteHeld && !state.transferPending;
  const stream = source === "local" ? state.localStream : state.remoteStream;
  const muted = source === "local" && state.muted;
  return (
    <div className="az-waveform-wrap">
      <LiveWaveform
        height={48}
        {...props}
        stream={stream}
        active={active && !muted && !preview}
        processing={active && !muted && preview}
      />
      {active && (
        <span>
          {preview
            ? "Simulated audio"
            : source === "local"
              ? muted
                ? "Microphone muted"
                : "Your microphone"
              : "Call audio"}
        </span>
      )}
    </div>
  );
}
