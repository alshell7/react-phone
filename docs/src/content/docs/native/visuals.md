---
title: Orb, waveforms & bars
description: Native Orb, Live Waveform, Bar Visualizer, and Waveform driven by real call audio from WebRTC statistics.
---

The visuals are native re-implementations of the ElevenLabs UI components used by the web package. They render with `react-native-svg` and Views, animate transforms on the native driver, and read audio activity from **WebRTC statistics** (`audioLevel` / `totalAudioEnergy`), which behave the same on iOS, Android, and the web. No extra audio tap, microphone, or API key is involved.

```tsx
<SipPhone
  config={config}
  visualization={{
    type: "orb", // "avatar" | "orb" | "waveform" | "bars" | "both" | "none"
    orb: { size: 168, speed: 0.8, seed: 7, colors: ["#285dab", "#a6cfff"] },
    waveform: { mode: "scrolling", source: "remote", barWidth: 3, barGap: 2 },
    bars: { barCount: 12, height: 64 },
  }}
/>
```

| Visual        | Behaviour                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Orb           | Layered gradient blobs rotate and breathe with speech **only during an active, unheld call**; still otherwise   |
| Waveform      | `static` mirrored bars or `scrolling` history from `remote` or `local` audio; edges fade                        |
| Bars          | Lifecycle sequences while connecting/ringing; speech-shaped bands while talking; quiet on hold                  |
| Avatar        | Photo, initials, or a glyph, with ripple rings while ringing                                                     |

| SIP / media condition                     | Bar state      | Orb          |
| ----------------------------------------- | -------------- | ------------ |
| Ready, no call                            | `idle`         | Still        |
| Registering / dialing                     | `connecting`   | Still        |
| Waiting for microphone / answering        | `initializing` | Still        |
| Incoming or remote ringing                | `ringing`      | Still        |
| Active, quiet                             | `listening`    | Gentle motion |
| Active, either side speaking              | `speaking`     | Audio-reactive |
| Transfer pending                          | `thinking`     | Still        |
| Held (either side)                        | `held`         | Still        |

Muting removes your microphone from the activity. `motion={false}`, `orb.animate: false`, `orb.speed: 0`, and the system **Reduce Motion** setting stop all animation.

## Custom visuals

```tsx
import { useCallActivity } from "@azeer-ui-widget/react-native-phone";

function MyMeter() {
  const { state, input, output, bands } = useCallActivity(8);
  return <MyBars levels={bands} label={state} />;
}
```

One statistics poller per client is shared by every mounted visual and pauses in the background. Standalone components work without a provider: `<Orb getOutputVolume={() => level} />`, `<LiveWaveform active getLevel={() => level} />`, `<BarVisualizer state="speaking" bands={bands} />`, and `<Waveform data={samples} />`.
