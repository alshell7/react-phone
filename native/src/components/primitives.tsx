import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type Insets,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { usePhoneMotion } from "./motion.tsx";
import { usePhoneTheme, withAlpha } from "./theme.tsx";

/** Lucide-compatible icon component. */
export type PhoneIcon = (props: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) => ReactNode;

export interface PressableScaleProps {
  children?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  /** Scale while pressed; defaults to 0.94. */
  scaleTo?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  hitSlop?: Insets | number;
  delayLongPress?: number;
  /** Milliseconds before onPressIn. Keypads use 0 to act on touch-down everywhere. */
  delayPressIn?: number;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Accessibility state for every platform. iOS/Android read `accessibilityState`;
 * react-native-web only reads ARIA props, so mirror the state there (toggle buttons
 * become aria-pressed, tabs aria-selected, radios aria-checked).
 */
export function accessibilityStateProps(
  role: AccessibilityRole | undefined,
  state: AccessibilityState = {},
): Record<string, unknown> {
  const props: Record<string, unknown> = { accessibilityState: state };
  if (Platform.OS !== "web") return props;
  if (state.disabled) props["aria-disabled"] = true;
  if (state.expanded !== undefined) props["aria-expanded"] = state.expanded;
  if (state.busy !== undefined) props["aria-busy"] = state.busy;
  if (state.checked !== undefined) props["aria-checked"] = state.checked;
  if (state.selected !== undefined)
    props[role === "tab" || role === "option" ? "aria-selected" : "aria-pressed"] = state.selected;
  return props;
}

/** Pressable with spring scale feedback on the native driver. */
export function PressableScale({
  children,
  style,
  pressedStyle,
  scaleTo = 0.94,
  disabled,
  onPressIn,
  accessibilityRole = "button",
  accessibilityState,
  ...props
}: PressableScaleProps): ReactElement {
  const motion = usePhoneMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const spring = (to: number) => {
    if (!motion.enabled) return;
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: to === 1 ? 6 : 0,
    }).start();
  };
  // One element carries layout, press feedback, and the scale transform.
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      {...accessibilityStateProps(accessibilityRole, { disabled: Boolean(disabled), ...accessibilityState })}
      onPressIn={() => {
        setPressed(true);
        spring(scaleTo);
        onPressIn?.();
      }}
      onPressOut={() => {
        setPressed(false);
        spring(1);
      }}
      style={[
        style,
        pressed && pressedStyle,
        disabled && { opacity: 0.4 },
        { transform: [{ scale }] },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

export type RoundButtonTone =
  | "neutral"
  | "accent"
  | "danger"
  | "danger-soft"
  | "glass";

export interface RoundButtonProps {
  icon: PhoneIcon;
  label?: string;
  accessibilityLabel: string;
  onPress?: () => void;
  onLongPress?: () => void;
  tone?: RoundButtonTone;
  /** Toggle buttons render inverted while selected. */
  selected?: boolean;
  disabled?: boolean;
  size?: number;
  /** Text colour for the label below the button. */
  labelColor?: string;
  accessibilityHint?: string;
  expanded?: boolean;
  testID?: string;
}

/** Circular call action with an optional caption, sized for thumbs (≥ 56 pt). */
export function RoundButton({
  icon: Icon,
  label,
  accessibilityLabel,
  onPress,
  onLongPress,
  tone = "neutral",
  selected,
  disabled,
  size = 64,
  labelColor,
  accessibilityHint,
  expanded,
  testID,
}: RoundButtonProps): ReactElement {
  const theme = usePhoneTheme();
  const fills: Record<RoundButtonTone, [string, string]> = {
    neutral: [theme.surface, theme.foreground],
    accent: [theme.accent, theme.accentForeground],
    danger: [theme.danger, theme.dangerForeground],
    "danger-soft": [theme.dangerSoft, theme.danger],
    glass: [withAlpha(theme.foreground, theme.appearance === "dark" ? 0.14 : 0.07), theme.foreground],
  };
  const [background, foreground] = selected
    ? [theme.foreground, theme.background]
    : fills[tone];
  return (
    <View style={{ alignItems: "center", gap: 8, minWidth: size }}>
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          ...(selected !== undefined ? { selected } : {}),
          ...(expanded !== undefined ? { expanded } : {}),
        }}
        scaleTo={0.9}
        hitSlop={6}
        testID={testID}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          alignItems: "center",
          justifyContent: "center",
        }}
        pressedStyle={{ opacity: 0.82 }}
      >
        <Icon size={Math.round(size * 0.38)} color={foreground} strokeWidth={1.9} />
      </PressableScale>
      {label ? (
        <PhoneText
          size={12}
          weight="500"
          color={labelColor ?? theme.foreground}
          numberOfLines={1}
          style={{ maxWidth: size + 28, textAlign: "center" }}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {label}
        </PhoneText>
      ) : null}
    </View>
  );
}

export interface PhoneTextProps {
  children?: ReactNode;
  size?: number;
  weight?: TextStyle["fontWeight"];
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityLiveRegion?: "none" | "polite" | "assertive";
  importantForAccessibility?: "auto" | "yes" | "no" | "no-hide-descendants";
  accessibilityElementsHidden?: boolean;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  selectable?: boolean;
  onPress?: () => void;
  testID?: string;
}

/** Themed text that respects Dynamic Type up to 1.6× to keep layouts intact. */
export function PhoneText({
  children,
  size = 15,
  weight = "400",
  color,
  style,
  ...props
}: PhoneTextProps): ReactElement {
  const theme = usePhoneTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...props}
      style={[
        {
          fontSize: size,
          lineHeight: Math.round(size * 1.3),
          fontWeight: weight,
          color: color ?? theme.foreground,
          fontFamily: theme.fontFamily,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: PhoneIcon;
  tone?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/** Full-width rounded action used in forms, banners, and sheets. */
export function Button({
  label,
  onPress,
  icon: Icon,
  tone = "primary",
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps): ReactElement {
  const theme = usePhoneTheme();
  const [background, foreground] = {
    primary: [theme.accent, theme.accentForeground],
    secondary: [theme.surface, theme.foreground],
    danger: [theme.danger, theme.dangerForeground],
    ghost: ["transparent", theme.accent],
  }[tone];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      scaleTo={0.97}
      testID={testID}
      style={[
        {
          minHeight: 50,
          borderRadius: 14,
          paddingHorizontal: 18,
          backgroundColor: background,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        style,
      ]}
      pressedStyle={{ opacity: 0.86 }}
    >
      {Icon ? <Icon size={18} color={foreground} strokeWidth={2} /> : null}
      <PhoneText size={16} weight="600" color={foreground} numberOfLines={1}>
        {label}
      </PhoneText>
    </PressableScale>
  );
}

export interface IconButtonProps {
  icon: PhoneIcon;
  accessibilityLabel: string;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  color?: string;
  size?: number;
  accessibilityState?: AccessibilityState;
  testID?: string;
}

/** 44 pt borderless icon action. */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  onLongPress,
  disabled,
  color,
  size = 20,
  accessibilityState,
  testID,
}: IconButtonProps): ReactElement {
  const theme = usePhoneTheme();
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={4}
      scaleTo={0.88}
      testID={testID}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
      }}
      pressedStyle={{ backgroundColor: theme.pressed }}
    >
      <Icon size={size} color={color ?? theme.muted} strokeWidth={2} />
    </PressableScale>
  );
}

export interface FieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  trailing?: ReactNode;
}

/** Labelled text field with a visible focus ring. */
export function Field({
  label,
  hint,
  style,
  trailing,
  onFocus,
  onBlur,
  editable = true,
  ...input
}: FieldProps): ReactElement {
  const theme = usePhoneTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      <PhoneText size={13} weight="600" color={theme.muted}>
        {label}
      </PhoneText>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? theme.accent : theme.border,
          backgroundColor: theme.background,
          paddingLeft: focused ? 13 : 14,
          opacity: editable ? 1 : 0.55,
          minHeight: 50,
        }}
      >
        <TextInput
          placeholderTextColor={theme.muted}
          selectionColor={theme.accent}
          cursorColor={theme.accent}
          editable={editable}
          accessibilityLabel={label}
          {...input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{
            flex: 1,
            fontSize: 16,
            color: theme.foreground,
            fontFamily: theme.fontFamily,
            paddingVertical: 12,
          }}
        />
        {trailing}
      </View>
      {hint ? (
        <PhoneText size={12} color={theme.muted}>
          {hint}
        </PhoneText>
      ) : null}
    </View>
  );
}

/**
 * Fades and lifts children in when mounted; skipped when motion is off. Use
 * `fade={false}` for alerts so screen readers never meet an invisible element.
 */
export function Appear({
  children,
  delay = 0,
  offset = 10,
  fade = true,
  style,
}: {
  children: ReactNode;
  delay?: number;
  offset?: number;
  fade?: boolean;
  style?: StyleProp<ViewStyle>;
}): ReactElement {
  const motion = usePhoneMotion();
  const progress = useRef(new Animated.Value(motion.enabled ? 0 : 1)).current;
  useEffect(() => {
    if (!motion.enabled) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration + 60,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, motion.enabled, motion.duration, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fade ? progress : 1,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Expanding ripple rings behind ringing avatars and answer buttons. */
export function PulseRings({
  size,
  color,
  active,
  rings = 3,
  spread = 1.75,
}: {
  size: number;
  color: string;
  active: boolean;
  rings?: number;
  spread?: number;
}): ReactElement | null {
  const motion = usePhoneMotion();
  const values = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0)),
  ).current;
  const running = active && motion.enabled;
  useEffect(() => {
    if (!running) return;
    const count = Math.min(4, Math.max(1, rings));
    const loops = values.slice(0, count).map((value, i) => {
      value.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay((i * 2400) / count),
          Animated.timing(value, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [running, rings, values]);
  if (!running) return null;
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {values.slice(0, Math.min(4, Math.max(1, rings))).map((value, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: value.interpolate({
              inputRange: [0, 1],
              outputRange: [0.32, 0],
            }),
            transform: [
              {
                scale: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, spread],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Small status dot that breathes while something is in progress. */
export function StatusDot({
  color,
  pulsing = false,
  size = 7,
}: {
  color: string;
  pulsing?: boolean;
  size?: number;
}): ReactElement {
  const motion = usePhoneMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!pulsing || !motion.enabled) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulsing, motion.enabled, opacity]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

/** Thin themed separator. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }): ReactElement {
  const theme = usePhoneTheme();
  return (
    <View
      style={[{ height: 1, backgroundColor: theme.border, alignSelf: "stretch" }, style]}
    />
  );
}
