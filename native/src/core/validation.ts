import type { SipConfig } from "./types.ts";

const SIP_URI = /^sips?:[^\s@<>;?]+@[^\s@<>/?]+$/;
// React Native's URL implementation lacks most getters, so parse explicitly.
const WEBSOCKET_URL =
  /^(wss?):\/\/(?:([^@/?#]*)@)?(\[[^\]/?#]+\]|[^:/?#]+)(?::(\d{1,5}))?([/?#].*)?$/i;
const LOOPBACK = ["localhost", "127.0.0.1", "[::1]", "10.0.2.2"];

/** Validate before allocating a WebSocket or asking for device permissions. */
export function validateConfig(config: SipConfig): void {
  const url = WEBSOCKET_URL.exec(config.websocketUrl?.trim() ?? "");
  if (!url) throw new Error("Enter a valid secure WebSocket URL.");
  const [, scheme, credentials, host] = url;
  if (
    scheme.toLowerCase() !== "wss" &&
    !LOOPBACK.includes(host.toLowerCase())
  ) {
    throw new Error(
      "Use wss:// for your SIP server (ws:// is only allowed for local development).",
    );
  }
  if (credentials !== undefined || !host)
    throw new Error(
      "WebSocket credentials must be supplied in the account fields.",
    );
  if (!SIP_URI.test(config.uri ?? ""))
    throw new Error("Enter a SIP address such as sip:1001@pbx.example.com.");
  if (!config.password) throw new Error("Enter your SIP password.");
  if (
    config.authorizationUsername &&
    /[\r\n]/.test(config.authorizationUsername)
  )
    throw new Error("Enter a valid authentication username.");
  for (const value of [
    config.registrationTimeoutMs,
    config.callTimeoutSeconds,
    config.maxReconnectAttempts,
  ]) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0))
      throw new Error("Timeouts and retry limits must be positive numbers.");
  }
}

/** Accept extensions, international numbers, feature codes, and explicit SIP URIs. */
export function normalizeTarget(value: string, ownUri: string): string {
  const target = value.trim();
  if (SIP_URI.test(target)) return target;
  const number = target.replace(/[\s().-]/g, "");
  if (!/^[+\d*#][\d*#]{0,63}$/.test(number))
    throw new Error("Enter a phone number, extension, or full SIP address.");
  const domain = ownUri.split("@")[1];
  if (!domain) throw new Error("Connect your SIP account before calling.");
  // # is a URI delimiter; escaping feature codes preserves them as the user part.
  return `sip:${number.replace(/#/g, "%23")}@${domain}`;
}

/** Human-readable elapsed time (mm:ss, or h:mm:ss after an hour). */
export function formatDuration(seconds: number): string {
  const duration = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const secs = (duration % 60).toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs}`
    : `${minutes.toString().padStart(2, "0")}:${secs}`;
}

/** Collision-resistant call IDs without crypto.randomUUID (missing on Hermes). */
export function createId(): string {
  const bytes = new Uint8Array(16);
  const crypto = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (crypto?.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
