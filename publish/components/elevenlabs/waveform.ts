// Generated from src/components/elevenlabs/waveform.tsx. Run npm run package:build; do not edit.
"use client";

/**
 * Adapted from ElevenLabs UI's Waveform (MIT, Copyright 2025 Eleven Labs Inc.).
 * Source: https://github.com/elevenlabs/ui/blob/main/apps/www/registry/elevenlabs-ui/ui/waveform.tsx
 * Changes: scoped styling, bounded values, static empty baseline, persistent resize
 * observer, and React/JSR explicit return types. See THIRD_PARTY_NOTICES.md.
 */
import { useEffect, useRef } from "react";

/** Visual-only waveform. Media acquisition belongs to the phone, not this component. */
import { jsx as _jsx } from "react/jsx-runtime";
import type { ReactElement } from "../../react-types.d.ts";
export interface WaveformProps {
  data?: readonly number[];
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  height?: number;
}

/** ElevenLabs UI canvas waveform, driven by caller-supplied audio samples. */
export function Waveform({
  data = [],
  barWidth = 3,
  barGap = 3,
  barRadius = 2,
  barColor,
  height = 64
}: WaveformProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef(data);
  const drawRef = useRef<() => void>(() => {});
  useEffect(() => {
    dataRef.current = data;
    drawRef.current();
  }, [data]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.max(1, barWidth);
    const gap = Math.max(0, barGap);
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx || rect.width === 0) return;
      ctx.scale(dpr, dpr);
      const color = barColor || getComputedStyle(canvas).getPropertyValue("--az-accent").trim() || "#294f3d";
      const barCount = Math.floor(rect.width / (width + gap));
      for (let i = 0; i < barCount; i++) {
        const samples = dataRef.current;
        const value = Math.max(0, Math.min(1, samples[Math.floor(i / barCount * samples.length)] || 0));
        const barHeight = Math.max(3, value * rect.height * 0.8);
        const x = i * (width + gap);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3 + value * 0.7;
        ctx.beginPath();
        ctx.roundRect(x, (rect.height - barHeight) / 2, width, barHeight, Math.max(0, barRadius));
        ctx.fill();
      }
      const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
      const fadePercent = Math.min(0.2, 24 / rect.width);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(fadePercent, "rgba(255,255,255,0)");
      gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)");
      gradient.addColorStop(1, "rgba(255,255,255,1)");
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.globalCompositeOperation = "source-over";
    };
    drawRef.current = render;
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    return () => {
      observer.disconnect();
      drawRef.current = () => {};
    };
  }, [barWidth, barGap, barRadius, barColor, height]);
  return /*#__PURE__*/_jsx("canvas", {
    ref: canvasRef,
    className: "az-waveform",
    style: {
      height,
      width: "100%",
      display: "block"
    },
    "aria-hidden": "true"
  });
}
