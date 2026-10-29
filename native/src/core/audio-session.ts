import type { AudioSessionAdapter } from "./media.ts";

/** The parts of react-native-incall-manager this adapter uses. */
export interface InCallManagerLike {
  start(options?: {
    media?: "audio" | "video";
    auto?: boolean;
    ringback?: string;
  }): void;
  stop(options?: { busytone?: string }): void;
  setForceSpeakerphoneOn(enabled: boolean | null): void;
  startRingtone?(
    ringtone: string,
    vibratePattern?: number[],
    iosCategory?: string,
    seconds?: number,
  ): void;
  stopRingtone?(): void;
}

export interface InCallManagerSessionOptions {
  /** Play the device's system ringtone for incoming calls. Defaults to false. */
  systemRingtone?: boolean;
}

/**
 * Bridge to react-native-incall-manager without making it a dependency:
 *
 * ```ts
 * import InCallManager from "react-native-incall-manager";
 * const audioSession = createInCallManagerAudioSession(InCallManager);
 * ```
 *
 * Enables earpiece/speaker routing, the proximity sensor, and keeps the screen awake.
 */
export function createInCallManagerAudioSession(
  manager: InCallManagerLike,
  { systemRingtone = false }: InCallManagerSessionOptions = {},
): AudioSessionAdapter {
  let mode: "ringing" | "call" | null = null;
  return {
    start(next) {
      if (next === "ringing") {
        if (systemRingtone && mode === null)
          manager.startRingtone?.("_DEFAULT_");
        mode = mode ?? "ringing";
        return;
      }
      if (mode === "ringing") manager.stopRingtone?.();
      if (mode !== "call") manager.start({ media: "audio" });
      mode = "call";
    },
    stop() {
      if (mode === "ringing") manager.stopRingtone?.();
      if (mode === "call") {
        manager.setForceSpeakerphoneOn(null);
        manager.stop();
      }
      mode = null;
    },
    setSpeaker(enabled) {
      manager.setForceSpeakerphoneOn(enabled);
    },
  };
}
