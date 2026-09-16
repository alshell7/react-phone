---
title: "Permissions & recovery"
description: "Permissions & recovery for Azeer React Phone. Configuration, examples, and expected behavior."
---

| Edge case                                                  | Behavior                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Microphone not yet allowed                                 | Prompt on dial/answer, with a pending state and cancel action          |
| Permission denied, missing/busy device                     | Explain the problem and recovery; allow a fresh attempt                |
| Prompt unanswered for 30 seconds                           | End the attempt; release any stream granted later                      |
| Caller cancels / user hangs up while permission is pending | Ignore the stale answer/dial; stop late media                          |
| Rapid double-click or second INVITE                        | Reject duplicate dialing; respond busy to the extra call               |
| WebSocket loss                                             | End current call and release media; try registration again with limits |
| WebRTC ICE fails / remains disconnected for 10 seconds     | End the call and explain network/media configuration                   |
| Browser blocks audio                                       | Show **Enable call audio**; a user gesture retries playback            |
| Microphone physically disconnects                          | End call and release media with a device recovery message              |
| Transfer rejected/timed out                                | Keep the current call; offer retry; no false success                   |
| Unmount / account disconnect                               | Stop tracks, ringtone, audio, timers, and SIP client                   |
| React StrictMode                                           | Cleanup and remount safely; stale async events are ignored             |

Use HTTPS in production. A valid certificate, WebSocket-capable SIP server, compatible audio codecs, and correct media routing are required. Chrome/Edge provide the broadest device-selection support; browsers without `setSinkId` use the system output. Microphone permission is controlled by the browser and cannot be silently granted. Incoming ringtone playback may require the user to enable audio after browser suspension.

## Embedding in an iframe

Allow microphone use on the iframe and in the parent's Permissions Policy. Cross-origin frames need explicit delegation:

```html
<iframe
  src="https://your-phone.example.com"
  allow="microphone; autoplay"
  title="Support phone"
></iframe>
```

Prefer a React component when you control the host. For a strict CSP, pass `nonce` for the injected styles, allow the PBX in `connect-src`, and allow `data:` images for the Orb noise texture. Audio output selection is browser-dependent. The Orb uses a static fallback when WebGL is unavailable; reduced motion also stops animated visuals.
