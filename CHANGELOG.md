# Changelog

## 0.1.1 — 2026-09-16

- Fix JSR npm compatibility by publishing JSX-free TypeScript generated from the original TSX sources. Ordinary React/Vite projects need no custom `npm:` resolver.
- Preserve public types and JSDoc in the generated modules; verify they match `src/` before release.
- Declare React 19 support consistently. React and its types use compatible `^19.0.0` ranges so npm can share the host's React runtime.

Use 0.1.1 or later for npm-compatible installations. Version 0.1.0's TSX output from JSR's npm bridge is not compatible with a standard Vite setup.

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
