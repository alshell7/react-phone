// Generated from src/components/call-visuals.tsx. Run npm run package:build; do not edit.
import { useRef } from "react";
import type { ReactElement } from "../react-types.d.ts";
import { View } from "react-native";
import { useCallActivity } from "../react/use-call-activity.ts";
import { usePhone } from "../react/phone-provider.ts";
import { usePhoneMotion } from "./motion.ts";
import { usePhoneTheme } from "./theme.ts";
import { PhoneText } from "./primitives.ts";
import { Orb, type OrbProps } from "./visuals/orb.ts";
import { LiveWaveform, type LiveWaveformProps } from "./visuals/live-waveform.ts";
import { BarVisualizer, type BarVisualizerProps } from "./visuals/bar-visualizer.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export type CallOrbProps = Omit<OrbProps, "getInputVolume" | "getOutputVolume" | "state">;

/** Still before/after a call; listening/talking motion follows real call audio. */
export function CallOrb({
  animate = true,
  ...props
}: CallOrbProps): ReactElement {
  const activity = useCallActivity();
  const motion = usePhoneMotion();
  const latest = useRef(activity);
  latest.current = activity;
  return /*#__PURE__*/_jsx(Orb, {
    ...props,
    state: activity.state === "speaking" ? "talking" : activity.state,
    animate: activity.active && !["thinking", "held"].includes(activity.state) && animate && motion.enabled,
    getInputVolume: () => latest.current.active ? latest.current.input : 0,
    getOutputVolume: () => latest.current.active ? latest.current.output : 0
  });
}
export interface CallWaveformProps extends Omit<LiveWaveformProps, "getLevel" | "level" | "active" | "processing"> {
  /** Defaults to remote audio; choose local to visualize the microphone. */
  source?: "remote" | "local";
  /** Show a caption under the waveform while connected. Defaults to true. */
  showCaption?: boolean;
}

/** Live Waveform connected to the current call. */
export function CallWaveform({
  source = "remote",
  showCaption = true,
  ...props
}: CallWaveformProps): ReactElement {
  const {
    state,
    preview
  } = usePhone();
  const theme = usePhoneTheme();
  const activity = useCallActivity(4);
  const latest = useRef(activity);
  latest.current = activity;
  const active = state.status === "active" && !state.remoteHeld && !state.transferPending;
  const muted = source === "local" && state.muted;
  return /*#__PURE__*/_jsxs(View, {
    style: {
      alignSelf: "stretch",
      alignItems: "center",
      gap: 4
    },
    children: [/*#__PURE__*/_jsx(LiveWaveform, {
      height: 44,
      ...props,
      style: [{
        alignSelf: "stretch"
      }, props.style],
      active: active && !muted,
      getLevel: () => source === "local" ? latest.current.input : latest.current.output
    }), showCaption && active ? /*#__PURE__*/_jsx(PhoneText, {
      size: 11,
      weight: "500",
      color: theme.muted,
      children: preview ? "Simulated audio" : source === "local" ? muted ? "Microphone muted" : "Your microphone" : "Call audio"
    }) : null]
  });
}
export type CallBarVisualizerProps = Omit<BarVisualizerProps, "state" | "bands">;

/** SIP lifecycle + speech energy drive the bar animation state. */
export function CallBarVisualizer(props: CallBarVisualizerProps): ReactElement {
  const activity = useCallActivity(props.barCount);
  return /*#__PURE__*/_jsx(BarVisualizer, {
    ...props,
    state: activity.state,
    bands: activity.bands
  });
}
