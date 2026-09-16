import { describe, expect, it } from "vitest";
import {
  formatDuration,
  normalizeTarget,
  validateConfig,
} from "../src/core/validation.ts";

const config = {
  websocketUrl: "wss://voice.example.com/ws",
  uri: "sip:1001@voice.example.com",
  authorizationUsername: "test_user",
  password: "test-only",
};

describe("SIP input validation", () => {
  it("keeps the authentication identity independent from the address of record", () =>
    expect(() => validateConfig(config)).not.toThrow());
  it.each([
    "http://voice.example.com/ws",
    "ws://voice.example.com/ws",
    "wss://user:secret@voice.example.com/ws",
    "bad url",
  ])("rejects unsafe server %s", (websocketUrl) =>
    expect(() => validateConfig({ ...config, websocketUrl })).toThrow(),
  );
  it("allows local non-TLS development endpoints", () =>
    expect(() =>
      validateConfig({ ...config, websocketUrl: "ws://localhost/ws" }),
    ).not.toThrow());
  it.each([
    "1001",
    "sip:@voice.example.com",
    "sip:1001@voice.example.com\r\nVia: injection",
    "sip:1001@host?method=REGISTER",
  ])("rejects malformed SIP identity %s", (uri) =>
    expect(() => validateConfig({ ...config, uri })).toThrow(),
  );
  it("requires a password", () =>
    expect(() => validateConfig({ ...config, password: "" })).toThrow());
  it("normalizes formatted international numbers", () =>
    expect(normalizeTarget("+1 (415) 555-0123", config.uri)).toBe(
      "sip:+14155550123@voice.example.com",
    ));
  it("preserves PBX feature codes safely", () =>
    expect(normalizeTarget("*72#", config.uri)).toBe(
      "sip:*72%23@voice.example.com",
    ));
  it("accepts explicit SIP targets", () =>
    expect(normalizeTarget("sip:support@example.com", config.uri)).toBe(
      "sip:support@example.com",
    ));
  it.each([
    "",
    "javascript:alert(1)",
    "sip:user@host\r\nInjected: header",
    "123;method=REGISTER",
    "12+34",
  ])("rejects unsafe dial target %s", (value) =>
    expect(() => normalizeTarget(value, config.uri)).toThrow(),
  );
  it("formats long calls without wrapping at one hour", () =>
    expect(formatDuration(3661)).toBe("61:01"));
});
