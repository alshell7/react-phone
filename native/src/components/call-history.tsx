import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
} from "lucide-react-native";
import { usePhone } from "../react/phone-provider.tsx";
import type { CallInfo, Caller } from "../core/types.ts";
import { formatDuration } from "../core/validation.ts";
import { usePhoneTheme } from "./theme.tsx";
import {
  endReasonLabel,
  usePhoneLabels,
  usePhoneNumberFormatter,
} from "./locale.tsx";
import { Avatar } from "./caller-card.tsx";
import {
  Divider,
  IconButton,
  PhoneText,
  PressableScale,
} from "./primitives.tsx";
import { action } from "./status.tsx";

export interface CallHistoryProps {
  /** Maximum rows; defaults to 20. */
  limit?: number;
  /** Row press. Defaults to calling the number back. */
  onSelect?: (call: CallInfo) => void;
  emptyText?: string;
  /** Show a Clear action. Defaults to true. */
  clearable?: boolean;
  renderAvatar?: (caller: Caller) => ReactNode;
}

/** Missed: an incoming call that was never answered and not declined here. */
export function isMissed(call: CallInfo): boolean {
  return (
    call.direction === "incoming" &&
    !call.answeredAt &&
    call.endReason !== "Declined"
  );
}

/** Time today, otherwise a short date, in the device locale. */
function when(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  try {
    return date.toDateString() === now.toDateString()
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { day: "numeric", month: "short" });
  } catch {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
}

/** Recents from this client's real call history (in memory; nothing is persisted). */
export function CallHistory({
  limit = 20,
  onSelect,
  emptyText,
  clearable = true,
  renderAvatar,
}: CallHistoryProps): ReactElement {
  const { state, client } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const format = usePhoneNumberFormatter();
  const idle = ["idle", "ended"].includes(state.status);
  const calls = state.history.slice(0, Math.max(0, limit));
  const callBack = (call: CallInfo) =>
    action(() => client.call(call.caller.number, call.caller));
  if (!calls.length)
    return (
      <View style={{ paddingVertical: 28, alignItems: "center", gap: 6 }}>
        <PhoneText size={16} weight="600">
          {labels.noRecents}
        </PhoneText>
        <PhoneText
          size={14}
          color={theme.muted}
          style={{ textAlign: "center" }}
        >
          {emptyText ?? labels.recentsEmpty}
        </PhoneText>
      </View>
    );
  return (
    <View style={{ alignSelf: "stretch" }}>
      {clearable ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <PressableScale
            onPress={() => client.clearHistory()}
            accessibilityLabel={labels.clearRecents}
            style={{
              paddingHorizontal: 8,
              minHeight: 36,
              justifyContent: "center",
            }}
          >
            <PhoneText size={14} weight="600" color={theme.accent}>
              {labels.clear}
            </PhoneText>
          </PressableScale>
        </View>
      ) : null}
      {calls.map((call, i) => {
        const missed = isMissed(call);
        const Icon = missed
          ? PhoneMissed
          : call.direction === "incoming"
            ? PhoneIncoming
            : PhoneOutgoing;
        const duration =
          call.answeredAt && call.endedAt
            ? formatDuration((call.endedAt - call.answeredAt) / 1000)
            : null;
        const number = format(call.caller.number);
        const name = call.caller.name || number;
        const reason = endReasonLabel(labels, call.endReason);
        return (
          <View key={call.id}>
            {i > 0 ? <Divider style={{ marginLeft: 60 }} /> : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                minHeight: 64,
              }}
            >
              <PressableScale
                onPress={() => (onSelect ? onSelect(call) : callBack(call))}
                accessibilityLabel={`${missed ? labels.missedCallFrom(name) : call.direction === "incoming" ? labels.incomingCallFrom(name) : labels.callTo(name)}, ${when(call.startedAt)}${duration ? `, ${duration}` : ""}`}
                accessibilityHint={onSelect ? undefined : labels.callsBack}
                scaleTo={0.98}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                  paddingVertical: 8,
                }}
              >
                <Avatar caller={call.caller} size={44} render={renderAvatar} />
                <View style={{ flex: 1, gap: 2 }}>
                  <PhoneText
                    size={16}
                    weight="600"
                    color={missed ? theme.danger : theme.foreground}
                    numberOfLines={1}
                  >
                    {name}
                  </PhoneText>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon
                      size={13}
                      color={missed ? theme.danger : theme.muted}
                      strokeWidth={2}
                    />
                    <PhoneText size={13} color={theme.muted} numberOfLines={1}>
                      {[call.caller.name ? number : null, duration ?? reason]
                        .filter(Boolean)
                        .join(" · ")}
                    </PhoneText>
                  </View>
                </View>
                <PhoneText size={13} color={theme.muted}>
                  {when(call.startedAt)}
                </PhoneText>
              </PressableScale>
              <IconButton
                icon={Phone}
                color={theme.accent}
                accessibilityLabel={labels.callContact(name)}
                disabled={!idle || state.connection !== "registered"}
                onPress={() => callBack(call)}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
