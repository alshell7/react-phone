// Generated from src/components/call-orb.tsx. Run npm run package:build; do not edit.
"use client";

import type { ReactElement } from "react";
import { Orb, type OrbProps } from "./elevenlabs/orb.ts";
import { useCallActivity } from "../react/use-call-activity.ts";
import { usePhoneMotion } from "./motion.ts";
import { usePhoneTheme } from "./theme.ts";
import { jsx as _jsx } from "react/jsx-runtime";
export type CallOrbProps = Omit<OrbProps, "getInputVolume" | "getOutputVolume" | "state">;

/** Static before/after a call; listening/talking motion follows real WebRTC audio. */
export function CallOrb({
  animate = true,
  ...props
}: CallOrbProps): ReactElement {
  const activity = useCallActivity();
  const motion = usePhoneMotion();
  const theme = usePhoneTheme();
  return /*#__PURE__*/_jsx(Orb, {
    appearance: theme.appearance,
    ...props,
    state: activity.state === "speaking" ? "talking" : activity.state,
    animate: activity.active && !["thinking", "held"].includes(activity.state) && animate && motion.enabled,
    getInputVolume: () => activity.active ? activity.input : 0,
    getOutputVolume: () => activity.active ? activity.output : 0
  });
}
