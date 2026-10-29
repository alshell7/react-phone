import type { PhoneToneOptions } from "./tones.ts";
import type {
  AudioSessionAdapter,
  HapticsAdapter,
  MediaAdapter,
  PhoneMediaStream,
} from "./media.ts";

/** A STUN/TURN server. Mirrors the WebRTC RTCIceServer dictionary. */
export interface PhoneIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/** SIP credentials and transport options. Keep this object in memory; never persist it. */
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
  iceServers?: PhoneIceServer[];
  iceTransportPolicy?: "all" | "relay";
  registrationTimeoutMs?: number;
  callTimeoutSeconds?: number;
  maxReconnectAttempts?: number;
  /**
   * RFC2833 (default) sends in-band telephone events. Platforms without an RTP DTMF
   * sender (react-native-webrtc) automatically fall back to SIP INFO.
   */
  dtmfTransport?: "INFO" | "RFC2833";
  /** Extra getUserMedia audio constraints (echoCancellation, noiseSuppression, …). */
  audioConstraints?: Record<string, unknown>;
}

/** Transport and registration status are intentionally distinct from call state. */
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "registered"
  | "reconnecting"
  | "error";
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
/** `blocked` means the OS will not show a prompt again; the user must open Settings. */
export type MicrophoneStatus =
  | "unknown"
  | "requesting"
  | "granted"
  | "denied"
  | "blocked"
  | "unavailable";

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
  /** Loudspeaker routing. Requires an AudioSessionAdapter that supports it. */
  speaker: boolean;
  remoteHeld: boolean;
  transferPending: boolean;
  error: PhoneError | null;
  /** Web only: the browser blocked autoplay of call audio until a user gesture. */
  playbackBlocked: boolean;
  volume: number;
  inputDeviceId: string;
  outputDeviceId: string;
  localStream: PhoneMediaStream | null;
  remoteStream: PhoneMediaStream | null;
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
  | "speaker"
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
  /** Defaults to react-native-webrtc on iOS/Android and the browser on the web. */
  media?: MediaAdapter;
  /** Speaker/earpiece routing and call audio session (for example InCallManager). */
  audioSession?: AudioSessionAdapter;
  /** Defaults to React Native Vibration on iOS/Android and navigator.vibrate on the web. */
  haptics?: HapticsAdapter;
}
