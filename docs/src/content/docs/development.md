---
title: "Development & releases"
description: "Development & releases for Azeer React Phone. Configuration, examples, and expected behavior."
---

```sh
npm run package:build
npm run package:check
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npx jsr publish --dry-run --allow-dirty
```

Unit tests cover configuration, authentication failure, timeouts, call/permission races, busy handling, duplicate terminal events, media cleanup, transfer success/failure, and preview behavior. Browser tests exercise the UI on desktop/mobile and run automated WCAG accessibility checks. They also verify prefill/automatic dialing under StrictMode, no repeat attempts after reconnection or microphone denial, WebGL fallback, reduced motion, and borrowed-stream cleanup. A local SIP registrar/proxy connects two actual JsSIP browser clients, automatically dials after digest registration, and verifies two-way WebRTC audio, mute, hold/resume, DTMF sending, and hangup. This does not validate your production PBX or TURN setup; complete a live call with a second registered endpoint before deployment.

| Directory                    | Responsibility                                               |
| ---------------------------- | ------------------------------------------------------------ |
| `src/core/`                  | SIP state, media ownership, validation, public event types   |
| `src/react/`                 | Provider and external-store hook                             |
| `src/components/`            | Presets, composable controls, scoped themes                  |
| `src/components/elevenlabs/` | Attributed ElevenLabs UI Orb/shader and waveform adaptations |
| `publish/`                   | Generated JSX-free TypeScript for JSR; do not edit directly   |
| `demo/`                      | React playground; excluded from the published source package |
| `tests/`                     | Lifecycle unit tests and desktop/mobile browser tests        |

## Documentation and Pages

```sh
npm ci
npm ci --prefix docs
npm run docs:dev
# Build documentation and the playground as one Pages artifact:
npm run site:build
```

Starlight serves `/react-phone/`; the React playground is copied to `/react-phone/playground/`. Both use the same GitHub Pages deployment. The documentation uses neutral dark tokens and Geist typography; it has no runtime dependency on the phone widget. Mermaid diagrams are rendered to static SVG with `npm run docs:diagrams` (install Playwright Chromium first).

## Publish to JSR

The package name and entry points are in `jsr.json`. Generated `publish/` sources, README, and license notices are explicitly allowlisted; the demo, credentials, test results, and development files are excluded.

Edit the original TypeScript/TSX in `src/`, then run `npm run package:build` and commit the generated `publish/` tree. This lowers JSX to React runtime calls while retaining public TypeScript annotations and documentation. JSR's npm bridge can then emit ordinary JavaScript without leaving TSX files containing `npm:` imports. CI runs `npm run package:check` to reject stale generated files. The committed output also keeps the supplied Publish workflow build-free.

The published package targets React 19. Before a release, validate a separate React app installed from JSR, including its production build and public API types; building this repository's playground alone does not test JSR's npm conversion.

`nodeModulesDir: "auto"` lets the publisher resolve dependencies in a clean checkout without an `npm install` step. `lock: false` prevents the publisher from generating a second lockfile that would make the release checkout dirty; normal development uses the committed `package-lock.json`.

```sh
# Validate locally without uploading a release.
npx jsr publish --dry-run --allow-dirty

# Publish after reviewing and committing the release.
npx jsr publish
```

The supplied `.github/workflows/publish.yml` is preserved exactly: pushes to `main` publish with GitHub OIDC through the linked `alshell7/react-phone` repository. Keep `package.json` and `jsr.json` versions in sync. Bump both for a new release; JSR versions are immutable. The independent `check.yml` runs types, unit/browser tests, build, and publishing validation. Configure branch protection to require **Check** before merging; the requested Publish workflow does not depend on that job.

## License & attribution

MIT © Owais. [ElevenLabs UI](https://ui.elevenlabs.io/) supplies the adapted Orb and waveform components; [JsSIP](https://jssip.net/) handles SIP/WebRTC. [react-softphone](https://github.com/chamuridis/react-softphone) informed the tutorial/architecture approach. See [THIRD_PARTY_NOTICES.md](https://github.com/alshell7/react-phone/blob/main/THIRD_PARTY_NOTICES.md) for attribution and licenses. No ElevenLabs API key is needed.
