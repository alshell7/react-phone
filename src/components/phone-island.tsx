"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import {
  AudioLines,
  ChevronDown,
  ChevronUp,
  Phone,
  PhoneIncoming,
  PhoneOff,
} from "lucide-react";
import {
  PhoneProvider,
  usePhone,
  type PhoneProviderProps,
} from "../react/phone-provider.tsx";
import { useAnimatedSize } from "../react/use-animated-size.ts";
import { PhoneWidget, type PhoneWidgetProps } from "./phone-widget.tsx";
import { PhoneRoot } from "./theme.tsx";
import { CallTimer, ConnectionStatus } from "./controls.tsx";

/** Six logical docking positions within the window or a positioned container. */
export type PhoneIslandPlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
/** Expand the phone, show compact answer/decline actions, or leave opening to the user. */
export type IncomingCallBehavior = "expand" | "notify" | "manual";
export type PhoneIslandChangeReason =
  "user" | "incoming" | "outgoing" | "answered" | "ended";

/** Docked presentation of one provider's phone. Collapsing never disconnects it. */
export interface PhoneIslandProps extends Omit<
  PhoneWidgetProps,
  "draggable" | "elementRef"
> {
  /** `window` uses fixed positioning. `container` needs a positioned ancestor with a height. */
  scope?: "window" | "container";
  placement?: PhoneIslandPlacement;
  /** Inset from the docking area in CSS pixels; defaults to 20. Safe areas are added in window mode. */
  offset?: number | { x?: number; y?: number };
  zIndex?: number;
  incomingBehavior?: IncomingCallBehavior;
  /** Default false: an incoming call must not steal the user's keyboard focus. */
  focusOnIncoming?: boolean;
  expandOnOutgoing?: boolean;
  collapseAfterCall?: boolean;
  /** Defaults to 1400 ms; keeps the end state visible briefly. */
  collapseDelayMs?: number;
  defaultExpanded?: boolean;
  /** Controlled mode: the host must update this value in onExpandedChange. */
  expanded?: boolean;
  onExpandedChange?: (
    expanded: boolean,
    reason: PhoneIslandChangeReason,
  ) => void;
}

/** A persistent SIP status capsule that morphs into the full calling interface. */
export function PhoneIsland({
  scope = "window",
  placement = "bottom-right",
  offset = 20,
  zIndex = 50,
  incomingBehavior = "expand",
  focusOnIncoming = false,
  expandOnOutgoing = true,
  collapseAfterCall = true,
  collapseDelayMs = 1400,
  defaultExpanded = false,
  expanded: controlled,
  onExpandedChange,
  theme,
  motion,
  nonce,
  includeStyles,
  className,
  style,
  title = "Your phone",
  ...widget
}: PhoneIslandProps): ReactElement {
  const { state, client } = usePhone();
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const expanded = controlled ?? localExpanded;
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const wantsFocus = useRef(false);
  const panelId = useId();
  const handlers = useRef({ controlled, onExpandedChange });
  handlers.current = { controlled, onExpandedChange };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const change = (next: boolean, reason: PhoneIslandChangeReason) => {
    clearTimeout(timer.current);
    if (handlers.current.controlled === undefined) setLocalExpanded(next);
    handlers.current.onExpandedChange?.(next, reason);
  };
  const latestChange = useRef(change);
  latestChange.current = change;
  useAnimatedSize(frame, content, motion);

  // Consume each transition once; cosmetic prop changes never reopen a dismissed call.
  const previous = useRef({ client, status: "idle" as string, id: "" });
  useEffect(() => {
    const before = previous.current;
    const id = state.call?.id ?? "";
    if (
      before.client === client &&
      before.status === state.status &&
      before.id === id
    )
      return;
    previous.current = { client, status: state.status, id };
    clearTimeout(timer.current);
    if (state.status === "incoming" && incomingBehavior === "expand") {
      wantsFocus.current = focusOnIncoming;
      if (focusOnIncoming)
        previousFocus.current = document.activeElement as HTMLElement | null;
      latestChange.current(true, "incoming");
    } else if (
      state.call?.direction === "outgoing" &&
      id !== before.id &&
      !["idle", "ended"].includes(state.status) &&
      expandOnOutgoing
    ) {
      latestChange.current(true, "outgoing");
    } else if (
      state.status === "active" &&
      ["incoming", "answering"].includes(before.status) &&
      state.call?.direction === "incoming"
    ) {
      latestChange.current(true, "answered");
    } else if (state.status === "ended" && collapseAfterCall) {
      timer.current = setTimeout(
        () => {
          // Retain visible recovery instructions after failed calls / microphone denial.
          if (!client.getSnapshot().error) latestChange.current(false, "ended");
        },
        Math.max(0, Math.min(30000, collapseDelayMs)),
      );
    }
  }, [
    client,
    state.status,
    state.call?.id,
    state.call?.direction,
    incomingBehavior,
    focusOnIncoming,
    expandOnOutgoing,
    collapseAfterCall,
    collapseDelayMs,
  ]);
  useEffect(() => () => clearTimeout(timer.current), [client]);
  useEffect(() => {
    if (!expanded) {
      const focused = document.activeElement;
      if (
        focused &&
        root.current?.querySelector(".az-island-panel")?.contains(focused)
      ) {
        trigger.current?.focus({ preventScroll: true });
      }
    }
    if (expanded && wantsFocus.current) {
      wantsFocus.current = false;
      root.current
        ?.querySelector<HTMLButtonElement>(
          ".az-incoming-actions button:last-child",
        )
        ?.focus({ preventScroll: true });
    }
  }, [expanded, state.status, state.call?.id]);
  const close = () => {
    change(false, "user");
    if (previousFocus.current?.isConnected)
      previousFocus.current.focus({ preventScroll: true });
    else trigger.current?.focus({ preventScroll: true });
    previousFocus.current = null;
  };
  const incoming = state.status === "incoming";
  const active = state.status === "active" || state.status === "held";
  const busy = !["idle", "ended"].includes(state.status);
  const rawCaller = state.call?.caller;
  const caller =
    rawCaller && widget.resolveCaller
      ? widget.resolveCaller(rawCaller)
      : rawCaller;
  const label = incoming
    ? "Incoming call"
    : state.status === "held" || state.remoteHeld
      ? "On hold"
      : state.status === "active"
        ? "In conversation"
        : state.status === "answering"
          ? "Connecting call"
          : busy
            ? "Calling"
            : state.error
              ? "Phone needs attention"
              : state.playbackBlocked
                ? "Enable call audio"
                : title;
  const inset = (value: number | undefined) =>
    Number.isFinite(value) ? Math.max(0, Math.min(500, value!)) : 20;
  const x = inset(typeof offset === "number" ? offset : offset.x);
  const y = inset(typeof offset === "number" ? offset : offset.y);
  const isBottom = placement.startsWith("bottom");
  const align = placement.endsWith("left")
    ? "flex-start"
    : placement.endsWith("right")
      ? "flex-end"
      : "center";
  const safe = (edge: string, value: number) =>
    scope === "window"
      ? `max(${value}px, env(safe-area-inset-${edge}, 0px))`
      : `${value}px`;
  const anchorStyle: CSSProperties = {
    position: scope === "window" ? "fixed" : "absolute",
    top: safe("top", y),
    bottom: safe("bottom", y),
    left: safe("left", x),
    right: safe("right", x),
    display: "flex",
    justifyContent: align,
    alignItems: isBottom ? "flex-end" : "flex-start",
    pointerEvents: "none",
    zIndex,
  };
  return (
    <div
      className="az-island-anchor"
      data-scope={scope}
      data-placement={placement}
      style={anchorStyle}
    >
      <PhoneRoot
        theme={theme}
        motion={motion}
        nonce={nonce}
        includeStyles={includeStyles}
        elementRef={root}
        className={`az-island ${className ?? ""}`}
        style={{
          ...style,
          width: expanded
            ? widget.preset === "compact"
              ? 480
              : 380
            : incoming && incomingBehavior === "notify"
              ? 360
              : 288,
        }}
      >
        <div
          className="az-island-shell"
          data-expanded={expanded}
          data-incoming={incoming}
          ref={frame}
          onKeyDown={(event) => {
            if (event.key === "Escape" && expanded && !event.defaultPrevented) {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        >
          <div ref={content}>
            <div className="az-island-bar">
              <button
                ref={trigger}
                type="button"
                className="az-island-trigger"
                aria-label={
                  expanded
                    ? "Collapse phone"
                    : busy
                      ? "Open call"
                      : "Open phone"
                }
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => (expanded ? close() : change(true, "user"))}
              >
                <span className="az-island-mark" aria-hidden="true">
                  {incoming ? (
                    <PhoneIncoming size={20} />
                  ) : (
                    <AudioLines size={20} />
                  )}
                </span>
                <span className="az-island-copy">
                  <strong>{label}</strong>
                  <ConnectionStatus />
                </span>
                <span className="az-island-chevron" aria-hidden="true">
                  {expanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronUp size={16} />
                  )}
                </span>
              </button>
              {!expanded && active && <CallTimer />}
            </div>
            <span className="az-sr-only" role="status">
              {incoming
                ? `Incoming call from ${caller?.name ?? caller?.number ?? "unknown caller"}`
                : ""}
            </span>
            {!expanded && busy && (
              <div className="az-island-call-summary">
                <span>{caller?.name ?? caller?.number ?? "Connecting"}</span>
                {state.muted && <span>Muted</span>}
              </div>
            )}
            {!expanded && incoming && incomingBehavior === "notify" && (
              <div
                className="az-island-notification"
                aria-label="Incoming call actions"
              >
                <button
                  type="button"
                  className="az-button az-danger"
                  onClick={() => client.hangup()}
                >
                  <PhoneOff size={17} />
                  Decline
                </button>
                <button
                  type="button"
                  className="az-button az-primary"
                  onClick={() => {
                    change(true, "user");
                    void client.answer().catch(() => {});
                  }}
                >
                  <Phone size={17} />
                  Answer
                </button>
              </div>
            )}
            {/* Stay mounted: auto-dial consumption, dial input, and the SIP session survive collapse. */}
            <div id={panelId} hidden={!expanded} className="az-island-panel">
              <PhoneWidget
                {...widget}
                title={title}
                theme={theme}
                motion={motion}
                nonce={nonce}
                includeStyles={false}
              />
            </div>
          </div>
        </div>
      </PhoneRoot>
    </div>
  );
}

export interface WebPhoneIslandProps
  extends Omit<PhoneProviderProps, "children">, PhoneIslandProps {}

/** All-in-one island. Use PhoneIsland inside an existing PhoneProvider to share a line. */
export function WebPhoneIsland({
  config,
  autoConnect,
  preview,
  client,
  tones,
  onEvent,
  onIncomingCall,
  onAnswered,
  onDisconnected,
  onConnectionChange,
  onError,
  ...island
}: WebPhoneIslandProps): ReactElement {
  return (
    <PhoneProvider
      {...{
        config,
        autoConnect,
        preview,
        client,
        tones,
        onEvent,
        onIncomingCall,
        onAnswered,
        onDisconnected,
        onConnectionChange,
        onError,
      }}
    >
      <PhoneIsland {...island} />
    </PhoneProvider>
  );
}
