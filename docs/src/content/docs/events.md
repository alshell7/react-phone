---
title: "Events & lifecycle"
description: "Events & lifecycle for Azeer React Phone. Configuration, examples, and expected behavior."
---

Connection and call state are independent. A connected account can be idle, ringing, or in a call.

## Connection state

![SIP registration transitions through connecting, registered, reconnecting and error states](/react-phone/diagrams/registration.svg)

<details>
<summary>Mermaid source</summary>

```mermaid
stateDiagram-v2
  [*] --> Disconnected
  Disconnected --> Connecting: connect
  Connecting --> Registered: SIP registration succeeds
  Connecting --> Error: timeout or rejection
  Registered --> Reconnecting: WebSocket lost
  Reconnecting --> Registered: registered again
  Reconnecting --> Error: retry limit or timeout
  Registered --> Disconnected: disconnect
  Error --> Connecting: reconnect
```

</details>

## Call state

![Call lifecycle from idle through incoming or dialing, active, held, and ended](/react-phone/diagrams/call-lifecycle.svg)

<details>
<summary>Mermaid source</summary>

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Microphone: dial
  Idle --> Incoming: INVITE
  Incoming --> Microphone: answer
  Microphone --> Ringing: outgoing INVITE
  Microphone --> Active: incoming answer accepted
  Ringing --> Active: answered
  Active --> Held: hold
  Held --> Active: resume
  Active --> Ended: hangup or completed transfer
  Held --> Ended: hangup
  Incoming --> Ended: decline or caller cancelled
  Microphone --> Ended: denied or cancelled
  Ringing --> Ended: busy or no answer
  Ended --> Idle: next interaction
```

</details>

The client retains `ended` until the next call starts, keeping its outcome available to the UI. Connection and call state are independent.

## Callbacks

| Callback                     | When                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| `onIncomingCall(call)`       | A new incoming call is accepted by the local line          |
| `onAnswered(call)`           | The call is answered/attended; exactly once                |
| `onDisconnected(call)`       | A call ends, including failures/cancellation; exactly once |
| `onConnectionChange(status)` | Registration / transport state changes                     |
| `onError(error)`             | Actionable sanitized error                                 |
| `onEvent(event)`             | All lifecycle events below                                 |

Event types: `connection`, `incoming`, `outgoing`, `answered`, `disconnected`, `muted`, `held`, `dtmf`, `transfer-started`, `transferred`, `error`. Payload: `{ type, timestamp, call, connection, error?, value? }`. Call data includes ID, direction, caller, start/answer/end timestamps, and end reason. It never includes passwords, complete SIP requests, or raw server responses. In-memory demo history/logs can contain phone numbers; apply your own retention policy in a host application.
