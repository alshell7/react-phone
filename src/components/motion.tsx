"use client";
import { createContext, useContext } from "react";
import { useReducedMotion } from "../react/use-reduced-motion.ts";

export interface PhoneMotion {
  enabled?: boolean;
  /** 80–600 ms; defaults to 220 ms. */
  durationMs?: number;
}
export const MotionContext = createContext<PhoneMotion>({});
export function usePhoneMotion(): { enabled: boolean; duration: number } {
  const motion = useContext(MotionContext);
  const reduced = useReducedMotion();
  return {
    enabled: motion.enabled !== false && !reduced,
    duration: Math.min(600, Math.max(80, motion.durationMs ?? 220)),
  };
}
