---
title: Platforms & recovery
description: iOS, Android, and web specifics; permissions; background behaviour and CallKit; and how the phone recovers from failures.
---

## Platform matrix

| Capability                   | iOS                                  | Android                                      | Web (react-native-web)          |
| ---------------------------- | ------------------------------------ | -------------------------------------------- | -------------------------------- |
| Media                        | react-native-webrtc                  | react-native-webrtc                          | Browser WebRTC (HTTPS/localhost) |
| Microphone permission        | System prompt once; then Settings    | Runtime prompt; "Don't ask again" → Settings | Browser prompt                   |
| Speaker routing              | Audio session adapter                | Audio session adapter                        | Output device selection          |
| DTMF                         | SIP INFO (automatic)                 | SIP INFO (automatic)                         | RFC 2833                         |
| Haptics                      | Adapter (e.g. expo-haptics)          | Built in                                     | `navigator.vibrate` where supported |
| Synthesized tones            | With `react-native-audio-api`        | With `react-native-audio-api`                | Built in                         |
| Expo Go                      | Preview only                         | Preview only                                 | –                                |

## Permissions

The phone never captures audio on launch or registration. It requests the microphone when someone dials or answers, or when they press **Check microphone access** in audio settings.

| `state.microphone` | Meaning                                         | UI                                                         |
| ------------------ | ----------------------------------------------- | ---------------------------------------------------------- |
| `requesting`       | Prompt is showing (30 s limit)                  | "Waiting for microphone…"                                  |
| `granted`          | Allowed                                         | –                                                          |
| `denied`           | Declined this time; can ask again               | Error with retry guidance                                  |
| `blocked`          | iOS denied, or Android "Don't ask again"        | Error plus **Open Settings** (`client.openSettings()`)     |
| `unavailable`      | No device, busy, or timed out                   | Error explaining the cause                                 |

## Calls while in the background

Mobile systems suspend JavaScript in the background, so a WebSocket SIP registration cannot reliably ring a sleeping phone. The phone re-registers when the app returns to the foreground (`refreshOnForeground`, default on) and keeps active calls running with `UIBackgroundModes: ["audio", "voip"]` on iOS.

For incoming calls while the app is closed, add push wake-up and system call UI:

1. Your PBX or a push service sends a VoIP push (PushKit) or high-priority FCM message.
2. Show the system UI with [react-native-callkeep](https://github.com/react-native-webrtc/react-native-callkeep) and connect the client.
3. Wire CallKeep's answer/end actions to `client.answer()` / `client.hangup()`, and use `onIncomingCall` / `onDisconnected` to keep CallKit in sync.

This needs server-side push support and is outside this package.

## Recovery

| Problem                              | What the phone does                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Wrong credentials (401/403/404)      | Stops, `connection: "error"`, asks to check identity, username, and password          |
| Server silent / TLS failure          | Times out after `registrationTimeoutMs` (20 s), stops the agent                       |
| Socket drops                         | Ends media, `reconnecting`, bounded retries (`maxReconnectAttempts`, 5)               |
| Registration lapses in background    | Re-registers on foreground                                                            |
| ICE fails / disconnects for 10 s     | Ends the call with STUN/TURN guidance                                                 |
| Microphone unplugged mid-call        | Ends the call and explains                                                            |
| Transfer fails or times out (30 s)   | Keeps the call connected                                                              |
| Second incoming call                 | `486 Busy Here`                                                                       |
| WebRTC missing (Expo Go)             | `unsupported` error naming react-native-webrtc and a development build                |

Errors are sanitized: no SIP messages, SDP, or passwords reach callbacks or the UI.

## Production checklist

- Use `wss://` with a valid certificate (plain `ws://` is accepted only for `localhost`, `127.0.0.1`, `[::1]`, and the Android emulator host `10.0.2.2`).
- Provide TURN servers (`iceServers`) for mobile networks behind carrier NAT.
- Enable WebRTC on the PBX endpoint (for Asterisk PJSIP: `webrtc=yes`, DTLS, and the WSS transport).
- Test on real devices with your PBX: routing, two-way audio, hold, DTMF, and REFER transfer.
