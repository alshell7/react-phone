// Generated from src/components/call-history.tsx. Run npm run package:build; do not edit.
import type { ReactElement } from "../react-types.d.ts";
import { View } from "react-native";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.ts";
import type { CallInfo } from "../core/types.ts";
import { formatDuration } from "../core/validation.ts";
import { usePhoneTheme } from "./theme.ts";
import { Avatar } from "./caller-card.ts";
import { Divider, IconButton, PhoneText, PressableScale } from "./primitives.ts";
import { action } from "./status.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export interface CallHistoryProps {
  /** Maximum rows; defaults to 20. */
  limit?: number;
  /** Row press. Defaults to calling the number back. */
  onSelect?: (call: CallInfo) => void;
  emptyText?: string;
  /** Show a Clear action. Defaults to true. */
  clearable?: boolean;
}

/** Missed: an incoming call that was never answered and not declined here. */
export function isMissed(call: CallInfo): boolean {
  return call.direction === "incoming" && !call.answeredAt && call.endReason !== "Declined";
}
function when(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  if (date.toDateString() === now.toDateString()) return time;
  return `${date.getDate()}/${date.getMonth() + 1} ${time}`;
}

/** Recents from this client's real call history (in memory; nothing is persisted). */
export function CallHistory({
  limit = 20,
  onSelect,
  emptyText = "Calls you make and receive appear here.",
  clearable = true
}: CallHistoryProps): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const theme = usePhoneTheme();
  const idle = ["idle", "ended"].includes(state.status);
  const calls = state.history.slice(0, Math.max(0, limit));
  const callBack = (call: CallInfo) => action(() => client.call(call.caller.number, call.caller));
  if (!calls.length) return /*#__PURE__*/_jsxs(View, {
    style: {
      paddingVertical: 28,
      alignItems: "center",
      gap: 6
    },
    children: [/*#__PURE__*/_jsx(PhoneText, {
      size: 16,
      weight: "600",
      children: "No recent calls"
    }), /*#__PURE__*/_jsx(PhoneText, {
      size: 14,
      color: theme.muted,
      style: {
        textAlign: "center"
      },
      children: emptyText
    })]
  });
  return /*#__PURE__*/_jsxs(View, {
    style: {
      alignSelf: "stretch"
    },
    children: [clearable ? /*#__PURE__*/_jsx(View, {
      style: {
        flexDirection: "row",
        justifyContent: "flex-end"
      },
      children: /*#__PURE__*/_jsx(PressableScale, {
        onPress: () => client.clearHistory(),
        accessibilityLabel: "Clear recent calls",
        style: {
          paddingHorizontal: 8,
          minHeight: 36,
          justifyContent: "center"
        },
        children: /*#__PURE__*/_jsx(PhoneText, {
          size: 14,
          weight: "600",
          color: theme.accent,
          children: "Clear"
        })
      })
    }) : null, calls.map((call, i) => {
      const missed = isMissed(call);
      const Icon = missed ? PhoneMissed : call.direction === "incoming" ? PhoneIncoming : PhoneOutgoing;
      const duration = call.answeredAt && call.endedAt ? formatDuration((call.endedAt - call.answeredAt) / 1000) : null;
      const name = call.caller.name || call.caller.number;
      return /*#__PURE__*/_jsxs(View, {
        children: [i > 0 ? /*#__PURE__*/_jsx(Divider, {
          style: {
            marginLeft: 60
          }
        }) : null, /*#__PURE__*/_jsxs(View, {
          style: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            minHeight: 64
          },
          children: [/*#__PURE__*/_jsxs(PressableScale, {
            onPress: () => onSelect ? onSelect(call) : callBack(call),
            accessibilityLabel: `${missed ? "Missed call from" : call.direction === "incoming" ? "Incoming call from" : "Call to"} ${name}, ${when(call.startedAt)}${duration ? `, ${duration}` : ""}`,
            accessibilityHint: onSelect ? undefined : "Calls back",
            scaleTo: 0.98,
            style: {
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              flex: 1,
              paddingVertical: 8
            },
            children: [/*#__PURE__*/_jsx(Avatar, {
              caller: call.caller,
              size: 44
            }), /*#__PURE__*/_jsxs(View, {
              style: {
                flex: 1,
                gap: 2
              },
              children: [/*#__PURE__*/_jsx(PhoneText, {
                size: 16,
                weight: "600",
                color: missed ? theme.danger : theme.foreground,
                numberOfLines: 1,
                children: name
              }), /*#__PURE__*/_jsxs(View, {
                style: {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5
                },
                children: [/*#__PURE__*/_jsx(Icon, {
                  size: 13,
                  color: missed ? theme.danger : theme.muted,
                  strokeWidth: 2
                }), /*#__PURE__*/_jsx(PhoneText, {
                  size: 13,
                  color: theme.muted,
                  numberOfLines: 1,
                  children: [call.caller.name ? call.caller.number : null, duration ?? call.endReason].filter(Boolean).join(" · ")
                })]
              })]
            }), /*#__PURE__*/_jsx(PhoneText, {
              size: 13,
              color: theme.muted,
              children: when(call.startedAt)
            })]
          }), /*#__PURE__*/_jsx(IconButton, {
            icon: Phone,
            color: theme.accent,
            accessibilityLabel: `Call ${name}`,
            disabled: !idle || state.connection !== "registered",
            onPress: () => callBack(call)
          })]
        })]
      }, call.id);
    })]
  });
}
