# Changelog

## 0.1.0 — 2026-10-29

First release of `@azeer-ui-widget/react-native-phone`, the React Native companion to `@azeer-ui-widget/react-phone`.

### Calling

- Incoming/outgoing SIP audio over secure WebSocket with JsSIP and react-native-webrtc on iOS and Android, and browser WebRTC through react-native-web.
- Manual, prefilled, and once-per-request automatic dialing; answer, decline, cancel, mute, hold, speaker, DTMF, and blind REFER transfer.
- Runtime microphone permission with `denied` and `blocked` states and an Open Settings recovery action.
- RFC 2833 DTMF where an RTP DTMF sender exists, with automatic SIP INFO fallback on react-native-webrtc.
- Foreground re-registration, bounded reconnection, ICE loss handling, and generation-guarded media cleanup.
- Audio levels from WebRTC statistics, identical on every platform.
- Readable end reasons ("Call ended", "Missed call", "Number not found", …) instead of raw SIP causes.

### Interface

- Full-screen (`screen`), embeddable (`card`), and chrome-free (`sheet`) phone surfaces with basic/advanced/compact presets.
- Dynamic island: status capsule with live timer and voice bars, heads-up incoming banner, expanding sheet, six placements, swipe gestures, Android Back and iOS escape gesture, and safe-area insets.
- iOS-style keypad (touch-down entry, long-press 0 for +, long-press delete to clear), slide-to-answer, Recents from real call history.
- Native Orb, Live Waveform, Bar Visualizer, and Waveform built with react-native-svg and the native animation driver.
- Light, dark, and system appearance; scoped theme tokens; caller identity, tags, and render slots; haptics; reduced motion; VoiceOver/TalkBack labels and web ARIA state.

### Integration

- Adapters for media, audio routing (`createInCallManagerAudioSession`), haptics, and tones (any Web Audio context, including react-native-audio-api).
- Expo playground for iOS, Android, and the web, with Preview and Live SIP modes and credential-free embed code.
- Published to JSR as JSX-free TypeScript generated from the TSX sources.

### Scope

One audio call per client. Blind transfer requires PBX REFER support. CallKit/ConnectionService, push-based incoming calls in the background, video, conferencing, recording, and emergency calling are not included.
