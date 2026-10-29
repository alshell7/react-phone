---
title: Calling & lifecycle
description: Dialing, automatic calls, incoming calls, DTMF, hold, speaker, transfer, events, and state for the React Native phone.
---

## Dialing

```tsx
// Prefill only; the user still presses Call.
<SipPhone config={config} autoConnect defaultNumber="7003" />

// One attempt after registration. A new key permits a new attempt.
<SipPhone config={config} autoConnect defaultNumber="7003" autoDial autoDialKey="ticket-42" />
```

Targets accept extensions, international numbers with formatting (`+1 (415) 555-0123`), PBX feature codes (`*72#`, with `#` escaped safely), and explicit `sip:` URIs. Each destination/key is dialed once per mounted phone; reconnects, rerenders, hangups, and permission denials never redial, and a busy line consumes the request instead of queueing a surprise call. Use `useAutoDial()` in custom layouts.

## In a call

| Action           | Method                         | Notes                                                                                           |
| ---------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Answer / decline | `answer()`, `hangup()`         | Declining responds `486 Busy Here`; a second incoming call is rejected the same way             |
| Mute             | `setMuted(boolean)`            | Stops sending microphone audio; the Orb and local waveform go quiet                             |
| Hold             | `setHeld(boolean)`             | SDP re-INVITE; remote hold is reported as `remoteHeld`. A quick Resume while the PBX is still answering the hold is retried until negotiation settles |
| Speaker          | `setSpeaker(boolean)`          | Needs an [audio session adapter](/react-phone/native/audio/); also available while ringing out   |
| Keypad           | `sendDTMF("0-9*#A-D")`         | RFC 2833 when the platform has an RTP DTMF sender; otherwise SIP INFO automatically             |
| Transfer         | `transfer(target)`             | Blind REFER; the call ends only after the PBX reports success, and stays connected on failure   |
| Volume           | `setVolume(0–1)`               | Remote track gain on devices; audio element volume on the web                                   |

Remote REFER requests are always rejected so a remote party cannot make the phone dial elsewhere. React Native WebRTC has no RTP DTMF sender, so devices send DTMF as SIP INFO unless you force `dtmfTransport: "INFO"` everywhere for consistency.

## Status

`state.connection` (registration) and `state.status` (call) are independent:

| `connection`   | Meaning                                                       |
| -------------- | ------------------------------------------------------------- |
| `connecting`   | Opening the WebSocket and registering                          |
| `registered`   | Ready for calls                                               |
| `reconnecting` | Socket dropped or registration lapsed; JsSIP is recovering     |
| `error`        | Gave up (timeout, rejected credentials, retry limit)          |

| `status`                 | Meaning                                         |
| ------------------------ | ----------------------------------------------- |
| `requesting-microphone`  | Waiting for permission (30 s limit)             |
| `dialing` / `ringing`    | INVITE sent / remote is ringing                 |
| `incoming` / `answering` | Ringing here / acquiring media to answer        |
| `active` / `held`        | Connected / locally held                        |
| `ended`                  | Finished; `call.endReason` explains why in plain words: "Call ended", "Missed call", "Declined", "Cancelled", "Busy", "No answer", "Number not found", "Connection lost", … (translate with `labels.endReasons`) |

## Events

Pass callbacks to `SipPhone`, `SipPhoneIsland`, `PhoneProvider`, or `PhoneClient`:

| Callback             | When                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `onIncomingCall`     | A new incoming call starts ringing                                   |
| `onAnswered`         | The remote party accepted, or an incoming call was answered          |
| `onDisconnected`     | Exactly once per call, including rejected, failed, and cancelled     |
| `onConnectionChange` | Registration status changed                                          |
| `onError`            | A sanitized, actionable `PhoneError` (`code` + `message`)            |
| `onEvent`            | Every event: `connection`, `incoming`, `outgoing`, `answered`, `disconnected`, `muted`, `held`, `speaker`, `dtmf`, `transfer-started`, `transferred`, `error` |

Events carry call metadata only: never passwords, SDP, or raw SIP messages. Throwing inside a callback cannot interrupt media cleanup or other callbacks.

![Call lifecycle](/react-phone/diagrams/call-lifecycle.svg)
