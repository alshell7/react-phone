import type { ReactNode } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { usePhoneTheme, withAlpha } from "@azeer-ui-widget/react-native-phone";

/** Small inspector kit. Uses the phone theme so the playground matches the phone. */
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = usePhoneTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: theme.muted,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function Chips<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  const theme = usePhoneTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              paddingHorizontal: 13,
              minHeight: 36,
              justifyContent: "center",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: selected ? theme.accent : theme.border,
              backgroundColor: selected
                ? theme.accentSoft
                : pressed
                  ? theme.pressed
                  : theme.background,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: selected ? "600" : "500",
                color: selected ? theme.accent : theme.foreground,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = usePhoneTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 44,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontWeight: "500", color: theme.foreground }}
        >
          {label}
        </Text>
        {hint ? (
          <Text style={{ fontSize: 12, color: theme.muted }}>{hint}</Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.accent, false: theme.border }}
        thumbColor="#ffffff"
        {...({ activeThumbColor: "#ffffff" } as object)}
      />
    </View>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const theme = usePhoneTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.muted }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          minHeight: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          paddingHorizontal: 12,
          fontSize: 15,
          color: theme.foreground,
          backgroundColor: theme.background,
        }}
      />
    </View>
  );
}

export function Swatches({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  const theme = usePhoneTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Accent colour"
      style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const color = option.value || theme.accent;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              padding: 3,
              borderWidth: 2,
              borderColor: selected ? color : "transparent",
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 20,
                backgroundColor: option.value
                  ? color
                  : withAlpha(theme.foreground, 0.08),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!option.value ? (
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: theme.accent,
                  }}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
