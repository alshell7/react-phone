/**
 * Composable, themeable React Native SIP phone for iOS, Android, and the web.
 * Use SipPhone / SipPhoneIsland for complete experiences, or PhoneProvider + usePhone
 * with the individual controls for your own layout.
 * @module
 */
export {
  PhoneClient,
  normalizeAudioLevel,
} from "./core/phone-client.ts";
export type { PhoneCapabilities, AudioLevels } from "./core/phone-client.ts";
export {
  formatDuration,
  normalizeTarget,
  validateConfig,
} from "./core/validation.ts";
export type * from "./core/types.ts";
export type {
  MediaAdapter,
  AudioSessionAdapter,
  HapticsAdapter,
  RemoteAudioPlayer,
  PhoneMediaStream,
  PhoneMediaTrack,
  PhoneMediaDevice,
  PermissionResult,
} from "./core/media.ts";
export { createInCallManagerAudioSession } from "./core/audio-session.ts";
export type {
  InCallManagerLike,
  InCallManagerSessionOptions,
} from "./core/audio-session.ts";
export {
  createNativeHaptics,
  createNativeMediaAdapter,
  createWebHaptics,
  createWebMediaAdapter,
} from "./platform/index.ts";
export { phoneTonePresets } from "./core/tones.ts";
export type {
  PhoneToneOptions,
  PhoneTonePreset,
  PhoneToneEvent,
  TonePattern,
  ToneStep,
  AudioContextLike,
} from "./core/tones.ts";
export { getCallVisualState } from "./core/visual-state.ts";
export type { CallVisualState } from "./core/visual-state.ts";

export { PhoneProvider, usePhone } from "./react/phone-provider.tsx";
export type {
  PhoneProviderProps,
  PhoneContextValue,
} from "./react/phone-provider.tsx";
export { useAutoDial } from "./react/use-auto-dial.ts";
export type { AutoDialOptions } from "./react/use-auto-dial.ts";
export { useCallActivity, activityBands } from "./react/use-call-activity.ts";
export type { CallActivity } from "./react/use-call-activity.ts";
export { useReducedMotion } from "./react/use-reduced-motion.ts";
export { useDraggable } from "./react/use-draggable.ts";
export type {
  PhoneDragOptions,
  PhoneDragHandle,
  PhonePosition,
} from "./react/use-draggable.ts";

export {
  SipPhone,
  PhoneWidget,
  phonePresets,
} from "./components/phone-widget.tsx";
export type {
  SipPhoneProps,
  PhoneWidgetProps,
  PhonePreset,
  PhoneFeatures,
  PhoneVisualization,
  SafeAreaInsets,
} from "./components/phone-widget.tsx";
export { PhoneIsland, SipPhoneIsland } from "./components/phone-island.tsx";
export type {
  PhoneIslandProps,
  SipPhoneIslandProps,
  PhoneIslandPlacement,
  IncomingCallBehavior,
  PhoneIslandChangeReason,
} from "./components/phone-island.tsx";
export {
  PhoneRoot,
  usePhoneTheme,
  resolvePhoneTheme,
  mixColors,
  withAlpha,
} from "./components/theme.tsx";
export type {
  PhoneRootProps,
  PhoneTheme,
  ResolvedPhoneTheme,
} from "./components/theme.tsx";
export { usePhoneMotion } from "./components/motion.tsx";
export type { PhoneMotion } from "./components/motion.tsx";
export {
  ConnectionStatus,
  CallTimer,
  ErrorBanner,
} from "./components/status.tsx";
export type { ConnectionStatusProps } from "./components/status.tsx";
export { CallerCard, Avatar } from "./components/caller-card.tsx";
export type { CallerCardProps } from "./components/caller-card.tsx";
export { Dialer, Keypad } from "./components/dialer.tsx";
export type { DialerProps, KeypadProps } from "./components/dialer.tsx";
export {
  CallControls,
  IncomingCallActions,
  SlideToAnswer,
  TransferPanel,
  defaultCallControls,
} from "./components/call-controls.tsx";
export type {
  CallControl,
  CallControlsProps,
  IncomingCallActionsProps,
  SlideToAnswerProps,
} from "./components/call-controls.tsx";
export { ConnectionForm } from "./components/connection-form.tsx";
export type { ConnectionFormProps } from "./components/connection-form.tsx";
export { AudioSettings, VolumeSlider } from "./components/audio-settings.tsx";
export type { VolumeSliderProps } from "./components/audio-settings.tsx";
export { CallHistory, isMissed } from "./components/call-history.tsx";
export type { CallHistoryProps } from "./components/call-history.tsx";
export {
  RoundButton,
  Button,
  IconButton,
  PhoneText,
  PressableScale,
} from "./components/primitives.tsx";
export type {
  RoundButtonProps,
  ButtonProps,
  IconButtonProps,
  PhoneTextProps,
  PressableScaleProps,
  PhoneIcon,
} from "./components/primitives.tsx";
export {
  CallOrb,
  CallWaveform,
  CallBarVisualizer,
} from "./components/call-visuals.tsx";
export type {
  CallOrbProps,
  CallWaveformProps,
  CallBarVisualizerProps,
} from "./components/call-visuals.tsx";
export { Orb } from "./components/visuals/orb.tsx";
export type { OrbProps } from "./components/visuals/orb.tsx";
export { LiveWaveform } from "./components/visuals/live-waveform.tsx";
export type { LiveWaveformProps } from "./components/visuals/live-waveform.tsx";
export { BarVisualizer } from "./components/visuals/bar-visualizer.tsx";
export type { BarVisualizerProps } from "./components/visuals/bar-visualizer.tsx";
export { Waveform } from "./components/visuals/waveform.tsx";
export type { WaveformProps } from "./components/visuals/waveform.tsx";
