# Azeer Phone

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, explicitly requested. TypeScript, Vite, and JsSIP are implementation choices.

## Users and purpose

Developers embed a customizable SIP phone in React applications. Their users place and receive browser calls, identify callers, and operate mute, hold, keypad, and transfer controls.

## Capabilities and constraints

- Publishable as `@azeer-ui-widget/react-phone` on JSR; GitHub Actions workflow supplied by the user.
- Basic, advanced, compact, and independently composable controls.
- Caller name, number, avatar, tags, lifecycle callbacks, and configurable colors.
- A runnable demo asks for credentials and exposes the supplied test server configuration. Passwords never enter committed files, logs, browser storage, or generated embed examples.
- Microphone capture requires a secure browser context and browser permission; code must explain and recover from denials.
- Assumption pending optional layout preference: advanced calling leads the demo, with all presets selectable.

## Brand commitments

Use ElevenLabs UI components and their restrained audio interface conventions. No invented customers, analytics, or call history.

## Evidence

User-supplied SIP endpoint and account details; credentials are deliberately excluded from this document. Real server calling requires live validation and a reachable peer.
