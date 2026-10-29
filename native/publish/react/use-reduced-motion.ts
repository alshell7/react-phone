// Generated from src/react/use-reduced-motion.ts. Run npm run package:build; do not edit.
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Follows the operating system's Reduce Motion / Remove animations setting. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(value => {
      if (live) setReduced(Boolean(value));
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (value: boolean) => setReduced(Boolean(value)));
    return () => {
      live = false;
      subscription?.remove();
    };
  }, []);
  return reduced;
}
