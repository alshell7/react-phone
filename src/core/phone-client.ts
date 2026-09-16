import type { UA, RTCSessionEvent } from "jssip/lib/UA.js";
import type { RTCSession } from "jssip/lib/RTCSession.js";
import type { DTMF_TRANSPORT } from "jssip/lib/Constants.js";
import { PhoneAudio, microphoneMessage, stopStream } from "./media.ts";
import { normalizeTarget, validateConfig } from "./validation.ts";
import type { PhoneToneOptions, PhoneToneEvent } from "./tones.ts";
import type {
  Caller,
  CallInfo,
  ConnectionStatus,
  PhoneCallbacks,
  PhoneClientOptions,
  PhoneError,
  PhoneEvent,
  PhoneEventType,
  PhoneSnapshot,
  SipConfig,
} from "./types.ts";

const initialSnapshot: PhoneSnapshot = {
  connection: "disconnected",
  status: "idle",
  microphone: "unknown",
  call: null,
  muted: false,
  remoteHeld: false,
  transferPending: false,
  error: null,
  playbackBlocked: false,
  volume: 0.8,
  inputDeviceId: "",
  outputDeviceId: "",
  localStream: null,
  remoteStream: null,
  history: [],
};

/**
 * A single-line SIP phone. Owns WebSocket, media, and session lifetime independently
 * of React. All asynchronous work is generation-guarded so disconnect/unmount and
 * rapid user actions cannot resurrect an old session or leave a microphone open.
 */
export class PhoneClient {
  private snapshot: PhoneSnapshot = { ...initialSnapshot };
  private readonly listeners: Set<() => void> = new Set();
  private callbacks: PhoneCallbacks;
  private readonly options: PhoneClientOptions;
  private ua: UA | null = null;
  private session: RTCSession | null = null;
  private config: SipConfig | null = null;
  private generation: number = 0;
  private mediaGeneration: number = 0;
  private registrationTimer: ReturnType<typeof setTimeout> | undefined;
  private previewTimer: ReturnType<typeof setTimeout> | undefined;
  private transferTimer: ReturnType<typeof setTimeout> | undefined;
  private iceTimer: ReturnType<typeof setTimeout> | undefined;
  private cancelConnect: (() => void) | null = null;
  private readonly audio: PhoneAudio = new PhoneAudio();

  constructor(options: PhoneClientOptions = {}) {
    this.options = options;
    this.callbacks = options;
    this.audio.configureTones(options.tones ?? {});
    if (options.preview?.enabled)
      this.snapshot = { ...this.snapshot, connection: "registered" };
  }

  /** Stable functions for React's external-store subscription API. */
  getSnapshot: () => PhoneSnapshot = () => this.snapshot;
  subscribe: (listener: () => void) => () => void = (listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setCallbacks(callbacks: PhoneCallbacks): void {
    this.callbacks = callbacks;
  }

  /** Configure synthesized local cues independently from remote voice volume. */
  setTones(options: PhoneToneOptions | false): void {
    this.audio.configureTones(options);
  }
  /** Plays one cue only when idle, so a preview cannot interrupt an actual call. */
  previewTone(event: PhoneToneEvent = "incoming"): void {
    if (!this.hasCall()) {
      this.audio.unlock();
      this.audio.previewCue(event);
    }
  }
  /** Tactile/local feedback without sending a SIP digit (for the idle dial pad). */
  playKeypadTone(digit: string): void {
    if (!/^[0-9*#A-D]$/.test(digit)) return;
    this.audio.unlock();
    this.audio.cue("dtmf", digit);
  }

  /** Resume an explicitly simulated client after a React StrictMode cleanup. */
  startPreview(): void {
    if (!this.options.preview)
      throw new Error("Preview must be enabled at construction.");
    this.connection("registered");
  }

  private update(patch: Partial<PhoneSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private emit(type: PhoneEventType, value?: string | boolean): void {
    const { call, connection, error } = this.snapshot;
    const event: PhoneEvent = {
      type,
      timestamp: Date.now(),
      call,
      connection,
      ...(error && type === "error" ? { error } : {}),
      ...(value !== undefined ? { value } : {}),
    };
    // Host callbacks must never prevent media cleanup or other callback delivery.
    const invoke = (fn: (() => void) | undefined) => {
      try {
        fn?.();
      } catch {
        /* Isolate host failures. */
      }
    };
    invoke(() => this.callbacks.onEvent?.(event));
    if (type === "connection")
      invoke(() => this.callbacks.onConnectionChange?.(connection));
    if (type === "incoming" && call)
      invoke(() => this.callbacks.onIncomingCall?.(call));
    if (type === "answered" && call)
      invoke(() => this.callbacks.onAnswered?.(call));
    if (type === "disconnected" && call)
      invoke(() => this.callbacks.onDisconnected?.(call));
    if (type === "error" && error)
      invoke(() => this.callbacks.onError?.(error));
  }

  private connection(status: ConnectionStatus): void {
    if (this.snapshot.connection === status) return;
    this.update({ connection: status });
    this.emit("connection");
  }

  private fail(code: PhoneError["code"], message: string): Error {
    this.update({ error: { code, message } });
    this.emit("error");
    return new Error(message);
  }

  clearError(): void {
    this.update({ error: null });
  }
  clearHistory(): void {
    this.update({ history: [] });
  }

  /** Connect on an explicit user gesture. Resolves only after SIP registration. */
  async connect(config: SipConfig): Promise<void> {
    if (this.options.preview) return;
    if (this.hasCall())
      throw this.fail("call", "End the current call before changing accounts.");
    try {
      validateConfig(config);
    } catch (e) {
      throw this.fail("configuration", (e as Error).message);
    }
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !window.RTCPeerConnection
    ) {
      throw this.fail(
        "unsupported",
        "Open this phone in a WebRTC-capable browser over HTTPS or localhost.",
      );
    }
    this.disconnect();
    this.audio.unlock();
    const generation = this.generation;
    this.config = { ...config };
    this.update({ error: null, status: "idle", call: null });
    this.connection("connecting");
    let JsSIP: typeof import("jssip");
    try {
      JsSIP = await import("jssip");
    } catch {
      if (generation !== this.generation) return;
      this.connection("error");
      throw this.fail(
        "connection",
        "The calling engine could not load. Check your connection and try again.",
      );
    }
    if (generation !== this.generation) return;
    let ua: UA;
    try {
      ua = new JsSIP.UA({
        sockets: [new JsSIP.WebSocketInterface(config.websocketUrl)],
        uri: config.uri,
        authorization_user: config.authorizationUsername,
        password: config.password,
        display_name: config.displayName,
        registrar_server: config.registrarServer,
        register: true,
        session_timers: true,
        session_timers_refresh_method: "INVITE",
        no_answer_timeout: config.callTimeoutSeconds ?? 45,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 15,
      });
    } catch {
      this.config = null;
      this.connection("error");
      throw this.fail(
        "configuration",
        "Check the SIP address, authentication username, and WebSocket server.",
      );
    }
    this.ua = ua;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const settle = (error?: Error) => {
        if (settled) return;
        settled = true;
        this.cancelConnect = null;
        if (error) reject(error);
        else resolve();
      };
      this.cancelConnect = () => settle(new Error("Connection cancelled."));
      const isCurrent = () => this.ua === ua && generation === this.generation;
      const stopWithError = (
        code: "connection" | "registration",
        message: string,
      ) => {
        if (!isCurrent()) return;
        clearTimeout(this.registrationTimer);
        this.registrationTimer = undefined;
        this.ua = null;
        ua.stop();
        this.config = null;
        this.connection("error");
        settle(this.fail(code, message));
      };
      const deadline = () => {
        if (this.registrationTimer) return;
        this.registrationTimer = setTimeout(
          () =>
            stopWithError(
              "connection",
              "The SIP server did not respond. Check the server address, network, and TLS certificate, then reconnect.",
            ),
          config.registrationTimeoutMs ?? 20000,
        );
      };
      deadline();
      ua.on("connecting", ({ attempts }) => {
        if (!isCurrent()) return;
        if (attempts > (config.maxReconnectAttempts ?? 5))
          stopWithError(
            "connection",
            "Could not reconnect to the SIP server. Check your network and reconnect.",
          );
      });
      ua.on("registered", () => {
        if (!isCurrent()) return;
        clearTimeout(this.registrationTimer);
        this.registrationTimer = undefined;
        this.update({ error: null });
        this.connection("registered");
        settle();
      });
      ua.on("registrationFailed", ({ response }) => {
        const auth = [401, 403, 404].includes(response?.status_code ?? 0);
        stopWithError(
          "registration",
          auth
            ? "Registration was rejected. Check the SIP identity, authentication username, and password."
            : "Registration failed. Verify your account and registrar settings, then reconnect.",
        );
      });
      ua.on("unregistered", () => {
        if (!isCurrent()) return;
        this.connection("reconnecting");
        deadline();
        try {
          ua.register();
        } catch {
          stopWithError(
            "registration",
            "Your registration expired. Reconnect your SIP account.",
          );
        }
      });
      ua.on("disconnected", () => {
        if (!isCurrent()) return;
        this.endSession("Connection lost");
        this.connection("reconnecting");
        // Do not reset an existing retry deadline on every failed socket attempt.
        if (settled) deadline();
      });
      ua.on("newRTCSession", ({ session }: RTCSessionEvent) => {
        if (!isCurrent()) {
          session.terminate();
          return;
        }
        if (
          this.session ||
          (session.direction === "incoming" && this.hasCall())
        ) {
          session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
          return;
        }
        this.bindSession(session);
      });
      try {
        ua.start();
      } catch {
        stopWithError(
          "connection",
          "Could not open the SIP connection. Verify the server address and reconnect.",
        );
      }
    });
  }

  /** Unregister, terminate calls, invalidate async work, and release media. */
  disconnect(): void {
    this.generation++;
    this.mediaGeneration++;
    this.cancelConnect?.();
    this.cancelConnect = null;
    clearTimeout(this.registrationTimer);
    this.registrationTimer = undefined;
    this.endSession("Disconnected");
    const ua = this.ua;
    this.ua = null;
    this.config = null;
    ua?.stop();
    this.audio.dispose();
    this.connection("disconnected");
  }

  /** Reusable after disposal, including React StrictMode's effect replay. */
  dispose(): void {
    this.disconnect();
  }

  private hasCall(): boolean {
    return !["idle", "ended"].includes(this.snapshot.status);
  }

  private newCall(direction: CallInfo["direction"], caller: Caller): CallInfo {
    return {
      id: crypto.randomUUID(),
      direction,
      caller: { ...caller },
      startedAt: Date.now(),
    };
  }

  private async acquireMicrophone(token: number): Promise<MediaStream> {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.isSecureContext
    ) {
      throw this.fail(
        "unsupported",
        "Microphone access needs HTTPS or localhost and a supported browser.",
      );
    }
    this.update({ microphone: "requesting" });
    let expired = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        ...this.config?.audioConstraints,
        ...(this.snapshot.inputDeviceId
          ? { deviceId: { exact: this.snapshot.inputDeviceId } }
          : {}),
      },
      video: false,
    };
    try {
      const request = navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          if (expired || token !== this.mediaGeneration) {
            stopStream(stream);
            throw new DOMException("Cancelled", "AbortError");
          }
          return stream;
        });
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new DOMException("Timed out", "TimeoutError"));
        }, 30000);
      });
      const stream = await Promise.race([request, timeout]);
      this.update({ microphone: "granted" });
      return stream;
    } catch (error) {
      if (token !== this.mediaGeneration) throw error;
      this.update({
        microphone:
          error instanceof Error && error.name === "NotAllowedError"
            ? "denied"
            : "unavailable",
      });
      throw this.fail("microphone", microphoneMessage(error));
    } finally {
      clearTimeout(timer);
    }
  }

  /** Permission preflight stops its test stream immediately; no idle mic capture. */
  async testMicrophone(): Promise<void> {
    if (this.hasCall() || this.snapshot.microphone === "requesting") return;
    const token = ++this.mediaGeneration;
    const stream = await this.acquireMicrophone(token);
    stopStream(stream);
  }

  private ownStream(stream: MediaStream): void {
    this.update({ localStream: stream });
    for (const track of stream.getAudioTracks()) {
      track.addEventListener(
        "ended",
        () => {
          if (this.snapshot.localStream !== stream) return;
          this.fail(
            "microphone",
            "Your microphone disconnected. Check your device before calling again.",
          );
          this.endSession("Microphone disconnected");
        },
        { once: true },
      );
    }
  }

  /** Dial once registered. Overlapping requests are rejected before media acquisition. */
  async call(target: string, caller?: Partial<Caller>): Promise<void> {
    if (this.hasCall())
      throw this.fail("call", "A call is already in progress.");
    if (this.snapshot.connection !== "registered")
      throw this.fail("call", "Connect your SIP account before calling.");
    let uri: string;
    try {
      uri = normalizeTarget(
        target,
        this.config?.uri ?? "sip:preview@localhost",
      );
    } catch (error) {
      throw this.fail("call", (error as Error).message);
    }
    this.update({
      error: null,
      call: this.newCall("outgoing", { ...caller, number: target }),
      status: "requesting-microphone",
      muted: false,
      remoteHeld: false,
    });
    this.emit("outgoing");
    this.audio.unlock();
    this.audio.ring("outgoing");
    const token = ++this.mediaGeneration;
    if (this.options.preview) {
      this.update({ status: "ringing" });
      this.audio.ring("ringing");
      this.previewTimer = setTimeout(
        () => this.accepted(),
        this.options.preview.answerDelayMs ?? 1600,
      );
      return;
    }
    this.audio.unlock();
    try {
      const stream = await this.acquireMicrophone(token);
      if (token !== this.mediaGeneration || !this.ua) {
        stopStream(stream);
        return;
      }
      this.ownStream(stream);
      this.update({ status: "dialing" });
      this.ua.call(uri, {
        mediaStream: stream,
        mediaConstraints: { audio: true, video: false },
        pcConfig: this.pcConfig(),
      });
    } catch (error) {
      if (token !== this.mediaGeneration) return;
      this.finish("Call failed");
      if (!this.snapshot.error)
        throw this.fail(
          "call",
          "The call could not start. Check the number and try again.",
        );
      throw error;
    }
  }

  /** The only way to inject a simulated incoming call; requires explicit preview mode. */
  simulateIncoming(
    caller: Caller = {
      name: "Alex Morgan",
      number: "7003",
      tags: ["Preview call"],
    },
  ): void {
    if (!this.options.preview)
      throw new Error("Simulation is only available in preview mode.");
    if (this.hasCall())
      throw this.fail("call", "End the current preview call first.");
    this.update({
      status: "incoming",
      call: this.newCall("incoming", caller),
      error: null,
      muted: false,
    });
    this.audio.unlock();
    this.update({ playbackBlocked: !this.audio.ring() });
    this.emit("incoming");
  }

  async answer(): Promise<void> {
    if (this.snapshot.status !== "incoming") return;
    const token = ++this.mediaGeneration;
    this.update({ status: "answering", error: null });
    this.audio.stopRinging();
    if (this.options.preview) {
      this.accepted();
      return;
    }
    this.audio.unlock();
    try {
      const stream = await this.acquireMicrophone(token);
      if (
        token !== this.mediaGeneration ||
        !this.session ||
        this.session.isEnded()
      ) {
        stopStream(stream);
        return;
      }
      this.ownStream(stream);
      this.session.answer({
        mediaStream: stream,
        mediaConstraints: { audio: true, video: false },
        pcConfig: this.pcConfig(),
      });
    } catch (error) {
      if (token !== this.mediaGeneration) return;
      this.endSession("Could not answer");
      if (!this.snapshot.error)
        throw this.fail(
          "call",
          "The call could not be answered. Please try again.",
        );
      throw error;
    }
  }

  hangup(): void {
    this.endSession(
      this.snapshot.status === "incoming"
        ? "Declined"
        : this.snapshot.call?.answeredAt
          ? "Call ended"
          : "Cancelled",
    );
  }

  private endSession(reason: string): void {
    const session = this.session;
    this.session = null;
    // Finish before terminate(), which may synchronously emit ended/failed.
    this.finish(reason);
    if (session && !session.isEnded()) {
      try {
        session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
      } catch {
        /* Already terminated remotely. */
      }
    }
  }

  private finish(reason: string): void {
    this.mediaGeneration++;
    clearTimeout(this.previewTimer);
    clearTimeout(this.transferTimer);
    clearTimeout(this.iceTimer);
    const call = this.snapshot.call;
    const completed =
      call && !call.endedAt
        ? { ...call, endedAt: Date.now(), endReason: reason }
        : null;
    const stream = this.snapshot.localStream;
    this.update({
      ...(completed
        ? {
            call: completed,
            status: "ended",
            history: [completed, ...this.snapshot.history].slice(
              0,
              this.options.historyLimit ?? 50,
            ),
          }
        : {}),
      localStream: null,
      remoteStream: null,
      muted: false,
      remoteHeld: false,
      transferPending: false,
      playbackBlocked: false,
      ...(this.snapshot.microphone === "requesting"
        ? { microphone: "unknown" }
        : {}),
    });
    this.audio.stop();
    stopStream(stream);
    if (completed) {
      this.audio.cue("disconnected");
      this.emit("disconnected");
    }
  }

  private accepted(): void {
    const call = this.snapshot.call;
    if (!call || call.endedAt || call.answeredAt) return;
    this.audio.stopRinging();
    this.audio.cue("connected");
    this.update({
      status: "active",
      call: { ...call, answeredAt: Date.now() },
      ...(this.snapshot.remoteStream ? {} : { playbackBlocked: false }),
    });
    this.emit("answered");
  }

  private pcConfig(): RTCConfiguration {
    return {
      iceServers: this.config?.iceServers ?? [],
      iceTransportPolicy: this.config?.iceTransportPolicy ?? "all",
    };
  }

  private bindSession(session: RTCSession): void {
    this.session = session;
    const current = () => this.session === session;
    const bindPeer = (peer: RTCPeerConnection) => {
      const receive = (track: MediaStreamTrack) => {
        if (!current() || track.kind !== "audio") return;
        const remote = this.snapshot.remoteStream ?? new MediaStream();
        if (!remote.getTracks().includes(track)) remote.addTrack(track);
        this.update({ remoteStream: remote });
        if (session.direction === "outgoing" && !this.snapshot.call?.answeredAt)
          this.audio.stopRinging();
        void this.playAudio();
      };
      peer.addEventListener("track", ({ track }) => receive(track));
      peer.getReceivers().forEach(({ track }) => {
        if (track) receive(track);
      });
      peer.addEventListener("iceconnectionstatechange", () => {
        if (!current()) return;
        clearTimeout(this.iceTimer);
        if (peer.iceConnectionState === "failed") {
          this.fail(
            "call",
            "The audio connection failed. Check your network and STUN/TURN settings.",
          );
          this.endSession("Audio connection failed");
        } else if (peer.iceConnectionState === "disconnected") {
          this.iceTimer = setTimeout(() => {
            if (current()) {
              this.fail(
                "call",
                "The audio connection was lost. Check your network and call again.",
              );
              this.endSession("Audio connection lost");
            }
          }, 10000);
        }
      });
    };
    session.on("peerconnection", ({ peerconnection }) =>
      bindPeer(peerconnection),
    );
    if (session.connection) bindPeer(session.connection);
    session.on("progress", () => {
      if (current() && session.direction === "outgoing") {
        this.update({ status: "ringing" });
        if (!this.snapshot.remoteStream) this.audio.ring("ringing");
      }
    });
    session.on("accepted", () => {
      if (current()) this.accepted();
    });
    const ended = (cause: string) => {
      if (!current()) return;
      this.session = null;
      const known = new Set([
        "Busy",
        "Rejected",
        "Canceled",
        "No Answer",
        "Unavailable",
        "Not Found",
        "Connection Error",
        "Request Timeout",
        "Terminated",
        "BYE",
      ]);
      const reason = known.has(cause) ? cause : "Call ended";
      this.finish(reason);
      if (
        !this.snapshot.call?.answeredAt &&
        !["Canceled", "Rejected"].includes(cause)
      )
        this.fail(
          "call",
          `Call ended: ${reason}. Check the destination and try again.`,
        );
    };
    session.on("ended", ({ cause }) => ended(cause));
    session.on("failed", ({ cause }) => ended(cause));
    session.on("hold", ({ originator }) => {
      if (!current()) return;
      this.update(
        originator === "local" ? { status: "held" } : { remoteHeld: true },
      );
      this.emit("held", true);
    });
    session.on("unhold", ({ originator }) => {
      if (!current()) return;
      this.update(
        originator === "local" ? { status: "active" } : { remoteHeld: false },
      );
      this.emit("held", false);
    });
    session.on("muted", () => {
      if (current()) {
        this.update({ muted: true });
        this.emit("muted", true);
      }
    });
    session.on("unmuted", () => {
      if (current()) {
        this.update({ muted: false });
        this.emit("muted", false);
      }
    });
    // Never accept a remote REFER automatically: it could dial an unexpected destination.
    session.on("refer", ({ reject }) => reject());
    if (session.direction === "incoming") {
      this.update({
        call: this.newCall("incoming", {
          number: session.remote_identity.uri.user,
          name: session.remote_identity.display_name || undefined,
        }),
        status: "incoming",
        error: null,
        muted: false,
        remoteHeld: false,
      });
      this.update({ playbackBlocked: !this.audio.ring() });
      this.emit("incoming");
    }
  }

  /** Restore call audio after browser autoplay restrictions or output changes. */
  async playAudio(): Promise<void> {
    this.audio.unlock();
    const stream = this.snapshot.remoteStream;
    if (!stream) {
      if (this.snapshot.status === "incoming") {
        const callId = this.snapshot.call?.id;
        await this.audio.resumeTones().catch(() => {});
        if (
          this.snapshot.status === "incoming" &&
          this.snapshot.call?.id === callId
        )
          this.update({ playbackBlocked: !this.audio.ring() });
      }
      return;
    }
    try {
      await this.audio.play(
        stream,
        this.snapshot.volume,
        this.snapshot.outputDeviceId,
      );
      if (this.snapshot.remoteStream === stream)
        this.update({ playbackBlocked: false });
    } catch {
      if (this.snapshot.remoteStream === stream)
        this.update({ playbackBlocked: true });
    }
  }

  setMuted(muted: boolean): void {
    if (!["active", "held"].includes(this.snapshot.status)) return;
    if (this.options.preview) {
      this.update({ muted });
      this.emit("muted", muted);
      return;
    }
    if (muted) this.session?.mute({ audio: true });
    else this.session?.unmute({ audio: true });
  }

  setHeld(held: boolean): void {
    if (
      !["active", "held"].includes(this.snapshot.status) ||
      this.snapshot.transferPending
    )
      return;
    if (this.options.preview) {
      this.update({ status: held ? "held" : "active" });
      this.emit("held", held);
      return;
    }
    try {
      const ok = held ? this.session?.hold() : this.session?.unhold();
      if (!ok) throw new Error("Not ready");
    } catch {
      throw this.fail(
        "call",
        "Hold is temporarily unavailable while the call negotiates. Try again shortly.",
      );
    }
  }

  sendDTMF(tone: string): void {
    if (!/^[0-9*#A-D]$/.test(tone))
      throw this.fail("call", "Use a single keypad digit, *, #, or A–D.");
    if (!["active", "held"].includes(this.snapshot.status)) return;
    try {
      this.session?.sendDTMF(tone, {
        transportType: (this.config?.dtmfTransport ??
          "RFC2833") as DTMF_TRANSPORT,
      });
      this.emit("dtmf", tone);
      this.playKeypadTone(tone);
    } catch {
      throw this.fail(
        "call",
        "Could not send the keypad tone. Check your PBX’s DTMF transport setting.",
      );
    }
  }

  /** Blind transfer. Completes only when REFER NOTIFY reports success. */
  transfer(target: string): void {
    if (
      !["active", "held"].includes(this.snapshot.status) ||
      this.snapshot.transferPending
    )
      return;
    let uri: string;
    try {
      uri = normalizeTarget(
        target,
        this.config?.uri ?? "sip:preview@localhost",
      );
    } catch (error) {
      throw this.fail("transfer", (error as Error).message);
    }
    this.update({ transferPending: true, error: null });
    this.emit("transfer-started", target);
    const callId = this.snapshot.call?.id;
    const current = () =>
      this.snapshot.call?.id === callId && this.snapshot.transferPending;
    const failed = () => {
      if (!current()) return;
      clearTimeout(this.transferTimer);
      this.update({ transferPending: false });
      this.fail(
        "transfer",
        "Transfer failed or timed out. Your call is still connected; check the destination and try again.",
      );
    };
    const succeeded = () => {
      if (!current()) return;
      this.emit("transferred", target);
      this.endSession("Transferred");
    };
    if (this.options.preview) {
      this.transferTimer = setTimeout(succeeded, 1000);
      return;
    }
    this.transferTimer = setTimeout(failed, 30000);
    try {
      this.session?.refer(uri, {
        eventHandlers: { requestFailed: failed, failed, accepted: succeeded },
      });
    } catch {
      failed();
    }
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    const safe = Math.max(0, Math.min(1, volume));
    this.update({ volume: safe });
    this.audio.setVolume(safe);
  }

  /** Input changes apply to the next call to avoid interrupting an active conversation. */
  setInputDevice(id: string): void {
    if (this.hasCall())
      throw this.fail(
        "audio",
        "End the current call before changing microphones.",
      );
    this.update({ inputDeviceId: id });
  }

  async setOutputDevice(id: string): Promise<void> {
    try {
      await this.audio.setOutputDevice(id);
      this.update({ outputDeviceId: id });
    } catch {
      throw this.fail(
        "audio",
        "Could not switch speakers. Select an available output in your browser or system settings.",
      );
    }
  }
}
