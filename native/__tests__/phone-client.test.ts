import { PhoneClient } from "../src/core/phone-client.ts";
import { PhoneAudio } from "../src/core/audio.ts";
import type { PhoneClientOptions } from "../src/core/types.ts";
import {
  Session,
  Stream,
  config,
  createMedia,
  flush,
  silent,
  ua,
  uas,
} from "./helpers/sip.ts";

jest.mock("jssip", () => require("./helpers/sip.ts").jssipMock);

let clients: PhoneClient[];
let media: ReturnType<typeof createMedia>;

function make(options: PhoneClientOptions = {}): PhoneClient {
  const client = new PhoneClient({ media: media.media, haptics: silent, ...options });
  clients.push(client);
  return client;
}

async function registered(client: PhoneClient): Promise<void> {
  const connection = client.connect(config);
  ua().emit("registered");
  await connection;
}

async function connectedCall(client: PhoneClient): Promise<Session> {
  await registered(client);
  await client.call("7003");
  const session = ua().call.mock.results[0].value as Session;
  session.emit("accepted");
  return session;
}

beforeEach(() => {
  clients = [];
  uas.length = 0;
  media = createMedia();
});
afterEach(() => {
  clients.forEach((client) => client.dispose());
  jest.useRealTimers();
});

describe("PhoneClient lifecycle", () => {
  it("routes each call cue once and never resurrects ringing after a delayed audio unlock", async () => {
    const cue = jest.spyOn(PhoneAudio.prototype, "cue");
    const ring = jest.spyOn(PhoneAudio.prototype, "ring");
    let resume!: () => void;
    const unlock = jest
      .spyOn(PhoneAudio.prototype, "resumeTones")
      .mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resume = resolve;
          }),
      );
    try {
      jest.useFakeTimers();
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
      await jest.advanceTimersByTimeAsync(5);
      expect(client.getSnapshot().status).toBe("active");
      client.sendDTMF("5");
      client.hangup();
      expect(ring).toHaveBeenCalledWith("outgoing");
      expect(ring).toHaveBeenCalledWith("ringing");
      expect(cue.mock.calls.filter(([event]) => event === "connected")).toHaveLength(1);
      expect(cue).toHaveBeenCalledWith("dtmf", "5");
      expect(cue.mock.calls.filter(([event]) => event === "disconnected")).toHaveLength(2);
    } finally {
      cue.mockRestore();
      ring.mockRestore();
      unlock.mockRestore();
    }
  });

  it("does not extend the reconnection deadline when the socket repeatedly drops", async () => {
    const client = make();
    await registered(client);
    jest.useFakeTimers();
    ua().emit("disconnected");
    await jest.advanceTimersByTimeAsync(15000);
    ua().emit("disconnected");
    await jest.advanceTimersByTimeAsync(6000);
    expect(client.getSnapshot().connection).toBe("error");
  });

  it("expires an ignored microphone prompt and disposes of a late-granted stream", async () => {
    const client = make();
    await registered(client);
    jest.useFakeTimers();
    let resolve!: (stream: Stream) => void;
    media.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const request = client.call("7003");
    const rejection = expect(request).rejects.toThrow("pending");
    await jest.advanceTimersByTimeAsync(30001);
    await rejection;
    expect(client.getSnapshot().status).toBe("ended");
    const late = new Stream();
    resolve(late);
    await jest.advanceTimersByTimeAsync(1);
    expect(late.tracks[0].stop).toHaveBeenCalled();
    expect(ua().call).not.toHaveBeenCalled();
  });

  it("terminates an active call if the captured microphone disconnects", async () => {
    const client = make();
    await registered(client);
    const stream = new Stream();
    media.getUserMedia.mockResolvedValue(stream);
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
    await connectedCall(client);
    jest.useFakeTimers();
    client.transfer("7004");
    await jest.advanceTimersByTimeAsync(30001);
    expect(client.getSnapshot().status).toBe("active");
    expect(client.getSnapshot().transferPending).toBe(false);
    expect(client.getSnapshot().error?.code).toBe("transfer");
  });

  it("does not request the microphone on construction or registration", async () => {
    const client = make();
    await registered(client);
    expect(client.getSnapshot().connection).toBe("registered");
    expect(media.getUserMedia).not.toHaveBeenCalled();
    expect(media.media.prepare).toHaveBeenCalledTimes(1);
    expect(ua().config).toMatchObject({
      authorization_user: "auth-user",
      uri: config.uri,
    });
  });

  it("reports authentication failure without leaking config or SIP messages", async () => {
    const onEvent = jest.fn();
    const client = make({ onEvent });
    const promise = client.connect(config);
    const rejection = expect(promise).rejects.toThrow("Registration was rejected");
    ua().emit("registrationFailed", {
      response: { status_code: 403, body: config.password },
    });
    await rejection;
    expect(client.getSnapshot().connection).toBe("error");
    expect(JSON.stringify(onEvent.mock.calls)).not.toContain(config.password);
  });

  it("times out a silent server and stops its agent", async () => {
    jest.useFakeTimers();
    const client = make();
    const promise = client.connect(config);
    const rejection = expect(promise).rejects.toThrow("did not respond");
    await jest.advanceTimersByTimeAsync(21000);
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
    const onAnswered = jest.fn();
    const onDisconnected = jest.fn();
    const client = make({ onAnswered, onDisconnected });
    await registered(client);
    const stream = new Stream();
    media.getUserMedia.mockResolvedValue(stream);
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
    media.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const first = client.call("7003");
    await expect(client.call("7004")).rejects.toThrow("already in progress");
    resolve(new Stream());
    await first;
    expect(ua().call).toHaveBeenCalledTimes(1);
    expect(media.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("cancels dialing during a permission prompt and stops a late-granted stream", async () => {
    const client = make();
    await registered(client);
    let resolve!: (stream: Stream) => void;
    media.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const call = client.call("7003");
    await flush();
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
    const denied = new Error("Denied");
    denied.name = "NotAllowedError";
    media.getUserMedia.mockRejectedValueOnce(denied);
    await expect(client.call("7003")).rejects.toThrow("denied");
    expect(client.getSnapshot().microphone).toBe("denied");
    expect(client.getSnapshot().status).toBe("ended");
    await client.call("7003");
    expect(ua().call).toHaveBeenCalledTimes(1);
  });

  it("maps a permanently blocked permission to Settings guidance without capturing", async () => {
    const client = make();
    await registered(client);
    media.media.requestMicrophonePermission = jest.fn(async () => "blocked" as const);
    await expect(client.call("7003")).rejects.toThrow("turned off");
    expect(client.getSnapshot().microphone).toBe("blocked");
    expect(client.getSnapshot().error?.message).toContain("Open Settings");
    expect(media.getUserMedia).not.toHaveBeenCalled();
    await client.openSettings();
    expect(media.media.openSettings).toHaveBeenCalled();
    expect(client.capabilities.settings).toBe(true);
  });

  it("maps a denied Android prompt to a retryable denial", async () => {
    media = createMedia({ platform: "android" });
    const client = make();
    await registered(client);
    media.media.requestMicrophonePermission = jest.fn(async () => "denied" as const);
    await expect(client.call("7003")).rejects.toThrow("Permissions");
    expect(client.getSnapshot().microphone).toBe("denied");
  });

  it("does not revive an incoming call cancelled while its answer waits for permission", async () => {
    const client = make();
    await registered(client);
    const session = new Session();
    session.direction = "incoming";
    ua().emit("newRTCSession", { session });
    let resolve!: (stream: Stream) => void;
    media.getUserMedia.mockReturnValue(
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
    expect(client.getSnapshot().call?.caller).toEqual({ number: "7003", name: "Alex" });
  });

  it("declines an unanswered incoming call with 486 and ends an established call with BYE", async () => {
    const client = make();
    await registered(client);
    const incoming = new Session();
    incoming.direction = "incoming";
    ua().emit("newRTCSession", { session: incoming });
    client.hangup();
    expect(incoming.terminate).toHaveBeenCalledWith({ status_code: 486, reason_phrase: "Busy Here" });
    expect(client.getSnapshot().call?.endReason).toBe("Declined");
    await client.call("7003");
    const outgoing = ua().call.mock.results[0].value as Session;
    outgoing.emit("accepted");
    outgoing.isEstablished = () => true;
    client.hangup();
    expect(outgoing.terminate).toHaveBeenCalledWith(undefined);
    expect(client.getSnapshot().call?.endReason).toBe("Call ended");
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
    const session = await connectedCall(client);
    client.transfer("7004");
    expect(client.getSnapshot().transferPending).toBe(true);
    const options = (
      session.refer.mock.calls[0] as unknown as [
        string,
        { eventHandlers: { failed: () => void; accepted: () => void } },
      ]
    )[1];
    expect(session.refer.mock.calls[0][0]).toBe("sip:7004@voice.example.com");
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

  it("never follows a remote REFER", async () => {
    const client = make();
    const session = await connectedCall(client);
    const reject = jest.fn();
    session.emit("refer", { reject, accept: jest.fn() });
    expect(reject).toHaveBeenCalled();
  });

  it("isolates host callback errors from cleanup and other callbacks", async () => {
    const disconnected = jest.fn();
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
    const stream = (await media.getUserMedia.mock.results[0].value) as Stream;
    expect(stream.tracks[0].stop).toHaveBeenCalled();
    expect(client.getSnapshot().status).toBe("idle");
    expect(client.getSnapshot().microphone).toBe("granted");
  });

  it("clamps playback volume, ignores NaN, and applies gain to remote audio", async () => {
    const client = make();
    expect(client.getSnapshot().volume).toBe(0.8);
    client.setVolume(2);
    expect(client.getSnapshot().volume).toBe(1);
    client.setVolume(-1);
    expect(client.getSnapshot().volume).toBe(0);
    client.setVolume(NaN);
    expect(client.getSnapshot().volume).toBe(0);
    const native = createMedia({ defaultVolume: 1 } as never);
    expect(new PhoneClient({ media: native.media, haptics: silent }).getSnapshot().volume).toBe(1);
  });

  it("plays remote tracks through the platform player", async () => {
    const client = make();
    const session = await connectedCall(client);
    const remote = new Stream();
    session.connection!.dispatchEvent(
      Object.assign(new Event("track"), { track: remote.tracks[0], streams: [remote] }),
    );
    await flush();
    expect(client.getSnapshot().remoteStream).toBe(remote);
    expect(media.player.play).toHaveBeenCalledWith(remote, 0.8, "");
  });

  it("ends the call when ICE fails and after a sustained disconnect", async () => {
    const client = make();
    const session = await connectedCall(client);
    session.connection!.iceConnectionState = "failed";
    session.connection!.dispatchEvent(new Event("iceconnectionstatechange"));
    expect(client.getSnapshot().status).toBe("ended");
    expect(client.getSnapshot().error?.message).toContain("STUN/TURN");

    jest.useFakeTimers();
    await client.call("7003");
    const second = ua().call.mock.results[1].value as Session;
    second.emit("accepted");
    second.connection!.iceConnectionState = "disconnected";
    second.connection!.dispatchEvent(new Event("iceconnectionstatechange"));
    await jest.advanceTimersByTimeAsync(9000);
    expect(client.getSnapshot().status).toBe("active");
    await jest.advanceTimersByTimeAsync(1500);
    expect(client.getSnapshot().call?.endReason).toBe("Audio connection lost");
  });

  it("provides network-free preview and survives StrictMode-style cleanup", async () => {
    jest.useFakeTimers();
    const client = make({ preview: { enabled: true } });
    client.dispose();
    client.startPreview();
    await client.call("7003");
    await jest.advanceTimersByTimeAsync(1800);
    expect(client.getSnapshot().status).toBe("active");
    client.setMuted(true);
    client.setHeld(true);
    client.setSpeaker(true);
    expect(client.getSnapshot()).toMatchObject({ status: "held", muted: true, speaker: true });
    client.hangup();
    expect(client.getSnapshot().speaker).toBe(false);
    expect(uas).toHaveLength(0);
    expect(media.getUserMedia).not.toHaveBeenCalled();
  });

  it("rejects simulation outside preview mode", () => {
    expect(() => make().simulateIncoming()).toThrow("preview");
  });
});

describe("native platform behaviour", () => {
  it("explains a missing WebRTC module instead of connecting", async () => {
    media = createMedia({ isSupported: () => false });
    const client = make();
    await expect(client.connect(config)).rejects.toThrow("react-native-webrtc");
    expect(uas).toHaveLength(0);
    expect(client.getSnapshot().error?.code).toBe("unsupported");
  });

  it("falls back to SIP INFO when the platform has no RTP DTMF sender", async () => {
    const client = make();
    const session = await connectedCall(client);
    client.sendDTMF("5");
    expect(session.sendDTMF).toHaveBeenLastCalledWith("5", { transportType: "INFO" });
    session.connection!.senders[0].dtmf = { insertDTMF: jest.fn() };
    client.sendDTMF("#");
    expect(session.sendDTMF).toHaveBeenLastCalledWith("#", { transportType: "RFC2833" });
    expect(() => client.sendDTMF("55")).toThrow("single keypad digit");
  });

  it("honours an explicit INFO transport", async () => {
    const client = make();
    const connection = client.connect({ ...config, dtmfTransport: "INFO" });
    ua().emit("registered");
    await connection;
    await client.call("7003");
    const session = ua().call.mock.results[0].value as Session;
    session.emit("accepted");
    session.connection!.senders[0].dtmf = {};
    client.sendDTMF("1");
    expect(session.sendDTMF).toHaveBeenLastCalledWith("1", { transportType: "INFO" });
  });

  it("drives the audio session through ringing, call, speaker, and teardown", async () => {
    const audioSession = { start: jest.fn(), stop: jest.fn(), setSpeaker: jest.fn() };
    const onEvent = jest.fn();
    const client = make({ audioSession, onEvent });
    expect(client.capabilities.speaker).toBe(true);
    await registered(client);
    const incoming = new Session();
    incoming.direction = "incoming";
    ua().emit("newRTCSession", { session: incoming });
    expect(audioSession.start).toHaveBeenLastCalledWith("ringing");
    client.setSpeaker(true);
    expect(audioSession.setSpeaker).not.toHaveBeenCalled();
    await client.answer();
    expect(audioSession.start).toHaveBeenLastCalledWith("call");
    client.setSpeaker(true);
    expect(audioSession.setSpeaker).toHaveBeenCalledWith(true);
    expect(client.getSnapshot().speaker).toBe(true);
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "speaker", value: true }));
    client.hangup();
    expect(audioSession.stop).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot().speaker).toBe(false);
  });

  it("reports speaker routing as unavailable without an adapter", async () => {
    const client = make();
    expect(client.capabilities.speaker).toBe(false);
    await connectedCall(client);
    expect(() => client.setSpeaker(true)).toThrow("not configured");
    expect(client.getSnapshot().speaker).toBe(false);
  });

  it("survives a throwing audio session adapter", async () => {
    const audioSession = {
      start: jest.fn(() => {
        throw new Error("native failure");
      }),
      stop: jest.fn(() => Promise.reject(new Error("late failure"))),
    };
    const client = make({ audioSession });
    await connectedCall(client);
    expect(client.getSnapshot().status).toBe("active");
    client.hangup();
    expect(client.getSnapshot().status).toBe("ended");
  });

  it("reads normalized audio levels from WebRTC statistics", async () => {
    const client = make();
    expect(await client.getAudioLevels()).toEqual({ input: 0, output: 0 });
    const session = await connectedCall(client);
    const peer = session.connection!;
    peer.stats = [
      { type: "inbound-rtp", kind: "audio", audioLevel: 0.1 },
      { type: "media-source", kind: "audio", audioLevel: 0.001 },
      { type: "inbound-rtp", kind: "video", audioLevel: 1 },
    ];
    const levels = await client.getAudioLevels();
    expect(levels.output).toBeCloseTo(0.75, 1);
    expect(levels.input).toBe(0);
    // Energy deltas take precedence when available (RMS of the interval).
    peer.stats = [{ type: "inbound-rtp", kind: "audio", totalAudioEnergy: 0, totalSamplesDuration: 1 }];
    await client.getAudioLevels();
    peer.stats = [{ type: "inbound-rtp", kind: "audio", totalAudioEnergy: 0.0001, totalSamplesDuration: 1.1 }];
    // RMS sqrt(0.0001 / 0.1) ≈ 0.0316 is −30 dBFS, the midpoint of the −50…−10 dB range.
    expect((await client.getAudioLevels()).output).toBeCloseTo(0.5, 2);
    client.setMuted(true);
    peer.stats = [{ type: "media-source", kind: "audio", audioLevel: 0.5 }];
    expect((await client.getAudioLevels()).input).toBe(0);
  });

  it("re-registers on foreground only when the registration lapsed", async () => {
    const client = make();
    await registered(client);
    client.refreshRegistration();
    expect(ua().register).not.toHaveBeenCalled();
    ua().registered = false;
    client.refreshRegistration();
    expect(client.getSnapshot().connection).toBe("reconnecting");
    expect(ua().register).toHaveBeenCalledTimes(1);
    ua().emit("registered");
    expect(client.getSnapshot().connection).toBe("registered");
  });

  it("keeps a bounded history of completed calls", async () => {
    jest.useFakeTimers();
    const client = make({ preview: { enabled: true, answerDelayMs: 1 }, historyLimit: 2 });
    for (const number of ["7001", "7002", "7003"]) {
      await client.call(number);
      client.hangup();
    }
    expect(client.getSnapshot().history.map((call) => call.caller.number)).toEqual(["7003", "7002"]);
    client.clearHistory();
    expect(client.getSnapshot().history).toHaveLength(0);
  });
});

describe("end reasons", () => {
  it.each([
    ["outgoing", "BYE", "Call ended", false],
    ["outgoing", "Busy", "Busy", true],
    ["outgoing", "Rejected", "Declined by recipient", false],
    ["outgoing", "Not Found", "Number not found", true],
    ["incoming", "Canceled", "Missed call", false],
    ["outgoing", "Something New", "Call ended", true],
  ])("maps a %s call ending with %p to %p", async (direction, cause, reason, errors) => {
    const client = make();
    await registered(client);
    let session: Session;
    if (direction === "incoming") {
      session = new Session();
      session.direction = "incoming";
      ua().emit("newRTCSession", { session });
    } else {
      await client.call("7003");
      session = ua().call.mock.results[0].value as Session;
    }
    // A BYE only arrives after the call was answered.
    if (cause === "BYE") session.emit("accepted");
    session.emit(cause === "BYE" ? "ended" : "failed", { cause });
    expect(client.getSnapshot().call?.endReason).toBe(reason);
    expect(Boolean(client.getSnapshot().error)).toBe(errors);
    if (errors) expect(client.getSnapshot().error?.message).toContain(reason);
  });
});

describe("hold negotiation", () => {
  it("retries Resume while the hold re-INVITE is still in flight", async () => {
    const client = make();
    const session = await connectedCall(client);
    jest.useFakeTimers();
    client.setHeld(true);
    expect(client.getSnapshot().status).toBe("held");
    let ready = false;
    session.unhold.mockImplementation(() => {
      if (!ready) return false;
      session.emit("unhold", { originator: "local" });
      return true;
    });
    client.setHeld(false);
    expect(client.getSnapshot().status).toBe("held");
    expect(client.getSnapshot().error).toBeNull();
    ready = true;
    await jest.advanceTimersByTimeAsync(300);
    expect(client.getSnapshot().status).toBe("active");
    expect(client.getSnapshot().error).toBeNull();
  });

  it("explains when hold cannot be applied after negotiation stalls", async () => {
    const client = make();
    const session = await connectedCall(client);
    jest.useFakeTimers();
    session.hold.mockImplementation(() => false);
    client.setHeld(true);
    await jest.advanceTimersByTimeAsync(6500);
    expect(client.getSnapshot().status).toBe("active");
    expect(client.getSnapshot().error?.message).toContain("Hold is temporarily unavailable");
  });

  it("stops retrying when the call ends", async () => {
    const client = make();
    const session = await connectedCall(client);
    jest.useFakeTimers();
    session.hold.mockImplementation(() => false);
    client.setHeld(true);
    client.hangup();
    await jest.advanceTimersByTimeAsync(7000);
    expect(client.getSnapshot().error).toBeNull();
    expect(session.hold.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
