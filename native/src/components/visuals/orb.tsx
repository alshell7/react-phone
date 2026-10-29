import { useEffect, useId, useMemo, useRef, type ReactElement } from "react";
import {
  Animated,
  Easing,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { usePhoneMotion } from "../motion.tsx";
import { mixColors, usePhoneTheme } from "../theme.tsx";

export interface OrbProps {
  /** Base and highlight colours. Defaults follow the theme accent. */
  colors?: [string, string];
  /** Stable pattern seed. */
  seed?: number;
  /** Animation multiplier, clamped to 0–2. Zero freezes motion. */
  speed?: number;
  animate?: boolean;
  /** Visual state label, exposed to assistive technology. */
  state?: string;
  appearance?: "light" | "dark";
  /** Audio levels normalized to 0–1. CallOrb supplies the current call levels. */
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const clamp = (n: number): number =>
  Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;

/** Deterministic pseudo-random sequence from a seed. */
function random(seed: number): () => number {
  let value = Math.abs(Math.floor(seed)) % 2147483647 || 7;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function useLoop(enabled: boolean, durationMs: number): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled || !Number.isFinite(durationMs)) return;
    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, durationMs, value]);
  return value;
}

/**
 * A layered gradient orb inspired by ElevenLabs UI's Orb, rebuilt for native
 * rendering: SVG gradients rotate on the native driver and breathe with call audio.
 */
export function Orb({
  colors,
  seed = 7,
  speed = 1,
  animate = true,
  state = "idle",
  appearance,
  getInputVolume,
  getOutputVolume,
  size = 112,
  style,
  testID,
}: OrbProps): ReactElement {
  const theme = usePhoneTheme();
  const motion = usePhoneMotion();
  const mode = appearance ?? theme.appearance;
  const [base, light] = useMemo<[string, string]>(() => {
    if (colors) return colors;
    return mode === "dark"
      ? [mixColors(theme.accent, "#0b120e", 0.45), theme.accent]
      : [theme.accent, mixColors(theme.accent, "#ffffff", 0.65)];
  }, [colors, mode, theme.accent]);
  const rate = Math.max(0, Math.min(2, Number.isFinite(speed) ? speed : 1));
  const moving = animate && motion.enabled && rate > 0;
  const layout = useMemo(() => {
    const next = random(seed);
    return Array.from({ length: 3 }, () => ({
      offset: next() * 360,
      dx: 0.14 + next() * 0.12,
      dy: next() * 0.16 - 0.08,
    }));
  }, [seed]);
  const spinA = useLoop(moving, 9000 / rate);
  const spinB = useLoop(moving, 13500 / rate);
  const spinC = useLoop(moving, 21000 / rate);
  const input = useRef(new Animated.Value(0)).current;
  const output = useRef(new Animated.Value(0)).current;
  const volumes = useRef({ getInputVolume, getOutputVolume });
  volumes.current = { getInputVolume, getOutputVolume };
  useEffect(() => {
    if (!moving) {
      input.setValue(0);
      output.setValue(0);
      return;
    }
    const timer = setInterval(() => {
      const next = (value: Animated.Value, level: number) =>
        Animated.timing(value, {
          toValue: clamp(level),
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      next(input, volumes.current.getInputVolume?.() ?? 0);
      next(output, volumes.current.getOutputVolume?.() ?? 0);
    }, 90);
    return () => clearInterval(timer);
  }, [moving, input, output]);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rotate = (value: Animated.Value, offset: number, direction = 1) =>
    value.interpolate({
      inputRange: [0, 1],
      outputRange: [`${offset}deg`, `${offset + 360 * direction}deg`],
    });
  const blob = (
    gradient: string,
    index: number,
    rx: number,
    ry: number,
  ) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse
        cx={50 + layout[index].dx * 100}
        cy={50 + layout[index].dy * 100}
        rx={rx}
        ry={ry}
        fill={`url(#${gradient})`}
      />
    </Svg>
  );
  const layer = { position: "absolute" as const, width: size, height: size };
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Voice orb: ${state}`}
      style={[{ width: size, height: size }, style]}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          transform: [
            {
              scale: Animated.add(
                1,
                Animated.multiply(Animated.add(input, output), 0.045),
              ),
            },
          ],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100" style={layer}>
          <Defs>
            <RadialGradient id={`${id}base`} cx="42%" cy="38%" r="70%">
              <Stop offset="0" stopColor={light} />
              <Stop offset="0.55" stopColor={mixColors(base, light, 0.45)} />
              <Stop offset="1" stopColor={base} />
            </RadialGradient>
            <RadialGradient id={`${id}a`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={base} stopOpacity={0.95} />
              <Stop offset="1" stopColor={base} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`${id}b`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={light} stopOpacity={0.95} />
              <Stop offset="1" stopColor={light} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`${id}c`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.7} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill={`url(#${id}base)`} />
        </Svg>
        <Animated.View
          style={[
            layer,
            {
              transform: [
                { rotate: rotate(spinA, layout[0].offset) },
                {
                  scale: Animated.add(1, Animated.multiply(input, 0.18)),
                },
              ],
            },
          ]}
        >
          {blob(`${id}a`, 0, 34, 26)}
        </Animated.View>
        <Animated.View
          style={[
            layer,
            {
              opacity: Animated.add(0.55, Animated.multiply(output, 0.45)),
              transform: [{ rotate: rotate(spinB, layout[1].offset, -1) }],
            },
          ]}
        >
          {blob(`${id}b`, 1, 30, 36)}
        </Animated.View>
        <Animated.View
          style={[
            layer,
            {
              opacity: Animated.add(0.35, Animated.multiply(output, 0.5)),
              transform: [{ rotate: rotate(spinC, layout[2].offset) }],
            },
          ]}
        >
          {blob(`${id}c`, 2, 22, 14)}
        </Animated.View>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={layer}>
          <Defs>
            <RadialGradient id={`${id}gloss`} cx="34%" cy="26%" r="42%">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`${id}rim`} cx="50%" cy="50%" r="50%">
              <Stop offset="0.82" stopColor={base} stopOpacity={0} />
              <Stop offset="1" stopColor={base} stopOpacity={0.45} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill={`url(#${id}rim)`} />
          <Circle cx={50} cy={50} r={50} fill={`url(#${id}gloss)`} />
        </Svg>
      </Animated.View>
    </View>
  );
}
