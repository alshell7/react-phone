# Third-party notices

## ElevenLabs UI

The canvas rendering in `src/components/elevenlabs/waveform.tsx` is adapted from [ElevenLabs UI Waveform](https://github.com/elevenlabs/ui/blob/main/apps/www/registry/elevenlabs-ui/ui/waveform.tsx). It retains the bar visualization and edge-fading approach. Adaptations remove framework-specific utilities, scope styling, improve resize handling, and connect it to the phone-owned media stream without another microphone request.

Added on 2026-09-16 from upstream revision `23c31bd3088814215a8b5d0bfb56b327cad1a578`:

| Local component            | Upstream source                                                                                                                                      | Adaptations                                                                                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orb.tsx`, `orb-shader.ts` | [Orb](https://github.com/elevenlabs/ui/blob/23c31bd3088814215a8b5d0bfb56b327cad1a578/apps/www/registry/elevenlabs-ui/ui/orb.tsx)                     | Original vertex/fragment shaders; direct Three.js wrapper, bundled upstream noise texture instead of a runtime CDN image, lazy loading, speed/size/theme options, reduced motion, visibility throttling, resource cleanup and WebGL fallback. |
| `live-waveform.tsx`        | [Live Waveform](https://github.com/elevenlabs/ui/blob/23c31bd3088814215a8b5d0bfb56b327cad1a578/apps/www/registry/elevenlabs-ui/ui/live-waveform.tsx) | Retains mirrored/scrolling renderer, processing animation and fades. Borrows a supplied stream; removes microphone capture and track stopping, removes Tailwind/alias dependencies, handles reduced motion, validates FFT/bar sizes and cleans up fade animation.           |

`orb-texture.ts` bundles the [noise texture referenced by upstream Orb](https://storage.googleapis.com/eleven-public-cdn/images/perlin-noise.png) as a data URI, preserving the original appearance without a runtime CDN dependency. `CallOrb` and `CallWaveform` connect the adapted components to SIP call audio. These are source adaptations, not unmodified registry installations.

`bar-visualizer.tsx` adapts [ElevenLabs UI Bar Visualizer](https://github.com/elevenlabs/ui/blob/23c31bd3088814215a8b5d0bfb56b327cad1a578/apps/www/registry/elevenlabs-ui/ui/bar-visualizer.tsx): mirrored connecting sequences, center listening/thinking highlights, volume-to-height mapping and centered bars. The adaptation removes Tailwind utilities, accepts phone-owned frequency bands, adds SIP idle/ringing/held/ended/error states, uses transform-based bar motion, and pauses sequencing offscreen or under reduced motion. `CallBarVisualizer` supplies SIP state and borrowed-stream audio analysis.

MIT License

Copyright (c) 2025 Eleven Labs Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Other dependencies and references

- [JsSIP](https://github.com/versatica/JsSIP): MIT, retained in the dependency distribution.
- [Lucide](https://lucide.dev/license): ISC, retained in the dependency distribution.
- [Three.js](https://github.com/mrdoob/three): MIT, retained in the dependency distribution; loaded on demand by Orb.
- [Geist](https://github.com/vercel/geist-font): SIL Open Font License, demo only.
- [react-softphone](https://github.com/chamuridis/react-softphone) was used as an architecture/tutorial reference. No source was copied from that project.

This project is independent of ElevenLabs and does not require an ElevenLabs account or API key.
