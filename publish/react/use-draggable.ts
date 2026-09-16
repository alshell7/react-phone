// Generated from src/react/use-draggable.ts. Run npm run package:build; do not edit.
"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type RefObject } from "react";
export interface PhonePosition {
  x: number;
  y: number;
}
export interface PhoneDragOptions {
  enabled?: boolean;
  bounds?: "viewport" | "parent";
  initialPosition?: PhonePosition;
  /** Supply with onPositionChange for controlled positioning. */
  position?: PhonePosition;
  onPositionChange?: (position: PhonePosition) => void;
}
export interface PhoneDragHandle {
  style: CSSProperties;
  handleProps: HTMLAttributes<HTMLButtonElement>;
  dragging: boolean;
  enabled: boolean;
}

/** Pointer capture covers mouse/touch/pen; keyboard arrows and Home are equivalent. */
export function useDraggable(ref: RefObject<HTMLDivElement | null>, option: boolean | PhoneDragOptions = false): PhoneDragHandle {
  const config = typeof option === "boolean" ? {
    enabled: option
  } : option;
  const enabled = config.enabled !== false;
  const [local, setLocal] = useState<PhonePosition>(config.initialPosition ?? {
    x: 0,
    y: 0
  });
  const [dragging, setDragging] = useState(false);
  const position = config.position ?? local;
  const committed = useRef(position);
  const latest = useRef({
    config,
    position
  });
  latest.current = {
    config,
    position
  };
  const start = useRef<{
    id: number;
    x: number;
    y: number;
    position: PhonePosition;
  } | null>(null);
  useLayoutEffect(() => {
    committed.current = enabled ? position : {
      x: 0,
      y: 0
    };
  });
  const clamp = (next: PhonePosition): PhonePosition => {
    const node = ref.current;
    if (!node) return next;
    const rect = node.getBoundingClientRect();
    const bounds = latest.current.config.bounds === "parent" ? node.parentElement?.getBoundingClientRect() : undefined;
    const left = bounds?.left ?? 8,
      top = bounds?.top ?? 8;
    const right = bounds?.right ?? window.innerWidth - 8,
      bottom = bounds?.bottom ?? window.innerHeight - 8;
    const baseX = rect.left - committed.current.x,
      baseY = rect.top - committed.current.y;
    const minX = left - baseX,
      maxX = Math.max(minX, right - baseX - rect.width);
    // For a tall phone keep the header reachable and let normal scrolling reach controls.
    const minY = top - baseY,
      maxY = Math.max(minY, bottom - baseY - rect.height);
    return {
      x: Math.min(maxX, Math.max(minX, Number.isFinite(next.x) ? next.x : 0)),
      y: Math.min(maxY, Math.max(minY, Number.isFinite(next.y) ? next.y : 0))
    };
  };
  const move = (next: PhonePosition) => {
    const safe = clamp(next);
    if (latest.current.config.position === undefined) setLocal(safe);
    latest.current.config.onPositionChange?.(safe);
  };
  useEffect(() => {
    if (!enabled) {
      start.current = null;
      setDragging(false);
      return;
    }
    const adjust = () => {
      const current = latest.current.position;
      const next = clamp(current);
      if (!Number.isFinite(current.x) || !Number.isFinite(current.y) || Math.abs(next.x - current.x) > 0.5 || Math.abs(next.y - current.y) > 0.5) move(next);
    };
    const observer = new ResizeObserver(adjust);
    if (ref.current) observer.observe(ref.current);
    if (ref.current?.parentElement) observer.observe(ref.current.parentElement);
    window.addEventListener("resize", adjust);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", adjust);
    };
  }, [enabled, config.bounds, ref]);
  return {
    enabled,
    dragging,
    style: enabled ? {
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      position: "relative",
      zIndex: dragging ? 50 : 5
    } : {},
    handleProps: {
      "aria-label": "Move phone",
      title: "Drag to move. Arrow keys move; Shift moves faster; Home resets.",
      onPointerDown(event) {
        if (!enabled || event.button !== 0) return;
        start.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          position
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        event.preventDefault();
        event.currentTarget.focus();
      },
      onPointerMove(event) {
        const origin = start.current;
        if (!origin || origin.id !== event.pointerId) return;
        move({
          x: origin.position.x + event.clientX - origin.x,
          y: origin.position.y + event.clientY - origin.y
        });
      },
      onPointerUp(event) {
        start.current = null;
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      },
      onPointerCancel() {
        start.current = null;
        setDragging(false);
      },
      onLostPointerCapture() {
        start.current = null;
        setDragging(false);
      },
      onKeyDown(event) {
        const step = event.shiftKey ? 40 : 10;
        const offset: Record<string, PhonePosition> = {
          ArrowLeft: {
            x: -step,
            y: 0
          },
          ArrowRight: {
            x: step,
            y: 0
          },
          ArrowUp: {
            x: 0,
            y: -step
          },
          ArrowDown: {
            x: 0,
            y: step
          }
        };
        if (event.key === "Home") {
          event.preventDefault();
          move(config.initialPosition ?? {
            x: 0,
            y: 0
          });
        } else if (offset[event.key]) {
          event.preventDefault();
          move({
            x: position.x + offset[event.key].x,
            y: position.y + offset[event.key].y
          });
        }
      }
    }
  };
}
