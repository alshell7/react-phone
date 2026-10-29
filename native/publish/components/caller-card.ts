// Generated from src/components/caller-card.tsx. Run npm run package:build; do not edit.
import { useState } from "react";
import type { ReactElement, ReactNode } from "../react-types.d.ts";
import { Image, View } from "react-native";
import { AudioLines } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.ts";
import type { Caller } from "../core/types.ts";
import { usePhoneTheme } from "./theme.ts";
import { endReasonLabel, usePhoneLabels, usePhoneNumberFormatter } from "./locale.ts";
import { PhoneText, PulseRings, StatusDot } from "./primitives.ts";
import { CallTimer } from "./status.ts";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
  return source.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
}

/** Avatar with image, initials, or a neutral glyph. */
export function Avatar({
  caller,
  size = 88,
  render
}: {
  caller?: Caller;
  size?: number;
  render?: (caller: Caller) => ReactNode;
}): ReactElement {
  const theme = usePhoneTheme();
  const [failed, setFailed] = useState<string | null>(null);
  const initials = initialsOf(caller);
  const image = caller?.avatarUrl && failed !== caller.avatarUrl ? caller.avatarUrl : null;
  return /*#__PURE__*/_jsx(View, {
    importantForAccessibility: "no-hide-descendants",
    accessibilityElementsHidden: true,
    style: {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: "hidden",
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border
    },
    children: caller && render ? render(caller) : image ? /*#__PURE__*/_jsx(Image, {
      source: {
        uri: image
      },
      style: {
        width: size,
        height: size
      },
      onError: () => setFailed(image)
    }) : initials ? /*#__PURE__*/_jsx(PhoneText, {
      size: size * 0.36,
      weight: "600",
      color: theme.accent,
      children: initials
    }) : /*#__PURE__*/_jsx(AudioLines, {
      size: size * 0.38,
      color: theme.accent,
      strokeWidth: 1.6
    })
  });
}

/** Display supplied identity or the active SIP caller; slots accept your own UI. */
export function CallerCard({
  caller: supplied,
  renderAvatar,
  renderTags,
  showAvatar = true,
  visual,
  size = "regular",
  color
}: CallerCardProps): ReactElement {
  const {
    state
  } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const format = usePhoneNumberFormatter();
  const caller = supplied ?? state.call?.caller;
  const large = size === "large";
  const busy = !["idle", "ended"].includes(state.status);
  const ringing = state.status === "incoming" || state.status === "ringing";
  const status = {
    idle: labels.readyToConnect,
    "requesting-microphone": labels.waitingForMicrophone,
    dialing: labels.calling,
    ringing: labels.ringing,
    incoming: labels.incomingCall,
    answering: labels.answering,
    active: state.remoteHeld ? labels.remoteHold : labels.connected,
    held: labels.onHold,
    ended: endReasonLabel(labels, state.call?.endReason)
  }[state.status];
  const avatarSize = large ? 112 : 88;
  const text = color ?? theme.foreground;
  const subtle = color ? color : theme.muted;
  return /*#__PURE__*/_jsxs(View, {
    style: {
      alignItems: "center",
      gap: large ? 14 : 10
    },
    children: [visual ?? (showAvatar ? /*#__PURE__*/_jsxs(View, {
      style: {
        alignItems: "center",
        justifyContent: "center",
        margin: 6
      },
      children: [/*#__PURE__*/_jsx(PulseRings, {
        size: avatarSize,
        color: theme.accent,
        active: ringing
      }), /*#__PURE__*/_jsx(Avatar, {
        caller: caller,
        size: avatarSize,
        render: renderAvatar
      })]
    }) : null), /*#__PURE__*/_jsxs(View, {
      style: {
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 8
      },
      children: [/*#__PURE__*/_jsx(PhoneText, {
        size: large ? 30 : 22,
        weight: "600",
        color: text,
        numberOfLines: 1,
        adjustsFontSizeToFit: true,
        minimumFontScale: 0.6,
        accessibilityRole: "header",
        style: {
          textAlign: "center",
          letterSpacing: large ? -0.4 : -0.2
        },
        children: caller?.name || (caller?.number ? format(caller.number) : labels.idleTitle)
      }), /*#__PURE__*/_jsx(PhoneText, {
        size: large ? 17 : 15,
        color: subtle,
        numberOfLines: 1,
        style: {
          textAlign: "center",
          opacity: color ? 0.75 : 1
        },
        children: caller?.name ? format(caller.number) : busy ? " " : labels.idleSubtitle
      })]
    }), caller && (renderTags ? renderTags(caller) : caller.tags?.length ? /*#__PURE__*/_jsx(View, {
      style: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 6
      },
      children: caller.tags.map((tag, i) => /*#__PURE__*/_jsx(View, {
        style: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: theme.accentSoft
        },
        children: /*#__PURE__*/_jsx(PhoneText, {
          size: 12,
          weight: "600",
          color: theme.accent,
          children: tag
        })
      }, `${tag}-${i}`))
    }) : null), state.status !== "idle" && /*#__PURE__*/_jsxs(View, {
      accessible: true,
      accessibilityLiveRegion: "polite",
      style: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        minHeight: 22
      },
      children: [busy && /*#__PURE__*/_jsx(StatusDot, {
        color: theme.accent,
        pulsing: state.status !== "active" && state.status !== "held"
      }), /*#__PURE__*/_jsx(PhoneText, {
        size: 15,
        weight: "500",
        color: subtle,
        children: status
      }), state.call?.answeredAt ? /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx(PhoneText, {
          size: 15,
          color: subtle,
          children: "\xB7"
        }), /*#__PURE__*/_jsx(CallTimer, {
          color: subtle
        })]
      }) : null]
    })]
  });
}
