import type { PhoneSnapshot } from "./types.ts";

/** Shared semantic states for Orb, waveform, and ElevenLabs bar animation. */
export type CallVisualState =
  | "idle"
  | "connecting"
  | "initializing"
  | "ringing"
  | "listening"
  | "speaking"
  | "thinking"
  | "held"
  | "ended"
  | "error";

export function getCallVisualState(
  state: PhoneSnapshot,
  input = 0,
  output = 0,
): CallVisualState {
  if (
    state.status === "held" ||
    (state.status === "active" && state.remoteHeld)
  )
    return "held";
  if (state.status === "active") {
    if (state.transferPending) return "thinking";
    return Math.max(state.muted ? 0 : input, output) > 0.035
      ? "speaking"
      : "listening";
  }
  if (state.status === "requesting-microphone" || state.status === "answering")
    return "initializing";
  if (state.status === "dialing") return "connecting";
  if (state.status === "ringing" || state.status === "incoming")
    return "ringing";
  if (state.connection === "connecting" || state.connection === "reconnecting")
    return "connecting";
  if (state.error || state.connection === "error") return "error";
  return state.status === "ended" ? "ended" : "idle";
}
