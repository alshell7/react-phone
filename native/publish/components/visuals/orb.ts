// Generated from src/components/visuals/orb.tsx. Run npm run package:build; do not edit.
import { useEffect, useId, useMemo, useRef } from "react";
import type { ReactElement } from "../../react-types.d.ts";
import { Animated, Easing, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { usePhoneMotion } from "../motion.ts";
import { mixColors, usePhoneTheme } from "../theme.ts";
import { usePhoneLabels } from "../locale.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const clamp = (n: number): number => Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;

/** Deterministic pseudo-random sequence from a seed. */
function random(seed: number): () => number {
  let value = Math.abs(Math.floor(seed)) % 2147483647 || 7;
  return () => {
    value = value * 16807 % 2147483647;
    return (value - 1) / 2147483646;
  };
}
function useLoop(enabled: boolean, durationMs: number): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled || !Number.isFinite(durationMs)) return;
    const loop = Animated.loop(Animated.timing(value, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: true
    }));
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
  testID
}: OrbProps): ReactElement {
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const motion = usePhoneMotion();
  const mode = appearance ?? theme.appearance;
  const [base, light] = useMemo<[string, string]>(() => {
    if (colors) return colors;
    return mode === "dark" ? [mixColors(theme.accent, "#0b120e", 0.45), theme.accent] : [theme.accent, mixColors(theme.accent, "#ffffff", 0.65)];
  }, [colors, mode, theme.accent]);
  const rate = Math.max(0, Math.min(2, Number.isFinite(speed) ? speed : 1));
  const moving = animate && motion.enabled && rate > 0;
  const layout = useMemo(() => {
    const next = random(seed);
    return Array.from({
      length: 3
    }, () => ({
      offset: next() * 360,
      dx: 0.14 + next() * 0.12,
      dy: next() * 0.16 - 0.08
    }));
  }, [seed]);
  const spinA = useLoop(moving, 9000 / rate);
  const spinB = useLoop(moving, 13500 / rate);
  const spinC = useLoop(moving, 21000 / rate);
  const input = useRef(new Animated.Value(0)).current;
  const output = useRef(new Animated.Value(0)).current;
  const volumes = useRef({
    getInputVolume,
    getOutputVolume
  });
  volumes.current = {
    getInputVolume,
    getOutputVolume
  };
  useEffect(() => {
    if (!moving) {
      input.setValue(0);
      output.setValue(0);
      return;
    }
    const timer = setInterval(() => {
      const next = (value: Animated.Value, level: number) => Animated.timing(value, {
        toValue: clamp(level),
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }).start();
      next(input, volumes.current.getInputVolume?.() ?? 0);
      next(output, volumes.current.getOutputVolume?.() ?? 0);
    }, 90);
    return () => clearInterval(timer);
  }, [moving, input, output]);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rotate = (value: Animated.Value, offset: number, direction = 1) => value.interpolate({
    inputRange: [0, 1],
    outputRange: [`${offset}deg`, `${offset + 360 * direction}deg`]
  });
  const blob = (gradient: string, index: number, rx: number, ry: number) => /*#__PURE__*/_jsx(Svg, {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    children: /*#__PURE__*/_jsx(Ellipse, {
      cx: 50 + layout[index].dx * 100,
      cy: 50 + layout[index].dy * 100,
      rx: rx,
      ry: ry,
      fill: `url(#${gradient})`
    })
  });
  const layer = {
    position: "absolute" as const,
    width: size,
    height: size
  };
  return /*#__PURE__*/_jsx(View, {
    testID: testID,
    accessible: true,
    accessibilityRole: "image",
    accessibilityLabel: labels.voiceOrb(state),
    style: [{
      width: size,
      height: size
    }, style],
    children: /*#__PURE__*/_jsxs(Animated.View, {
      style: {
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        transform: [{
          scale: Animated.add(1, Animated.multiply(Animated.add(input, output), 0.045))
        }]
      },
      children: [/*#__PURE__*/_jsxs(Svg, {
        width: size,
        height: size,
        viewBox: "0 0 100 100",
        style: layer,
        children: [/*#__PURE__*/_jsxs(Defs, {
          children: [/*#__PURE__*/_jsxs(RadialGradient, {
            id: `${id}base`,
            cx: "42%",
            cy: "38%",
            r: "70%",
            children: [/*#__PURE__*/_jsx(Stop, {
              offset: "0",
              stopColor: light
            }), /*#__PURE__*/_jsx(Stop, {
              offset: "0.55",
              stopColor: mixColors(base, light, 0.45)
            }), /*#__PURE__*/_jsx(Stop, {
              offset: "1",
              stopColor: base
            })]
          }), /*#__PURE__*/_jsxs(RadialGradient, {
            id: `${id}a`,
            cx: "50%",
            cy: "50%",
            r: "50%",
            children: [/*#__PURE__*/_jsx(Stop, {
              offset: "0",
              stopColor: base,
              stopOpacity: 0.95
            }), /*#__PURE__*/_jsx(Stop, {
              offset: "1",
              stopColor: base,
              stopOpacity: 0
            })]
          }), /*#__PURE__*/_jsxs(RadialGradient, {
            id: `${id}b`,
            cx: "50%",
            cy: "50%",
            r: "50%",
            children: [/*#__PURE__*/_jsx(Stop, {
              offset: "0",
              stopColor: light,
              stopOpacity: 0.95
            }), /*#__PURE__*/_jsx(Stop, {
              offset: "1",
              stopColor: light,
              stopOpacity: 0
            })]
          }), /*#__PURE__*/_jsxs(RadialGradient, {
            id: `${id}c`,
            cx: "50%",
            cy: "50%",
            r: "50%",
            children: [/*#__PURE__*/_jsx(Stop, {
              offset: "0",
              stopColor: "#ffffff",
              stopOpacity: 0.7
            }), /*#__PURE__*/_jsx(Stop, {
              offset: "1",
              stopColor: "#ffffff",
              stopOpacity: 0
            })]
          })]
        }), /*#__PURE__*/_jsx(Circle, {
          cx: 50,
          cy: 50,
          r: 50,
          fill: `url(#${id}base)`
        })]
      }), /*#__PURE__*/_jsx(Animated.View, {
        style: [layer, {
          transform: [{
            rotate: rotate(spinA, layout[0].offset)
          }, {
            scale: Animated.add(1, Animated.multiply(input, 0.18))
          }]
        }],
        children: blob(`${id}a`, 0, 34, 26)
      }), /*#__PURE__*/_jsx(Animated.View, {
        style: [layer, {
          opacity: Animated.add(0.55, Animated.multiply(output, 0.45)),
          transform: [{
            rotate: rotate(spinB, layout[1].offset, -1)
          }]
        }],
        children: blob(`${id}b`, 1, 30, 36)
      }), /*#__PURE__*/_jsx(Animated.View, {
        style: [layer, {
          opacity: Animated.add(0.35, Animated.multiply(output, 0.5)),
          transform: [{
            rotate: rotate(spinC, layout[2].offset)
          }]
        }],
        children: blob(`${id}c`, 2, 22, 14)
      }), /*#__PURE__*/_jsxs(Svg, {
        width: size,
        height: size,
        viewBox: "0 0 100 100",
        style: layer,
        children: [/*#__PURE__*/_jsxs(Defs, {
          children: [/*#__PURE__*/_jsxs(RadialGradient, {
            id: `${id}gloss`,
            cx: "34%",
            cy: "26%",
            r: "42%",
            children: [/*#__PURE__*/_jsx(Stop, {
              offset: "0",
              stopColor: "#ffffff",
              stopOpacity: 0.55
            }), /*#__PURE__*/_jsx(Stop, {
              offset: "1",
              stopColor: "#ffffff",
              stopOpacity: 0
            })]
          }), /*#__PURE__*/_jsxs(RadialGradient, {
            id: `${id}rim`,
            cx: "50%",
            cy: "50%",
            r: "50%",
            children: [/*#__PURE__*/_jsx(Stop, {
              offset: "0.82",
              stopColor: base,
              stopOpacity: 0
            }), /*#__PURE__*/_jsx(Stop, {
              offset: "1",
              stopColor: base,
              stopOpacity: 0.45
            })]
          })]
        }), /*#__PURE__*/_jsx(Circle, {
          cx: 50,
          cy: 50,
          r: 50,
          fill: `url(#${id}rim)`
        }), /*#__PURE__*/_jsx(Circle, {
          cx: 50,
          cy: 50,
          r: 50,
          fill: `url(#${id}gloss)`
        })]
      })]
    })
  });
}
