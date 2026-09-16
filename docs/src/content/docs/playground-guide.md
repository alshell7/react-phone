---
title: "Playground"
description: "Playground for Azeer React Phone. Configuration, examples, and expected behavior."
---

**[Open the hosted playground](/react-phone/playground/)** to try every preset, visual, tone, and incoming-call behavior.

![The Azeer phone playground with a live configuration inspector](/react-phone/media/playground-desktop.png)

## Run locally

Requires Node.js 22.12+ or 24+ and a current WebRTC-capable browser.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The playground starts in **Preview** mode: simulated calls, no SIP traffic, no microphone capture. Try dialing an extension or **Simulate incoming call**, then switch layouts, colors, and caller details. **Get embed code** produces your current component configuration without account credentials.

### Connect the supplied test account

1. Switch to **Live SIP** and open **Connection**.
2. Enter your SIP username and password. The password is intentionally not included in this public repository.
3. Review **Server & network settings**, then select **Connect account**.
4. Dial a reachable extension, or call your registered extension from another phone to test receiving.

| Demo field               | Initial value                     |
| ------------------------ | --------------------------------- |
| Authentication username  | `T6_7002_1`                       |
| SIP address              | `sip:T6_7002_1@voice.mottasl.com` |
| Display name / extension | `7002`                            |
| WebSocket server         | `wss://voice.mottasl.com:8089/ws` |
| Password                 | Enter at runtime                  |

The **SIP address** is your address of record; **username** is your digest authentication identity. This VitalPBX account successfully registered on **2026-09-16** using the full tenant-prefixed device identity `T6_7002_1` in both fields. `7002` remains the user-facing extension. A second reachable endpoint is still needed to verify production call audio and routing. No TURN server is assumed; supply one if your deployment needs a media relay.

Credentials remain in memory for the active connection; successful registration clears the form's password field. The app never writes credentials or call history to local/session storage. Disconnecting or unmounting clears the client's credentials and media. Reloading resets the session. Your browser's own password manager is controlled by you.

## Explore the island

Open **Dynamic island**, enable **Use dynamic island**, and choose the window or preview container. Change the position and incoming-call presentation, then select **Simulate incoming call**. **Get embed code** includes the corresponding `WebPhoneIsland` options. For container scope, place the generated component inside a parent with `position: relative` and an explicit height.

## Mobile

<img src="/react-phone/media/playground-mobile.png" alt="The responsive playground on a mobile screen" width="390" loading="lazy" />
