---
title: "SIP configuration"
description: "SIP configuration for Azeer React Phone. Configuration, examples, and expected behavior."
---

Your PBX must support SIP over secure WebSocket and browser-compatible WebRTC audio. Authentication identity and the SIP address can differ.

```tsx
import type { SipConfig } from "@azeer-ui-widget/react-phone";

// Store this in state after sign-in; keep its identity stable.
const makeConfig = (username: string, password: string): SipConfig => ({
  websocketUrl: "wss://pbx.example.com/ws",
  uri: `sip:${username}@pbx.example.com`,
  authorizationUsername: username,
  password,
  displayName: "Support",
  // Supply deployment-specific STUN/TURN servers if required.
  iceServers: [],
});
```

| Option                           | Default / meaning                                                             |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `websocketUrl`                   | Required; `wss://…` (`ws://` allowed only for localhost)                      |
| `uri`                            | Required SIP address of record                                                |
| `authorizationUsername`          | Optional digest identity, separate from the URI user                          |
| `password`                       | Required; keep in memory                                                      |
| `displayName`, `registrarServer` | Optional caller name / explicit registrar                                     |
| `iceServers`                     | `[]`; supply your own STUN/TURN servers                                       |
| `iceTransportPolicy`             | `"all"`; set `"relay"` to require TURN                                        |
| `registrationTimeoutMs`          | `20000`                                                                       |
| `maxReconnectAttempts`           | `5`; retry delay managed by JsSIP (2–15 seconds)                              |
| `callTimeoutSeconds`             | `45`; unanswered-call timeout                                                 |
| `dtmfTransport`                  | `"RFC2833"`; use `"INFO"` when required by your PBX                           |
| `audioConstraints`               | Browser audio constraints; echo cancellation and noise suppression default on |

Never put passwords into public build-time variables (`VITE_*`, `PUBLIC_*`), checked-in files, or URLs. The hosted playground accepts credentials at runtime and keeps them in memory. A browser SIP client necessarily has access to its own credentials; use a dedicated, least-privilege PBX device account.
