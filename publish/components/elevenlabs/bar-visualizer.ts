// Generated from src/components/elevenlabs/bar-visualizer.tsx. Run npm run package:build; do not edit.
"use client";

// Adapted from ElevenLabs UI BarVisualizer (MIT). See THIRD_PARTY_NOTICES.md.
// Retains its connecting/listening sequences and volume-to-height bar rendering.
import { useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes, ReactElement } from "../../react-types.d.ts";
import { usePhoneMotion } from "../motion.ts";
import { jsx as _jsx } from "react/jsx-runtime";
import type { CallVisualState } from "../../core/visual-state.ts";
export interface BarVisualizerProps extends HTMLAttributes<HTMLDivElement> {
  state?: CallVisualState;
  barCount?: number;
  /** Normalized audio bands. CallBarVisualizer supplies real call audio. */
  bands?: readonly number[];
  minHeight?: number;
  maxHeight?: number;
  centerAlign?: boolean;
  height?: number;
  color?: string;
  animate?: boolean;
}

/** Upstream ElevenLabs sequences, paused offscreen and for reduced motion. */
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
  ...props
}: BarVisualizerProps): ReactElement {
  const count = Math.min(32, Math.max(1, Math.round(barCount) || 12));
  const motion = usePhoneMotion();
  const moving = motion.enabled && animate;
  const [frame, setFrame] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
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
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (ref.current) observer.observe(ref.current);
    const interval = state === "listening" ? 500 : state === "thinking" ? 150 : 160;
    const timer = setInterval(() => {
      if (visible && !document.hidden) setFrame(n => (n + 1) % sequence.length);
    }, interval);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [moving, sequence, state]);
  const highlighted = sequence[frame % sequence.length];
  const speech = state === "speaking";
  const quiet = ["idle", "ended", "error", "held"].includes(state);
  return /*#__PURE__*/_jsx("div", {
    ...props,
    ref: ref,
    "data-bar-visualizer": "",
    "data-state": state,
    "data-animated": moving && !quiet,
    role: "img",
    "aria-label": `Voice bars: ${state}`,
    style: {
      display: "flex",
      gap: 6,
      alignItems: centerAlign ? "center" : "flex-end",
      justifyContent: "center",
      width: "100%",
      height,
      overflow: "hidden",
      color: color ?? "var(--az-accent, #2e5945)",
      ...style
    },
    children: Array.from({
      length: count
    }, (_, i) => {
      const value = moving && speech ? Math.max(0, Math.min(1, bands[i] ?? 0)) : 0;
      const heightPct = Math.min(maxHeight, Math.max(minHeight, value * 100 + 5));
      const highlight = !quiet && (speech || highlighted.includes(i));
      return /*#__PURE__*/_jsx("span", {
        "data-highlighted": highlight,
        style: {
          flex: 1,
          minWidth: 2,
          maxWidth: 12,
          height: "100%",
          borderRadius: 999,
          background: "currentColor",
          opacity: highlight ? 1 : 0.22,
          transform: `scaleY(${heightPct / 100})`,
          transformOrigin: centerAlign ? "center" : "bottom",
          transition: moving ? `transform ${motion.duration}ms cubic-bezier(0.16,1,0.3,1), opacity ${motion.duration}ms ease` : "none"
        }
      }, i);
    })
  });
}
