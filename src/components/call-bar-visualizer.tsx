"use client";
import type { ReactElement } from "react";
import { useCallActivity } from "../react/use-call-activity.ts";
import {
  BarVisualizer,
  type BarVisualizerProps,
} from "./elevenlabs/bar-visualizer.tsx";
export type CallBarVisualizerProps = Omit<
  BarVisualizerProps,
  "state" | "bands"
>;
/** SIP lifecycle + speech energy drive the ElevenLabs bar animation state. */
export function CallBarVisualizer(props: CallBarVisualizerProps): ReactElement {
  const activity = useCallActivity(props.barCount);
  return (
    <BarVisualizer {...props} state={activity.state} bands={activity.bands} />
  );
}
