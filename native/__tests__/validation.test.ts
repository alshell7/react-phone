import {
  createId,
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
    "wss://@voice.example.com/ws",
    "bad url",
    "",
  ])("rejects unsafe server %p", (websocketUrl) =>
    expect(() => validateConfig({ ...config, websocketUrl })).toThrow(),
  );
  it.each([
    "ws://localhost/ws",
    "ws://127.0.0.1:8088/ws",
    "ws://10.0.2.2:8088/ws",
    "ws://[::1]:8088/ws",
    "wss://voice.example.com:8089/ws",
    "WSS://Voice.Example.com/ws?transport=ws",
  ])("allows %p (secure, or local development including the Android emulator host)", (websocketUrl) =>
    expect(() => validateConfig({ ...config, websocketUrl })).not.toThrow(),
  );
  it.each([
    "1001",
    "sip:@voice.example.com",
    "sip:1001@voice.example.com\r\nVia: injection",
    "sip:1001@host?method=REGISTER",
  ])("rejects malformed SIP identity %p", (uri) =>
    expect(() => validateConfig({ ...config, uri })).toThrow(),
  );
  it("requires a password", () =>
    expect(() => validateConfig({ ...config, password: "" })).toThrow("password"));
  it("rejects header injection in the authentication username", () =>
    expect(() =>
      validateConfig({ ...config, authorizationUsername: "user\r\nVia: x" }),
    ).toThrow());
  it.each([0, -1, NaN, Infinity])("rejects a non-positive timeout %p", (registrationTimeoutMs) =>
    expect(() => validateConfig({ ...config, registrationTimeoutMs })).toThrow("positive"),
  );
  it("normalizes formatted international numbers", () =>
    expect(normalizeTarget("+1 (415) 555-0123", config.uri)).toBe(
      "sip:+14155550123@voice.example.com",
    ));
  it("preserves PBX feature codes safely", () =>
    expect(normalizeTarget("*72#", config.uri)).toBe("sip:*72%23@voice.example.com"));
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
  ])("rejects unsafe dial target %p", (value) =>
    expect(() => normalizeTarget(value, config.uri)).toThrow(),
  );
  it("requires an account domain for bare numbers", () =>
    expect(() => normalizeTarget("7003", "")).toThrow("Connect"));
});

describe("formatting and identifiers", () => {
  it.each([
    [0, "00:00"],
    [59.9, "00:59"],
    [61, "01:01"],
    [3599, "59:59"],
    [3661, "1:01:01"],
    [-5, "00:00"],
    [NaN, "00:00"],
  ])("formats %p seconds as %p", (seconds, text) => expect(formatDuration(seconds)).toBe(text));
  it("creates RFC 4122 version 4 identifiers without crypto.randomUUID", () => {
    const ids = new Set(Array.from({ length: 500 }, () => createId()));
    expect(ids.size).toBe(500);
    for (const id of ids)
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
