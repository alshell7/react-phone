---
title: React Phone
description: A composable SIP phone for React. Ship a complete calling interface, a dynamic island, or your own controls.
---

Embed a complete SIP phone, dock it as a dynamic island, or compose the controls your product needs. Built with React, TypeScript, JsSIP, and adapted ElevenLabs UI audio visuals.

<div class="intro-links">
<a href="/react-phone/quick-start/">Start building</a>
<a href="/react-phone/playground/">Open playground</a>
<a href="https://github.com/alshell7/react-phone">Source on GitHub</a>
</div>

![Azeer React Phone — Your interface. Every conversation. React, TypeScript, SIP, WebRTC, MIT.](/react-phone/media/repository-banner.png)

## Start with one component

```sh
npx jsr add @azeer-ui-widget/react-phone
```

```tsx
import { WebPhoneIsland, type SipConfig } from "@azeer-ui-widget/react-phone";

export function SupportPhone({ config }: { config: SipConfig }) {
  return (
    <WebPhoneIsland
      config={config}
      autoConnect
      placement="bottom-right"
      incomingBehavior="notify"
      theme={{ appearance: "dark", accent: "#91edc2" }}
      visualization={{ type: "orb" }}
    />
  );
}
```

Supply a stable configuration after sign-in. The phone asks for microphone access when the user dials or answers. No separate stylesheet or ElevenLabs API key is required.

## Choose your integration

| You need                                          | Start with                     | Guide                                                                   |
| ------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| A ready-to-use phone in your layout               | `WebPhone`                     | [Quick start](/react-phone/quick-start/)                                |
| A small persistent phone that expands for calls   | `WebPhoneIsland`               | [Dynamic island](/react-phone/dynamic-island/)                          |
| Your own dialer, transfer button, or call toolbar | `PhoneProvider` + `usePhone()` | [Composable UI](/react-phone/components/)                               |
| Calling without React                             | `PhoneClient` from `/core`     | [Client methods](/react-phone/components/#custom-buttons-with-usephone) |

## One line. Every essential control.

| Calling                           | Presentation                           | Integration                  |
| --------------------------------- | -------------------------------------- | ---------------------------- |
| Incoming / outgoing audio         | Basic, advanced, compact presets       | React 18.3 / 19 + TypeScript |
| Mute, hold, DTMF, blind transfer  | Orb, live waveform, frequency bars     | Typed lifecycle callbacks    |
| Device selection, audio recovery  | Themes, identity, tags, render slots   | Source package on JSR        |
| Permission and reconnect handling | Island placement and incoming behavior | MIT license                  |

This release handles **one audio call per client**. Transfer requires PBX REFER support. Conferencing, attended transfer, recording, and emergency calling are outside its scope.

## Try it before you connect

![The working React playground, with phone presets and configuration controls](/react-phone/media/playground-desktop.png)

The [playground](/react-phone/playground/) opens in clearly labeled Preview mode. Simulate a call, tune the interface, then copy your component configuration. Switch to Live SIP to register your own account.

## Built from real components

The Orb shader, Live Waveform, Bar Visualizer, and Waveform are source adaptations of [ElevenLabs UI](https://ui.elevenlabs.io/). They borrow the current call's media streams. The SIP connection and WebRTC audio run through [JsSIP](https://jssip.net/).

See [validation and production limits](/react-phone/development/), [release notes](https://github.com/alshell7/react-phone/releases), and [third-party notices](https://github.com/alshell7/react-phone/blob/main/THIRD_PARTY_NOTICES.md).
