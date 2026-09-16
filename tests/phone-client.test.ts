import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhoneClient } from "../src/core/phone-client.ts";
import { PhoneAudio } from "../src/core/media.ts";

const mocks = vi.hoisted(() => ({
  uas: [] as unknown[],
  getUserMedia: vi.fn(),
}));
class Track extends EventTarget {
  kind = "audio";
  stop = vi.fn();
}
class Stream {
  tracks = [new Track()];
  getTracks = () => this.tracks;
  getAudioTracks = () => this.tracks;
}
class Session extends EventEmitter {
  direction = "outgoing";
  remote_identity = { uri: { user: "7003" }, display_name: "Alex" };
  connection = undefined;
  isEnded = () => false;
  terminate = vi.fn(() => this.emit("ended", { cause: "Terminated" }));
  answer = vi.fn(() => this.emit("accepted"));
  mute = vi.fn(() => this.emit("muted"));
  unmute = vi.fn(() => this.emit("unmuted"));
  hold = vi.fn(() => {
    this.emit("hold", { originator: "local" });
    return true;
  });
  unhold = vi.fn(() => {
    this.emit("unhold", { originator: "local" });
    return true;
  });
  sendDTMF = vi.fn();
  refer = vi.fn();
}
class MockUA extends EventEmitter {
  start = vi.fn();
  stop = vi.fn();
  register = vi.fn();
  call = vi.fn(() => {
    const session = new Session();
    this.emit("newRTCSession", { session });
    return session;
  });
  constructor(public config: unknown) {
    super();
    mocks.uas.push(this);
  }
}
vi.mock("jssip", () => ({
  UA: MockUA,
  WebSocketInterface: class {
    constructor(public url: string) {}
  },
}));
const config = {
  websocketUrl: "wss://voice.example.com/ws",
  uri: "sip:1001@voice.example.com",
  authorizationUsername: "auth-user",
  password: "test-only",
  registrationTimeoutMs: 20000,
};
let clients: PhoneClient[];
const make = (options: ConstructorParameters<typeof PhoneClient>[0] = {}) => {
  const client = new PhoneClient(options);
  clients.push(client);
  return client;
};
const ua = () => mocks.uas.at(-1) as MockUA;
async function registered(client: PhoneClient): Promise<void> {
  const connection = client.connect(config);
  await vi.waitFor(() => expect(ua()).toBeDefined());
  ua().emit("registered");
  await connection;
}
beforeEach(() => {
  clients = [];
  mocks.uas.length = 0;
  vi.stubGlobal("window", {
    isSecureContext: true,
    RTCPeerConnection: class {},
  });
  vi.stubGlobal("navigator", {
    mediaDevices: { getUserMedia: mocks.getUserMedia },
  });
  mocks.getUserMedia.mockReset().mockResolvedValue(new Stream());
});
afterEach(() => {
  clients.forEach((client) => client.dispose());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("PhoneClient lifecycle", () => {
  it("routes each call cue once and never resurrects ringing after a delayed audio unlock", async () => {
    const cue = vi.spyOn(PhoneAudio.prototype, "cue");
    const ring = vi.spyOn(PhoneAudio.prototype, "ring");
    let resume!: () => void;
    const unlock = vi
      .spyOn(PhoneAudio.prototype, "resumeTones")
      .mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resume = resolve;
          }),
      );
    try {
      const client = make({ preview: { enabled: true, answerDelayMs: 1 } });
      client.simulateIncoming();
      expect(ring).toHaveBeenCalledWith();
      const play = client.playAudio();
      client.hangup();
      const count = ring.mock.calls.length;
      resume();
      await play;
      expect(ring).toHaveBeenCalledTimes(count);
      await client.call("7003");
      await vi.waitFor(() =>
        expect(client.getSnapshot().status).toBe("active"),
      );
      client.sendDTMF("5");
      client.hangup();
      expect(ring).toHaveBeenCalledWith("outgoing");
      expect(ring).toHaveBeenCalledWith("ringing");
      expect(
        cue.mock.calls.filter(([event]) => event === "connected"),
      ).toHaveLength(1);
      expect(cue).toHaveBeenCalledWith("dtmf", "5");
      expect(
        cue.mock.calls.filter(([event]) => event === "disconnected"),
      ).toHaveLength(2);
    } finally {
      cue.mockRestore();
      ring.mockRestore();
      unlock.mockRestore();
    }
  });
  it("does not extend the reconnection deadline when the socket repeatedly drops", async () => {
    const client = make();
    await registered(client);
    vi.useFakeTimers();
    ua().emit("disconnected");
    await vi.advanceTimersByTimeAsync(15000);
    ua().emit("disconnected");
    await vi.advanceTimersByTimeAsync(6000);
    expect(client.getSnapshot().connection).toBe("error");
  });
  it("expires an ignored microphone prompt and disposes of a late-granted stream", async () => {
    const client = make();
    await registered(client);
    vi.useFakeTimers();
    let resolve!: (stream: Stream) => void;
    mocks.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const request = client.call("7003");
    const rejection = expect(request).rejects.toThrow("pending");
    await vi.advanceTimersByTimeAsync(30001);
    await rejection;
    expect(client.getSnapshot().status).toBe("ended");
    const late = new Stream();
    resolve(late);
    await vi.advanceTimersByTimeAsync(1);
    expect(late.tracks[0].stop).toHaveBeenCalled();
    expect(ua().call).not.toHaveBeenCalled();
  });
  it("terminates an active call if the captured microphone disconnects", async () => {
    const client = make();
    await registered(client);
    const stream = new Stream();
    mocks.getUserMedia.mockResolvedValue(stream);
    await client.call("7003");
    const session = ua().call.mock.results[0].value as Session;
    session.emit("accepted");
    stream.tracks[0].dispatchEvent(new Event("ended"));
    expect(client.getSnapshot().status).toBe("ended");
    expect(client.getSnapshot().error?.code).toBe("microphone");
    expect(session.terminate).toHaveBeenCalled();
  });
  it("keeps the call connected when transfer receives no final response", async () => {
    const client = make();
    await registered(client);
    await client.call("7003");
    const session = ua().call.mock.results[0].value as Session;
    session.emit("accepted");
    vi.useFakeTimers();
    client.transfer("7004");
    await vi.advanceTimersByTimeAsync(30001);
    expect(client.getSnapshot().status).toBe("active");
    expect(client.getSnapshot().transferPending).toBe(false);
    expect(client.getSnapshot().error?.code).toBe("transfer");
  });
  it("does not request the microphone on construction or registration", async () => {
    const client = make();
    await registered(client);
    expect(client.getSnapshot().connection).toBe("registered");
    expect(mocks.getUserMedia).not.toHaveBeenCalled();
    expect(ua().config).toMatchObject({
      authorization_user: "auth-user",
      uri: config.uri,
    });
  });
  it("reports authentication failure without leaking config or SIP messages", async () => {
    const onEvent = vi.fn();
    const client = make({ onEvent });
    const promise = client.connect(config);
    const rejection = expect(promise).rejects.toThrow(
      "Registration was rejected",
    );
    await vi.waitFor(() => expect(ua()).toBeDefined());
    ua().emit("registrationFailed", {
      response: { status_code: 403, body: config.password },
    });
    await rejection;
    expect(client.getSnapshot().connection).toBe("error");
    expect(JSON.stringify(onEvent.mock.calls)).not.toContain(config.password);
  });
  it("times out a silent server and stops its agent", async () => {
    vi.useFakeTimers();
    const client = make();
    const promise = client.connect(config);
    const rejection = expect(promise).rejects.toThrow("did not respond");
    await vi.advanceTimersByTimeAsync(21000);
    await rejection;
    expect(ua().stop).toHaveBeenCalled();
    expect(client.getSnapshot().connection).toBe("error");
  });
  it("stops retrying after the configured attempt limit", async () => {
    const client = make();
    await registered(client);
    ua().emit("connecting", { attempts: 6 });
    expect(client.getSnapshot().connection).toBe("error");
    expect(ua().stop).toHaveBeenCalled();
  });
  it("answers once, reports remote hold, and releases media exactly once on duplicate terminal events", async () => {
    const onAnswered = vi.fn();
    const onDisconnected = vi.fn();
    const client = make({ onAnswered, onDisconnected });
    await registered(client);
    const stream = new Stream();
    mocks.getUserMedia.mockResolvedValue(stream);
    await client.call("7003");
    const session = ua().call.mock.results[0].value as Session;
    session.emit("accepted");
    session.emit("accepted");
    expect(onAnswered).toHaveBeenCalledTimes(1);
    session.emit("hold", { originator: "remote" });
    expect(client.getSnapshot().remoteHeld).toBe(true);
    session.emit("ended", { cause: "BYE" });
    session.emit("failed", { cause: "BYE" });
    expect(onDisconnected).toHaveBeenCalledTimes(1);
    expect(stream.tracks[0].stop).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot().history).toHaveLength(1);
    expect(client.getSnapshot().localStream).toBeNull();
  });
  it("rejects double dialing while a microphone permission prompt is pending", async () => {
    const client = make();
    await registered(client);
    let resolve!: (stream: Stream) => void;
    mocks.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const first = client.call("7003");
    await expect(client.call("7004")).rejects.toThrow("already in progress");
    const stream = new Stream();
    resolve(stream);
    await first;
    expect(ua().call).toHaveBeenCalledTimes(1);
    expect(mocks.getUserMedia).toHaveBeenCalledTimes(1);
  });
  it("cancels dialing during a permission prompt and stops a late-granted stream", async () => {
    const client = make();
    await registered(client);
    let resolve!: (stream: Stream) => void;
    mocks.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const call = client.call("7003");
    client.hangup();
    const stream = new Stream();
    resolve(stream);
    await call;
    expect(stream.tracks[0].stop).toHaveBeenCalled();
    expect(ua().call).not.toHaveBeenCalled();
    expect(client.getSnapshot().status).toBe("ended");
  });
  it("handles microphone denial and permits a fresh retry", async () => {
    const client = make();
    await registered(client);
    mocks.getUserMedia.mockRejectedValueOnce(
      new DOMException("Denied", "NotAllowedError"),
    );
    await expect(client.call("7003")).rejects.toThrow("blocked");
    expect(client.getSnapshot().microphone).toBe("denied");
    expect(client.getSnapshot().status).toBe("ended");
    await client.call("7003");
    expect(ua().call).toHaveBeenCalledTimes(1);
  });
  it("does not revive an incoming call cancelled while its answer waits for permission", async () => {
    const client = make();
    await registered(client);
    const session = new Session();
    session.direction = "incoming";
    ua().emit("newRTCSession", { session });
    let resolve!: (stream: Stream) => void;
    mocks.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const answer = client.answer();
    session.emit("failed", { cause: "Canceled" });
    const stream = new Stream();
    resolve(stream);
    await answer;
    expect(session.answer).not.toHaveBeenCalled();
    expect(stream.tracks[0].stop).toHaveBeenCalled();
  });
  it("responds busy to a second incoming call without replacing the current caller", async () => {
    const client = make();
    await registered(client);
    const first = new Session();
    first.direction = "incoming";
    ua().emit("newRTCSession", { session: first });
    const id = client.getSnapshot().call?.id;
    const second = new Session();
    second.direction = "incoming";
    ua().emit("newRTCSession", { session: second });
    expect(second.terminate).toHaveBeenCalledWith({
      status_code: 486,
      reason_phrase: "Busy Here",
    });
    expect(client.getSnapshot().call?.id).toBe(id);
  });
  it("ends media on network loss and observes re-registration", async () => {
    const client = make();
    await registered(client);
    await client.call("7003");
    const stream = client.getSnapshot().localStream!;
    ua().emit("disconnected");
    expect(client.getSnapshot().connection).toBe("reconnecting");
    expect(stream.getTracks()[0].stop).toHaveBeenCalled();
    expect(client.getSnapshot().status).toBe("ended");
    ua().emit("registered");
    expect(client.getSnapshot().connection).toBe("registered");
  });
  it("preserves the call when transfer fails and ends it only on success NOTIFY", async () => {
    const client = make();
    await registered(client);
    await client.call("7003");
    const session = ua().call.mock.results[0].value as Session;
    session.emit("accepted");
    client.transfer("7004");
    expect(client.getSnapshot().transferPending).toBe(true);
    const options = (
      session.refer.mock.calls[0] as unknown as [
        string,
        { eventHandlers: { failed: () => void; accepted: () => void } },
      ]
    )[1];
    options.eventHandlers.failed();
    expect(client.getSnapshot().status).toBe("active");
    expect(session.terminate).not.toHaveBeenCalled();
    client.transfer("7004");
    const retry = (
      session.refer.mock.calls[1] as unknown as [
        string,
        { eventHandlers: { accepted: () => void } },
      ]
    )[1];
    retry.eventHandlers.accepted();
    expect(client.getSnapshot().call?.endReason).toBe("Transferred");
    expect(session.terminate).toHaveBeenCalled();
  });
  it("isolates host callback errors from cleanup and other callbacks", async () => {
    const disconnected = vi.fn();
    const client = make({
      onEvent: () => {
        throw new Error("host failure");
      },
      onDisconnected: disconnected,
    });
    await registered(client);
    await client.call("7003");
    client.hangup();
    expect(disconnected).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot().localStream).toBeNull();
  });
  it("preflight releases its microphone and keeps the phone idle", async () => {
    const client = make();
    await client.testMicrophone();
    const stream = (await mocks.getUserMedia.mock.results[0].value) as Stream;
    expect(stream.tracks[0].stop).toHaveBeenCalled();
    expect(client.getSnapshot().status).toBe("idle");
  });
  it("clamps playback volume and ignores NaN", () => {
    const client = make();
    client.setVolume(2);
    expect(client.getSnapshot().volume).toBe(1);
    client.setVolume(-1);
    expect(client.getSnapshot().volume).toBe(0);
    client.setVolume(NaN);
    expect(client.getSnapshot().volume).toBe(0);
  });
  it("provides network-free preview and survives StrictMode-style cleanup", async () => {
    vi.useFakeTimers();
    const client = make({ preview: { enabled: true } });
    client.dispose();
    client.startPreview();
    await client.call("7003");
    await vi.advanceTimersByTimeAsync(1800);
    expect(client.getSnapshot().status).toBe("active");
    client.setMuted(true);
    client.setHeld(true);
    expect(client.getSnapshot().status).toBe("held");
    client.hangup();
    expect(mocks.uas).toHaveLength(0);
    expect(mocks.getUserMedia).not.toHaveBeenCalled();
  });
});
