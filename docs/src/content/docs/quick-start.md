---
title: "Quick start"
description: "Quick start for Azeer React Phone. Configuration, examples, and expected behavior."
---

Install version **0.1.2 or later** in your React 19 app:

```sh
npx jsr add @azeer-ui-widget/react-phone
```

```tsx
import { WebPhone, type SipConfig } from "@azeer-ui-widget/react-phone";

// Create a stable config after the user signs in. Never hardcode passwords
// or place them in public VITE_* environment variables.
export function CustomerPhone({ config }: { config: SipConfig }) {
  return (
    <WebPhone
      config={config}
      autoConnect
      preset="advanced"
      theme={{ accent: "#2e5945", radius: "16px" }}
      onIncomingCall={(call) => console.info("Incoming", call.id)}
      onAnswered={(call) => console.info("Answered", call.id)}
      onDisconnected={(call) => console.info("Ended", call.endReason)}
    />
  );
}
```

`autoConnect` defaults to `false`. For explicit sign-in, compose `ConnectionForm` beside `PhoneWidget`. A new `config` object identity with `autoConnect` intentionally triggers reconnection; memoize it or keep it in state. End the current call before changing accounts. The phone must run in a client component in SSR frameworks; browser APIs are accessed after mounting or a user action.

No global CSS, Tailwind setup, or ElevenLabs API key is required. For an interactive credential form, use [the composition example](/react-phone/components/). See [SIP configuration](/react-phone/sip-configuration/) for a complete config object.

To experiment without an account:

```tsx
import { WebPhone } from "@azeer-ui-widget/react-phone";

const preview = { enabled: true as const };
export function PreviewPhone() {
  return <WebPhone preview={preview} preset="advanced" />;
}
```

Preview is explicit simulation. It does not open a microphone or contact a SIP server.
