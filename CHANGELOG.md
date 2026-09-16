# Changelog

## 0.1.2 — 2026-09-16

- Fix React declarations for strict TypeScript consumers (`skipLibCheck: false`) using a declaration-only namespace bridge. Public prop types and runtime behavior are unchanged.
- Add a post-publication CI check that installs the actual JSR npm artifact into an independent React 19 app and verifies types, production build, Orb rendering, incoming/outgoing preview calls, island persistence, and lifecycle callbacks.

Use **0.1.2 or later**. Version 0.1.0 has incompatible npm JSX output; 0.1.1 fixes the build but its generated React imports fail strict declaration checks.

## 0.1.1 — 2026-09-16

- Fix JSR npm compatibility by publishing JSX-free TypeScript generated from the original TSX sources. Ordinary React/Vite projects need no custom `npm:` resolver.
- Preserve public types and JSDoc in the generated modules; verify they match `src/` before release.
- Declare React 19 support consistently. React and its types use compatible `^19.0.0` ranges so npm can share the host's React runtime.

Version 0.1.0's TSX output from JSR's npm bridge is not compatible with a standard Vite setup.

## 0.1.0 — 2026-09-16

First public release of `@azeer-ui-widget/react-phone`.

### Calling

- Incoming/outgoing SIP audio over secure WebSocket with JsSIP and WebRTC.
- Manual, prefilled, and once-per-request automatic calling.
- Answer, decline, cancel, mute, hold, DTMF, and blind REFER transfer.
- Microphone permissions, device selection, autoplay recovery, and bounded reconnection.
- Typed events, sanitized errors, and media cleanup across cancellation and unmount races.

### Interface

- Basic, advanced, and compact presets; composable controls and a headless client.
- Dynamic island with window/container docking, six positions, and expand/notify/manual incoming modes.
- Configurable ElevenLabs UI Orb, Live Waveform, and Bar Visualizer source adaptations.
- Scoped themes, caller metadata and render slots, selectable controls, branding, dragging, and motion.
- Synthesized call cues and keypad feedback, optional haptics, and reduced-motion support.

### Developer experience

- React playground with preview/live modes and credential-free configuration export.
- Dark Starlight documentation, real widget screenshots, and static Mermaid diagrams.
- GitHub Pages documentation/playground deployment and JSR OIDC publishing.
- MIT license with preserved third-party notices.

### Scope

One audio call per client. Blind transfer requires PBX REFER support. Production PBX routing, two-way audio, and TURN must be verified against your own deployment. Attended transfer, conferencing, recording, and emergency calling are not included.
