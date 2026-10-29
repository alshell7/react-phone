import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import {
  AudioLines,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Phone,
  PhoneIncoming,
  PhoneOff,
} from "lucide-react-native";
import {
  PhoneProvider,
  usePhone,
  type PhoneProviderProps,
} from "../react/phone-provider.tsx";
import { useCallActivity } from "../react/use-call-activity.ts";
import {
  PhoneRoot,
  controlRadius,
  mixColors,
  readableColor,
  usePhoneTheme,
  withAlpha,
} from "./theme.tsx";
import { usePhoneLabels, usePhoneNumberFormatter } from "./locale.tsx";
import { animateNextLayout, usePhoneMotion } from "./motion.tsx";
import {
  PhoneText,
  PressableScale,
  PulseRings,
  accessibilityStateProps,
} from "./primitives.tsx";
import { CallTimer, action } from "./status.tsx";
import { Avatar } from "./caller-card.tsx";
import {
  PhoneWidget,
  type PhoneWidgetProps,
  type SafeAreaInsets,
} from "./phone-widget.tsx";

/** Six logical docking positions within the window or a positioned container. */
export type PhoneIslandPlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
/** Expand the phone, show a heads-up banner, or leave opening to the user. */
export type IncomingCallBehavior = "expand" | "notify" | "manual";
export type PhoneIslandChangeReason =
  "user" | "incoming" | "outgoing" | "answered" | "ended";

/** Docked presentation of one provider's phone. Collapsing never disconnects it. */
export interface PhoneIslandProps extends Omit<
  PhoneWidgetProps,
  "draggable" | "variant" | "onMinimize" | "insets"
> {
  /** `window` adds safe-area insets; `container` docks inside its parent. Both overlay absolutely. */
  scope?: "window" | "container";
  /** Defaults to top-center, where the system call indicator lives on phones. */
  placement?: PhoneIslandPlacement;
  /** Inset from the docking edge in points; defaults to 12. */
  offset?: number | { x?: number; y?: number };
  /** Safe-area insets (from react-native-safe-area-context), added in window scope. */
  insets?: SafeAreaInsets;
  zIndex?: number;
  incomingBehavior?: IncomingCallBehavior;
  /** Announce incoming calls to VoiceOver/TalkBack. Defaults to true. */
  announceIncoming?: boolean;
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
  /** Dim the app behind the expanded island; tapping it collapses. Defaults to true. */
  backdrop?: boolean;
  /** `contrast` (default) is a dark capsule like the system island; `surface` follows the theme. */
  tone?: "contrast" | "surface";
  /** Maximum expanded width; defaults to 420. */
  expandedWidth?: number;
}

function IslandBars({ color }: { color: string }): ReactElement {
  const activity = useCallActivity(4);
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2.5,
        height: 18,
      }}
    >
      {activity.bands.map((band, i) => (
        <View
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            height: 4 + Math.round(band * 14),
            backgroundColor: color,
            opacity: activity.active ? 1 : 0.5,
          }}
        />
      ))}
    </View>
  );
}

/** A persistent SIP status capsule that morphs into the full calling interface. */
export function PhoneIsland({
  theme,
  motion,
  labels,
  formatNumber,
  style,
  testID,
  ...props
}: PhoneIslandProps): ReactElement {
  return (
    <PhoneRoot
      theme={theme}
      motion={motion}
      labels={labels}
      formatNumber={formatNumber}
      testID={testID}
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: props.zIndex ?? 50,
        },
        style,
      ]}
    >
      <IslandBody
        {...props}
        theme={theme}
        motion={motion}
        labels={labels}
        formatNumber={formatNumber}
      />
    </PhoneRoot>
  );
}

function IslandBody({
  scope = "window",
  placement = "top-center",
  offset = 12,
  insets = {},
  incomingBehavior = "expand",
  announceIncoming = true,
  expandOnOutgoing = true,
  collapseAfterCall = true,
  collapseDelayMs = 1400,
  defaultExpanded = false,
  expanded: controlled,
  onExpandedChange,
  backdrop = true,
  tone = "contrast",
  expandedWidth = 420,
  title,
  theme: themeTokens,
  motion: motionSetting,
  ...widget
}: Omit<PhoneIslandProps, "style" | "testID">): ReactElement {
  const { state, client, preview } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const format = usePhoneNumberFormatter();
  const motion = usePhoneMotion();
  const window = useWindowDimensions();
  // Dock within the measured overlay so container scope never sizes from the window.
  const [measured, setMeasured] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const area = measured ?? window;
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const expanded = controlled ?? localExpanded;
  const handlers = useRef({ controlled, onExpandedChange });
  handlers.current = { controlled, onExpandedChange };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const change = (next: boolean, reason: PhoneIslandChangeReason) => {
    clearTimeout(timer.current);
    animateNextLayout(motion.enabled, motion.duration + 80);
    if (handlers.current.controlled === undefined) setLocalExpanded(next);
    handlers.current.onExpandedChange?.(next, reason);
  };
  const latestChange = useRef(change);
  latestChange.current = change;

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
    if (state.status === "incoming") {
      if (announceIncoming) {
        const who =
          state.call?.caller.name ??
          state.call?.caller.number ??
          labels.unknownCaller;
        AccessibilityInfo.announceForAccessibility?.(
          labels.incomingCallFrom(who),
        );
      }
      if (incomingBehavior === "expand") latestChange.current(true, "incoming");
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
          // Keep recovery instructions visible after failed calls / microphone denial.
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
    state.call?.caller.name,
    state.call?.caller.number,
    incomingBehavior,
    announceIncoming,
    expandOnOutgoing,
    collapseAfterCall,
    collapseDelayMs,
  ]);
  useEffect(() => () => clearTimeout(timer.current), [client]);

  // Android back collapses the island before navigating.
  useEffect(() => {
    if (!expanded) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        latestChange.current(false, "user");
        return true;
      },
    );
    return () => subscription.remove();
  }, [expanded]);

  const reveal = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    if (!motion.enabled) {
      reveal.setValue(expanded ? 1 : 0);
      return;
    }
    const animation = Animated.timing(reveal, {
      toValue: expanded ? 1 : 0,
      duration: motion.duration + 60,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, motion.enabled, motion.duration, reveal]);

  const top = placement.startsWith("top");
  const latestPlacement = useRef({ top, expanded });
  latestPlacement.current = { top, expanded };
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        const { top: atTop, expanded: open } = latestPlacement.current;
        const towardContent = atTop ? g.dy > 28 : g.dy < -28;
        const towardEdge = atTop ? g.dy < -28 : g.dy > 28;
        if (!open && towardContent) latestChange.current(true, "user");
        else if (open && towardEdge) latestChange.current(false, "user");
      },
    }),
  ).current;

  const incoming = state.status === "incoming";
  const active = state.status === "active" || state.status === "held";
  const busy = !["idle", "ended"].includes(state.status);
  const rawCaller = state.call?.caller;
  const caller =
    rawCaller && widget.resolveCaller
      ? widget.resolveCaller(rawCaller)
      : rawCaller;
  const heading = title ?? labels.title;
  const label = incoming
    ? labels.incomingCall
    : state.status === "held" || state.remoteHeld
      ? labels.onHold
      : state.status === "active"
        ? labels.inConversation
        : state.status === "answering"
          ? labels.connectingCall
          : busy
            ? labels.callingShort
            : state.error
              ? labels.needsAttention
              : state.playbackBlocked
                ? labels.enableCallAudio
                : heading;
  const connectionLabel = {
    disconnected: labels.notConnected,
    connecting: labels.connecting,
    registered: preview ? labels.previewMode : labels.readyForCalls,
    reconnecting: labels.reconnecting,
    error: labels.connectionFailed,
  }[state.connection];
  const who =
    caller?.name ?? (caller?.number ? format(caller.number) : undefined);
  const secondary = incoming
    ? caller?.name
      ? format(caller.number)
      : labels.tapToAnswer
    : busy
      ? [who, state.muted ? labels.muted : null].filter(Boolean).join(" · ")
      : connectionLabel;

  const inset = (value: number | undefined) =>
    Number.isFinite(value) ? Math.max(0, Math.min(500, value!)) : 12;
  const ox = inset(typeof offset === "number" ? offset : offset.x);
  const oy = inset(typeof offset === "number" ? offset : offset.y);
  const safe = scope === "window" ? insets : {};
  const notify = incoming && !expanded && incomingBehavior === "notify";
  const available = area.width - ox * 2 - (safe.left ?? 0) - (safe.right ?? 0);
  const width = Math.max(
    200,
    Math.min(
      available,
      expanded ? expandedWidth : notify ? 380 : busy ? 300 : 250,
    ),
  );
  const contrast = tone === "contrast";
  const pillBg = contrast ? theme.islandBackground : theme.background;
  const pillFg = contrast ? theme.islandForeground : theme.foreground;
  const pillMuted = contrast
    ? withAlpha(theme.islandForeground, 0.62)
    : theme.muted;
  // A dark accent disappears on the dark capsule; lift it toward white for contrast.
  const glow =
    contrast &&
    readableColor(theme.islandBackground) === "#ffffff" &&
    readableColor(theme.accent) === "#ffffff"
      ? mixColors(theme.accent, "#ffffff", 0.38)
      : theme.accent;
  const onGlow = readableColor(glow);
  // A custom answer colour wins; otherwise the lifted accent reads on the capsule.
  const answerColor =
    contrast && theme.answer === theme.accent ? glow : theme.answer;
  const maxPanel =
    area.height - oy * 2 - (safe.top ?? 0) - (safe.bottom ?? 0) - 64;
  const align = placement.endsWith("left")
    ? "flex-start"
    : placement.endsWith("right")
      ? "flex-end"
      : "center";

  const mark = (
    <View
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PulseRings
        size={32}
        color={glow}
        active={incoming}
        rings={2}
        spread={1.6}
      />
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: state.error
            ? theme.danger
            : busy
              ? glow
              : withAlpha(pillFg, 0.12),
        }}
      >
        {state.error && !busy ? (
          <CircleAlert size={17} color={theme.dangerForeground} />
        ) : incoming ? (
          <PhoneIncoming size={16} color={onGlow} />
        ) : busy ? (
          <Phone size={15} color={onGlow} fill={onGlow} />
        ) : (
          <AudioLines size={17} color={pillFg} />
        )}
      </View>
    </View>
  );

  const bar = (
    <View {...swipe.panHandlers}>
      <Pressable
        onPress={() => change(!expanded, "user")}
        accessibilityRole="button"
        accessibilityLabel={
          expanded
            ? labels.collapsePhone
            : busy
              ? labels.openCall
              : labels.openPhone
        }
        accessibilityHint={expanded ? undefined : `${label}. ${secondary}`}
        {...accessibilityStateProps("button", { expanded })}
        testID="island-trigger"
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minHeight: 52,
          paddingLeft: 10,
          paddingRight: 14,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {mark}
        <View style={{ flex: 1, minWidth: 0 }}>
          <PhoneText
            size={14}
            weight="600"
            color={expanded ? theme.foreground : pillFg}
            numberOfLines={1}
          >
            {label}
          </PhoneText>
          {secondary ? (
            <PhoneText
              size={12}
              color={expanded ? theme.muted : pillMuted}
              numberOfLines={1}
            >
              {secondary}
            </PhoneText>
          ) : null}
        </View>
        {!expanded && active ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <CallTimer color={glow} size={14} />
            <IslandBars color={glow} />
          </View>
        ) : expanded ? (
          top ? (
            <ChevronUp size={18} color={theme.muted} />
          ) : (
            <ChevronDown size={18} color={theme.muted} />
          )
        ) : !busy ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                state.connection === "registered"
                  ? glow
                  : state.connection === "error"
                    ? theme.danger
                    : pillMuted,
            }}
          />
        ) : null}
      </Pressable>
    </View>
  );

  const banner = notify ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 12,
        paddingBottom: 12,
      }}
    >
      <Avatar caller={caller} size={40} />
      <PhoneText
        size={16}
        weight="600"
        color={pillFg}
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {who ?? labels.unknownCaller}
      </PhoneText>
      <PressableScale
        onPress={() => client.hangup()}
        accessibilityLabel={labels.decline}
        scaleTo={0.88}
        style={{
          width: 46,
          height: 46,
          borderRadius: controlRadius(theme, 46),
          backgroundColor: theme.danger,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PhoneOff size={20} color={theme.dangerForeground} />
      </PressableScale>
      <PressableScale
        onPress={() => {
          change(true, "user");
          action(() => client.answer());
        }}
        accessibilityLabel={labels.answer}
        scaleTo={0.88}
        style={{
          width: 46,
          height: 46,
          borderRadius: controlRadius(theme, 46),
          backgroundColor: answerColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Phone
          size={20}
          color={readableColor(answerColor)}
          fill={readableColor(answerColor)}
        />
      </PressableScale>
    </View>
  ) : null;

  const radius = expanded ? Math.max(theme.radius + 8, 28) : notify ? 30 : 26;
  return (
    <View
      pointerEvents="box-none"
      style={{ flex: 1 }}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) setMeasured({ width, height });
      }}
    >
      {backdrop ? (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.28)",
            opacity: reveal,
          }}
        >
          {/* Touch-only: assistive tech uses the trigger, Android Back, or the iOS escape gesture. */}
          <Pressable
            style={{ flex: 1 }}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            onPress={() => change(false, "user")}
          />
        </Animated.View>
      ) : null}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: top ? oy + (safe.top ?? 0) : undefined,
          bottom: top ? undefined : oy + (safe.bottom ?? 0),
          left: ox + (safe.left ?? 0),
          right: ox + (safe.right ?? 0),
          alignItems: align,
        }}
      >
        <Animated.View
          testID="island-shell"
          onAccessibilityEscape={
            expanded ? () => change(false, "user") : undefined
          }
          style={{
            width,
            borderRadius: radius,
            overflow: "hidden",
            backgroundColor: pillBg,
            borderWidth:
              contrast && theme.appearance === "dark"
                ? 1
                : tone === "surface"
                  ? 1
                  : 0,
            borderColor: contrast ? "rgba(255,255,255,0.08)" : theme.border,
            boxShadow:
              "0 14px 38px -12px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.12)",
            transform: [
              {
                scale: reveal.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0.985, 1],
                }),
              },
            ],
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.background,
              opacity: reveal,
            }}
          />
          {top ? bar : null}
          {banner}
          {/* Stay mounted: auto-dial consumption, dial input, and the SIP session survive collapse. */}
          <Animated.View
            style={{ display: expanded ? "flex" : "none", opacity: reveal }}
            importantForAccessibility={
              expanded ? "auto" : "no-hide-descendants"
            }
          >
            <ScrollView
              style={{ maxHeight: Math.max(240, maxPanel) }}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <PhoneWidget
                {...widget}
                title={heading}
                theme={themeTokens}
                motion={motionSetting}
                variant="sheet"
                header={null}
              />
            </ScrollView>
          </Animated.View>
          {top ? null : bar}
        </Animated.View>
      </View>
    </View>
  );
}

export interface SipPhoneIslandProps
  extends Omit<PhoneProviderProps, "children">, PhoneIslandProps {}

/** All-in-one island. Use PhoneIsland inside an existing PhoneProvider to share a line. */
export function SipPhoneIsland({
  config,
  autoConnect,
  preview,
  client,
  tones,
  media,
  audioSession,
  haptics,
  refreshOnForeground,
  onEvent,
  onIncomingCall,
  onAnswered,
  onDisconnected,
  onConnectionChange,
  onError,
  ...island
}: SipPhoneIslandProps): ReactElement {
  return (
    <PhoneProvider
      {...{
        config,
        autoConnect,
        preview,
        client,
        tones,
        media,
        audioSession,
        haptics,
        refreshOnForeground,
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
