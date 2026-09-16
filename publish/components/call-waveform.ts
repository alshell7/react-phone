// Generated from src/components/call-waveform.tsx. Run npm run package:build; do not edit.
"use client";

import type { ReactElement } from "../react-types.d.ts";
import { usePhone } from "../react/phone-provider.ts";
import { LiveWaveform, type LiveWaveformProps } from "./elevenlabs/live-waveform.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export interface CallWaveformProps extends Omit<LiveWaveformProps, "stream" | "active" | "processing"> {
  /** Defaults to remote audio; choose local to visualize the microphone. */
  source?: "remote" | "local";
}

/** ElevenLabs Live Waveform connected to the existing WebRTC audio stream. */
export function CallWaveform({
  source = "remote",
  ...props
}: CallWaveformProps): ReactElement {
  const {
    state,
    preview
  } = usePhone();
  const active = state.status === "active" && !state.remoteHeld && !state.transferPending;
  const stream = source === "local" ? state.localStream : state.remoteStream;
  const muted = source === "local" && state.muted;
  return /*#__PURE__*/_jsxs("div", {
    className: "az-waveform-wrap",
    children: [/*#__PURE__*/_jsx(LiveWaveform, {
      height: 48,
      ...props,
      stream: stream,
      active: active && !muted && !preview,
      processing: active && !muted && preview
    }), active && /*#__PURE__*/_jsx("span", {
      children: preview ? "Simulated audio" : source === "local" ? muted ? "Microphone muted" : "Your microphone" : "Call audio"
    })]
  });
}
