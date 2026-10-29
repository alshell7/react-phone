---
title: Audio, tones & haptics
description: Speaker routing with an audio session adapter, system ringtones, synthesized call tones, haptics, and volume on iOS and Android.
---

## Speaker and audio session

Mobile call audio needs a native audio session: earpiece by default, loudspeaker on request, proximity sensor, and screen wake. The phone talks to it through an `AudioSessionAdapter`, so you choose the native module. For [react-native-incall-manager](https://github.com/react-native-webrtc/react-native-incall-manager):

```tsx
import InCallManager from "react-native-incall-manager";
import { SipPhone, createInCallManagerAudioSession } from "@azeer-ui-widget/react-native-phone";

// Create once, outside render.
const audioSession = createInCallManagerAudioSession(InCallManager, { systemRingtone: true });

<SipPhone config={config} audioSession={audioSession} />;
```

The **Speaker** button appears only when the adapter implements `setSpeaker`. The phone calls `start("ringing")` for incoming calls, `start("call")` when media begins, and `stop()` once the call fully ends. Adapter failures never interrupt a call. Write your own adapter for CallKit, ConnectionService, or a custom module:

```ts
const audioSession: AudioSessionAdapter = {
  start(mode) { /* configure AVAudioSession / AudioManager */ },
  stop() { /* restore */ },
  setSpeaker(enabled) { /* route to speaker or earpiece */ },
};
```

## Call tones

Ringing, ringback, connect, disconnect, and DTMF cues are synthesized with the same three presets as the web package (`gentle`, `classic`, `minimal`). They need a Web Audio context: browsers provide one automatically; on devices, pass [react-native-audio-api](https://docs.swmansion.com/react-native-audio-api/):

```tsx
import { AudioContext } from "react-native-audio-api";

<SipPhone config={config} tones={{ preset: "classic", volume: 0.4, audioContext: () => new AudioContext() }} />;
```

Without an audio context, devices stay silent for synthesized cues but still vibrate for incoming calls. Alternatively, use `systemRingtone: true` on the InCallManager adapter for the device's own ringtone.

| `tones` option      | Default              | Notes                                                          |
| ------------------- | -------------------- | -------------------------------------------------------------- |
| `preset`            | `gentle`             | `gentle`, `classic`, `minimal`                                 |
| `volume`            | `0.35`               | Independent from call volume                                   |
| `events`            | all on               | e.g. `{ dtmf: false }`                                          |
| `haptics`           | `false`              | Keypad ticks and connect/disconnect taps                        |
| `vibrateOnIncoming` | `true` on devices    | Repeating ring vibration                                        |
| `audioContext`      | browser default      | Factory for any Web Audio–compatible context                    |
| `false`             | –                    | Disable all tones                                               |

## Haptics

Android uses short `Vibration` ticks out of the box. iOS ignores vibration durations, so pass a taptic adapter for keypad feedback:

```tsx
import * as Haptics from "expo-haptics";
import { Vibration } from "react-native";

const haptics = {
  impact: (kind: "light" | "medium" | "heavy") =>
    void Haptics.impactAsync(
      kind === "light" ? Haptics.ImpactFeedbackStyle.Light : kind === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy,
    ),
  startRinging: () => Vibration.vibrate([0, 700, 900], true),
  stopRinging: () => Vibration.cancel(),
};

<SipPhone config={config} haptics={haptics} tones={{ haptics: true }} />;
```

## Volume and remote audio

Native WebRTC plays remote audio automatically. `setVolume(0–1)` adjusts the remote track's gain; the default is `1` on devices and `0.8` on the web. On the web, browsers may block autoplay until a gesture: the phone shows **Enable call audio** when that happens.
