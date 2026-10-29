/** Browser defaults, used by react-native-web. This file must not import react-native. */
import type {
  HapticsAdapter,
  MediaAdapter,
  PhoneMediaDevice,
  PhoneMediaStream,
  PhoneMediaTrack,
  RemoteAudioPlayer,
} from "../core/media.ts";

type WebGlobals = {
  window?: { isSecureContext?: boolean; RTCPeerConnection?: unknown };
  navigator?: {
    mediaDevices?: {
      getUserMedia?: (c: unknown) => Promise<PhoneMediaStream>;
      enumerateDevices?: () => Promise<PhoneMediaDevice[]>;
      addEventListener?: (type: string, fn: () => void) => void;
      removeEventListener?: (type: string, fn: () => void) => void;
    };
    vibrate?: (pattern: number | number[]) => boolean;
  };
  MediaStream?: new (tracks?: PhoneMediaTrack[]) => PhoneMediaStream;
  Audio?: new () => WebAudioElement;
  HTMLMediaElement?: { prototype: object };
};
interface WebAudioElement {
  autoplay: boolean;
  volume: number;
  srcObject: unknown;
  play(): Promise<void>;
  pause(): void;
  setSinkId?(id: string): Promise<void>;
}

const web = globalThis as unknown as WebGlobals;

class WebAudioPlayer implements RemoteAudioPlayer {
  private element: WebAudioElement | null = null;
  private create(): WebAudioElement | null {
    if (!web.Audio) return null;
    this.element ??= new web.Audio();
    this.element.autoplay = true;
    return this.element;
  }
  async play(
    stream: PhoneMediaStream,
    volume: number,
    sinkId: string,
  ): Promise<void> {
    const element = this.create();
    if (!element) return;
    element.volume = volume;
    element.srcObject = stream;
    if (sinkId && element.setSinkId) await element.setSinkId(sinkId);
    await element.play();
  }
  setVolume(volume: number): void {
    if (this.element) this.element.volume = volume;
  }
  async setOutputDevice(id: string): Promise<void> {
    const element = this.create();
    if (!element?.setSinkId) {
      if (id)
        throw new Error(
          "Audio output selection is not supported by this browser.",
        );
      return;
    }
    await element.setSinkId(id);
  }
  stop(): void {
    if (this.element) {
      this.element.pause();
      this.element.srcObject = null;
    }
  }
  dispose(): void {
    this.stop();
    this.element = null;
  }
}

export function createWebMediaAdapter(): MediaAdapter {
  return {
    platform: "web",
    canSelectOutput:
      !!web.HTMLMediaElement && "setSinkId" in web.HTMLMediaElement.prototype,
    isSupported: () =>
      !!web.window?.isSecureContext &&
      !!web.window.RTCPeerConnection &&
      !!web.navigator?.mediaDevices?.getUserMedia,
    prepare() {},
    getUserMedia: (constraints) => {
      const getUserMedia = web.navigator?.mediaDevices?.getUserMedia;
      if (!getUserMedia) return Promise.reject(new Error("Unsupported"));
      return getUserMedia.call(web.navigator!.mediaDevices, constraints);
    },
    createStream: (tracks) =>
      web.MediaStream
        ? new web.MediaStream(tracks)
        : {
            getTracks: () => tracks,
            getAudioTracks: () => tracks.filter((t) => t.kind === "audio"),
          },
    createPlayer: () => new WebAudioPlayer(),
    enumerateDevices: async () =>
      (await web.navigator?.mediaDevices?.enumerateDevices?.()) ?? [],
    onDeviceChange(listener) {
      const devices = web.navigator?.mediaDevices;
      devices?.addEventListener?.("devicechange", listener);
      return () => devices?.removeEventListener?.("devicechange", listener);
    },
  };
}

export function createWebHaptics(): HapticsAdapter {
  let ringing: ReturnType<typeof setInterval> | undefined;
  const vibrate = (pattern: number | number[]) => {
    try {
      web.navigator?.vibrate?.(pattern);
    } catch {
      /* Optional platform affordance. */
    }
  };
  return {
    impact: (kind) =>
      vibrate(kind === "light" ? 8 : kind === "medium" ? 14 : 24),
    startRinging() {
      clearInterval(ringing);
      vibrate([600, 400, 600]);
      ringing = setInterval(() => vibrate([600, 400, 600]), 2500);
    },
    stopRinging() {
      clearInterval(ringing);
      ringing = undefined;
      vibrate(0);
    },
  };
}
