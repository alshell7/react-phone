# Validation

Validation performed on 2026-10-29 on macOS (Apple M1) with Node.js 24, Expo SDK 58 (React Native 0.88.1, react-native-webrtc 124.0.8), and Playwright Chromium 156.

| Check                                         | Result                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                                    | Pass: strict library (`src`, tests) and the Expo example                                                                                                                                                                                                                                 |
| 142 unit and component tests (Jest + RNTL)    | Pass: 43 client lifecycle tests (the web suite's races plus permission `denied`/`blocked`, Settings recovery, readable end reasons for SIP causes, SIP INFO DTMF fallback, audio-session start/stop/speaker, adapter failure isolation, stats-based levels, foreground re-registration, ICE loss, bounded history), validation, tones with injected audio contexts and haptics, InCallManager adapter, theme tokens, and 25 component tests covering every surface, preset, keypad, DTMF, incoming, slide-to-answer, transfer, settings, connection form, error recovery, island behaviours, auto-dial, Recents, branding, and accessible names |
| Real SIP + WebRTC calls (local registrar)     | Pass: two playground pages register with MD5 digest auth on a local SIP registrar/proxy (ported from the web suite) and call each other through the phone's own UI with real JsSIP and Chromium WebRTC (fake microphone): ringing, answer, real remote audio driving the stats-based bars to `speaking`, mute/unmute, hold with the other phone showing "Caller put you on hold", resume, DTMF, and hangup on both sides; REGISTER/INVITE/ACK/BYE and the hold/resume re-INVITEs observed on the wire. A wrong password is explained inline without registering; an unknown extension reports "Number not found". This run caught raw JsSIP causes ("BYE") being shown to people, now mapped to readable reasons |
| 24 browser UI tests (Playwright, desktop + Pixel 7) | Pass on the exported web playground: dialing, incoming, in-call keypad, Recents, island banner/collapse/bounds, theme/preset/visual switching, credential-free embed code, live-mode validation, axe WCAG 2 A/AA in light and dark during idle/incoming/active calls, touch-target and name audit, reduced motion freezing the Orb, and Orb motion during calls |
| JSR artifact                                  | `npm run publish:check` passes: `publish/` matches `src/`, slow-types analysis and dependency resolution succeed. `npm run test:staged` bundles the playground from the staged JSR files (confirmed via source map) and the full browser suite (UI and SIP wire) passes against it |
| Documentation                                 | Starlight build passes (26 pages) with generated screenshots from Preview mode                                                                                                                                                                                                          |

## Live PBX

`npm run test:live` uses real JsSIP over Node's WebSocket against the PBX configured in `.env.local`:

- TLS WebSocket connection to the supplied server succeeded, and the server issued a standard digest challenge (`realm="asterisk"`, MD5, `qop=auth`). JsSIP answered it correctly.
- The supplied credentials were **rejected with 401** for both supplied accounts, so registration and live calls could not be completed. The phone reported the sanitized "Registration was rejected" error, as designed. Attempts were stopped early to avoid account lockout.
- Cross-check: the **web package's own playground** (`npm run dev` at the repository root), run on the same machine with the same credentials, was rejected identically (`401`, `401`, "Registration was rejected"), and the React Native web build in Chromium behaved the same. The credentials, not this package, are what the PBX refuses from this machine; a swapped username/password combination was also rejected.
- The unreachable-server path (timeout and bounded retries) was verified live.

With valid credentials, `npm run test:live` verifies registration, refresh, reconnect, and unregister, and `npx playwright test --project=live-sip` registers from the web build and, with `SIP_TEST_TARGET`, places a real call (Chromium fake microphone), mutes, unmutes, and hangs up.

## Not verified here

- Native iOS and Android builds on devices or emulators (this machine had no Xcode or Android SDK). The example app is configured for both (`expo prebuild` with the WebRTC config plugin, microphone permission text, Android permissions, iOS background modes).
- Speaker routing with a real audio session, Bluetooth routes, proximity sensor, and system ringtone.
- PBX interoperability for hold, REFER transfer, and DTMF over SIP INFO on a production server, and TURN on mobile networks.
- CallKit/ConnectionService and push-woken incoming calls (outside this release).

Preview-mode calls in tests and screenshots are explicitly simulated. No live account, server, or password is bundled in the source, playground, documentation, or generated embed code.
