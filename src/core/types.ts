import type { PhoneToneOptions } from "./tones.ts";
/** SIP credentials and browser transport options. Keep this object in memory. */
export interface SipConfig {
  /** Secure WebSocket endpoint, for example wss://pbx.example.com/ws. */
  websocketUrl: string;
  /** Address of record, for example sip:1001@pbx.example.com. */
  uri: string;
  /** Digest authentication identity; may differ from the URI user. */
  authorizationUsername?: string;
  password: string;
  displayName?: string;
  /** Optional registrar, for deployments with separate routing domains. */
  registrarServer?: string;
  /** Supply your own STUN/TURN configuration for your network. */
  iceServers?: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  registrationTimeoutMs?: number;
  callTimeoutSeconds?: number;
  maxReconnectAttempts?: number;
  dtmfTransport?: "INFO" | "RFC2833";
  audioConstraints?: MediaTrackConstraints;
}

/** Transport and registration status are intentionally distinct from call state. */
export type ConnectionStatus =
  "disconnected" | "connecting" | "registered" | "reconnecting" | "error";
/** Only one call is active per PhoneClient. Additional INVITEs receive 486 Busy. */
export type CallStatus =
  | "idle"
  | "requesting-microphone"
  | "dialing"
  | "ringing"
  | "incoming"
  | "answering"
  | "active"
  | "held"
  | "ended";
export type MicrophoneStatus =
  "unknown" | "requesting" | "granted" | "denied" | "unavailable";

/** Serializable caller data, safe to deliver to lifecycle callbacks. */
export interface Caller {
  number: string;
  name?: string;
  avatarUrl?: string;
  tags?: readonly string[];
}

/** Stable call identity and timestamps (milliseconds since Unix epoch). */
export interface CallInfo {
  id: string;
  direction: "incoming" | "outgoing";
  caller: Caller;
  startedAt: number;
  answeredAt?: number;
  endedAt?: number;
  endReason?: string;
}

/** Actionable error without SIP messages, passwords, or raw server responses. */
export interface PhoneError {
  code:
    | "configuration"
    | "connection"
    | "registration"
    | "microphone"
    | "call"
    | "transfer"
    | "audio"
    | "unsupported";
  message: string;
}

/** Immutable snapshot consumed by useSyncExternalStore. Treat nested values as read-only. */
export interface PhoneSnapshot {
  connection: ConnectionStatus;
  status: CallStatus;
  microphone: MicrophoneStatus;
  call: CallInfo | null;
  muted: boolean;
  remoteHeld: boolean;
  transferPending: boolean;
  error: PhoneError | null;
  playbackBlocked: boolean;
  volume: number;
  inputDeviceId: string;
  outputDeviceId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  history: readonly CallInfo[];
}

export type PhoneEventType =
  | "connection"
  | "incoming"
  | "outgoing"
  | "answered"
  | "disconnected"
  | "muted"
  | "held"
  | "dtmf"
  | "transfer-started"
  | "transferred"
  | "error";

/** No raw SIP requests or config objects are exposed. */
export interface PhoneEvent {
  type: PhoneEventType;
  timestamp: number;
  call: CallInfo | null;
  connection: ConnectionStatus;
  error?: PhoneError;
  value?: string | boolean;
}

/** `onAnswered` means the remote party accepted, or an incoming call was answered. */
export interface PhoneCallbacks {
  onEvent?: (event: PhoneEvent) => void;
  onIncomingCall?: (call: CallInfo) => void;
  onAnswered?: (call: CallInfo) => void;
  /** Exactly once per call, including rejected, failed, and cancelled calls. */
  onDisconnected?: (call: CallInfo) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onError?: (error: PhoneError) => void;
}

/** Development-only simulation; no network, microphone, or external calls. */
export interface PreviewOptions {
  enabled: true;
  answerDelayMs?: number;
}

/** Client construction options. The React provider can update callbacks later. */
export interface PhoneClientOptions extends PhoneCallbacks {
  preview?: PreviewOptions;
  historyLimit?: number;
  tones?: PhoneToneOptions | false;
}
