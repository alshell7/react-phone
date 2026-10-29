import { useRef, type ReactElement } from "react";
import { View } from "react-native";
import { useCallActivity } from "../react/use-call-activity.ts";
import { usePhone } from "../react/phone-provider.tsx";
import { usePhoneMotion } from "./motion.tsx";
import { usePhoneTheme } from "./theme.tsx";
import { usePhoneLabels } from "./locale.tsx";
import { PhoneText } from "./primitives.tsx";
import { Orb, type OrbProps } from "./visuals/orb.tsx";
import {
  LiveWaveform,
  type LiveWaveformProps,
} from "./visuals/live-waveform.tsx";
import {
  BarVisualizer,
  type BarVisualizerProps,
} from "./visuals/bar-visualizer.tsx";

export type CallOrbProps = Omit<
  OrbProps,
  "getInputVolume" | "getOutputVolume" | "state"
>;

/** Still before/after a call; listening/talking motion follows real call audio. */
export function CallOrb({
  animate = true,
  ...props
}: CallOrbProps): ReactElement {
  const activity = useCallActivity();
  const motion = usePhoneMotion();
  const latest = useRef(activity);
  latest.current = activity;
  return (
    <Orb
      {...props}
      state={activity.state === "speaking" ? "talking" : activity.state}
      animate={
        activity.active &&
        !["thinking", "held"].includes(activity.state) &&
        animate &&
        motion.enabled
      }
      getInputVolume={() => (latest.current.active ? latest.current.input : 0)}
      getOutputVolume={() =>
        latest.current.active ? latest.current.output : 0
      }
    />
  );
}

export interface CallWaveformProps extends Omit<
  LiveWaveformProps,
  "getLevel" | "level" | "active" | "processing"
> {
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
  const { state, preview } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const activity = useCallActivity(4);
  const latest = useRef(activity);
  latest.current = activity;
  const active =
    state.status === "active" && !state.remoteHeld && !state.transferPending;
  const muted = source === "local" && state.muted;
  return (
    <View style={{ alignSelf: "stretch", alignItems: "center", gap: 4 }}>
      <LiveWaveform
        height={44}
        {...props}
        style={[{ alignSelf: "stretch" }, props.style]}
        active={active && !muted}
        getLevel={() =>
          source === "local" ? latest.current.input : latest.current.output
        }
      />
      {showCaption && active ? (
        <PhoneText size={11} weight="500" color={theme.muted}>
          {preview
            ? labels.simulatedAudio
            : source === "local"
              ? muted
                ? labels.microphoneMuted
                : labels.yourMicrophone
              : labels.callAudio}
        </PhoneText>
      ) : null}
    </View>
  );
}

export type CallBarVisualizerProps = Omit<
  BarVisualizerProps,
  "state" | "bands"
>;

/** SIP lifecycle + speech energy drive the bar animation state. */
export function CallBarVisualizer(props: CallBarVisualizerProps): ReactElement {
  const activity = useCallActivity(props.barCount);
  return (
    <BarVisualizer {...props} state={activity.state} bands={activity.bands} />
  );
}
