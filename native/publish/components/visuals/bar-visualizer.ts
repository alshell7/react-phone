// Generated from src/components/visuals/bar-visualizer.tsx. Run npm run package:build; do not edit.
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "../../react-types.d.ts";
import { Animated, Easing, View, type StyleProp, type ViewStyle } from "react-native";
import { usePhoneMotion } from "../motion.ts";
import { usePhoneTheme } from "../theme.ts";
import { jsx as _jsx } from "react/jsx-runtime";
import type { CallVisualState } from "../../core/visual-state.ts";
export interface BarVisualizerProps {
  state?: CallVisualState;
  barCount?: number;
  /** Normalized audio bands. CallBarVisualizer supplies real call activity. */
  bands?: readonly number[];
  /** Minimum bar height as a percentage of `height`. */
  minHeight?: number;
  /** Maximum bar height as a percentage of `height`. */
  maxHeight?: number;
  centerAlign?: boolean;
  height?: number;
  color?: string;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
function Bar({
  value,
  highlighted,
  height,
  color,
  centerAlign,
  duration,
  moving
}: {
  value: number;
  highlighted: boolean;
  height: number;
  color: string;
  centerAlign: boolean;
  duration: number;
  moving: boolean;
}) {
  const scale = useRef(new Animated.Value(value)).current;
  const opacity = useRef(new Animated.Value(highlighted ? 1 : 0.22)).current;
  useEffect(() => {
    const targets = [[scale, value], [opacity, highlighted ? 1 : 0.22]] as const;
    if (!moving) {
      targets.forEach(([node, to]) => node.setValue(to));
      return;
    }
    const animation = Animated.parallel(targets.map(([node, to]) => Animated.timing(node, {
      toValue: to,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    })));
    animation.start();
    return () => animation.stop();
  }, [value, highlighted, moving, duration, scale, opacity]);
  return /*#__PURE__*/_jsx(View, {
    style: {
      flex: 1,
      minWidth: 3,
      maxWidth: 12,
      height,
      justifyContent: centerAlign ? "center" : "flex-end"
    },
    children: /*#__PURE__*/_jsx(Animated.View, {
      style: {
        height,
        borderRadius: 999,
        backgroundColor: color,
        opacity,
        transform: centerAlign ? [{
          scaleY: scale
        }] : [{
          translateY: height / 2
        }, {
          scaleY: scale
        }, {
          translateY: -height / 2
        }]
      }
    })
  });
}

/**
 * Lifecycle-aware bars adapted from ElevenLabs UI's BarVisualizer: connecting and
 * listening sequences, then live speech energy while someone talks.
 */
export function BarVisualizer({
  state = "idle",
  barCount = 12,
  bands = [],
  minHeight = 12,
  maxHeight = 100,
  centerAlign = true,
  height = 72,
  color,
  animate = true,
  style,
  testID
}: BarVisualizerProps): ReactElement {
  const theme = usePhoneTheme();
  const motion = usePhoneMotion();
  const count = Math.min(32, Math.max(1, Math.round(barCount) || 12));
  const moving = motion.enabled && animate;
  const [frame, setFrame] = useState(0);
  const sequence = useMemo(() => {
    if (state === "thinking" || state === "listening") return [[Math.floor(count / 2)], [-1]];
    if (["connecting", "initializing", "ringing"].includes(state)) return Array.from({
      length: count
    }, (_, i) => [i, count - 1 - i]);
    return [Array.from({
      length: count
    }, (_, i) => i)];
  }, [state, count]);
  useEffect(() => {
    setFrame(0);
    if (!moving || sequence.length < 2) return;
    const interval = state === "listening" ? 500 : state === "thinking" ? 150 : 160;
    const timer = setInterval(() => setFrame(n => (n + 1) % sequence.length), interval);
    return () => clearInterval(timer);
  }, [moving, sequence, state]);
  const highlighted = sequence[frame % sequence.length];
  const speech = state === "speaking";
  const quiet = ["idle", "ended", "error", "held"].includes(state);
  const low = Math.max(0, Math.min(100, minHeight)) / 100;
  const high = Math.max(low, Math.min(100, maxHeight) / 100);
  return /*#__PURE__*/_jsx(View, {
    testID: testID,
    accessible: true,
    accessibilityRole: "image",
    accessibilityLabel: `Voice bars: ${state}`,
    style: [{
      height,
      flexDirection: "row",
      gap: 6,
      alignItems: centerAlign ? "center" : "flex-end",
      justifyContent: "center",
      alignSelf: "stretch"
    }, style],
    children: Array.from({
      length: count
    }, (_, i) => {
      const energy = moving && speech ? Math.max(0, Math.min(1, bands[i] ?? 0)) : 0;
      const value = Math.min(high, Math.max(low, energy + 0.05));
      return /*#__PURE__*/_jsx(Bar, {
        value: value,
        highlighted: !quiet && (speech || highlighted.includes(i)),
        height: height,
        color: color ?? theme.accent,
        centerAlign: centerAlign,
        duration: motion.duration,
        moving: moving
      }, i);
    })
  });
}
