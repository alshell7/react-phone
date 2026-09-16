---
title: "Dialing & incoming calls"
description: "Dialing & incoming calls for Azeer React Phone. Configuration, examples, and expected behavior."
---

Use manual entry, a prefilled destination, or one automatic attempt after registration. Every preset can receive and answer calls.

## Presets

| Preset     | Dial input | Keypad / DTMF | Mute | Hold | Transfer | Waveform |
| ---------- | ---------- | ------------- | ---- | ---- | -------- | -------- |
| `basic`    | Yes        | —             | Yes  | —    | —        | Yes      |
| `advanced` | Yes        | Yes           | Yes  | Yes  | Yes      | Yes      |
| `compact`  | Yes        | —             | Yes  | Yes  | —        | —        |

All presets support incoming calls, answer/decline, and cancel/hangup. Customize any preset with `features={{ keypad: true, hold: true, transfer: false, waveform: false, audioSettings: true }}`. Hiding a feature changes the UI, not the underlying client capability. Preset and theme changes preserve the current call.

## Manual, prefilled, or automatic outgoing calls

```tsx
// Manual dialing: the user types a number and presses Call.
<WebPhone config={config} autoConnect />

// Prefill only: still editable, and no call starts by itself.
<WebPhone config={config} autoConnect defaultNumber="7003" />

// Start once, as soon as the account is registered.
<WebPhone
  config={config}
  autoConnect
  defaultNumber="7003"
  autoDial
  autoDialKey="support-request-42"
  onAnswered={(call) => console.info("Answered", call.id)}
  onDisconnected={(call) => console.info("Ended", call.endReason)}
/>
```

| Prop            | Behavior                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| `defaultNumber` | Prefills the editable dialer; changing the prop updates it. Falls back to `caller.number`. |
| `autoDial`      | Defaults to `false`. When enabled, calls the supplied number after registration.           |
| `autoDialKey`   | Optional request identity. Change it to intentionally call the same number again.          |

Each destination/key pair gets **one attempt per mounted widget and client**. React StrictMode, unrelated rerenders, reconnection, hangup, and microphone denial do not redial. A request encountered while the line is busy is skipped, not queued. Disabling `autoDial` cancels a pending start; it does not hang up an established call. A new destination or key is a new request. Unmounting/remounting the widget resets this scope; keep it mounted while a request remains active, or clear `autoDial` in your host when the request is consumed.

Automatic calls still require browser microphone permission. Permission/autoplay errors use the same recovery UI as manual calls; a browser may require a click on **Enable call audio**. For custom compositions, call `useAutoDial({ number, enabled: true, requestId, caller })` inside `PhoneProvider`, with only one owner per line. The playground's **Outgoing calls** panel lets you apply a prefill or start an automatic attempt explicitly.

## Incoming calls

The inline widget displays the caller and Answer / Decline controls when an INVITE arrives. The [dynamic island](/react-phone/dynamic-island/) lets you choose automatic expansion, a compact notification, or manual opening. Answering requests microphone access; receiving an INVITE does not. A second incoming call while busy receives SIP `486 Busy Here`.

## Transfer

`client.transfer(number)` performs a **blind transfer**. The current call ends only after a successful final REFER NOTIFY from the PBX. Rejection or timeout leaves the original call available. Attended transfer, multiple lines, conferencing, recording, and emergency calling are outside this release.
