---
title: "Sound & motion"
description: "Sound & motion for Azeer React Phone. Configuration, examples, and expected behavior."
---

Configure the window and sound without replacing the underlying call session.

## Window, branding & controls

```tsx
<WebPhone
  config={config}
  autoConnect
  preset="advanced"
  visualization={{ type: "orb" }}
  theme={{ accent: "#285dab" }}
  controls={["mute", "hold", "transfer", "hangup"]}
  draggable={{ bounds: "viewport", initialPosition: { x: 0, y: 0 } }}
  branding={{ name: "Your company", href: "https://example.com" }}
  motion={{ enabled: true, durationMs: 220 }}
/>
```

| Option                                   | Behavior                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `controls`                               | Select/order `mute`, `keypad`, `hold`, `transfer`, `hangup`. Utility rows resize to the visible buttons; hangup occupies the last row. Default: all five, subject to preset features. |
| `features.mute`                          | Show/hide mute, default `true` in all presets. The button toggles to Unmute with an accessible pressed state.                                                                         |
| `draggable`                              | `false` by default; `true` adds a grip. Object options enable bounds (`viewport` default, or `parent`) and an initial translation in pixels.                                          |
| `draggable.position`, `onPositionChange` | Controlled `{x, y}` positioning. Supply both and update the position when notified. Viewport/parent resize keeps the grip reachable.                                                  |
| `branding`                               | Optional small **Powered by …** text at the very bottom, including compact layout and custom/hidden footers. Only HTTP(S) links become clickable. Omit to hide.                       |
| `motion`                                 | `true` by default; `false` removes widget and visual motion. An object controls `enabled` and `durationMs` (80–600, default 220). OS reduced motion always takes precedence.          |

The drag grip supports mouse, touch, pen, and keyboard: arrow keys move 10 px, Shift+arrows 40 px, Home restores the initial position. Parent bounds require a host container with room to move. Dragging translates the inline widget; host ancestors with clipped overflow constrain what remains visible. Disabling dragging returns it to its normal layout position.

Motion keeps panel resizing continuous and provides short control/answer/transfer feedback. An interrupted resize starts from the current visible height. Content remains usable with animations off. Incoming Answer/Decline remain available; if you omit `hangup`, supply your own end-call action using `client.hangup()`. `CallControls buttons={["mute", "hangup"]}` provides the same customization in composed UIs.

## Ringing, call tones & keypad feedback

```tsx
<WebPhone
  config={config}
  autoConnect
  tones={{
    preset: "gentle", // "gentle" | "classic" | "minimal"
    volume: 0.35,
    haptics: true,
    events: { connected: true, disconnected: true, dtmf: true },
  }}
/>
```

| Cue            | Trigger                                                                                 |
| -------------- | --------------------------------------------------------------------------------------- |
| `incoming`     | Repeating inbound ringtone until answer/end                                             |
| `outgoing`     | Outgoing attempt begins                                                                 |
| `ringing`      | Outgoing ringing / SIP progress; stops when early media is available                    |
| `connected`    | A call is answered, once                                                                |
| `disconnected` | A call ends, once; disposal stops any remaining cue                                     |
| `dtmf`         | Real two-frequency keypad tone, also available before dialing; optional short vibration |

All three synthesized presets include these cues. Default: `gentle`, volume `0.35`, haptics off. `tones={false}` disables all cues. Use `events: { incoming: false }` to silence one cue, or `volume: 0` to silence audio. Haptics are optional and depend on browser/device support. Tones play through the browser's default output; remote voice retains its independently selected output/volume. Browser autoplay policy still applies; **Enable call audio** recovers blocked ringing/playback.

Configure tones on `PhoneProvider` or `new PhoneClient({ tones })` when composing widgets. `client.setTones(options)` updates them; `client.previewTone("incoming")` auditions one cycle while idle. `client.playKeypadTone("5")` gives local feedback without sending SIP DTMF; `client.sendDTMF("5")` sends DTMF and provides that feedback. Cues belong to the client, so mounting multiple controls does not duplicate sounds. The playground exposes preset, volume, per-cue audition, vibration, window, branding, motion, and button settings; embed code includes the chosen options.

For anchored window/container positioning, use [PhoneIsland](/react-phone/dynamic-island/). Its positioning replaces free dragging. Incoming presentation does not change ringtone settings; disable the incoming tone separately if you need a quiet experience.
