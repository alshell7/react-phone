---
title: Develop, test & publish
description: Run the React Native example, the test layers (unit, component, browser, live PBX), and the JSR publishing flow.
---

The package lives in [`native/`](https://github.com/alshell7/react-phone/tree/main/native) beside the web package; `native/example` is the Expo playground for iOS, Android, and the web.

```sh
cd native
npm install
npm run example          # Expo dev server: w (web), a (Android), i (iOS)
npm run check            # publish/ freshness, TypeScript, unit + component tests
npm run test:e2e         # Playwright: UI suites + real SIP/WebRTC calls on a local registrar
npm run test:live        # Real JsSIP registration against your PBX
npm run test:live:call   # A real call through your PBX from the web build (opt-in)
npm run publish:check    # Stage and dry-run the JSR package
```

## Test layers

| Layer          | Tool                                    | Covers                                                                                                     |
| -------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Core           | Jest + mocked JsSIP and media adapters  | Lifecycle races, permission states, DTMF fallback, speaker/audio session, stats levels, tones, validation   |
| Components     | React Native Testing Library            | Every surface and preset, keypad, incoming, slide-to-answer, transfer, settings, island behaviours, a11y names |
| Browser        | Playwright (desktop + Pixel 7)          | The real web build: flows, island bounds, theme/preset switching, axe WCAG A/AA, reduced motion, orb motion |
| SIP wire       | Playwright + local registrar            | Two phones register with digest auth and call each other with real JsSIP and WebRTC: answer, live audio levels, mute, hold/remote hold, DTMF, hangup, rejected passwords, unknown numbers |
| Live PBX       | Jest (Node WebSocket) / Playwright      | Real REGISTER against your server; with `SIP_TEST_TARGET`, a real call with Chromium's fake microphone      |

Live tests read `native/.env.local` (git-ignored; see `.env.example`) or environment variables, and skip without credentials. In GitHub Actions, add `SIP_WSS_URL`, `SIP_URI`, `SIP_USERNAME`, `SIP_PASSWORD`, and `SIP_TEST_TARGET` as repository secrets then run the **React Native** workflow manually (`workflow_dispatch`) or add the `live-sip` label to a pull request: the `live` job registers and places a controlled call against your PBX. Ordinary pushes and pull request updates never use the account. Secrets are not available to pull requests from forks. The live browser call only runs with `SIP_LIVE=1` (`npm run test:live:call`) so routine runs never touch a real account.

## Native builds

```sh
cd native/example
npx expo prebuild
npx expo run:android      # needs JDK 17 and the Android SDK
npx expo run:ios          # needs Xcode
```

## Publishing to JSR

1. Edit `native/src`, then `npm run package:build` to regenerate the JSX-free `publish/` tree (CI fails on a stale tree).
2. Keep `native/package.json` and `native/jsr.json` versions aligned; JSR versions are immutable.
3. The **Publish** workflow stages the package with only its runtime dependencies (`npm run publish:stage`) and runs `npx jsr publish` from `.jsr-stage` using GitHub OIDC. Link `@azeer-ui-widget/react-native-phone` to this repository in the JSR package settings first.

Staging matters: publishing from `native/` would make Deno resolve the Expo example workspace. The staged manifest uses wide ranges (`react-native: 0.x`, `react-native-webrtc: 124 - 999`) so npm consumers never get a second React Native nested inside the package.
