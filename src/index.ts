/**
 * Embeddable React SIP phone with ElevenLabs UI audio visualization.
 * Use WebPhone for a preset or PhoneProvider and usePhone for custom compositions.
 * @module
 */
export { PhoneClient } from "./core/phone-client.ts";
export {
  formatDuration,
  normalizeTarget,
  validateConfig,
} from "./core/validation.ts";
export type * from "./core/types.ts";
export { PhoneProvider, usePhone } from "./react/phone-provider.tsx";
export type {
  PhoneProviderProps,
  PhoneContextValue,
} from "./react/phone-provider.tsx";
export {
  WebPhone,
  PhoneWidget,
  phonePresets,
} from "./components/phone-widget.tsx";
export type {
  WebPhoneProps,
  PhoneWidgetProps,
  PhonePreset,
  PhoneFeatures,
  PhoneVisualization,
} from "./components/phone-widget.tsx";
export { PhoneRoot, PhoneStyles } from "./components/theme.tsx";
export type { PhoneRootProps, PhoneTheme } from "./components/theme.tsx";
export {
  Dialer,
  CallerCard,
  CallControls,
  CallTimer,
  TransferPanel,
  ConnectionForm,
  ConnectionStatus,
  AudioSettings,
  ErrorBanner,
} from "./components/controls.tsx";
export type {
  DialerProps,
  CallerCardProps,
  CallControlsProps,
  CallControl,
  ConnectionFormProps,
} from "./components/controls.tsx";
export { CallWaveform } from "./components/call-waveform.tsx";
export type { CallWaveformProps } from "./components/call-waveform.tsx";
export { CallOrb } from "./components/call-orb.tsx";
export type { CallOrbProps } from "./components/call-orb.tsx";
export { Orb } from "./components/elevenlabs/orb.tsx";
export type { OrbProps } from "./components/elevenlabs/orb.tsx";
export { LiveWaveform } from "./components/elevenlabs/live-waveform.tsx";
export type { LiveWaveformProps } from "./components/elevenlabs/live-waveform.tsx";
export { useAutoDial } from "./react/use-auto-dial.ts";
export type { AutoDialOptions } from "./react/use-auto-dial.ts";
export { BarVisualizer } from "./components/elevenlabs/bar-visualizer.tsx";
export type { BarVisualizerProps } from "./components/elevenlabs/bar-visualizer.tsx";
export { CallBarVisualizer } from "./components/call-bar-visualizer.tsx";
export type { CallBarVisualizerProps } from "./components/call-bar-visualizer.tsx";
export { defaultCallControls } from "./components/controls.tsx";
export type { PhoneDragOptions, PhonePosition } from "./react/use-draggable.ts";
export type { PhoneMotion } from "./components/motion.tsx";
export { useCallActivity } from "./react/use-call-activity.ts";
export type { CallActivity } from "./react/use-call-activity.ts";
export { getCallVisualState } from "./core/visual-state.ts";
export type { CallVisualState } from "./core/visual-state.ts";
export { phoneTonePresets } from "./core/tones.ts";
export type {
  PhoneToneOptions,
  PhoneTonePreset,
  PhoneToneEvent,
  TonePattern,
  ToneStep,
} from "./core/tones.ts";
export { Waveform } from "./components/elevenlabs/waveform.tsx";
export type { WaveformProps } from "./components/elevenlabs/waveform.tsx";
export { PhoneIsland, WebPhoneIsland } from "./components/phone-island.tsx";
export type {
  PhoneIslandProps,
  WebPhoneIslandProps,
  PhoneIslandPlacement,
  IncomingCallBehavior,
  PhoneIslandChangeReason,
} from "./components/phone-island.tsx";
