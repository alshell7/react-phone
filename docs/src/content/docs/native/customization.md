---
title: Themes, identity & motion
description: Theme tokens, light/dark/system appearance, caller identity and slots, motion, and accessibility for the React Native phone.
---

## Theme

```tsx
<SipPhone
  theme={{
    appearance: "system", // "light" (default) | "dark" | "system"
    accent: "#285dab",
    radius: 24,
    fontFamily: "Inter",
  }}
/>
```

| Token                                   | Light default | Dark default |
| --------------------------------------- | ------------- | ------------ |
| `accent` / `accentForeground`           | `#2e5945` / white | `#b8daa2` / `#17291e` |
| `background` / `surface`                | white / `#f4f6f3` | `#1b211d` / `#273029` |
| `foreground` / `muted` / `border`       | `#1f2621` / `#687169` / `#e5e9e3` | `#f2f4ef` / `#a9b4a7` / `#36403a` |
| `danger` / `dangerForeground`           | `#c2413d` / white | `#ec8f89` / `#2a1512` |
| `radius`                                | `20`          | `20`         |

Tints (selected states, decline fills, pressed keys) are derived from your tokens. Tokens are scoped per phone, so an island and a phone tab can differ. Use `<PhoneRoot theme={…}>` and `usePhoneTheme()` to style your own components with the resolved palette.

## Caller identity

`caller` describes the outgoing contact; `resolveCaller` enriches any incoming or outgoing caller (for example from your CRM) with `name`, `avatarUrl`, and `tags`. `renderAvatar` and `renderTags` replace those slots entirely. Incoming identity comes from the SIP `From` header; it is never invented.

## Motion

`motion={false}` or `motion={{ durationMs: 180 }}` (80–600 ms). Layout changes animate natively with `LayoutAnimation`; presses, rings, and visuals use the native driver. The system **Reduce Motion** setting always wins.

## Accessibility

- Every control has a label; toggles report selected state and the keypad toggle reports expanded state. On the web, the same state is exposed as ARIA (`aria-pressed`, `aria-selected`, `aria-checked`, `aria-expanded`).
- Status changes use live regions; errors are announced; incoming calls are announced without moving focus.
- Round controls are 56–80 pt; text respects Dynamic Type up to 1.6×.
- Slide-to-answer exposes an "Answer" action, and the volume slider is adjustable with increment/decrement actions.
- The island collapses with Android Back and the iOS escape gesture.
