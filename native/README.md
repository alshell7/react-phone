# Azeer React Native Phone

A customizable SIP phone for **React Native** on iOS, Android, and the web. Ship a full-screen phone, a floating **dynamic island**, an embeddable card, or compose your own calling UI. Powered by **JsSIP** and **react-native-webrtc**, with live audio visuals inspired by ElevenLabs UI.

**[Documentation](https://alshell7.github.io/react-phone/native/) · [Playground](https://alshell7.github.io/react-phone/native/playground/) · [JSR package](https://jsr.io/@azeer-ui-widget/react-native-phone) · [React (web) package](https://jsr.io/@azeer-ui-widget/react-phone)**

<p align="center">
  <img src="https://raw.githubusercontent.com/alshell7/react-phone/main/docs/public/media/native/screen-active.png" alt="Full-screen call with a live orb, a three-by-two grid of round controls, and a red end button" width="250" />
  &nbsp;
  <img src="https://raw.githubusercontent.com/alshell7/react-phone/main/docs/public/media/native/screen-keypad.png" alt="Keypad with large round keys, letters, and a green call button" width="250" />
  &nbsp;
  <img src="https://raw.githubusercontent.com/alshell7/react-phone/main/docs/public/media/native/island-banner.png" alt="Dynamic island showing a heads-up incoming call banner with Answer and Decline" width="250" />
</p>

Screenshots use simulated calls. The playground opens in **Preview** mode; switch to **Live SIP** to register your own account.

## Designed for phones

| Calling                                          | Interface                                                   | Integration                                       |
| ------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------- |
| Incoming / outgoing audio over SIP (WSS)         | Full-screen, card, and sheet surfaces                       | Expo (dev build) and bare React Native            |
| Mute, hold/resume, speaker, DTMF, blind transfer | Dynamic island: capsule, heads-up banner, expanding sheet   | iOS, Android, and react-native-web                |
| Runtime microphone permission with Settings link | iOS-style keypad, slide-to-answer, Recents from real calls  | Complete components, hooks, or a headless client  |
| Reconnect, foreground re-registration, ICE loss  | Orb, live waveform, lifecycle bars, avatar                  | Adapters for audio routing, haptics, and tones    |
| Manual, prefilled, or automatic dialing          | Themes (light/dark/system), haptics, reduced motion         | Typed lifecycle callbacks; MIT; source on JSR     |

**One audio call per client.** A second INVITE receives `486 Busy Here`. Transfer needs PBX REFER support. Attended transfer, conferencing, recording, video, and emergency calling are outside this release.

## Install

```sh
npx jsr add @azeer-ui-widget/react-native-phone
npx expo install react-native-webrtc @config-plugins/react-native-webrtc react-native-svg
```

Add the WebRTC config plugin and microphone text to `app.json`, then create a development build (Expo Go does not include WebRTC):

```json
{
  "expo": {
    "plugins": [
      ["@config-plugins/react-native-webrtc", { "microphonePermission": "Calls need your microphone." }]
    ]
  }
}
```

```sh
npx expo run:ios      # or: npx expo run:android
```

Bare React Native: install the same packages, run `pod install`, and add `NSMicrophoneUsageDescription` (iOS) and `RECORD_AUDIO` (Android). **[Full setup](https://alshell7.github.io/react-phone/native/quick-start/)**

## A full phone in one component

```tsx
import { SipPhone, type SipConfig } from "@azeer-ui-widget/react-native-phone";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Supply a stable config from your sign-in flow. Keep credentials in memory.
export function PhoneScreen({ config }: { config: SipConfig }) {
  return (
    <SipPhone
      config={config}
      autoConnect
      variant="screen"
      insets={useSafeAreaInsets()}
      theme={{ appearance: "system" }}
      visualization={{ type: "orb" }}
      onAnswered={(call) => console.info("Answered", call.id)}
      onDisconnected={(call) => console.info("Ended", call.endReason)}
    />
  );
}
```

`autoConnect` defaults to false. Memoize `config`: a new object intentionally re-registers. The microphone is requested only when someone dials or answers; a blocked permission shows an **Open Settings** action.

## A phone that becomes an island

```tsx
import { SipPhoneIsland } from "@azeer-ui-widget/react-native-phone";

// Render last in your root view so it floats above every screen.
<SipPhoneIsland
  config={config}
  autoConnect
  placement="top-center"
  incomingBehavior="notify"
  insets={useSafeAreaInsets()}
/>;
```

The capsule shows registration status, then a live timer and voice bars during calls. Tap or swipe to expand into the full phone; swipe back, tap outside, press Android Back, or use the iOS escape gesture to collapse. Collapsing never ends a call.

| Incoming behavior | Result                                                        |
| ----------------- | ------------------------------------------------------------- |
| `expand`          | Open the phone sheet for a new incoming call (default)        |
| `notify`          | Heads-up banner with caller, Answer, and Decline              |
| `manual`          | Keep the capsule collapsed; it pulses until the user opens it |

## Speaker, ringtone, and haptics

Audio routing is native territory, so it is an adapter instead of a hard dependency:

```tsx
import InCallManager from "react-native-incall-manager";
import { createInCallManagerAudioSession } from "@azeer-ui-widget/react-native-phone";

const audioSession = createInCallManagerAudioSession(InCallManager, { systemRingtone: true });

<SipPhone config={config} audioSession={audioSession} />; // enables the Speaker button
```

Synthesized call tones use any Web Audio context (browsers automatically, or `react-native-audio-api` on devices). Keypad and call haptics work out of the box on Android; pass an `expo-haptics` adapter for iOS taptic feedback. **[Sound, routing, and haptics](https://alshell7.github.io/react-phone/native/audio/)**

## Compose your own

```tsx
import { CallControls, PhoneProvider, usePhone } from "@azeer-ui-widget/react-native-phone";

function MyCallBar() {
  const { state } = usePhone();
  return state.status === "active" ? <CallControls buttons={["mute", "speaker", "hangup"]} /> : null;
}

<PhoneProvider config={config} autoConnect>
  <YourScreens />
  <MyCallBar />
</PhoneProvider>;
```

Every piece is exported: `Dialer`, `Keypad`, `CallerCard`, `CallControls`, `IncomingCallActions`, `SlideToAnswer`, `TransferPanel`, `ConnectionForm`, `AudioSettings`, `CallHistory`, `ConnectionStatus`, `CallTimer`, `ErrorBanner`, `Orb`, `LiveWaveform`, `BarVisualizer`, and the headless `PhoneClient` from `@azeer-ui-widget/react-native-phone/core`. **[Composable API](https://alshell7.github.io/react-phone/native/components/)**

## Develop

```sh
cd native
npm install
npm run example            # Expo dev server (press w for web, a for Android, i for iOS)
npm run check              # publish/ freshness, types, and 142 unit/component tests
npm run test:e2e           # Playwright: desktop + mobile UI, and real SIP/WebRTC calls on a local registrar
npm run test:live          # Real registration against your PBX (.env.local)
npm run test:live:call     # A real call through your PBX from the web build (opt-in)
npm run package:build      # Refresh publish/ after editing src/
```

See [VALIDATION.md](./VALIDATION.md) for what is verified automatically and what needs a device.

## License and credits

[MIT © 2026 Owais](./LICENSE). [JsSIP](https://jssip.net/) handles SIP; [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc) handles media. The Orb, Live Waveform, Bar Visualizer, and Waveform are native re-implementations inspired by [ElevenLabs UI](https://ui.elevenlabs.io/); see [THIRD_PARTY_NOTICES.md](https://github.com/alshell7/react-phone/blob/main/THIRD_PARTY_NOTICES.md).
