import { createContext, useContext } from "react";

/**
 * Every string the phone shows or announces. Pass a partial object to `labels` on any
 * phone (or PhoneRoot) to translate or reword it; unspecified keys keep English.
 */
export interface PhoneLabels {
  // Registration
  notConnected: string;
  connecting: string;
  readyForCalls: string;
  reconnecting: string;
  connectionFailed: string;
  previewMode: string;
  // Call status
  readyToConnect: string;
  waitingForMicrophone: string;
  calling: string;
  ringing: string;
  incomingCall: string;
  answering: string;
  connected: string;
  remoteHold: string;
  onHold: string;
  callEnded: string;
  idleTitle: string;
  idleSubtitle: string;
  callDuration: (time: string) => string;
  /** Display names for the client's end reasons ("Missed call", "Busy", …). */
  endReasons: Record<string, string>;
  // Call controls
  mute: string;
  unmute: string;
  keypad: string;
  hideKeypad: string;
  hide: string;
  speaker: string;
  hold: string;
  resume: string;
  transfer: string;
  endCall: string;
  cancelCall: string;
  answer: string;
  decline: string;
  slideToAnswer: string;
  answerCall: string;
  slideToAnswerHint: string;
  // Dialer
  dialPlaceholder: string;
  numberField: string;
  call: string;
  callNumber: (number: string) => string;
  startCall: string;
  deleteDigit: string;
  connectToCall: string;
  dialPad: string;
  inCallKeypad: string;
  sentDigits: (digits: string) => string;
  star: string;
  pound: string;
  longPressPlus: string;
  speedDialHint: (name: string) => string;
  // Suggestions
  suggestions: string;
  moreSuggestions: (count: number) => string;
  fewerSuggestions: string;
  useContact: (name: string) => string;
  // Transfer
  transferTitle: string;
  transferHint: string;
  destination: string;
  destinationPlaceholder: string;
  transferring: string;
  closeTransfer: string;
  // Phone chrome
  title: string;
  keypadTab: string;
  recentsTab: string;
  audioHandledByDevice: string;
  audioHandledByBrowser: string;
  connectAccountToCall: string;
  poweredBy: string;
  audioSettings: string;
  openAudioSettings: string;
  closeAudioSettings: string;
  movePhone: string;
  movePhoneHint: string;
  resetPosition: string;
  minimizeCall: string;
  lastCall: string;
  // Visuals
  simulatedAudio: string;
  microphoneMuted: string;
  yourMicrophone: string;
  callAudio: string;
  callAudioWaveform: string;
  waveform: string;
  /** `state` is a CallVisualState such as "speaking" or "held". */
  voiceOrb: (state: string) => string;
  voiceBars: (state: string) => string;
  // Island
  inConversation: string;
  connectingCall: string;
  callingShort: string;
  needsAttention: string;
  enableCallAudio: string;
  openPhone: string;
  openCall: string;
  collapsePhone: string;
  tapToAnswer: string;
  incomingCallFrom: (name: string) => string;
  unknownCaller: string;
  muted: string;
  // Errors
  dismissError: string;
  openSettings: string;
  // Recents
  noRecents: string;
  recentsEmpty: string;
  clear: string;
  clearRecents: string;
  missedCallFrom: (name: string) => string;
  callTo: (name: string) => string;
  callsBack: string;
  callContact: (name: string) => string;
  // Audio settings
  microphone: string;
  output: string;
  callVolume: string;
  checkMicrophone: string;
  microphoneReady: string;
  waitingForPermission: string;
  microphoneBlocked: string;
  microphoneDenied: string;
  microphoneGranted: string;
  microphoneUnknown: string;
  systemDefault: string;
  speakers: string;
  speakerRoutingHint: string;
  webOutputHint: string;
  nativeOutputHint: string;
  nextCallNote: string;
  // Connection form
  username: string;
  usernamePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  serverSettings: string;
  sipAddress: string;
  sipAddressHint: string;
  websocketServer: string;
  iceServer: string;
  turnUsername: string;
  turnPassword: string;
  connectAccount: string;
  connectingAccount: string;
  cancelConnection: string;
  credentialsNote: string;
}

export const defaultPhoneLabels: Readonly<PhoneLabels> = {
  notConnected: "Not connected",
  connecting: "Connecting",
  readyForCalls: "Ready for calls",
  reconnecting: "Reconnecting",
  connectionFailed: "Connection failed",
  previewMode: "Preview mode",
  readyToConnect: "Ready to connect",
  waitingForMicrophone: "Waiting for microphone…",
  calling: "Calling…",
  ringing: "Ringing…",
  incomingCall: "Incoming call",
  answering: "Connecting…",
  connected: "Connected",
  remoteHold: "Caller put you on hold",
  onHold: "On hold",
  callEnded: "Call ended",
  idleTitle: "Ready when you are",
  idleSubtitle: "Dial a number. Make a connection.",
  callDuration: (time) => `Call duration ${time}`,
  endReasons: {},
  mute: "Mute",
  unmute: "Unmute",
  keypad: "Keypad",
  hideKeypad: "Hide keypad",
  hide: "Hide",
  speaker: "Speaker",
  hold: "Hold",
  resume: "Resume",
  transfer: "Transfer",
  endCall: "End call",
  cancelCall: "Cancel call",
  answer: "Answer",
  decline: "Decline",
  slideToAnswer: "slide to answer",
  answerCall: "Answer call",
  slideToAnswerHint: "Slide right to answer",
  dialPlaceholder: "Enter a number",
  numberField: "Phone number or SIP address",
  call: "Call",
  callNumber: (number) => `Call ${number}`,
  startCall: "Start call",
  deleteDigit: "Delete last digit",
  connectToCall: "Connect an account to make calls",
  dialPad: "Dial pad",
  inCallKeypad: "In-call keypad",
  sentDigits: (digits) => `Sent ${digits}`,
  star: "star",
  pound: "pound",
  longPressPlus: "Long press for plus",
  speedDialHint: (name) => `Long press to call ${name}`,
  suggestions: "Suggested contacts",
  moreSuggestions: (count) => `${count} more`,
  fewerSuggestions: "Show fewer",
  useContact: (name) => `Use ${name}`,
  transferTitle: "Transfer call",
  transferHint: "Send this call directly to another number.",
  destination: "Destination",
  destinationPlaceholder: "Extension or SIP address",
  transferring: "Transferring…",
  closeTransfer: "Close transfer",
  title: "Your phone",
  keypadTab: "Keypad",
  recentsTab: "Recents",
  audioHandledByDevice: "Audio handled by your device",
  audioHandledByBrowser: "Audio handled by your browser",
  connectAccountToCall: "Connect an account to make calls",
  poweredBy: "Powered by",
  audioSettings: "Audio settings",
  openAudioSettings: "Open audio settings",
  closeAudioSettings: "Close audio settings",
  movePhone: "Move phone",
  movePhoneHint: "Drag to move. Activate to reset its position.",
  resetPosition: "Reset position",
  minimizeCall: "Minimize call",
  lastCall: "Last call",
  simulatedAudio: "Simulated audio",
  microphoneMuted: "Microphone muted",
  yourMicrophone: "Your microphone",
  callAudio: "Call audio",
  callAudioWaveform: "Call audio waveform",
  waveform: "Waveform",
  voiceOrb: (state) => `Voice orb: ${state}`,
  voiceBars: (state) => `Voice bars: ${state}`,
  inConversation: "In conversation",
  connectingCall: "Connecting call",
  callingShort: "Calling",
  needsAttention: "Phone needs attention",
  enableCallAudio: "Enable call audio",
  openPhone: "Open phone",
  openCall: "Open call",
  collapsePhone: "Collapse phone",
  tapToAnswer: "Tap to answer",
  incomingCallFrom: (name) => `Incoming call from ${name}`,
  unknownCaller: "Unknown caller",
  muted: "Muted",
  dismissError: "Dismiss error",
  openSettings: "Open Settings",
  noRecents: "No recent calls",
  recentsEmpty: "Calls you make and receive appear here.",
  clear: "Clear",
  clearRecents: "Clear recent calls",
  missedCallFrom: (name) => `Missed call from ${name}`,
  callTo: (name) => `Call to ${name}`,
  callsBack: "Calls back",
  callContact: (name) => `Call ${name}`,
  microphone: "Microphone",
  output: "Output",
  callVolume: "Call volume",
  checkMicrophone: "Check microphone access",
  microphoneReady: "Microphone ready · test again",
  waitingForPermission: "Waiting for permission…",
  microphoneBlocked: "Access is turned off in system settings.",
  microphoneDenied: "Access was denied. You can allow it and try again.",
  microphoneGranted: "This app can use your microphone during calls.",
  microphoneUnknown: "The microphone is used only while you are on a call.",
  systemDefault: "System default",
  speakers: "Speakers",
  speakerRoutingHint:
    "Use the Speaker button during a call to switch between earpiece and loudspeaker.",
  webOutputHint: "Audio plays through your system's default output.",
  nativeOutputHint:
    "Audio follows the system route. Add an audio session adapter to enable the Speaker button.",
  nextCallNote: "Microphone changes apply to your next call.",
  username: "Username",
  usernamePlaceholder: "Your SIP username",
  password: "Password",
  passwordPlaceholder: "Enter your SIP password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  serverSettings: "Server & network settings",
  sipAddress: "SIP address",
  sipAddressHint:
    "The extension in this address can differ from your username.",
  websocketServer: "WebSocket server",
  iceServer: "STUN / TURN server (optional)",
  turnUsername: "TURN username",
  turnPassword: "TURN password",
  connectAccount: "Connect account",
  connectingAccount: "Connecting…",
  cancelConnection: "Cancel connection",
  credentialsNote: "Credentials stay in memory for this session.",
};

export const LabelsContext = createContext<PhoneLabels>(defaultPhoneLabels);

/** Labels of the nearest PhoneRoot, merged over English defaults. */
export function usePhoneLabels(): PhoneLabels {
  return useContext(LabelsContext);
}

/** Display text for a call end reason, translated through `labels.endReasons`. */
export function endReasonLabel(
  labels: PhoneLabels,
  reason: string | undefined,
): string {
  if (!reason) return labels.callEnded;
  return (
    labels.endReasons[reason] ??
    (reason === "Call ended" ? labels.callEnded : reason)
  );
}

/** Formats phone numbers for display (never for dialing). Identity by default. */
export type PhoneNumberFormatter = (number: string) => string;
export const NumberFormatContext = createContext<PhoneNumberFormatter>(
  (number) => number,
);

/** The number formatter of the nearest PhoneRoot. */
export function usePhoneNumberFormatter(): PhoneNumberFormatter {
  return useContext(NumberFormatContext);
}
