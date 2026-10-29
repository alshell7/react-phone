import { useState, type ReactElement } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { usePhoneTheme } from "../theme.tsx";
import { usePhoneLabels } from "../locale.tsx";

/** Visual-only waveform. Media acquisition belongs to the phone, not this component. */
export interface WaveformProps {
  /** Samples 0–1. Bars resample them to the available width. */
  data?: readonly number[];
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Static bar waveform (adapted from ElevenLabs UI's Waveform), for recordings or previews. */
export function Waveform({
  data = [],
  barWidth = 3,
  barGap = 3,
  barRadius = 2,
  barColor,
  height = 64,
  style,
  accessibilityLabel,
}: WaveformProps): ReactElement {
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const [width, setWidth] = useState(0);
  const bw = Math.max(1, barWidth);
  const gap = Math.max(0, barGap);
  const count = Math.max(1, Math.floor((width + gap) / (bw + gap)));
  const sample = (i: number) => {
    if (!data.length) return 0;
    const value = data[Math.floor((i / count) * data.length)] ?? 0;
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  };
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? labels.waveform}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        { height, flexDirection: "row", alignItems: "center", gap },
        style,
      ]}
    >
      {width > 0 &&
        Array.from({ length: count }, (_, i) => (
          <View
            key={i}
            style={{
              width: bw,
              height: Math.max(2, sample(i) * height),
              borderRadius: barRadius,
              backgroundColor: barColor ?? theme.accent,
              opacity: data.length ? 1 : 0.25,
            }}
          />
        ))}
    </View>
  );
}
