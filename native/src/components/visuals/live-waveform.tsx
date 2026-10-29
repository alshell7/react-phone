import { useEffect, useRef, useState, type ReactElement } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { usePhoneMotion } from "../motion.tsx";
import { usePhoneTheme } from "../theme.tsx";

export interface LiveWaveformProps {
  /** Read live levels from `getLevel` / `level`. */
  active?: boolean;
  /** Show a gentle simulated motion (for example while a call connects). */
  processing?: boolean;
  animate?: boolean;
  /** Current level supplier, 0–1. Polled every `updateRate` ms while active. */
  getLevel?: () => number;
  /** Alternatively, a controlled level 0–1. */
  level?: number;
  /** `static` mirrors bars around the centre; `scrolling` draws level history. */
  mode?: "static" | "scrolling";
  barWidth?: number;
  /** Minimum bar height in points. */
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  /** Width of the fade at each edge, in points. */
  fadeWidth?: number;
  height?: number;
  sensitivity?: number;
  /** Scrolling samples kept. */
  historySize?: number;
  /** Minimum milliseconds between samples; defaults to 50. */
  updateRate?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * Live Waveform inspired by ElevenLabs UI. Native platforms have no audio analyser,
 * so it renders levels supplied by the phone's WebRTC statistics or your own source.
 */
export function LiveWaveform({
  active = false,
  processing = false,
  animate = true,
  getLevel,
  level,
  mode = "static",
  barWidth: requestedWidth = 3,
  barHeight = 4,
  barGap: requestedGap = 2,
  barRadius = 1.5,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 48,
  sensitivity = 1,
  historySize = 60,
  updateRate = 50,
  style,
  accessibilityLabel = "Call audio waveform",
  testID,
}: LiveWaveformProps): ReactElement {
  const theme = usePhoneTheme();
  const motion = usePhoneMotion();
  const moving = animate && motion.enabled;
  const barWidth = Math.max(1, Number.isFinite(requestedWidth) ? requestedWidth : 3);
  const barGap = Math.max(0, Number.isFinite(requestedGap) ? requestedGap : 2);
  const [width, setWidth] = useState(0);
  const count = Math.max(1, Math.floor((width + barGap) / (barWidth + barGap)));
  const [values, setValues] = useState<number[]>([]);
  const history = useRef<number[]>([]);
  const source = useRef({ getLevel, level });
  source.current = { getLevel, level };
  const live = moving && (active || processing);
  useEffect(() => {
    if (!live) {
      history.current = [];
      setValues([]);
      return;
    }
    const sample = () => {
      const t = Date.now() / 1000;
      const raw = processing && !active
        ? 0.22 + 0.18 * Math.sin(t * 3.1) * Math.sin(t * 1.3)
        : (source.current.getLevel?.() ?? source.current.level ?? 0);
      const value = clamp(raw * Math.max(0.1, sensitivity));
      if (mode === "scrolling") {
        history.current = [...history.current, value].slice(-Math.max(8, historySize));
        setValues(history.current);
      } else {
        setValues(
          Array.from({ length: count }, (_, i) => {
            const x = count === 1 ? 0 : Math.abs(i / (count - 1) - 0.5) * 2;
            const envelope = 1 - x * x * 0.75;
            const jitter = 0.55 + 0.45 * Math.abs(Math.sin(t * 6.3 + i * 0.9) * Math.cos(t * 2.2 + i * 0.37));
            return clamp(value * envelope * jitter * 1.4);
          }),
        );
      }
    };
    sample();
    const timer = setInterval(sample, Math.max(33, updateRate));
    return () => clearInterval(timer);
  }, [live, active, processing, mode, count, sensitivity, historySize, updateRate]);
  const color = barColor ?? theme.accent;
  const bars =
    mode === "scrolling"
      ? Array.from({ length: count }, (_, i) => values[values.length - count + i] ?? 0)
      : Array.from({ length: count }, (_, i) => values[i] ?? 0);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        {
          height,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: barGap,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {width > 0 &&
        bars.map((value, i) => {
          const edge = Math.min(i, count - 1 - i) * (barWidth + barGap);
          const fade = fadeEdges && fadeWidth > 0 ? Math.min(1, (edge + barWidth) / fadeWidth) : 1;
          return (
            <View
              key={i}
              style={{
                width: barWidth,
                height: Math.max(barHeight, value * height),
                borderRadius: barRadius,
                backgroundColor: color,
                opacity: (live ? 0.35 + value * 0.65 : 0.22) * fade,
              }}
            />
          );
        })}
    </View>
  );
}
