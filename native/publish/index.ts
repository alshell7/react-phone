// Generated from src/index.ts. Run npm run package:build; do not edit.
/**
 * Composable, themeable React Native SIP phone for iOS, Android, and the web.
 * Use SipPhone / SipPhoneIsland for complete experiences, or PhoneProvider + usePhone
 * with the individual controls for your own layout.
 * @module
 */
export { PhoneClient, normalizeAudioLevel } from "./core/phone-client.ts";
export type { PhoneCapabilities, AudioLevels } from "./core/phone-client.ts";
export { formatDuration, normalizeTarget, validateConfig } from "./core/validation.ts";
export type * from "./core/types.ts";
export type { MediaAdapter, AudioSessionAdapter, HapticsAdapter, RemoteAudioPlayer, PhoneMediaStream, PhoneMediaTrack, PhoneMediaDevice, PermissionResult } from "./core/media.ts";
export { createInCallManagerAudioSession } from "./core/audio-session.ts";
export type { InCallManagerLike, InCallManagerSessionOptions } from "./core/audio-session.ts";
export { createNativeHaptics, createNativeMediaAdapter, createWebHaptics, createWebMediaAdapter } from "./platform/index.ts";
export { phoneTonePresets } from "./core/tones.ts";
export type { PhoneToneOptions, PhoneTonePreset, PhoneToneEvent, TonePattern, ToneStep, AudioContextLike } from "./core/tones.ts";
export { getCallVisualState } from "./core/visual-state.ts";
export type { CallVisualState } from "./core/visual-state.ts";
export { PhoneProvider, usePhone } from "./react/phone-provider.ts";
export type { PhoneProviderProps, PhoneContextValue } from "./react/phone-provider.ts";
export { useAutoDial } from "./react/use-auto-dial.ts";
export type { AutoDialOptions } from "./react/use-auto-dial.ts";
export { useCallActivity, activityBands } from "./react/use-call-activity.ts";
export type { CallActivity } from "./react/use-call-activity.ts";
export { useReducedMotion } from "./react/use-reduced-motion.ts";
export { useDraggable } from "./react/use-draggable.ts";
export type { PhoneDragOptions, PhoneDragHandle, PhonePosition } from "./react/use-draggable.ts";
export { SipPhone, PhoneWidget, phonePresets } from "./components/phone-widget.ts";
export type { SipPhoneProps, PhoneWidgetProps, PhonePreset, PhoneFeatures, PhoneVisualization, SafeAreaInsets } from "./components/phone-widget.ts";
export { PhoneIsland, SipPhoneIsland } from "./components/phone-island.ts";
export type { PhoneIslandProps, SipPhoneIslandProps, PhoneIslandPlacement, IncomingCallBehavior, PhoneIslandChangeReason } from "./components/phone-island.ts";
export { PhoneRoot, usePhoneTheme, resolvePhoneTheme, mixColors, withAlpha } from "./components/theme.ts";
export type { PhoneRootProps, PhoneTheme, ResolvedPhoneTheme } from "./components/theme.ts";
export { usePhoneMotion } from "./components/motion.ts";
export type { PhoneMotion } from "./components/motion.ts";
export { ConnectionStatus, CallTimer, ErrorBanner } from "./components/status.ts";
export type { ConnectionStatusProps } from "./components/status.ts";
export { CallerCard, Avatar } from "./components/caller-card.ts";
export type { CallerCardProps } from "./components/caller-card.ts";
export { Dialer, Keypad } from "./components/dialer.ts";
export type { DialerProps, KeypadProps } from "./components/dialer.ts";
export { CallControls, IncomingCallActions, SlideToAnswer, TransferPanel, defaultCallControls } from "./components/call-controls.ts";
export type { CallControl, CallControlsProps, IncomingCallActionsProps, SlideToAnswerProps } from "./components/call-controls.ts";
export { ConnectionForm } from "./components/connection-form.ts";
export type { ConnectionFormProps } from "./components/connection-form.ts";
export { AudioSettings, VolumeSlider } from "./components/audio-settings.ts";
export type { VolumeSliderProps } from "./components/audio-settings.ts";
export { CallHistory, isMissed } from "./components/call-history.ts";
export type { CallHistoryProps } from "./components/call-history.ts";
export { RoundButton, Button, IconButton, PhoneText, PressableScale } from "./components/primitives.ts";
export type { RoundButtonProps, ButtonProps, IconButtonProps, PhoneTextProps, PressableScaleProps, PhoneIcon } from "./components/primitives.ts";
export { CallOrb, CallWaveform, CallBarVisualizer } from "./components/call-visuals.ts";
export type { CallOrbProps, CallWaveformProps, CallBarVisualizerProps } from "./components/call-visuals.ts";
export { Orb } from "./components/visuals/orb.ts";
export type { OrbProps } from "./components/visuals/orb.ts";
export { LiveWaveform } from "./components/visuals/live-waveform.ts";
export type { LiveWaveformProps } from "./components/visuals/live-waveform.ts";
export { BarVisualizer } from "./components/visuals/bar-visualizer.ts";
export type { BarVisualizerProps } from "./components/visuals/bar-visualizer.ts";
export { Waveform } from "./components/visuals/waveform.ts";
export type { WaveformProps } from "./components/visuals/waveform.ts";
