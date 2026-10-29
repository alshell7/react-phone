import { createContext, useContext } from "react";
import { LayoutAnimation, Platform } from "react-native";
import { useReducedMotion } from "../react/use-reduced-motion.ts";

export interface PhoneMotion {
  enabled?: boolean;
  /** 80–600 ms; defaults to 240 ms. */
  durationMs?: number;
}
export const MotionContext = createContext<PhoneMotion>({});

/** Motion settings after applying the OS Reduce Motion preference. */
export function usePhoneMotion(): { enabled: boolean; duration: number } {
  const motion = useContext(MotionContext);
  const reduced = useReducedMotion();
  return {
    enabled: motion.enabled !== false && !reduced,
    duration: Math.min(600, Math.max(80, motion.durationMs ?? 240)),
  };
}

/** Animate the next layout pass natively (size changes, items appearing/disappearing). */
export function animateNextLayout(enabled: boolean, duration: number): void {
  if (!enabled || Platform.OS === "web") return;
  LayoutAnimation.configureNext({
    duration,
    create: { type: "easeInEaseOut", property: "opacity" },
    update: { type: "spring", springDamping: 0.86 },
    delete: { type: "easeInEaseOut", property: "opacity" },
  });
}
