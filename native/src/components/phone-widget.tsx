import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Animated,
  Linking,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
  type HostInstance,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  AudioLines,
  ChevronDown,
  GripHorizontal,
  Headphones,
  Settings2,
  X,
} from "lucide-react-native";
import {
  PhoneProvider,
  usePhone,
  type PhoneProviderProps,
} from "../react/phone-provider.tsx";
import { useAutoDial } from "../react/use-auto-dial.ts";
import {
  useDraggable,
  type PhoneDragHandle,
  type PhoneDragOptions,
} from "../react/use-draggable.ts";
import type { Caller } from "../core/types.ts";
import { PhoneRoot, mixColors, usePhoneTheme, type PhoneRootProps } from "./theme.tsx";
import { animateNextLayout, usePhoneMotion } from "./motion.tsx";
import { Appear, IconButton, PhoneText, PressableScale } from "./primitives.tsx";
import { CallTimer, ConnectionStatus, ErrorBanner } from "./status.tsx";
import { Avatar, CallerCard, type CallerCardProps } from "./caller-card.tsx";
import { Dialer } from "./dialer.tsx";
import {
  CallControls,
  IncomingCallActions,
  type CallControl,
} from "./call-controls.tsx";
import { AudioSettings } from "./audio-settings.tsx";
import { CallHistory } from "./call-history.tsx";
import {
  CallBarVisualizer,
  CallOrb,
  CallWaveform,
  type CallBarVisualizerProps,
  type CallOrbProps,
  type CallWaveformProps,
} from "./call-visuals.tsx";

export type PhonePreset = "basic" | "advanced" | "compact";

export interface PhoneVisualization {
  /** Defaults to waveform; explicit selection overrides features.waveform. */
  type?: "avatar" | "orb" | "waveform" | "bars" | "both" | "none";
  orb?: CallOrbProps;
  waveform?: CallWaveformProps;
  bars?: CallBarVisualizerProps;
}

export interface PhoneFeatures {
  keypad: boolean;
  hold: boolean;
  transfer: boolean;
  waveform: boolean;
  audioSettings: boolean;
  mute: boolean;
  /** Earpiece/loudspeaker toggle (shown when routing is available). */
  speaker: boolean;
  /** Keypad / Recents tabs while idle. */
  recents: boolean;
}

/** Presets are ordinary feature objects; override any feature per instance. */
export const phonePresets: Readonly<Record<PhonePreset, Readonly<PhoneFeatures>>> = {
  basic: {
    mute: true,
    keypad: false,
    hold: false,
    transfer: false,
    waveform: true,
    audioSettings: true,
    speaker: true,
    recents: false,
  },
  advanced: {
    mute: true,
    keypad: true,
    hold: true,
    transfer: true,
    waveform: true,
    audioSettings: true,
    speaker: true,
    recents: true,
  },
  compact: {
    mute: true,
    keypad: false,
    hold: true,
    transfer: false,
    waveform: false,
    audioSettings: false,
    speaker: true,
    recents: false,
  },
};

export interface SafeAreaInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface PhoneWidgetProps
  extends Omit<PhoneRootProps, "children">,
    Omit<CallerCardProps, "caller" | "visual" | "size" | "color"> {
  preset?: PhonePreset;
  features?: Partial<PhoneFeatures>;
  /**
   * `card` embeds in your layout; `screen` fills its parent as a full phone; `sheet`
   * drops the outer chrome for your own modal or bottom sheet.
   */
  variant?: "card" | "screen" | "sheet";
  title?: string;
  /** Contact used for an outgoing call. Actual incoming identity is kept separate. */
  caller?: Caller;
  /** Enrich incoming and outgoing caller metadata from your CRM. */
  resolveCaller?: (caller: Caller) => Caller;
  /** Replace the header; `null` hides it. */
  header?: ReactNode;
  /** Replace the footer; `null` hides it. */
  footer?: ReactNode;
  defaultNumber?: string;
  /** Call defaultNumber (or caller.number) once after registration. */
  autoDial?: boolean;
  /** Change to explicitly repeat an automatic call to the same number. */
  autoDialKey?: string;
  visualization?: PhoneVisualization;
  controls?: readonly CallControl[];
  /** Answer with round buttons (default) or an iOS-style slider. */
  answerStyle?: "buttons" | "slide";
  /** Card variant only: drag the phone by its grip. */
  draggable?: boolean | PhoneDragOptions;
  /** Omit to hide attribution. Non-HTTP links render as plain text. */
  branding?: { name: string; href?: string };
  /** Screen variant: safe-area insets, for example from react-native-safe-area-context. */
  insets?: SafeAreaInsets;
  /** Screen variant: tint the background during calls. Defaults to true. */
  immersive?: boolean;
  /** Shows a minimize control during calls (used by PhoneIsland). */
  onMinimize?: () => void;
}

type Phase = "settings" | "idle" | "incoming" | "call";

function ImmersiveBackground(): ReactElement {
  const theme = usePhoneTheme();
  const top = mixColors(theme.background, theme.accent, theme.appearance === "dark" ? 0.32 : 0.2);
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Defs>
        <LinearGradient id="azImmersive" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="0.62" stopColor={theme.background} />
          <Stop offset="1" stopColor={theme.background} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#azImmersive)" />
    </Svg>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const theme = usePhoneTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: "row", padding: 3, borderRadius: 12, backgroundColor: theme.surface, alignSelf: "stretch" }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            scaleTo={0.97}
            style={{
              flex: 1,
              minHeight: 36,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? theme.background : "transparent",
              boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.12)" : undefined,
            }}
          >
            <PhoneText size={14} weight={selected ? "600" : "500"} color={selected ? theme.foreground : theme.muted}>
              {option.label}
            </PhoneText>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Compact summary of the call that just ended, shown above the keypad. */
function LastCall({
  caller,
  renderAvatar,
}: {
  caller?: Caller;
  renderAvatar?: (caller: Caller) => ReactNode;
}) {
  const { state } = usePhone();
  const theme = usePhoneTheme();
  const call = state.call;
  if (!call) return null;
  const name = caller?.name || caller?.number || "Last call";
  const reason = call.endReason ?? "Call ended";
  return (
    <View
      accessible
      accessibilityLabel={`${name}, ${reason}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 10,
        paddingRight: 16,
        borderRadius: 18,
        backgroundColor: theme.surface,
        alignSelf: "center",
        maxWidth: "100%",
      }}
    >
      <Avatar caller={caller} size={40} render={renderAvatar} />
      <View style={{ flexShrink: 1 }}>
        <PhoneText size={15} weight="600" numberOfLines={1}>
          {name}
        </PhoneText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <PhoneText size={13} color={theme.muted} numberOfLines={1}>
            {reason}
          </PhoneText>
          {call.answeredAt ? (
            <>
              <PhoneText size={13} color={theme.muted}>
                ·
              </PhoneText>
              <CallTimer size={13} />
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Branding({ branding }: { branding?: { name: string; href?: string } }) {
  const theme = usePhoneTheme();
  if (!branding?.name.trim()) return null;
  const link = branding.href && /^https?:\/\//i.test(branding.href) ? branding.href : null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", paddingBottom: 12, paddingTop: 2 }}>
      <PhoneText size={11} color={theme.muted}>
        Powered by{" "}
      </PhoneText>
      {link ? (
        <PhoneText
          size={11}
          weight="600"
          color={theme.muted}
          accessibilityRole="link"
          style={{ textDecorationLine: "underline" }}
          onPress={() => void Linking.openURL(link).catch(() => {})}
        >
          {branding.name}
        </PhoneText>
      ) : (
        <PhoneText size={11} weight="600" color={theme.muted}>
          {branding.name}
        </PhoneText>
      )}
    </View>
  );
}

/** A styled phone sharing the parent provider's single connection. */
export function PhoneWidget({
  theme,
  motion,
  style,
  testID,
  draggable = false,
  variant = "card",
  ...props
}: PhoneWidgetProps): ReactElement {
  const viewRef = useRef<HostInstance>(null);
  const drag = useDraggable(viewRef, variant === "card" ? draggable : false);
  const screen = variant === "screen";
  return (
    <PhoneRoot
      theme={theme}
      motion={motion}
      testID={testID}
      style={[
        screen ? { flex: 1 } : variant === "sheet" ? { alignSelf: "stretch" } : { alignSelf: "center", width: "100%", maxWidth: 400 },
        style,
      ]}
    >
      <Animated.View
        ref={viewRef}
        style={[
          screen ? { flex: 1 } : null,
          { transform: drag.transform, zIndex: drag.dragging ? 50 : undefined },
        ]}
      >
        <WidgetBody {...props} variant={variant} drag={drag} />
      </Animated.View>
    </PhoneRoot>
  );
}

function WidgetBody({
  preset = "advanced",
  features,
  variant,
  title = "Your phone",
  caller,
  resolveCaller,
  renderAvatar,
  renderTags,
  showAvatar,
  header,
  footer,
  defaultNumber = "",
  autoDial = false,
  autoDialKey,
  visualization,
  controls,
  answerStyle,
  branding,
  insets = {},
  immersive = true,
  onMinimize,
  drag,
}: Omit<PhoneWidgetProps, "theme" | "motion" | "style" | "testID" | "draggable"> & {
  drag: PhoneDragHandle;
}): ReactElement {
  const { state } = usePhone();
  const theme = usePhoneTheme();
  const motion = usePhoneMotion();
  const window = useWindowDimensions();
  const screen = variant === "screen";
  const options = { ...phonePresets[preset], ...features };
  const prefilled = defaultNumber || caller?.number || "";
  const [number, setNumber] = useState(prefilled);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"keypad" | "recents">("keypad");
  const idle = ["idle", "ended"].includes(state.status);
  const connected = ["active", "held"].includes(state.status);
  const visual = visualization?.type ?? (options.waveform ? "waveform" : "none");
  const keypadAllowed = options.keypad && (!controls || controls.includes("keypad"));
  useAutoDial({
    number: prefilled,
    enabled: autoDial,
    requestId: autoDialKey,
    caller: caller?.number === prefilled ? caller : undefined,
  });
  useEffect(() => {
    if (!connected || !keypadAllowed) setKeypadOpen(false);
  }, [connected, keypadAllowed]);
  useEffect(() => {
    setNumber(prefilled);
  }, [prefilled]);
  useEffect(() => {
    // An incoming call always takes precedence over the settings page.
    if (!idle) setSettingsOpen(false);
  }, [idle]);
  const phase: Phase = settingsOpen
    ? "settings"
    : idle
      ? "idle"
      : state.status === "incoming"
        ? "incoming"
        : "call";
  // Configure native layout animation for the commit that switches phases.
  const lastPhase = useRef(phase);
  if (lastPhase.current !== phase) {
    lastPhase.current = phase;
    animateNextLayout(motion.enabled, motion.duration);
  }
  const toggle = (fn: () => void) => {
    animateNextLayout(motion.enabled, motion.duration);
    fn();
  };

  const currentCaller = !idle ? state.call?.caller : state.status === "ended" ? state.call?.caller : caller;
  const identity = currentCaller && resolveCaller ? resolveCaller(currentCaller) : currentCaller;
  const inCall = phase === "call" || phase === "incoming";
  const large = screen;
  const orbSize = large ? 168 : 120;
  const visualNode =
    visual === "orb" || visual === "both" ? (
      <View style={{ margin: 6 }}>
        <CallOrb size={orbSize} {...visualization?.orb} />
      </View>
    ) : undefined;
  const avatar =
    showAvatar ?? (visual === "avatar" || (visual === "none" && visualization?.type === undefined) || visual === "waveform" || visual === "bars");
  const audioVisual =
    connected && (visual === "waveform" || visual === "both") ? (
      <CallWaveform {...visualization?.waveform} />
    ) : connected || state.status === "dialing" || state.status === "ringing"
      ? visual === "bars"
        ? <CallBarVisualizer height={56} {...visualization?.bars} />
        : null
      : null;

  const settingsButton = options.audioSettings ? (
    <IconButton
      icon={settingsOpen ? X : Settings2}
      accessibilityLabel={settingsOpen ? "Close audio settings" : "Open audio settings"}
      accessibilityState={{ expanded: settingsOpen }}
      onPress={() => toggle(() => setSettingsOpen(!settingsOpen))}
      testID="audio-settings-toggle"
    />
  ) : null;

  const headerNode =
    header !== undefined ? (
      header
    ) : (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          minHeight: 56,
          paddingHorizontal: screen ? 0 : 18,
          paddingRight: screen ? 0 : 8,
          borderBottomWidth: screen ? 0 : 1,
          borderBottomColor: theme.border,
        }}
      >
        {onMinimize && !idle ? (
          <IconButton icon={ChevronDown} accessibilityLabel="Minimize call" onPress={onMinimize} color={theme.foreground} />
        ) : (
          <AudioLines size={19} color={theme.foreground} strokeWidth={2} />
        )}
        <PhoneText size={16} weight="600" numberOfLines={1} style={{ flex: 1 }} accessibilityRole="header">
          {title}
        </PhoneText>
        <ConnectionStatus />
        {settingsButton}
      </View>
    );

  // Fit the keypad to short phones (iPhone SE) without scrolling where possible.
  const keySize = screen
    ? Math.max(56, Math.min(80, (window.height - (insets.top ?? 0) - (insets.bottom ?? 0) - 330) / 5.4))
    : 66;
  let body: ReactNode;
  if (phase === "settings") {
    body = (
      <Appear key="settings">
        <View style={{ gap: 14 }}>
          <PhoneText size={20} weight="600" accessibilityRole="header">
            Audio settings
          </PhoneText>
          <AudioSettings />
        </View>
      </Appear>
    );
  } else if (phase === "idle") {
    const showTabs = options.recents && keypadAllowed;
    body = (
      <View key="idle" style={{ gap: 18, flex: screen ? 1 : undefined }}>
        {showTabs ? (
          <Segmented
            value={tab}
            onChange={(next) => toggle(() => setTab(next as "keypad" | "recents"))}
            options={[
              { value: "keypad", label: "Keypad" },
              { value: "recents", label: "Recents" },
            ]}
          />
        ) : null}
        {showTabs && tab === "recents" ? (
          <CallHistory
            onSelect={(call) => {
              setNumber(call.caller.number);
              toggle(() => setTab("keypad"));
            }}
          />
        ) : (
          <View style={{ gap: 18, flex: screen ? 1 : undefined, justifyContent: screen ? "flex-end" : undefined }}>
            {!keypadAllowed ? (
              <Appear key={state.call?.id ?? "greeting"}>
                <CallerCard
                  caller={identity}
                  showAvatar={!visualNode && avatar}
                  visual={visualNode}
                  renderAvatar={renderAvatar}
                  renderTags={renderTags}
                />
              </Appear>
            ) : state.status === "ended" && state.call ? (
              <Appear key={state.call.id}>
                <LastCall caller={identity} renderAvatar={renderAvatar} />
              </Appear>
            ) : null}
            <Dialer
              value={number}
              onChange={setNumber}
              showKeypad={keypadAllowed}
              keySize={keySize}
              caller={caller && caller.number === number ? caller : undefined}
            />
          </View>
        )}
      </View>
    );
  } else if (phase === "incoming") {
    body = (
      <View key="incoming" style={{ gap: 28, flex: screen ? 1 : undefined }}>
        <Appear style={{ flex: screen ? 1 : undefined, justifyContent: screen ? "center" : undefined }}>
          <CallerCard
            caller={identity}
            size={large ? "large" : "regular"}
            showAvatar={!visualNode && avatar}
            visual={visualNode}
            renderAvatar={renderAvatar}
            renderTags={renderTags}
          />
        </Appear>
        <IncomingCallActions answerStyle={answerStyle} size={screen ? 76 : 68} />
      </View>
    );
  } else if (keypadOpen && connected) {
    body = (
      <View key="dtmf" style={{ gap: 18, flex: screen ? 1 : undefined, justifyContent: screen ? "flex-end" : undefined }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <PhoneText size={15} weight="600" numberOfLines={1}>
            {identity?.name || identity?.number}
          </PhoneText>
          <CallTimer />
        </View>
        <Dialer showKeypad keySize={keySize} />
        <CallControls buttons={["hangup"]} />
        <PressableScale
          onPress={() => toggle(() => setKeypadOpen(false))}
          accessibilityLabel="Hide keypad"
          style={{ alignSelf: "center", minHeight: 40, justifyContent: "center", paddingHorizontal: 16 }}
        >
          <PhoneText size={15} weight="600" color={theme.accent}>
            Hide
          </PhoneText>
        </PressableScale>
      </View>
    );
  } else {
    body = (
      <View key="call" style={{ gap: screen ? 20 : 18, flex: screen ? 1 : undefined }}>
        <Appear style={{ flex: screen ? 1 : undefined, justifyContent: screen ? "center" : undefined, gap: 16 }}>
          <CallerCard
            caller={identity}
            size={large ? "large" : "regular"}
            showAvatar={!visualNode && avatar}
            visual={visualNode}
            renderAvatar={renderAvatar}
            renderTags={renderTags}
          />
          {audioVisual}
        </Appear>
        <CallControls
          buttons={controls}
          showMute={options.mute}
          showHold={options.hold}
          showTransfer={options.transfer}
          showKeypad={keypadAllowed}
          showSpeaker={options.speaker}
          keypadOpen={keypadOpen}
          onKeypadToggle={() => toggle(() => setKeypadOpen(!keypadOpen))}
          buttonSize={screen ? 72 : 62}
          tone={screen && immersive ? "glass" : "neutral"}
        />
      </View>
    );
  }

  const footerNode =
    footer !== undefined ? (
      footer
    ) : screen ? null : (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <Headphones size={13} color={theme.muted} />
        <PhoneText size={12} color={theme.muted}>
          {state.connection === "registered"
            ? Platform.OS === "web"
              ? "Audio handled by your browser"
              : "Audio handled by your device"
            : "Connect an account to make calls"}
        </PhoneText>
      </View>
    );

  const grip = drag.enabled ? (
    <View
      {...drag.handlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Move phone"
      accessibilityHint="Drag to move. Activate to reset its position."
      accessibilityActions={[{ name: "activate", label: "Reset position" }]}
      onAccessibilityAction={drag.reset}
      style={{ alignItems: "center", paddingTop: 6, minHeight: 24 }}
    >
      <GripHorizontal size={18} color={theme.muted} />
    </View>
  ) : null;

  if (screen)
    return (
      <View
        accessibilityLabel={title}
        style={{ flex: 1, backgroundColor: theme.background, overflow: "hidden" }}
      >
        {immersive && inCall ? <ImmersiveBackground /> : null}
        <View
          style={{
            flex: 1,
            paddingTop: (insets.top ?? 0) + 4,
            paddingBottom: (insets.bottom ?? 0) + 20,
            paddingLeft: (insets.left ?? 0) + 22,
            paddingRight: (insets.right ?? 0) + 22,
            gap: 14,
          }}
        >
          {headerNode}
          <ErrorBanner />
          {/* Scrolls only when content cannot fit, never overlapping the header. */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
          {footerNode}
          <Branding branding={branding} />
        </View>
      </View>
    );

  if (variant === "sheet")
    return (
      <View accessibilityLabel={title}>
        {headerNode}
        <View style={{ paddingHorizontal: 20, paddingTop: header === null ? 8 : 16, paddingBottom: 20, gap: 18 }}>
          <ErrorBanner />
          {body}
        </View>
        {footerNode}
        <Branding branding={branding} />
      </View>
    );

  return (
    <View
      accessibilityLabel={title}
      style={{
        backgroundColor: theme.background,
        borderRadius: theme.radius,
        borderWidth: theme.appearance === "dark" ? 1 : 0,
        borderColor: theme.border,
        boxShadow:
          theme.appearance === "dark"
            ? "0 18px 50px -18px rgba(0,0,0,0.65)"
            : "0 12px 40px -14px rgba(16,38,26,0.28), 0 1px 4px rgba(16,38,26,0.07)",
        overflow: Platform.OS === "android" ? "hidden" : "visible",
      }}
    >
      {grip}
      {headerNode}
      <View style={{ padding: 20, gap: 18 }}>
        <ErrorBanner />
        {body}
      </View>
      {footerNode}
      <Branding branding={branding} />
    </View>
  );
}

/** All-in-one phone. For shared lines and custom layouts, use PhoneProvider + PhoneWidget. */
export interface SipPhoneProps
  extends Omit<PhoneProviderProps, "children">,
    PhoneWidgetProps {}

export function SipPhone({
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
  ...widget
}: SipPhoneProps): ReactElement {
  return (
    <PhoneProvider
      config={config}
      autoConnect={autoConnect}
      preview={preview}
      client={client}
      tones={tones}
      media={media}
      audioSession={audioSession}
      haptics={haptics}
      refreshOnForeground={refreshOnForeground}
      onEvent={onEvent}
      onIncomingCall={onIncomingCall}
      onAnswered={onAnswered}
      onDisconnected={onDisconnected}
      onConnectionChange={onConnectionChange}
      onError={onError}
    >
      <PhoneWidget {...widget} />
    </PhoneProvider>
  );
}
