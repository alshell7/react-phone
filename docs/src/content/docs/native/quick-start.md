---
title: Quick start
description: Install the React Native SIP phone in an Expo or bare app, configure permissions, and place your first call.
---

## Expo (recommended)

WebRTC is a native module, so use a [development build](https://docs.expo.dev/develop/development-builds/introduction/); **Expo Go cannot place calls**. Preview mode still works in Expo Go and on the web.

```sh
npx jsr add @azeer-ui-widget/react-native-phone
npx expo install react-native-webrtc @config-plugins/react-native-webrtc react-native-svg react-native-safe-area-context
```

```json title="app.json"
{
  "expo": {
    "ios": { "infoPlist": { "UIBackgroundModes": ["audio", "voip"] } },
    "android": { "permissions": ["RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS"] },
    "plugins": [
      ["@config-plugins/react-native-webrtc", { "microphonePermission": "Calls need your microphone so the other person can hear you." }]
    ]
  }
}
```

```sh
npx expo run:android   # or npx expo run:ios
```

Pair `react-native-webrtc` and the config plugin versions as listed in the [plugin's compatibility table](https://github.com/expo/config-plugins/tree/main/packages/react-native-webrtc).

## Bare React Native

```sh
npx jsr add @azeer-ui-widget/react-native-phone
npm install react-native-webrtc react-native-svg
cd ios && pod install
```

Add `NSMicrophoneUsageDescription` to `Info.plist`, and `RECORD_AUDIO` plus `MODIFY_AUDIO_SETTINGS` to `AndroidManifest.xml`. The phone requests the permission at runtime the first time someone dials or answers.

## Your first phone

```tsx
import { useMemo } from "react";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { SipPhone, type SipConfig } from "@azeer-ui-widget/react-native-phone";

function Phone({ password }: { password: string }) {
  // Keep the config stable: a new object intentionally re-registers.
  const config = useMemo<SipConfig>(
    () => ({
      websocketUrl: "wss://pbx.example.com:8089/ws",
      uri: "sip:1001@pbx.example.com",
      authorizationUsername: "1001",
      password,
    }),
    [password],
  );
  return (
    <SipPhone
      config={config}
      autoConnect
      variant="screen"
      insets={useSafeAreaInsets()}
      theme={{ appearance: "system" }}
      onIncomingCall={(call) => console.info("Incoming", call.caller.number)}
      onDisconnected={(call) => console.info("Ended", call.endReason)}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Phone password={/* from your sign-in flow */ ""} />
    </SafeAreaProvider>
  );
}
```

Never hardcode SIP passwords or put them in `EXPO_PUBLIC_*` variables: those are bundled into the app. Fetch credentials after sign-in and keep them in memory.

## Try it without an account

```tsx
const preview = { enabled: true as const };
<SipPhone preview={preview} variant="screen" />;
```

Preview simulates registration, ringing, answer, hold, transfer, and audio activity with no network or microphone. Use `client.simulateIncoming()` to rehearse incoming calls. It runs in Expo Go, on devices, and in the [web playground](/react-phone/native/playground/).
