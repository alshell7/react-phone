import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  type GestureResponderHandlers,
  type HostInstance,
} from "react-native";

export interface PhonePosition {
  x: number;
  y: number;
}
export interface PhoneDragOptions {
  enabled?: boolean;
  /** Keep the phone inside the window (default) or let it move freely. */
  bounds?: "window" | "none";
  /** Inset from window edges when bounded, in points. Defaults to 8. */
  margin?: number;
  initialPosition?: PhonePosition;
  /** Supply with onPositionChange for controlled positioning. */
  position?: PhonePosition;
  onPositionChange?: (position: PhonePosition) => void;
}
export interface PhoneDragHandle {
  enabled: boolean;
  dragging: boolean;
  /** Apply to the moving container's `transform` style. */
  transform: ReturnType<Animated.ValueXY["getTranslateTransform"]>;
  translate: Animated.ValueXY;
  /** Spread onto the grip view. */
  handlers: GestureResponderHandlers;
  /** Return to the initial position (also exposed as an accessibility action). */
  reset: () => void;
}

/**
 * Drag the phone by its grip. Movement is clamped to the window using the view's
 * measured frame, and stays controlled when `position` is supplied.
 */
export function useDraggable(
  ref: { current: HostInstance | null },
  option: boolean | PhoneDragOptions = false,
): PhoneDragHandle {
  const config = typeof option === "boolean" ? { enabled: option } : option;
  const enabled = config.enabled !== false && option !== false;
  const initial = config.initialPosition ?? { x: 0, y: 0 };
  const translate = useRef(
    new Animated.ValueXY(config.position ?? initial),
  ).current;
  const [dragging, setDragging] = useState(false);
  const latest = useRef(config);
  latest.current = config;
  const committed = useRef<PhonePosition>(config.position ?? initial);
  const frame = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const next = enabled
      ? (config.position ?? committed.current)
      : { x: 0, y: 0 };
    committed.current = next;
    translate.setValue(next);
  }, [enabled, config.position?.x, config.position?.y, translate]);

  const clamp = (next: PhonePosition): PhonePosition => {
    const rect = frame.current;
    const bounds = latest.current.bounds ?? "window";
    const x = Number.isFinite(next.x) ? next.x : 0;
    const y = Number.isFinite(next.y) ? next.y : 0;
    if (!rect || bounds === "none") return { x, y };
    const margin = latest.current.margin ?? 8;
    const window = Dimensions.get("window");
    // `rect` is the frame at gesture start, which already includes `committed`.
    const baseX = rect.x - committed.current.x;
    const baseY = rect.y - committed.current.y;
    const minX = margin - baseX;
    const maxX = Math.max(minX, window.width - margin - baseX - rect.width);
    const minY = margin - baseY;
    const maxY = Math.max(
      minY,
      window.height - margin - baseY - Math.min(rect.height, 120),
    );
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  };
  const commit = (next: PhonePosition) => {
    committed.current = next;
    if (latest.current.position === undefined) translate.setValue(next);
    latest.current.onPositionChange?.(next);
  };
  const clampRef = useRef(clamp);
  clampRef.current = clamp;
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) + Math.abs(g.dy) > 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          setDragging(true);
          ref.current?.measureInWindow(
            (x: number, y: number, width: number, height: number) => {
              frame.current = { x, y, width, height };
            },
          );
        },
        onPanResponderMove: (_, g) => {
          const next = clampRef.current({
            x: committed.current.x + g.dx,
            y: committed.current.y + g.dy,
          });
          translate.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          setDragging(false);
          commitRef.current(
            clampRef.current({
              x: committed.current.x + g.dx,
              y: committed.current.y + g.dy,
            }),
          );
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          translate.setValue(committed.current);
        },
      }),
    [ref, translate],
  );

  return {
    enabled,
    dragging,
    translate,
    transform: enabled ? translate.getTranslateTransform() : [],
    handlers: enabled ? responder.panHandlers : {},
    reset: () => commit(latest.current.initialPosition ?? { x: 0, y: 0 }),
  };
}
