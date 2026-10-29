// Generated from src/components/dialer.tsx. Run npm run package:build; do not edit.
import { useEffect, useState } from "react";
import type { ReactElement } from "../react-types.d.ts";
import { Platform, TextInput, View } from "react-native";
import { Delete, Phone } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.ts";
import type { Caller } from "../core/types.ts";
import { usePhoneTheme } from "./theme.ts";
import { Button, IconButton, PhoneText, PressableScale } from "./primitives.ts";
import { action } from "./status.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const KEYS: ReadonlyArray<readonly [string, string]> = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
export interface KeypadProps {
  /** Called on touch-down, like a hardware keypad. */
  onKey: (digit: string) => void;
  /** Long-press handler (used for 0 → +). */
  onLongKey?: (digit: string) => void;
  disabled?: boolean;
  /** Maximum key diameter; keys shrink to fit narrow containers. */
  keySize?: number;
  /** Key fill. Defaults to the theme surface. */
  keyColor?: string;
  /** Digit colour. Defaults to the theme foreground. */
  textColor?: string;
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
  accessibilityLabel = "Dial pad"
}: KeypadProps): ReactElement {
  const theme = usePhoneTheme();
  const [width, setWidth] = useState(0);
  const gap = width ? Math.min(28, Math.max(12, width * 0.07)) : 20;
  const size = width ? Math.max(52, Math.min(keySize, (width - gap * 2) / 3)) : keySize;
  const fg = textColor ?? theme.foreground;
  return /*#__PURE__*/_jsx(View, {
    accessibilityLabel: accessibilityLabel,
    onLayout: event => setWidth(event.nativeEvent.layout.width),
    style: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      columnGap: gap,
      rowGap: Math.round(gap * 0.7),
      alignSelf: "stretch",
      paddingHorizontal: 4
    },
    children: KEYS.map(([digit, letters]) => /*#__PURE__*/_jsx(View, {
      style: {
        width: size,
        alignItems: "center"
      },
      children: /*#__PURE__*/_jsxs(PressableScale, {
        accessibilityLabel: digit === "*" ? "star" : digit === "#" ? "pound" : digit,
        accessibilityHint: digit === "0" && onLongKey ? "Long press for plus" : undefined,
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
          borderRadius: size / 2,
          backgroundColor: keyColor ?? theme.surface,
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
            marginTop: letters ? 2 : 0
          },
          accessibilityElementsHidden: true,
          importantForAccessibility: "no",
          children: digit
        }), letters ? /*#__PURE__*/_jsx(PhoneText, {
          size: Math.max(8, Math.round(size * 0.125)),
          weight: "700",
          color: theme.muted,
          style: {
            letterSpacing: 1.6,
            lineHeight: Math.round(size * 0.16)
          },
          accessibilityElementsHidden: true,
          importantForAccessibility: "no",
          children: letters
        }) : null]
      })
    }, digit))
  });
}
export interface DialerProps {
  value?: string;
  onChange?: (value: string) => void;
  showKeypad?: boolean;
  /** Identity attached to the outgoing call when the number matches. */
  caller?: Partial<Caller>;
  placeholder?: string;
  /** Maximum keypad key diameter. */
  keySize?: number;
}
function displaySize(length: number): number {
  if (length <= 9) return 36;
  if (length <= 12) return 31;
  if (length <= 15) return 27;
  if (length <= 19) return 23;
  return 19;
}

/**
 * Standalone dial pad. While idle it composes a number and places the call; during a
 * connected call its keys send DTMF and the display shows the digits sent.
 */
export function Dialer({
  value: controlled,
  onChange,
  showKeypad = true,
  caller,
  placeholder = "Enter a number",
  keySize
}: DialerProps): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const theme = usePhoneTheme();
  const [localValue, setLocalValue] = useState("");
  const [sent, setSent] = useState("");
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
  const call = () => action(() => client.call(value, caller));
  const shown = inCall ? sent : value;
  const callDisabled = !value.trim() || !canDial || !ready;
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
        placeholder: placeholder,
        placeholderTextColor: theme.muted,
        keyboardType: "phone-pad",
        autoComplete: "tel",
        textContentType: "telephoneNumber",
        returnKeyType: "go",
        maxLength: 160,
        editable: canDial,
        onSubmitEditing: () => !callDisabled && call(),
        accessibilityLabel: "Phone number or SIP address",
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
        accessibilityLabel: "Delete last digit",
        disabled: !value || !canDial,
        onPress: () => update(value.slice(0, -1)),
        onLongPress: () => update("")
      })]
    }), /*#__PURE__*/_jsx(Button, {
      label: "Call",
      icon: Phone,
      disabled: callDisabled,
      onPress: call,
      accessibilityHint: ready ? undefined : "Connect an account to make calls"
    })]
  });
  return /*#__PURE__*/_jsxs(View, {
    style: {
      alignItems: "center",
      gap: 18,
      alignSelf: "stretch"
    },
    children: [/*#__PURE__*/_jsxs(View, {
      style: {
        alignSelf: "stretch",
        alignItems: "center",
        minHeight: 52,
        justifyContent: "center",
        paddingHorizontal: 12
      },
      children: [inCall ? /*#__PURE__*/_jsx(PhoneText, {
        size: displaySize(shown.length),
        weight: "300",
        numberOfLines: 1,
        style: {
          letterSpacing: 1,
          fontVariant: ["tabular-nums"]
        },
        accessibilityLabel: shown ? `Sent ${shown.split("").join(" ")}` : "Keypad",
        children: shown || " "
      }) : /*#__PURE__*/_jsx(TextInput, {
        value: value,
        onChangeText: update,
        placeholder: placeholder,
        placeholderTextColor: theme.muted
        // The keypad is the input; still allow paste via long press.
        ,
        showSoftInputOnFocus: false,
        caretHidden: Platform.OS !== "web",
        autoComplete: "tel",
        maxLength: 160,
        editable: canDial,
        accessibilityLabel: "Phone number or SIP address",
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
      }), !inCall && caller?.name && caller.number === value ? /*#__PURE__*/_jsx(PhoneText, {
        size: 14,
        weight: "500",
        color: theme.accent,
        children: caller.name
      }) : null]
    }), /*#__PURE__*/_jsx(Keypad, {
      keySize: keySize,
      accessibilityLabel: inCall ? "In-call keypad" : "Dial pad",
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
        if (digit === "0" && value.endsWith("0")) update(`${value.slice(0, -1)}+`);
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
        accessibilityLabel: value.trim() ? `Call ${value}` : "Start call",
        accessibilityHint: ready ? undefined : "Connect an account to make calls",
        disabled: callDisabled,
        onPress: call,
        scaleTo: 0.9,
        testID: "start-call",
        style: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: theme.accent,
          alignItems: "center",
          justifyContent: "center"
        },
        pressedStyle: {
          opacity: 0.85
        },
        children: /*#__PURE__*/_jsx(Phone, {
          size: 30,
          color: theme.accentForeground,
          fill: theme.accentForeground,
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
          accessibilityLabel: "Delete last digit",
          onPress: () => update(value.slice(0, -1)),
          onLongPress: () => update("")
        }) : null
      })]
    }) : null]
  });
}
