"use client";
import { useEffect, type RefObject } from "react";
import type { PhoneMotion } from "../components/motion.tsx";
import { useReducedMotion } from "./use-reduced-motion.ts";

/** Observe natural inner content, never the animated outer box, to avoid resize loops. */
export function useAnimatedSize(
  outer: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  motion: boolean | PhoneMotion = true,
): void {
  const reduced = useReducedMotion();
  const enabled =
    !reduced &&
    motion !== false &&
    (typeof motion !== "object" || motion.enabled !== false);
  const duration = Math.min(
    600,
    Math.max(80, typeof motion === "object" ? (motion.durationMs ?? 220) : 220),
  );
  useEffect(() => {
    const node = outer.current,
      inner = content.current;
    if (!node || !inner || !enabled || !node.animate) return;
    let height = inner.getBoundingClientRect().height;
    let animation: Animation | undefined;
    const observer = new ResizeObserver(() => {
      const next = inner.getBoundingClientRect().height;
      if (Math.abs(next - height) < 1) return;
      const start =
        animation?.playState === "running"
          ? node.getBoundingClientRect().height
          : height;
      animation?.cancel();
      animation = node.animate(
        [{ height: `${start}px` }, { height: `${next}px` }],
        { duration, easing: "cubic-bezier(0.16,1,0.3,1)" },
      );
      height = next;
    });
    observer.observe(inner);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, [outer, content, enabled, duration]);
}
