"use client";
import type { ReactElement } from "react";
import { Orb, type OrbProps } from "./elevenlabs/orb.tsx";
import { useCallActivity } from "../react/use-call-activity.ts";
import { usePhoneMotion } from "./motion.tsx";
import { usePhoneTheme } from "./theme.tsx";

export type CallOrbProps = Omit<
  OrbProps,
  "getInputVolume" | "getOutputVolume" | "state"
>;

/** Static before/after a call; listening/talking motion follows real WebRTC audio. */
export function CallOrb({
  animate = true,
  ...props
}: CallOrbProps): ReactElement {
  const activity = useCallActivity();
  const motion = usePhoneMotion();
  const theme = usePhoneTheme();
  return (
    <Orb
      appearance={theme.appearance}
      {...props}
      state={activity.state === "speaking" ? "talking" : activity.state}
      animate={
        activity.active &&
        !["thinking", "held"].includes(activity.state) &&
        animate &&
        motion.enabled
      }
      getInputVolume={() => (activity.active ? activity.input : 0)}
      getOutputVolume={() => (activity.active ? activity.output : 0)}
    />
  );
}
