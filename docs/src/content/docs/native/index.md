---
title: React Native Phone
description: A SIP phone designed for iOS, Android, and the web. Full-screen calls, a dynamic island, an iOS-style keypad, and composable controls.
---

Ship a full-screen phone, a floating **dynamic island**, or your own call controls in a React Native app. The calling engine is the same JsSIP lifecycle as the [React package](/react-phone/), rebuilt around native media, permissions, audio routing, and touch.

<div class="intro-links">
<a href="/react-phone/native/quick-start/">Start building</a>
<a href="/react-phone/native/playground/">Open playground</a>
<a href="https://jsr.io/@azeer-ui-widget/react-native-phone">JSR package</a>
</div>

<div class="widget-gallery">
<img src="/react-phone/media/native/screen-active.png" alt="Full-screen call with a live orb, a grid of round controls, and a red end button" width="260" />
<img src="/react-phone/media/native/screen-keypad.png" alt="iOS-style keypad with large round keys and a green call button" width="260" />
<img src="/react-phone/media/native/island-banner.png" alt="Dynamic island showing a heads-up incoming call banner" width="260" />
</div>

## Start with one component

```sh
npx jsr add @azeer-ui-widget/react-native-phone
npx expo install react-native-webrtc @config-plugins/react-native-webrtc react-native-svg
```

```tsx
import { SipPhone, type SipConfig } from "@azeer-ui-widget/react-native-phone";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PhoneScreen({ config }: { config: SipConfig }) {
  return <SipPhone config={config} autoConnect variant="screen" insets={useSafeAreaInsets()} />;
}
```

## Choose your integration

| You need                                             | Start with                              | Guide                                                   |
| ---------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| A dedicated phone screen or tab                      | `SipPhone variant="screen"`             | [Phone surfaces](/react-phone/native/surfaces/)         |
| A phone that floats over every screen                | `SipPhoneIsland`                        | [Dynamic island](/react-phone/native/dynamic-island/)   |
| Contact suggestions, speed dial, your own call buttons | `contacts`, `speedDial`, `extraControls` | [Contacts & speed dial](/react-phone/native/contacts/) |
| Your brand, your language                            | `theme.preset`, `labels`, `formatNumber` | [Themes, identity & motion](/react-phone/native/customization/) |
| A phone inside a scroll view, modal, or bottom sheet | `variant="card"` / `variant="sheet"`    | [Phone surfaces](/react-phone/native/surfaces/)         |
| Your own call bar, keypad, or CRM screen             | `PhoneProvider` + `usePhone()`          | [Compose your own](/react-phone/native/components/)     |
| Calling without React                                | `PhoneClient` from `/core`              | [Compose your own](/react-phone/native/components/#headless-client) |

## How it differs from the web package

| Topic                 | React (web)                       | React Native                                                                 |
| --------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| Media                 | Browser WebRTC                    | react-native-webrtc on iOS/Android; browser WebRTC under react-native-web    |
| Permissions           | Browser prompt                    | iOS prompt or Android runtime permission; blocked state links to Settings    |
| Speaker               | Output device (`setSinkId`)       | Earpiece/loudspeaker routing through an audio-session adapter                |
| DTMF                  | RFC 2833                          | RFC 2833 when available, automatic SIP INFO fallback                         |
| Audio visuals         | Web Audio analysers               | WebRTC statistics (identical on every platform)                              |
| Island                | Fixed-position panel              | Capsule, heads-up banner, swipe gestures, Android Back, iOS escape gesture   |
| Lifecycle             | Page visibility                   | Re-registers when the app returns to the foreground                          |

This release handles **one audio call per client**. CallKit/ConnectionService, push-woken incoming calls, video, conferencing, recording, and emergency calling are outside its scope; [Platforms & recovery](/react-phone/native/platforms/#calls-while-in-the-background) explains how to integrate system call UI.
