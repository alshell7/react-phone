---
title: "Compose your own UI"
description: "Compose your own UI for Azeer React Phone. Configuration, examples, and expected behavior."
---

```tsx
import {
  PhoneProvider,
  PhoneRoot,
  ConnectionForm,
  CallerCard,
  Dialer,
  CallControls,
  TransferPanel,
  ErrorBanner,
} from "@azeer-ui-widget/react-phone";

export function CustomPhone() {
  return (
    <PhoneProvider onAnswered={(call) => console.info(call.id)}>
      <PhoneRoot theme={{ accent: "#285dab" }}>
        <ConnectionForm
          defaultValues={{
            websocketUrl: "wss://pbx.example.com/ws",
            uri: "sip:7002@pbx.example.com",
          }}
        />
        <CallerCard />
        <Dialer />
        <CallControls showTransfer={false} />
        <TransferPanel />
        <ErrorBanner />
      </PhoneRoot>
    </PhoneProvider>
  );
}
```

| Export                                       | Purpose                                                  |
| -------------------------------------------- | -------------------------------------------------------- |
| `WebPhoneIsland`, `PhoneIsland`              | Docked status capsule and expandable phone               |
| `CallBarVisualizer`, `BarVisualizer`         | Call-connected or standalone frequency bars              |
| `WebPhone`                                   | Provider + themed preset in one component                |
| `PhoneProvider`                              | Own one SIP client; share it across controls             |
| `PhoneWidget`                                | Preset UI attached to an existing provider               |
| `PhoneRoot`, `PhoneStyles`                   | Scoped theme and self-contained CSS                      |
| `ConnectionForm`, `ConnectionStatus`         | Account entry and registration state                     |
| `CallerCard`, `CallTimer`, `CallWaveform`    | Identity, duration, and audio feedback                   |
| `CallOrb`, `Orb`, `LiveWaveform`, `Waveform` | Call-connected Orb and standalone ElevenLabs visuals     |
| `Dialer`, `CallControls`, `TransferPanel`    | Independently embeddable call controls                   |
| `AudioSettings`, `ErrorBanner`               | Devices, microphone access, recovery actions             |
| `usePhone()`                                 | `{ state, client, preview }` for your own UI             |
| `useAutoDial()`                              | Once-per-request outgoing calling in custom layouts      |
| `PhoneClient`                                | Framework-independent client; also exported from `/core` |

### Custom buttons with `usePhone`

```tsx
import { usePhone } from "@azeer-ui-widget/react-phone";

function TransferToSupport() {
  const { state, client } = usePhone();
  const connected = state.status === "active" || state.status === "held";
  return (
    <button
      disabled={!connected || state.transferPending}
      onClick={() => {
        try {
          client.transfer("7004");
        } catch {
          /* Render state.error or ErrorBanner. */
        }
      }}
    >
      {state.transferPending ? "Transferring…" : "Transfer to support"}
    </button>
  );
}
```

| Client method                           | Behavior                                                   |
| --------------------------------------- | ---------------------------------------------------------- |
| `connect(config): Promise<void>`        | Resolves on registration; rejects on timeout/failure       |
| `disconnect()`, `dispose()`             | End calls, unregister, stop audio, release devices         |
| `call(target, caller?): Promise<void>`  | Validate target, request microphone, dial                  |
| `answer(): Promise<void>`, `hangup()`   | Answer or decline/cancel/end the call                      |
| `setMuted(boolean)`, `setHeld(boolean)` | Mute or hold/resume an established call                    |
| `sendDTMF(tone)`                        | Send one digit, `*`, `#`, or `A`–`D`                       |
| `transfer(target)`                      | Blind REFER transfer; keeps the call until success NOTIFY  |
| `testMicrophone(): Promise<void>`       | Permission preflight; immediately releases its stream      |
| `setInputDevice(id)`                    | Select the next call's microphone; blocked during a call   |
| `setOutputDevice(id): Promise<void>`    | Change output where `setSinkId` is supported               |
| `setVolume(0…1)`, `playAudio()`         | Playback level and autoplay recovery                       |
| `clearError()`, `clearHistory()`        | Clear recoverable error or session history                 |
| `getSnapshot()`, `subscribe(listener)`  | Headless external-store API                                |
| `simulateIncoming(caller)`              | Available only when explicitly constructed in preview mode |

Promises reject for errors and synchronous actions can throw; handle them in your host UI. Errors also appear in `state.error`. Host callback exceptions are isolated so they cannot interrupt cleanup. If you supply an external `client` to `PhoneProvider`, you own its disposal. `historyLimit` is configurable on `new PhoneClient({ historyLimit: 25 })` (default: 50).

## Sound controls

| Method                  | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `setTones(options)`     | Update cue preset, volume, per-event toggles, and haptics |
| `previewTone(event)`    | Play one cue cycle while the line is idle                 |
| `playKeypadTone(digit)` | Local key feedback only; does not send SIP DTMF           |

`useCallActivity()` exposes call state, input/output levels, and normalized frequency bands for custom visuals. Use `PhoneProvider` once per line; mounting multiple all-in-one phones creates independent connections.
