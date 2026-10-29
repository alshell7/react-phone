---
title: Compose your own
description: Build custom call UI with PhoneProvider, usePhone, the exported components, adapters, and the headless PhoneClient.
---

```tsx
import { View } from "react-native";
import {
  CallControls,
  CallTimer,
  ErrorBanner,
  PhoneProvider,
  PhoneRoot,
  usePhone,
} from "@azeer-ui-widget/react-native-phone";

function CallBar() {
  const { state } = usePhone();
  if (state.status !== "active") return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <CallTimer />
      <CallControls buttons={["mute", "speaker", "hangup"]} buttonSize={48} />
    </View>
  );
}

export function App() {
  return (
    <PhoneProvider config={config} autoConnect audioSession={audioSession}>
      <PhoneRoot theme={{ appearance: "dark" }} style={{ flex: 1 }}>
        <YourNavigator />
        <ErrorBanner />
        <CallBar />
      </PhoneRoot>
    </PhoneProvider>
  );
}
```

One provider owns one line; every component under it shares that call.

## Components

| Component                                   | Purpose                                                              |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `PhoneWidget`, `PhoneIsland`                | The complete surfaces, inside your provider                          |
| `Dialer`, `Keypad`                          | Number entry and calling; the bare 3×4 keypad                        |
| `CallerCard`, `Avatar`                      | Identity, tags, status, and timer                                    |
| `CallControls`, `IncomingCallActions`, `SlideToAnswer`, `TransferPanel` | Call actions                 |
| `ConnectionForm`, `ConnectionStatus`        | Credentials (never persisted) and registration status               |
| `AudioSettings`, `VolumeSlider`             | Microphone access, device choice (web), volume                       |
| `CallHistory`                               | Recents from real call history                                       |
| `ContactSuggestions`, `useContactSuggestions` | Smart-dial suggestions for your own keypad                          |
| `ErrorBanner`, `CallTimer`                  | Actionable errors (with Open Settings) and elapsed time              |
| `CallOrb`, `CallWaveform`, `CallBarVisualizer`, `Orb`, `LiveWaveform`, `BarVisualizer`, `Waveform` | Visuals |
| `RoundButton`, `Button`, `IconButton`, `PhoneText`, `PressableScale` | Primitives that follow the theme             |

Hooks: `usePhone`, `useAutoDial`, `useCallActivity`, `useContactSuggestions`, `useReducedMotion`, `useDraggable`, `usePhoneTheme`, `usePhoneLabels`, `usePhoneNumberFormatter`, `usePhoneMotion`.

Helpers: `matchContacts`, `toKeypadDigits`, `resolvePhoneTheme`, `phoneThemes`, `controlRadius`, `readableColor`, `defaultPhoneLabels`, `endReasonLabel`, `formatDuration`, `normalizeTarget`.

## Headless client

```ts
import { PhoneClient } from "@azeer-ui-widget/react-native-phone/core";

const client = new PhoneClient({ onIncomingCall: (call) => showMyUI(call) });
await client.connect(config);
const unsubscribe = client.subscribe(() => render(client.getSnapshot()));
await client.call("7003");
```

| Method                                                    | Purpose                                                   |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `connect(config)`, `disconnect()`, `dispose()`            | Register, unregister, release everything                  |
| `call(target, caller?)`, `answer()`, `hangup()`           | Call control                                              |
| `setMuted`, `setHeld`, `setSpeaker`, `sendDTMF`, `transfer` | In-call actions                                         |
| `setVolume`, `setInputDevice`, `setOutputDevice`, `listDevices` | Audio                                               |
| `testMicrophone()`, `openSettings()`                      | Permission preflight and recovery                         |
| `getAudioLevels()`                                        | Normalized input/output activity from WebRTC stats        |
| `refreshRegistration()`                                   | Re-register after foregrounding (the provider does this)  |
| `capabilities`, `platform`                                | What the current adapters support                         |
| `subscribe`, `getSnapshot`                                | `useSyncExternalStore`-compatible state                   |
| `simulateIncoming()`, `startPreview()`                    | Preview mode only                                         |

## Adapters

| Option         | Interface             | Default                                                         |
| -------------- | --------------------- | --------------------------------------------------------------- |
| `media`        | `MediaAdapter`        | react-native-webrtc on iOS/Android; browser WebRTC on the web    |
| `audioSession` | `AudioSessionAdapter` | None (no Speaker button)                                         |
| `haptics`      | `HapticsAdapter`      | `Vibration` on devices; `navigator.vibrate` on the web           |
| `tones`        | `PhoneToneOptions`    | Browser Web Audio; silent on devices without `audioContext`      |

Inject a fake `MediaAdapter` to unit-test your own UI without WebRTC; the package's own tests do exactly that.
