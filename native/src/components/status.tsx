import { useEffect, useState, type ReactElement } from "react";
import { AccessibilityInfo, View } from "react-native";
import { ChevronRight, Settings, Volume2, X } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.tsx";
import { formatDuration } from "../core/validation.ts";
import { usePhoneTheme } from "./theme.tsx";
import { usePhoneLabels } from "./locale.tsx";
import {
  Appear,
  IconButton,
  PhoneText,
  PressableScale,
  StatusDot,
  type PhoneIcon,
} from "./primitives.tsx";

/** Run an action whose failure is already reported through state.error. */
export function action(fn: () => void | Promise<void>): void {
  try {
    void Promise.resolve(fn()).catch(() => {});
  } catch {
    /* ErrorBanner renders client errors. */
  }
}

export interface ConnectionStatusProps {
  /** Hide the label and show only the dot (for tight spaces). */
  compact?: boolean;
  /** Override label colours, for example on a dark island. */
  color?: string;
}

/** Registration state as a dot and label, announced politely to screen readers. */
export function ConnectionStatus({
  compact = false,
  color,
}: ConnectionStatusProps): ReactElement {
  const { state, preview } = usePhone();
  const theme = usePhoneTheme();
  const text = usePhoneLabels();
  const labels = {
    disconnected: text.notConnected,
    connecting: text.connecting,
    registered: preview ? text.previewMode : text.readyForCalls,
    reconnecting: text.reconnecting,
    error: text.connectionFailed,
  };
  const tint =
    state.connection === "registered"
      ? theme.accent
      : state.connection === "error"
        ? theme.danger
        : theme.muted;
  const pending =
    state.connection === "connecting" || state.connection === "reconnecting";
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={labels[state.connection]}
      accessibilityLiveRegion="polite"
      style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
    >
      <StatusDot color={tint} pulsing={pending} />
      {!compact && (
        <PhoneText
          size={12}
          weight="600"
          color={color ?? tint}
          numberOfLines={1}
        >
          {labels[state.connection]}
        </PhoneText>
      )}
    </View>
  );
}

/** Elapsed time since answer; tabular digits avoid jitter. */
export function CallTimer({
  color,
  size = 15,
}: {
  color?: string;
  size?: number;
}): ReactElement {
  const { state } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const [, tick] = useState(0);
  const answeredAt = state.call?.answeredAt;
  const endedAt = state.call?.endedAt;
  useEffect(() => {
    if (!answeredAt || endedAt) return;
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [answeredAt, endedAt]);
  const seconds = answeredAt
    ? ((endedAt ?? Date.now()) - answeredAt) / 1000
    : 0;
  const text = formatDuration(seconds);
  return (
    <PhoneText
      size={size}
      weight="500"
      color={color ?? theme.muted}
      accessibilityLabel={labels.callDuration(text)}
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {text}
    </PhoneText>
  );
}

function Notice({
  icon: Icon,
  label,
  onPress,
}: {
  icon: PhoneIcon;
  label: string;
  onPress: () => void;
}) {
  const theme = usePhoneTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      scaleTo={0.98}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: theme.accentSoft,
      }}
    >
      <Icon size={18} color={theme.accent} strokeWidth={2} />
      <PhoneText
        size={14}
        weight="600"
        color={theme.accent}
        style={{ flex: 1 }}
      >
        {label}
      </PhoneText>
      <ChevronRight size={16} color={theme.accent} strokeWidth={2} />
    </PressableScale>
  );
}

/** Actionable errors and recovery (Settings for blocked permissions, web audio unlock). */
export function ErrorBanner(): ReactElement | null {
  const { state, client } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const message = state.error?.message;
  useEffect(() => {
    // iOS does not announce role="alert" on its own.
    if (message) AccessibilityInfo.announceForAccessibility?.(message);
  }, [message]);
  const blocked =
    state.error?.code === "microphone" &&
    (state.microphone === "blocked" || state.microphone === "denied") &&
    client.capabilities.settings;
  if (!state.error && !state.playbackBlocked) return null;
  return (
    <View style={{ gap: 8 }}>
      {state.error ? (
        <Appear offset={-6} fade={false}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 4,
              paddingLeft: 14,
              paddingVertical: 4,
              borderRadius: 14,
              backgroundColor: theme.dangerSoft,
            }}
          >
            <PhoneText
              size={14}
              weight="500"
              color={theme.danger}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={{ flex: 1, paddingVertical: 10 }}
            >
              {state.error.message}
            </PhoneText>
            <IconButton
              icon={X}
              size={17}
              color={theme.danger}
              accessibilityLabel={labels.dismissError}
              onPress={() => client.clearError()}
            />
          </View>
        </Appear>
      ) : null}
      {blocked ? (
        <Notice
          icon={Settings}
          label={labels.openSettings}
          onPress={() => action(() => client.openSettings())}
        />
      ) : null}
      {state.playbackBlocked ? (
        <Notice
          icon={Volume2}
          label={labels.enableCallAudio}
          onPress={() => action(() => client.playAudio())}
        />
      ) : null}
    </View>
  );
}
