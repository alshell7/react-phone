import { useState, type ReactElement, type ReactNode } from "react";
import { Image, View } from "react-native";
import { AudioLines } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.tsx";
import type { Caller } from "../core/types.ts";
import { usePhoneTheme } from "./theme.tsx";
import { PhoneText, PulseRings, StatusDot } from "./primitives.tsx";
import { CallTimer } from "./status.tsx";

export interface CallerCardProps {
  caller?: Caller;
  showAvatar?: boolean;
  renderAvatar?: (caller: Caller) => ReactNode;
  renderTags?: (caller: Caller) => ReactNode;
  /** Replaces the avatar, for example with an Orb. */
  visual?: ReactNode;
  /** `large` is used by full-screen calls. */
  size?: "regular" | "large";
  /** Text colour override for immersive backgrounds. */
  color?: string;
}

/** Initials from a name or number, for avatar fallbacks. */
export function initialsOf(caller?: Partial<Caller>): string {
  const source = (caller?.name || caller?.number || "").trim();
  if (!source) return "";
  if (!caller?.name) return source.replace(/[^\d+*#]/g, "").slice(-2) || source.slice(0, 2);
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Avatar with image, initials, or a neutral glyph. */
export function Avatar({
  caller,
  size = 88,
  render,
}: {
  caller?: Caller;
  size?: number;
  render?: (caller: Caller) => ReactNode;
}): ReactElement {
  const theme = usePhoneTheme();
  const [failed, setFailed] = useState<string | null>(null);
  const initials = initialsOf(caller);
  const image = caller?.avatarUrl && failed !== caller.avatarUrl ? caller.avatarUrl : null;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: theme.accentSoft,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      {caller && render ? (
        render(caller)
      ) : image ? (
        <Image
          source={{ uri: image }}
          style={{ width: size, height: size }}
          onError={() => setFailed(image)}
        />
      ) : initials ? (
        <PhoneText size={size * 0.36} weight="600" color={theme.accent}>
          {initials}
        </PhoneText>
      ) : (
        <AudioLines size={size * 0.38} color={theme.accent} strokeWidth={1.6} />
      )}
    </View>
  );
}

/** Display supplied identity or the active SIP caller; slots accept your own UI. */
export function CallerCard({
  caller: supplied,
  renderAvatar,
  renderTags,
  showAvatar = true,
  visual,
  size = "regular",
  color,
}: CallerCardProps): ReactElement {
  const { state } = usePhone();
  const theme = usePhoneTheme();
  const caller = supplied ?? state.call?.caller;
  const large = size === "large";
  const busy = !["idle", "ended"].includes(state.status);
  const ringing = state.status === "incoming" || state.status === "ringing";
  const status = {
    idle: "Ready to connect",
    "requesting-microphone": "Waiting for microphone…",
    dialing: "Calling…",
    ringing: "Ringing…",
    incoming: "Incoming call",
    answering: "Connecting…",
    active: state.remoteHeld ? "Caller put you on hold" : "Connected",
    held: "On hold",
    ended: state.call?.endReason ?? "Call ended",
  }[state.status];
  const avatarSize = large ? 112 : 88;
  const text = color ?? theme.foreground;
  const subtle = color ? color : theme.muted;
  return (
    <View style={{ alignItems: "center", gap: large ? 14 : 10 }}>
      {visual ??
        (showAvatar ? (
          <View style={{ alignItems: "center", justifyContent: "center", margin: 6 }}>
            <PulseRings size={avatarSize} color={theme.accent} active={ringing} />
            <Avatar caller={caller} size={avatarSize} render={renderAvatar} />
          </View>
        ) : null)}
      <View style={{ alignItems: "center", gap: 2, paddingHorizontal: 8 }}>
        <PhoneText
          size={large ? 30 : 22}
          weight="600"
          color={text}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          accessibilityRole="header"
          style={{ textAlign: "center", letterSpacing: large ? -0.4 : -0.2 }}
        >
          {caller?.name || caller?.number || "Ready when you are"}
        </PhoneText>
        <PhoneText size={large ? 17 : 15} color={subtle} numberOfLines={1} style={{ textAlign: "center", opacity: color ? 0.75 : 1 }}>
          {caller?.name ? caller.number : busy ? " " : "Dial a number. Make a connection."}
        </PhoneText>
      </View>
      {caller &&
        (renderTags ? (
          renderTags(caller)
        ) : caller.tags?.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
            {caller.tags.map((tag, i) => (
              <View
                key={`${tag}-${i}`}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: theme.accentSoft,
                }}
              >
                <PhoneText size={12} weight="600" color={theme.accent}>
                  {tag}
                </PhoneText>
              </View>
            ))}
          </View>
        ) : null)}
      {state.status !== "idle" && (
        <View
          accessible
          accessibilityLiveRegion="polite"
          style={{ flexDirection: "row", alignItems: "center", gap: 7, minHeight: 22 }}
        >
          {busy && <StatusDot color={theme.accent} pulsing={state.status !== "active" && state.status !== "held"} />}
          <PhoneText size={15} weight="500" color={subtle}>
            {status}
          </PhoneText>
          {state.call?.answeredAt ? (
            <>
              <PhoneText size={15} color={subtle}>
                ·
              </PhoneText>
              <CallTimer color={subtle} />
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}
