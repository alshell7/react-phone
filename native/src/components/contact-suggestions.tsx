import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { Phone } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.tsx";
import type { Caller } from "../core/types.ts";
import {
  dialQuery,
  matchContacts,
  type ContactMatch,
} from "../core/contacts.ts";
import { controlRadius, usePhoneTheme } from "./theme.tsx";
import { usePhoneLabels, usePhoneNumberFormatter } from "./locale.tsx";
import { Avatar } from "./caller-card.tsx";
import { Appear, PhoneText, PressableScale } from "./primitives.tsx";

/** Where keypad suggestions come from. */
export interface ContactSuggestionOptions {
  /** Your contact list (device contacts, CRM, favourites). */
  contacts?: readonly Caller[];
  /** Search a large or remote directory as digits are typed (debounced, stale results ignored). */
  searchContacts?: (
    query: string,
  ) => readonly Caller[] | Promise<readonly Caller[]>;
  /** Include callers from this client's Recents. Defaults to true. */
  recents?: boolean;
  /** Maximum suggestions in the expanded list. Defaults to 5. */
  limit?: number;
}

/** Live matches for the digits typed, from contacts, your search function, and Recents. */
export function useContactSuggestions(
  value: string,
  {
    contacts,
    searchContacts,
    recents = true,
    limit = 5,
  }: ContactSuggestionOptions,
): ContactMatch[] {
  const { state } = usePhone();
  const query = dialQuery(value);
  const [remote, setRemote] = useState<{
    query: string;
    contacts: readonly Caller[];
  }>({ query: "", contacts: [] });
  const search = useRef(searchContacts);
  search.current = searchContacts;
  const hasSearch = Boolean(searchContacts);
  useEffect(() => {
    if (!hasSearch || !query) return;
    let live = true;
    const timer = setTimeout(() => {
      void Promise.resolve(search.current?.(query) ?? [])
        .then((found) => {
          if (live) setRemote({ query, contacts: found });
        })
        .catch(() => {});
    }, 120);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, hasSearch]);
  return useMemo(() => {
    const own = [
      ...(contacts ?? []),
      ...(remote.query === query ? remote.contacts : []),
    ];
    const history = recents ? state.history.map((call) => call.caller) : [];
    return matchContacts(query, { contacts: own, recents: history }, limit);
  }, [query, contacts, remote, recents, state.history, limit]);
}

function Highlighted({
  text,
  ranges,
  size,
  weight,
  color,
  highlight,
}: {
  text: string;
  ranges: Array<[number, number]>;
  size: number;
  weight: "400" | "500" | "600";
  color: string;
  highlight: string;
}) {
  const parts: Array<{ text: string; match: boolean }> = [];
  let at = 0;
  for (const [start, end] of [...ranges].sort((a, b) => a[0] - b[0])) {
    if (start > at) parts.push({ text: text.slice(at, start), match: false });
    parts.push({ text: text.slice(start, end), match: true });
    at = end;
  }
  if (at < text.length) parts.push({ text: text.slice(at), match: false });
  return (
    <PhoneText size={size} weight={weight} color={color} numberOfLines={1}>
      {parts.map((part, i) =>
        part.match ? (
          <PhoneText key={i} size={size} weight="700" color={highlight}>
            {part.text}
          </PhoneText>
        ) : (
          part.text
        ),
      )}
    </PhoneText>
  );
}

export interface ContactSuggestionsProps {
  matches: readonly ContactMatch[];
  /** Fill the number and attach this identity to the next call. */
  onSelect: (contact: Caller) => void;
  /** Call this contact immediately. */
  onCall?: (contact: Caller) => void;
  renderAvatar?: (caller: Caller) => ReactNode;
}

/**
 * Smart-dial suggestions: the best match as a pill under the number, with a "+N more"
 * chip that opens the rest. Matched letters and digits are highlighted.
 */
export function ContactSuggestions({
  matches,
  onSelect,
  onCall,
  renderAvatar,
}: ContactSuggestionsProps): ReactElement | null {
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const format = usePhoneNumberFormatter();
  const [open, setOpen] = useState(false);
  const best = matches[0];
  const signature = matches.map((match) => match.contact.number).join("|");
  useEffect(() => setOpen(false), [signature]);
  if (!best) return null;
  const row = (match: ContactMatch, compact: boolean) => {
    const name = match.contact.name;
    const number = match.contact.number;
    const shown = format(number);
    // Formatting may move characters; only highlight digits on the raw number.
    const numberRanges = shown === number ? match.numberRanges : [];
    return (
      <View
        key={number}
        style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
      >
        <PressableScale
          onPress={() => onSelect(match.contact)}
          accessibilityLabel={labels.useContact(name ?? shown)}
          accessibilityHint={name ? shown : undefined}
          scaleTo={0.98}
          testID={`suggestion-${number}`}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            minHeight: compact ? 44 : 52,
          }}
        >
          <Avatar
            caller={match.contact}
            size={compact ? 32 : 38}
            render={renderAvatar}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            {name ? (
              <Highlighted
                text={name}
                ranges={match.nameRanges}
                size={15}
                weight="600"
                color={theme.foreground}
                highlight={theme.accent}
              />
            ) : null}
            <Highlighted
              text={shown}
              ranges={numberRanges}
              size={name ? 13 : 15}
              weight={name ? "400" : "600"}
              color={name ? theme.muted : theme.foreground}
              highlight={theme.accent}
            />
          </View>
        </PressableScale>
        {onCall && !compact ? (
          <PressableScale
            onPress={() => onCall(match.contact)}
            accessibilityLabel={labels.callContact(name ?? shown)}
            scaleTo={0.88}
            style={{
              width: 40,
              height: 40,
              borderRadius: controlRadius(theme, 40),
              backgroundColor: theme.answer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Phone
              size={17}
              color={theme.answerForeground}
              fill={theme.answerForeground}
              strokeWidth={1.5}
            />
          </PressableScale>
        ) : null}
      </View>
    );
  };
  return (
    <View
      accessibilityLabel={labels.suggestions}
      style={{ alignSelf: "stretch", zIndex: 10 }}
    >
      <Appear offset={-4} fade={false}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingLeft: 8,
            paddingRight: 6,
            paddingVertical: 2,
            borderRadius: 16,
            backgroundColor: theme.surface,
            alignSelf: "center",
            maxWidth: "100%",
          }}
        >
          <View style={{ flexShrink: 1 }}>{row(best, true)}</View>
          {matches.length > 1 ? (
            <PressableScale
              onPress={() => setOpen(!open)}
              accessibilityLabel={
                open
                  ? labels.fewerSuggestions
                  : labels.moreSuggestions(matches.length - 1)
              }
              accessibilityState={{ expanded: open }}
              scaleTo={0.94}
              style={{
                paddingHorizontal: 10,
                minHeight: 32,
                borderRadius: 999,
                backgroundColor: theme.accentSoft,
                justifyContent: "center",
              }}
            >
              <PhoneText size={12} weight="700" color={theme.accent}>
                {open
                  ? labels.fewerSuggestions
                  : labels.moreSuggestions(matches.length - 1)}
              </PhoneText>
            </PressableScale>
          ) : null}
        </View>
      </Appear>
      {open ? (
        <Appear
          offset={-6}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 8,
            padding: 10,
            gap: 4,
            borderRadius: 18,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            boxShadow: "0 16px 40px -16px rgba(0,0,0,0.35)",
          }}
        >
          {matches.map((match) => row(match, false))}
        </Appear>
      ) : null}
    </View>
  );
}
