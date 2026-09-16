// Generated from src/components/call-bar-visualizer.tsx. Run npm run package:build; do not edit.
"use client";

import type { ReactElement } from "react";
import { useCallActivity } from "../react/use-call-activity.ts";
import { BarVisualizer, type BarVisualizerProps } from "./elevenlabs/bar-visualizer.ts";
import { jsx as _jsx } from "react/jsx-runtime";
export type CallBarVisualizerProps = Omit<BarVisualizerProps, "state" | "bands">;
/** SIP lifecycle + speech energy drive the ElevenLabs bar animation state. */
export function CallBarVisualizer(props: CallBarVisualizerProps): ReactElement {
  const activity = useCallActivity(props.barCount);
  return /*#__PURE__*/_jsx(BarVisualizer, {
    ...props,
    state: activity.state,
    bands: activity.bands
  });
}
