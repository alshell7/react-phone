import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PhoneClient } from "../../src/core/phone-client.ts";
import type { MediaAdapter } from "../../src/core/media.ts";
import type { PhoneEvent } from "../../src/core/types.ts";

// Jest sandboxes process.env, so parse the file instead of process.loadEnvFile().
const envFile = resolve(__dirname, "../../.env.local");
if (existsSync(envFile))
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
const { SIP_WSS_URL, SIP_URI, SIP_USERNAME, SIP_PASSWORD } = process.env;
const configured = Boolean(SIP_WSS_URL && SIP_URI && SIP_PASSWORD);
const live = configured ? describe : describe.skip;

// Registration needs signalling only; no microphone or peer connection is created.
const signallingOnly: MediaAdapter = {
  platform: "custom",
  canSelectOutput: false,
  isSupported: () => typeof WebSocket === "function",
  prepare() {},
  getUserMedia: () => Promise.reject(new Error("No media in Node")),
  createStream: (tracks) => ({ getTracks: () => tracks, getAudioTracks: () => tracks }),
  createPlayer: () => ({
    play: async () => {},
    setVolume() {},
    setOutputDevice: async () => {},
    stop() {},
    dispose() {},
  }),
};
const haptics = { impact() {}, startRinging() {}, stopRinging() {} };

live("live PBX registration (real JsSIP over WSS)", () => {
  const config = () => ({
    websocketUrl: SIP_WSS_URL!,
    uri: SIP_URI!,
    authorizationUsername: SIP_USERNAME,
    password: SIP_PASSWORD!,
    displayName: "react-native-phone live test",
    registrationTimeoutMs: 20000,
  });

  it("registers, survives a refresh, and unregisters cleanly", async () => {
    const events: PhoneEvent[] = [];
    const client = new PhoneClient({ media: signallingOnly, haptics, tones: false, onEvent: (e) => events.push(e) });
    const started = Date.now();
    await client.connect(config());
    const elapsed = Date.now() - started;
    expect(client.getSnapshot().connection).toBe("registered");
    expect(client.getSnapshot().error).toBeNull();
    // A foreground refresh is a no-op while the registration is still valid.
    client.refreshRegistration();
    expect(client.getSnapshot().connection).toBe("registered");
    client.disconnect();
    expect(client.getSnapshot().connection).toBe("disconnected");
    expect(events.map((e) => e.type === "connection" && e.connection).filter(Boolean)).toEqual([
      "connecting",
      "registered",
      "disconnected",
    ]);
    // No event may carry the password.
    expect(JSON.stringify(events)).not.toContain(SIP_PASSWORD);
    console.info(`Registered with the live PBX in ${elapsed} ms.`);
  });

  it("re-registers after an explicit reconnect with the same client", async () => {
    const client = new PhoneClient({ media: signallingOnly, haptics, tones: false });
    await client.connect(config());
    await client.connect(config());
    expect(client.getSnapshot().connection).toBe("registered");
    client.dispose();
  });

  it("reports a clear error for an unreachable WebSocket host without hanging", async () => {
    const client = new PhoneClient({ media: signallingOnly, haptics, tones: false });
    await expect(
      client.connect({ ...config(), websocketUrl: "wss://127.0.0.1:9/ws", registrationTimeoutMs: 4000, maxReconnectAttempts: 1 }),
    ).rejects.toThrow(/SIP server|reconnect/);
    expect(client.getSnapshot().connection).toBe("error");
    client.dispose();
  });
});
