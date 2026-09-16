---
title: "Themes & caller identity"
description: "Themes & caller identity for Azeer React Phone. Configuration, examples, and expected behavior."
---

```tsx
<WebPhone
  config={config}
  autoConnect
  caller={{
    name: "Support team",
    number: "7003",
    avatarUrl: "/avatars/support.png",
    tags: ["Support", "Priority"],
  }}
  resolveCaller={(caller) => ({
    ...caller,
    name: crm[caller.number]?.name ?? caller.name,
  })}
  renderAvatar={(caller) => <YourAvatar name={caller.name} />}
  renderTags={(caller) => <YourTags tags={caller.tags ?? []} />}
  theme={{
    appearance: "dark",
    accent: "#b8daa2",
    accentForeground: "#17291e",
    radius: "12px",
    fontFamily: "inherit",
  }}
/>
```

`caller` decorates an outgoing destination only while it matches the dialed number. Incoming identity comes from SIP and can be enriched with `resolveCaller`. Do not trust SIP display names as verified identity. Avatar failures fall back to initials. `header` and `footer` accept React nodes (`null` hides them).

Theme tokens: `accent`, `accentForeground`, `background`, `surface`, `foreground`, `muted`, `border`, `danger`, `dangerForeground`, `radius`, `fontFamily`, plus `appearance: "light" | "dark"`. Tokens become local `--az-*` CSS properties. Choose foreground colors with sufficient contrast when customizing. The library inherits your font; only the demo bundles Geist.

For strict Content Security Policy, pass `nonce` to `WebPhone`/`PhoneRoot`. For many instances, render `<PhoneStyles nonce={nonce} />` once and use `includeStyles={false}`. Theme customization uses inline style properties, so your host CSP must allow its chosen inline-style strategy. Embedding in an iframe additionally requires `allow="microphone; autoplay"` and a compatible `Permissions-Policy` from the parent.

Theme tokens are scoped to each `PhoneRoot`; multiple phones can use different colors. If you replace foreground or background colors, check their contrast together. Host CSS may still affect inherited fonts and box layout.
