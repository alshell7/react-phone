import { useEffect, useState, type ReactElement } from "react";
import { Platform, TextInput, View } from "react-native";
import { Delete, Phone } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.tsx";
import type { Caller } from "../core/types.ts";
import { usePhoneTheme } from "./theme.tsx";
import { Button, IconButton, PhoneText, PressableScale } from "./primitives.tsx";
import { action } from "./status.tsx";

const KEYS: ReadonlyArray<readonly [string, string]> = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", ""],
  ["0", "+"],
  ["#", ""],
];

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
  accessibilityLabel = "Dial pad",
}: KeypadProps): ReactElement {
  const theme = usePhoneTheme();
  const [width, setWidth] = useState(0);
  const gap = width ? Math.min(28, Math.max(12, width * 0.07)) : 20;
  const size = width
    ? Math.max(52, Math.min(keySize, (width - gap * 2) / 3))
    : keySize;
  const fg = textColor ?? theme.foreground;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: gap,
        rowGap: Math.round(gap * 0.7),
        alignSelf: "stretch",
        paddingHorizontal: 4,
      }}
    >
      {KEYS.map(([digit, letters]) => (
        <View key={digit} style={{ width: size, alignItems: "center" }}>
          <PressableScale
            accessibilityLabel={digit === "*" ? "star" : digit === "#" ? "pound" : digit}
            accessibilityHint={digit === "0" && onLongKey ? "Long press for plus" : undefined}
            disabled={disabled}
            scaleTo={0.9}
            delayPressIn={0}
            onPressIn={() => onKey(digit)}
            onLongPress={onLongKey ? () => onLongKey(digit) : undefined}
            delayLongPress={450}
            testID={`key-${digit}`}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: keyColor ?? theme.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
            pressedStyle={{ backgroundColor: theme.pressed }}
          >
            <PhoneText
              size={Math.round(size * 0.42)}
              weight="400"
              color={fg}
              style={{ lineHeight: Math.round(size * 0.48), marginTop: letters ? 2 : 0 }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {digit}
            </PhoneText>
            {letters ? (
              <PhoneText
                size={Math.max(8, Math.round(size * 0.125))}
                weight="700"
                color={theme.muted}
                style={{ letterSpacing: 1.6, lineHeight: Math.round(size * 0.16) }}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {letters}
              </PhoneText>
            ) : null}
          </PressableScale>
        </View>
      ))}
    </View>
  );
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
  keySize,
}: DialerProps): ReactElement {
  const { state, client } = usePhone();
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

  if (!showKeypad && !inCall)
    return (
      <View style={{ gap: 10, alignSelf: "stretch" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            paddingLeft: 14,
            minHeight: 52,
          }}
        >
          <TextInput
            value={value}
            onChangeText={update}
            placeholder={placeholder}
            placeholderTextColor={theme.muted}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="go"
            maxLength={160}
            editable={canDial}
            onSubmitEditing={() => !callDisabled && call()}
            accessibilityLabel="Phone number or SIP address"
            selectionColor={theme.accent}
            style={{ flex: 1, fontSize: 18, color: theme.foreground, fontFamily: theme.fontFamily, paddingVertical: 12 }}
          />
          <IconButton
            icon={Delete}
            accessibilityLabel="Delete last digit"
            disabled={!value || !canDial}
            onPress={() => update(value.slice(0, -1))}
            onLongPress={() => update("")}
          />
        </View>
        <Button
          label="Call"
          icon={Phone}
          disabled={callDisabled}
          onPress={call}
          accessibilityHint={ready ? undefined : "Connect an account to make calls"}
        />
      </View>
    );

  return (
    <View style={{ alignItems: "center", gap: 18, alignSelf: "stretch" }}>
      <View style={{ alignSelf: "stretch", alignItems: "center", minHeight: 52, justifyContent: "center", paddingHorizontal: 12 }}>
        {inCall ? (
          <PhoneText
            size={displaySize(shown.length)}
            weight="300"
            numberOfLines={1}
            style={{ letterSpacing: 1, fontVariant: ["tabular-nums"] }}
            accessibilityLabel={shown ? `Sent ${shown.split("").join(" ")}` : "Keypad"}
          >
            {shown || " "}
          </PhoneText>
        ) : (
          <TextInput
            value={value}
            onChangeText={update}
            placeholder={placeholder}
            placeholderTextColor={theme.muted}
            // The keypad is the input; still allow paste via long press.
            showSoftInputOnFocus={false}
            caretHidden={Platform.OS !== "web"}
            autoComplete="tel"
            maxLength={160}
            editable={canDial}
            accessibilityLabel="Phone number or SIP address"
            selectionColor={theme.accent}
            testID="dial-input"
            style={{
              alignSelf: "stretch",
              textAlign: "center",
              fontSize: value ? displaySize(value.length) : 22,
              fontWeight: value ? "300" : "400",
              color: theme.foreground,
              fontFamily: theme.fontFamily,
              letterSpacing: value ? 0.5 : 0,
              paddingVertical: 6,
            }}
          />
        )}
        {!inCall && caller?.name && caller.number === value ? (
          <PhoneText size={14} weight="500" color={theme.accent}>
            {caller.name}
          </PhoneText>
        ) : null}
      </View>
      <Keypad
        keySize={keySize}
        accessibilityLabel={inCall ? "In-call keypad" : "Dial pad"}
        disabled={!canDial && !inCall}
        onKey={(digit) => {
          if (inCall) {
            action(() => client.sendDTMF(digit));
            setSent((current) => (current + digit).slice(-24));
          } else {
            client.playKeypadTone(digit);
            update(value + digit);
          }
        }}
        onLongKey={
          inCall
            ? undefined
            : (digit) => {
                if (digit === "0" && value.endsWith("0")) update(`${value.slice(0, -1)}+`);
              }
        }
      />
      {canDial ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "stretch" }}>
          <View style={{ flex: 1 }} />
          <PressableScale
            accessibilityLabel={value.trim() ? `Call ${value}` : "Start call"}
            accessibilityHint={ready ? undefined : "Connect an account to make calls"}
            disabled={callDisabled}
            onPress={call}
            scaleTo={0.9}
            testID="start-call"
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: theme.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
            pressedStyle={{ opacity: 0.85 }}
          >
            <Phone size={30} color={theme.accentForeground} fill={theme.accentForeground} strokeWidth={1.5} />
          </PressableScale>
          <View style={{ flex: 1, alignItems: "center" }}>
            {value ? (
              <IconButton
                icon={Delete}
                size={24}
                accessibilityLabel="Delete last digit"
                onPress={() => update(value.slice(0, -1))}
                onLongPress={() => update("")}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
