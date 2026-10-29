/**
 * Platform boundaries. The core never touches a browser or native module directly;
 * it talks to these adapters so the same client runs on iOS, Android, and the web.
 */

/** The subset of MediaStreamTrack the phone uses. */
export interface PhoneMediaTrack {
  readonly kind: string;
  readonly id?: string;
  readonly readyState?: string;
  enabled: boolean;
  stop(): void;
  addEventListener?(
    type: "ended",
    listener: () => void,
    options?: unknown,
  ): void;
  removeEventListener?(type: "ended", listener: () => void): void;
  /** react-native-webrtc: playback gain for a remote audio track (0–10). */
  _setVolume?(volume: number): void;
}

/** The subset of MediaStream the phone uses. */
export interface PhoneMediaStream {
  readonly id?: string;
  getTracks(): PhoneMediaTrack[];
  getAudioTracks(): PhoneMediaTrack[];
  addTrack?(track: PhoneMediaTrack): void;
  /** react-native-webrtc: a URL usable by RTCView. */
  toURL?(): string;
}

export interface PhoneMediaDevice {
  deviceId: string;
  kind: "audioinput" | "audiooutput" | string;
  label: string;
}

/** Remote call audio. Native WebRTC plays remote tracks automatically. */
export interface RemoteAudioPlayer {
  play(
    stream: PhoneMediaStream,
    volume: number,
    outputDeviceId: string,
  ): Promise<void>;
  setVolume(volume: number): void;
  setOutputDevice(id: string): Promise<void>;
  stop(): void;
  dispose(): void;
}

export type PermissionResult = "granted" | "denied" | "blocked";

export interface MediaAdapter {
  readonly platform: "ios" | "android" | "web" | "custom";
  /** False when WebRTC is unavailable (no native module, insecure web origin, …). */
  isSupported(): boolean;
  /** Install the WebRTC globals JsSIP expects (react-native-webrtc's registerGlobals). */
  prepare(): void;
  /** Ask the OS for microphone access before capture. Optional on platforms that prompt in getUserMedia. */
  requestMicrophonePermission?(): Promise<PermissionResult>;
  getUserMedia(constraints: {
    audio: boolean | Record<string, unknown>;
    video: false;
  }): Promise<PhoneMediaStream>;
  createStream(tracks: PhoneMediaTrack[]): PhoneMediaStream;
  createPlayer(): RemoteAudioPlayer;
  enumerateDevices?(): Promise<PhoneMediaDevice[]>;
  onDeviceChange?(listener: () => void): () => void;
  /** Speaker selection by device ID (web setSinkId). */
  readonly canSelectOutput: boolean;
  /** Initial call volume (0–1). Defaults to 0.8. */
  readonly defaultVolume?: number;
  /** Open the app's system settings so a blocked permission can be re-enabled. */
  openSettings?(): Promise<void>;
}

/**
 * Call audio routing. Wire this to InCallManager, CallKit/ConnectionService, or your
 * own native module. Every method is optional and failures never interrupt a call.
 */
export interface AudioSessionAdapter {
  /** Called when a call starts ringing (`ringing`) and when media starts (`call`). */
  start?(mode: "ringing" | "call"): void;
  /** Called once the call has fully ended. */
  stop?(): void;
  /** Present only when loudspeaker routing is supported. */
  setSpeaker?(enabled: boolean): void | Promise<void>;
}

/** Tactile feedback. */
export interface HapticsAdapter {
  /** A short tick for keypad presses and call milestones. */
  impact(kind: "light" | "medium" | "heavy"): void;
  /** Repeating ring vibration for an incoming call. */
  startRinging(): void;
  stopRinging(): void;
}

/** Translate platform exceptions without leaking implementation or device details. */
export function microphoneMessage(
  error: unknown,
  platform: MediaAdapter["platform"] = "web",
): string {
  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  const settings =
    platform === "ios"
      ? "Open Settings, choose this app, and turn on Microphone."
      : platform === "android"
        ? "Open Settings → Apps → this app → Permissions, and allow Microphone."
        : "Allow the microphone in your browser’s site settings.";
  if (name === "BlockedError")
    return `Microphone access is turned off for this app. ${settings}`;
  if (
    name === "NotAllowedError" ||
    name === "SecurityError" ||
    name === "PermissionDeniedError"
  )
    return `Microphone access was denied. ${settings} Then try again.`;
  if (name === "NotFoundError")
    return "No microphone found. Connect a microphone, then try again.";
  if (name === "NotReadableError" || name === "AbortError")
    return "The microphone is busy or disconnected. Close other apps using it, then try again.";
  if (name === "OverconstrainedError")
    return "The selected microphone is unavailable. Choose the default microphone and try again.";
  if (name === "TimeoutError")
    return "Microphone permission is still pending. Respond to the permission prompt, then try again.";
  return "Could not access the microphone. Check app permissions and your audio device.";
}

/** Stop only streams acquired by this phone, never host-owned media. */
export function stopStream(stream: PhoneMediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      /* Already stopped. */
    }
  });
}

/** Named errors that survive transpilation (DOMException is not available on React Native). */
export function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

export const silentHaptics: HapticsAdapter = {
  impact() {},
  startRinging() {},
  stopRinging() {},
};
