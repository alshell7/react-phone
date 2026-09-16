// Generated from src/index.ts. Run npm run package:build; do not edit.
/**
 * Embeddable React SIP phone with ElevenLabs UI audio visualization.
 * Use WebPhone for a preset or PhoneProvider and usePhone for custom compositions.
 * @module
 */
export { PhoneClient } from "./core/phone-client.ts";
export { formatDuration, normalizeTarget, validateConfig } from "./core/validation.ts";
export type * from "./core/types.ts";
export { PhoneProvider, usePhone } from "./react/phone-provider.ts";
export type { PhoneProviderProps, PhoneContextValue } from "./react/phone-provider.ts";
export { WebPhone, PhoneWidget, phonePresets } from "./components/phone-widget.ts";
export type { WebPhoneProps, PhoneWidgetProps, PhonePreset, PhoneFeatures, PhoneVisualization } from "./components/phone-widget.ts";
export { PhoneRoot, PhoneStyles } from "./components/theme.ts";
export type { PhoneRootProps, PhoneTheme } from "./components/theme.ts";
export { Dialer, CallerCard, CallControls, CallTimer, TransferPanel, ConnectionForm, ConnectionStatus, AudioSettings, ErrorBanner } from "./components/controls.ts";
export type { DialerProps, CallerCardProps, CallControlsProps, CallControl, ConnectionFormProps } from "./components/controls.ts";
export { CallWaveform } from "./components/call-waveform.ts";
export type { CallWaveformProps } from "./components/call-waveform.ts";
export { CallOrb } from "./components/call-orb.ts";
export type { CallOrbProps } from "./components/call-orb.ts";
export { Orb } from "./components/elevenlabs/orb.ts";
export type { OrbProps } from "./components/elevenlabs/orb.ts";
export { LiveWaveform } from "./components/elevenlabs/live-waveform.ts";
export type { LiveWaveformProps } from "./components/elevenlabs/live-waveform.ts";
export { useAutoDial } from "./react/use-auto-dial.ts";
export type { AutoDialOptions } from "./react/use-auto-dial.ts";
export { BarVisualizer } from "./components/elevenlabs/bar-visualizer.ts";
export type { BarVisualizerProps } from "./components/elevenlabs/bar-visualizer.ts";
export { CallBarVisualizer } from "./components/call-bar-visualizer.ts";
export type { CallBarVisualizerProps } from "./components/call-bar-visualizer.ts";
export { defaultCallControls } from "./components/controls.ts";
export type { PhoneDragOptions, PhonePosition } from "./react/use-draggable.ts";
export type { PhoneMotion } from "./components/motion.ts";
export { useCallActivity } from "./react/use-call-activity.ts";
export type { CallActivity } from "./react/use-call-activity.ts";
export { getCallVisualState } from "./core/visual-state.ts";
export type { CallVisualState } from "./core/visual-state.ts";
export { phoneTonePresets } from "./core/tones.ts";
export type { PhoneToneOptions, PhoneTonePreset, PhoneToneEvent, TonePattern, ToneStep } from "./core/tones.ts";
export { Waveform } from "./components/elevenlabs/waveform.ts";
export type { WaveformProps } from "./components/elevenlabs/waveform.ts";
export { PhoneIsland, WebPhoneIsland } from "./components/phone-island.ts";
export type { PhoneIslandProps, WebPhoneIslandProps, PhoneIslandPlacement, IncomingCallBehavior, PhoneIslandChangeReason } from "./components/phone-island.ts";
