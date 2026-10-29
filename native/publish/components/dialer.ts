// Generated from src/components/dialer.tsx. Run npm run package:build; do not edit.
import { useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "../react-types.d.ts";
import { Platform, TextInput, View } from "react-native";
import { Delete, Phone } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.ts";
import type { Caller } from "../core/types.ts";
import { dialQuery } from "../core/contacts.ts";
import { controlRadius, usePhoneTheme } from "./theme.ts";
import { usePhoneLabels, usePhoneNumberFormatter } from "./locale.ts";
import { Button, IconButton, PhoneText, PressableScale } from "./primitives.ts";
import { action } from "./status.ts";
import { ContactSuggestions, useContactSuggestions, type ContactSuggestionOptions } from "./contact-suggestions.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const KEYS: ReadonlyArray<readonly [string, string]> = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];

/** Speed-dial entries for keys 1–9: a contact or a bare number. */
export type SpeedDial = Partial<Record<"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9", Caller | string>>;
function speedDialContact(entry: Caller | string | undefined): Caller | undefined {
  if (!entry) return undefined;
  return typeof entry === "string" ? {
    number: entry
  } : entry;
}
export interface KeypadProps {
  /** Called on touch-down, like a hardware keypad. */
  onKey: (digit: string) => void;
  /** Long-press handler (0 → +, speed dial). */
  onLongKey?: (digit: string) => void;
  disabled?: boolean;
  /** Maximum key diameter; keys shrink to fit narrow containers. */
  keySize?: number;
  /** Key fill. Defaults to the theme's `keyBackground`. */
  keyColor?: string;
  /** Digit colour. Defaults to the theme's `keyForeground`. */
  textColor?: string;
  /** Hide the ABC/DEF letters under the digits. */
  showLetters?: boolean;
  /** Keys with a speed-dial entry show a dot and announce who they call. */
  speedDial?: SpeedDial;
  accessibilityLabel?: string;
}

/** A 3×4 telephone keypad with letters, sized for thumbs. */
export function Keypad({
  onKey,
  onLongKey,
  disabled,
  keySize = 76,
  keyColor,
  textColor,
  showLetters = true,
  speedDial,
  accessibilityLabel
}: KeypadProps): ReactElement {
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const [width, setWidth] = useState(0);
  const gap = width ? Math.min(28, Math.max(12, width * 0.07)) : 20;
  const size = width ? Math.max(52, Math.min(keySize, (width - gap * 2) / 3)) : keySize;
  const fg = textColor ?? theme.keyForeground;
  return /*#__PURE__*/_jsx(View, {
    accessibilityLabel: accessibilityLabel ?? labels.dialPad,
    onLayout: event => setWidth(event.nativeEvent.layout.width),
    style: {
      alignSelf: "stretch",
      alignItems: "center",
      rowGap: Math.round(gap * 0.7),
      paddingHorizontal: 4
    },
    children: [0, 3, 6, 9].map(row =>
    /*#__PURE__*/
    // Explicit rows keep the keypad 3×4 at every key size.
    _jsx(View, {
      style: {
        flexDirection: "row",
        columnGap: gap
      },
      children: KEYS.slice(row, row + 3).map(([digit, letters]) => {
        const quick = speedDialContact(speedDial?.[digit as keyof SpeedDial]);
        const hint = quick && onLongKey ? labels.speedDialHint(quick.name ?? quick.number) : digit === "0" && onLongKey ? labels.longPressPlus : undefined;
        const subtitle = showLetters ? letters : digit === "0" ? "+" : "";
        return /*#__PURE__*/_jsx(View, {
          style: {
            width: size,
            alignItems: "center"
          },
          children: /*#__PURE__*/_jsxs(PressableScale, {
            accessibilityLabel: digit === "*" ? labels.star : digit === "#" ? labels.pound : digit,
            accessibilityHint: hint,
            disabled: disabled,
            scaleTo: 0.9,
            delayPressIn: 0,
            onPressIn: () => onKey(digit),
            onLongPress: onLongKey ? () => onLongKey(digit) : undefined,
            delayLongPress: 450,
            testID: `key-${digit}`,
            style: {
              width: size,
              height: size,
              borderRadius: controlRadius(theme, size),
              backgroundColor: keyColor ?? theme.keyBackground,
              alignItems: "center",
              justifyContent: "center"
            },
            pressedStyle: {
              backgroundColor: theme.pressed
            },
            children: [/*#__PURE__*/_jsx(PhoneText, {
              size: Math.round(size * 0.42),
              weight: "400",
              color: fg,
              style: {
                lineHeight: Math.round(size * 0.48),
                marginTop: subtitle ? 2 : 0
              },
              accessibilityElementsHidden: true,
              importantForAccessibility: "no",
              children: digit
            }), subtitle ? /*#__PURE__*/_jsx(PhoneText, {
              size: Math.max(8, Math.round(size * 0.125)),
              weight: "700",
              color: theme.muted,
              style: {
                letterSpacing: 1.6,
                lineHeight: Math.round(size * 0.16)
              },
              accessibilityElementsHidden: true,
              importantForAccessibility: "no",
              children: subtitle
            }) : null, quick ? /*#__PURE__*/_jsx(View, {
              pointerEvents: "none",
              style: {
                position: "absolute",
                top: size * 0.14,
                right: size * 0.2,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.accent
              }
            }) : null]
          })
        }, digit);
      })
    }, row))
  });
}
export interface DialerProps extends ContactSuggestionOptions {
  value?: string;
  onChange?: (value: string) => void;
  showKeypad?: boolean;
  /** Identity attached to the outgoing call when the number matches. */
  caller?: Partial<Caller>;
  placeholder?: string;
  /** Maximum keypad key diameter. */
  keySize?: number;
  /** Suggest contacts as digits are typed. Defaults to true when a source exists. */
  suggestions?: boolean;
  /** Long-press 1–9 on an empty keypad to call these contacts. */
  speedDial?: SpeedDial;
  /** Hide the letters under keypad digits. */
  showLetters?: boolean;
  /** Called when a suggestion is chosen. */
  onContactSelect?: (contact: Caller) => void;
  renderAvatar?: (caller: Caller) => ReactNode;
}
function displaySize(length: number): number {
  if (length <= 9) return 36;
  if (length <= 12) return 31;
  if (length <= 15) return 27;
  if (length <= 19) return 23;
  return 19;
}

/**
 * Standalone dial pad. While idle it composes a number, suggests matching contacts,
 * and places the call; during a connected call its keys send DTMF and the display
 * shows the digits sent.
 */
export function Dialer({
  value: controlled,
  onChange,
  showKeypad = true,
  caller,
  placeholder,
  keySize,
  suggestions = true,
  contacts,
  searchContacts,
  recents,
  limit,
  speedDial,
  showLetters,
  onContactSelect,
  renderAvatar
}: DialerProps): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const theme = usePhoneTheme();
  const labels = usePhoneLabels();
  const format = usePhoneNumberFormatter();
  const [localValue, setLocalValue] = useState("");
  const [sent, setSent] = useState("");
  const [chosen, setChosen] = useState<Caller | undefined>();
  const value = controlled ?? localValue;
  const update = (next: string) => {
    setLocalValue(next);
    onChange?.(next);
  };
  const inCall = ["active", "held"].includes(state.status);
  const canDial = ["idle", "ended"].includes(state.status);
  const ready = state.connection === "registered";
  useEffect(() => {
    if (!inCall) setSent("");
  }, [inCall]);
  const matches = useContactSuggestions(suggestions && canDial ? value : "", {
    contacts,
    searchContacts,
    recents,
    limit
  });
  // The identity for this number: a chosen suggestion, the caller prop, or an exact match.
  const identity = useMemo<Partial<Caller> | undefined>(() => {
    const query = dialQuery(value);
    if (!query) return undefined;
    if (chosen && dialQuery(chosen.number) === query) return chosen;
    if (caller?.number && dialQuery(caller.number) === query) return caller;
    return matches.find(match => dialQuery(match.contact.number) === query)?.contact;
  }, [value, chosen, caller, matches]);
  const callNumber = (number: string, who?: Partial<Caller>) => action(() => client.call(number, who));
  const call = () => callNumber(value, identity);
  const select = (contact: Caller) => {
    setChosen(contact);
    update(contact.number);
    onContactSelect?.(contact);
  };
  const shown = inCall ? sent : value;
  const callDisabled = !value.trim() || !canDial || !ready;
  const exact = identity?.name && !matches.some(m => m.contact.number !== identity.number);
  if (!showKeypad && !inCall) return /*#__PURE__*/_jsxs(View, {
    style: {
      gap: 10,
      alignSelf: "stretch"
    },
    children: [/*#__PURE__*/_jsxs(View, {
      style: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.background,
        paddingLeft: 14,
        minHeight: 52
      },
      children: [/*#__PURE__*/_jsx(TextInput, {
        value: value,
        onChangeText: update,
        placeholder: placeholder ?? labels.dialPlaceholder,
        placeholderTextColor: theme.muted,
        keyboardType: "phone-pad",
        autoComplete: "tel",
        textContentType: "telephoneNumber",
        returnKeyType: "go",
        maxLength: 160,
        editable: canDial,
        onSubmitEditing: () => !callDisabled && call(),
        accessibilityLabel: labels.numberField,
        selectionColor: theme.accent,
        style: {
          flex: 1,
          fontSize: 18,
          color: theme.foreground,
          fontFamily: theme.fontFamily,
          paddingVertical: 12
        }
      }), /*#__PURE__*/_jsx(IconButton, {
        icon: Delete,
        accessibilityLabel: labels.deleteDigit,
        disabled: !value || !canDial,
        onPress: () => update(value.slice(0, -1)),
        onLongPress: () => update("")
      })]
    }), suggestions && !exact ? /*#__PURE__*/_jsx(ContactSuggestions, {
      matches: matches,
      onSelect: select,
      onCall: contact => callNumber(contact.number, contact),
      renderAvatar: renderAvatar
    }) : null, /*#__PURE__*/_jsx(Button, {
      label: labels.call,
      icon: Phone,
      disabled: callDisabled,
      onPress: call,
      accessibilityHint: ready ? undefined : labels.connectToCall
    })]
  });
  return /*#__PURE__*/_jsxs(View, {
    style: {
      alignItems: "center",
      gap: 16,
      alignSelf: "stretch"
    },
    children: [/*#__PURE__*/_jsxs(View, {
      style: {
        alignSelf: "stretch",
        alignItems: "center",
        minHeight: 52,
        justifyContent: "center",
        paddingHorizontal: 12,
        gap: 6,
        zIndex: 10
      },
      children: [inCall ? /*#__PURE__*/_jsx(PhoneText, {
        size: displaySize(shown.length),
        weight: "300",
        numberOfLines: 1,
        style: {
          letterSpacing: 1,
          fontVariant: ["tabular-nums"]
        },
        accessibilityLabel: shown ? labels.sentDigits(shown.split("").join(" ")) : labels.keypad,
        children: shown || " "
      }) : /*#__PURE__*/_jsx(TextInput, {
        value: value,
        onChangeText: update,
        placeholder: placeholder ?? labels.dialPlaceholder,
        placeholderTextColor: theme.muted
        // The keypad is the input; still allow paste via long press.
        ,
        showSoftInputOnFocus: false,
        caretHidden: Platform.OS !== "web",
        autoComplete: "tel",
        maxLength: 160,
        editable: canDial,
        accessibilityLabel: labels.numberField,
        selectionColor: theme.accent,
        testID: "dial-input",
        style: {
          alignSelf: "stretch",
          textAlign: "center",
          fontSize: value ? displaySize(value.length) : 22,
          fontWeight: value ? "300" : "400",
          color: theme.foreground,
          fontFamily: theme.fontFamily,
          letterSpacing: value ? 0.5 : 0,
          paddingVertical: 6
        }
      }), !inCall && exact ? /*#__PURE__*/_jsx(PhoneText, {
        size: 14,
        weight: "600",
        color: theme.accent,
        numberOfLines: 1,
        children: identity?.name
      }) : !inCall && suggestions ? /*#__PURE__*/_jsx(ContactSuggestions, {
        matches: matches,
        onSelect: select,
        onCall: contact => callNumber(contact.number, contact),
        renderAvatar: renderAvatar
      }) : null]
    }), /*#__PURE__*/_jsx(Keypad, {
      keySize: keySize,
      showLetters: showLetters,
      speedDial: inCall ? undefined : speedDial,
      accessibilityLabel: inCall ? labels.inCallKeypad : labels.dialPad,
      disabled: !canDial && !inCall,
      onKey: digit => {
        if (inCall) {
          action(() => client.sendDTMF(digit));
          setSent(current => (current + digit).slice(-24));
        } else {
          client.playKeypadTone(digit);
          update(value + digit);
        }
      },
      onLongKey: inCall ? undefined : digit => {
        const quick = speedDialContact(speedDial?.[digit as keyof SpeedDial]);
        // The press already typed this digit; a lone digit means "speed dial".
        if (quick && value === digit && ready) {
          update("");
          callNumber(quick.number, quick);
        } else if (digit === "0" && value.endsWith("0")) update(`${value.slice(0, -1)}+`);
      }
    }), canDial ? /*#__PURE__*/_jsxs(View, {
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch"
      },
      children: [/*#__PURE__*/_jsx(View, {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/_jsx(PressableScale, {
        accessibilityLabel: value.trim() ? labels.callNumber(identity?.name ?? format(value)) : labels.startCall,
        accessibilityHint: ready ? undefined : labels.connectToCall,
        disabled: callDisabled,
        onPress: call,
        scaleTo: 0.9,
        testID: "start-call",
        style: {
          width: 72,
          height: 72,
          borderRadius: controlRadius(theme, 72),
          backgroundColor: theme.answer,
          alignItems: "center",
          justifyContent: "center"
        },
        pressedStyle: {
          opacity: 0.85
        },
        children: /*#__PURE__*/_jsx(Phone, {
          size: 30,
          color: theme.answerForeground,
          fill: theme.answerForeground,
          strokeWidth: 1.5
        })
      }), /*#__PURE__*/_jsx(View, {
        style: {
          flex: 1,
          alignItems: "center"
        },
        children: value ? /*#__PURE__*/_jsx(IconButton, {
          icon: Delete,
          size: 24,
          accessibilityLabel: labels.deleteDigit,
          onPress: () => update(value.slice(0, -1)),
          onLongPress: () => update("")
        }) : null
      })]
    }) : null]
  });
}
