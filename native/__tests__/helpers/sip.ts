import { EventEmitter } from "events";
import type { MediaAdapter, RemoteAudioPlayer } from "../../src/core/media.ts";

/** Every UA constructed by the mocked JsSIP, newest last. */
export const uas: MockUA[] = [];

export class Track extends EventTarget {
  kind = "audio";
  enabled = true;
  readyState = "live";
  stop = jest.fn();
  _setVolume = jest.fn();
}

export class Stream {
  tracks: Track[];
  constructor(tracks?: Track[]) {
    this.tracks = tracks ?? [new Track()];
  }
  getTracks = () => this.tracks;
  getAudioTracks = () => this.tracks;
  addTrack = (track: Track) => {
    this.tracks.push(track);
  };
}

export class Peer extends EventTarget {
  iceConnectionState = "connected";
  senders: Array<{ track: Track; dtmf?: unknown }> = [{ track: new Track() }];
  stats: Array<Record<string, unknown>> = [];
  getReceivers = () => [];
  getSenders = () => this.senders;
  getStats = jest.fn(async () => ({
    forEach: (fn: (stat: Record<string, unknown>) => void) => this.stats.forEach(fn),
  }));
}

export class Session extends EventEmitter {
  direction = "outgoing";
  remote_identity = { uri: { user: "7003" }, display_name: "Alex" };
  connection: Peer | undefined = new Peer();
  isEnded = () => false;
  isEstablished = () => false;
  terminate = jest.fn(() => this.emit("ended", { cause: "Terminated" }));
  answer = jest.fn(() => this.emit("accepted"));
  mute = jest.fn(() => this.emit("muted"));
  unmute = jest.fn(() => this.emit("unmuted"));
  hold = jest.fn(() => {
    this.emit("hold", { originator: "local" });
    return true;
  });
  unhold = jest.fn(() => {
    this.emit("unhold", { originator: "local" });
    return true;
  });
  sendDTMF = jest.fn();
  refer = jest.fn();
}

export class MockUA extends EventEmitter {
  start = jest.fn();
  stop = jest.fn();
  register = jest.fn();
  registered = true;
  isRegistered = () => this.registered;
  call = jest.fn(() => {
    const session = new Session();
    this.emit("newRTCSession", { session });
    return session;
  });
  constructor(public config: Record<string, unknown>) {
    super();
    uas.push(this);
  }
}

export const jssipMock = {
  UA: MockUA,
  WebSocketInterface: class {
    constructor(public url: string) {}
  },
};

export const ua = (): MockUA => uas[uas.length - 1];

export function createPlayer(): RemoteAudioPlayer & { play: jest.Mock; setVolume: jest.Mock } {
  return {
    play: jest.fn(async () => {}),
    setVolume: jest.fn(),
    setOutputDevice: jest.fn(async () => {}),
    stop: jest.fn(),
    dispose: jest.fn(),
  };
}

export function createMedia(overrides: Partial<MediaAdapter> = {}) {
  const getUserMedia = jest.fn(async () => new Stream());
  const player = createPlayer();
  const media = {
    platform: "ios" as const,
    canSelectOutput: false,
    isSupported: () => true,
    prepare: jest.fn(),
    requestMicrophonePermission: jest.fn(async () => "granted" as const),
    getUserMedia,
    createStream: (tracks: unknown[]) => new Stream(tracks as Track[]),
    createPlayer: () => player,
    openSettings: jest.fn(async () => {}),
    ...overrides,
  } as unknown as MediaAdapter & {
    getUserMedia: jest.Mock;
    requestMicrophonePermission: jest.Mock;
    prepare: jest.Mock;
    openSettings: jest.Mock;
  };
  return { media, getUserMedia: media.getUserMedia as jest.Mock, player };
}

export const silent = { impact: jest.fn(), startRinging: jest.fn(), stopRinging: jest.fn() };

export const config = {
  websocketUrl: "wss://voice.example.com/ws",
  uri: "sip:1001@voice.example.com",
  authorizationUsername: "auth-user",
  password: "test-only",
  registrationTimeoutMs: 20000,
};

/** Flush pending promise callbacks without relying on timers. */
export async function flush(times = 5): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}
