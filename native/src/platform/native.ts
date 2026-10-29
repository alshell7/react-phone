/** iOS/Android defaults backed by react-native-webrtc and React Native APIs. */
import { Linking, PermissionsAndroid, Platform, Vibration } from "react-native";
import type {
  HapticsAdapter,
  MediaAdapter,
  PermissionResult,
  PhoneMediaStream,
  RemoteAudioPlayer,
} from "../core/media.ts";

type WebRTC = typeof import("react-native-webrtc");
declare const require: (id: string) => unknown;

let webrtc: WebRTC | null | undefined;
let globalsRegistered = false;

/**
 * Loaded on first use so web bundles never execute native WebRTC, and so a missing
 * native module (for example Expo Go) becomes a clear "unsupported" error.
 */
function loadWebRTC(): WebRTC | null {
  if (webrtc !== undefined) return webrtc;
  try {
    webrtc = require("react-native-webrtc") as WebRTC;
  } catch {
    webrtc = null;
  }
  return webrtc;
}

function required(): WebRTC {
  const module = loadWebRTC();
  if (!module) throw new Error("react-native-webrtc is not available.");
  return module;
}

/** Native WebRTC renders remote audio itself; this only manages per-track gain. */
class NativeAudioPlayer implements RemoteAudioPlayer {
  private stream: PhoneMediaStream | null = null;
  private volume = 1;
  async play(stream: PhoneMediaStream, volume: number): Promise<void> {
    this.stream = stream;
    this.setVolume(volume);
  }
  setVolume(volume: number): void {
    this.volume = volume;
    this.stream?.getAudioTracks().forEach((track) => {
      try {
        track._setVolume?.(this.volume);
      } catch {
        /* Released tracks do not support gain. */
      }
    });
  }
  async setOutputDevice(id: string): Promise<void> {
    if (id) throw new Error("Use speaker routing on mobile devices.");
  }
  stop(): void {
    this.stream = null;
  }
  dispose(): void {
    this.stop();
  }
}

async function requestMicrophonePermission(): Promise<PermissionResult> {
  if (Platform.OS === "android") {
    const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    if (await PermissionsAndroid.check(permission)) return "granted";
    const result = await PermissionsAndroid.request(permission, {
      title: "Microphone access",
      message: "Calls need your microphone so the other person can hear you.",
      buttonPositive: "Allow",
      buttonNegative: "Not now",
    });
    if (result === PermissionsAndroid.RESULTS.GRANTED) return "granted";
    return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ? "blocked"
      : "denied";
  }
  try {
    // iOS shows its prompt once; afterwards only Settings can grant access.
    const state = await required().permissions.query({ name: "microphone" });
    return state === "denied" ? "blocked" : "granted";
  } catch {
    return "granted";
  }
}

export function createNativeMediaAdapter(): MediaAdapter {
  return {
    platform: Platform.OS === "android" ? "android" : "ios",
    canSelectOutput: false,
    defaultVolume: 1,
    isSupported: () =>
      typeof loadWebRTC()?.mediaDevices?.getUserMedia === "function",
    prepare() {
      if (globalsRegistered) return;
      required().registerGlobals();
      globalsRegistered = true;
    },
    requestMicrophonePermission,
    getUserMedia: (constraints) =>
      required().mediaDevices.getUserMedia(
        constraints as never,
      ) as unknown as Promise<PhoneMediaStream>,
    createStream: (tracks) =>
      new (required().MediaStream)(
        tracks as never,
      ) as unknown as PhoneMediaStream,
    createPlayer: () => new NativeAudioPlayer(),
    openSettings: () => Linking.openSettings(),
  };
}

export function createNativeHaptics(): HapticsAdapter {
  return {
    impact(kind) {
      // iOS ignores durations and always plays a long buzz; pass expo-haptics there.
      if (Platform.OS === "android")
        Vibration.vibrate(kind === "light" ? 10 : kind === "medium" ? 18 : 30);
    },
    startRinging: () => Vibration.vibrate([0, 700, 900], true),
    stopRinging: () => Vibration.cancel(),
  };
}
