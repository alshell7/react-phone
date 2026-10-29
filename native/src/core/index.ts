/** Headless SIP client and types, with no React dependency. @module */
export { PhoneClient, normalizeAudioLevel } from "./phone-client.ts";
export type { PhoneCapabilities, AudioLevels } from "./phone-client.ts";
export {
  normalizeTarget,
  validateConfig,
  formatDuration,
  createId,
} from "./validation.ts";
export type * from "./types.ts";
export type {
  MediaAdapter,
  AudioSessionAdapter,
  HapticsAdapter,
  RemoteAudioPlayer,
  PhoneMediaStream,
  PhoneMediaTrack,
  PhoneMediaDevice,
  PermissionResult,
} from "./media.ts";
export { microphoneMessage } from "./media.ts";
export { createInCallManagerAudioSession } from "./audio-session.ts";
export type {
  InCallManagerLike,
  InCallManagerSessionOptions,
} from "./audio-session.ts";
export { phoneTonePresets, dtmfFrequencies, PhoneTones } from "./tones.ts";
export type {
  PhoneToneOptions,
  PhoneTonePreset,
  PhoneToneEvent,
  TonePattern,
  ToneStep,
  AudioContextLike,
} from "./tones.ts";
export { getCallVisualState } from "./visual-state.ts";
export type { CallVisualState } from "./visual-state.ts";
