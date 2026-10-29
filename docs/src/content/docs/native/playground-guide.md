---
title: Playground
description: Use the React Native playground on the web or a device to tune the phone, rehearse calls, and copy embed code.
---

The [playground](/react-phone/native/playground/) is the Expo example app running on the web. The same app runs on iOS and Android from `native/example`.

<img src="/react-phone/media/native/playground-desktop.png" alt="React Native playground with a phone in a device frame and the inspector" width="900" />

- **Surfaces**: switch between the full-screen phone, the island over a sample app, and the card.
- **Design**: appearance, theme preset (Forest, Ocean, Midnight, Graphite, Sunset, Lavender), accent override, control shape, answer colour, language (English, Español, Français), phone preset, caller visual, and caller identity.
- **Behavior**: answer style, island placement and incoming behaviour, island tone, tones, haptics, motion, contact suggestions (sample contacts in Preview: type `2 6` or `70`), speed dial (long-press 1 or 2), keypad letters, number formatting, button captions, a custom Notes button, and a prefilled number.
- **Connection**: Preview (simulated, no network) or **Live SIP**. Enter your account at runtime; credentials stay in memory and are cleared after registration. Optional non-secret prefill comes from `EXPO_PUBLIC_SIP_USERNAME`, `EXPO_PUBLIC_SIP_URI`, and `EXPO_PUBLIC_SIP_WEBSOCKET_URL`.
- **Code**: copy embed code for the current configuration. It never includes credentials.

On a phone, the playground uses a floating tab bar (Phone, Island, Card, Configure). **Simulate incoming call** appears in Preview mode.
