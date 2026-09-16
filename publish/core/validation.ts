// Generated from src/core/validation.ts. Run npm run package:build; do not edit.
import type { SipConfig } from "./types.ts";

/** Validate before allocating a WebSocket or asking for device permissions. */
export function validateConfig(config: SipConfig): void {
  let url: URL;
  try {
    url = new URL(config.websocketUrl);
  } catch {
    throw new Error("Enter a valid secure WebSocket URL.");
  }
  if (url.protocol !== "wss:" && !(url.protocol === "ws:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
    throw new Error("Use wss:// for your SIP server (ws:// is only allowed on localhost).");
  }
  if (url.username || url.password || !url.hostname) throw new Error("WebSocket credentials must be supplied in the account fields.");
  if (!/^sips?:[^\s@<>;?]+@[^\s@<>/?]+$/.test(config.uri)) throw new Error("Enter a SIP address such as sip:1001@pbx.example.com.");
  if (!config.password) throw new Error("Enter your SIP password.");
  if (config.authorizationUsername && /[\r\n]/.test(config.authorizationUsername)) throw new Error("Enter a valid authentication username.");
  for (const value of [config.registrationTimeoutMs, config.callTimeoutSeconds, config.maxReconnectAttempts]) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new Error("Timeouts and retry limits must be positive numbers.");
  }
}

/** Accept extensions, international numbers, feature codes, and explicit SIP URIs. */
export function normalizeTarget(value: string, ownUri: string): string {
  const target = value.trim();
  if (/^sips?:[^\s@<>;?]+@[^\s@<>/?]+$/.test(target)) return target;
  const number = target.replace(/[\s().-]/g, "");
  if (!/^[+\d*#][\d*#]{0,63}$/.test(number)) throw new Error("Enter a phone number, extension, or full SIP address.");
  const domain = ownUri.split("@")[1];
  if (!domain) throw new Error("Connect your SIP account before calling.");
  // # is a URI delimiter; escaping feature codes preserves them as the user part.
  return `sip:${number.replace(/#/g, "%23")}@${domain}`;
}

/** Human-readable elapsed time, also used by host applications. */
export function formatDuration(seconds: number): string {
  const duration = Math.max(0, Math.floor(seconds));
  return `${Math.floor(duration / 60).toString().padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`;
}
