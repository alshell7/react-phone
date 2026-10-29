import {
  createContext,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  View,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MotionContext, type PhoneMotion } from "./motion.tsx";

/** Design tokens. Every phone instance can use different values. */
export interface PhoneTheme {
  /** `system` follows the device's light/dark setting. Defaults to `light`. */
  appearance?: "light" | "dark" | "system";
  accent?: string;
  accentForeground?: string;
  background?: string;
  surface?: string;
  foreground?: string;
  muted?: string;
  border?: string;
  danger?: string;
  dangerForeground?: string;
  /** Corner radius of cards and sheets, in points. Defaults to 20. */
  radius?: number;
  fontFamily?: string;
}

/** Fully resolved tokens plus derived tints used by the components. */
export interface ResolvedPhoneTheme {
  appearance: "light" | "dark";
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  danger: string;
  dangerForeground: string;
  radius: number;
  fontFamily?: string;
  /** Accent tint for selected states and soft fills. */
  accentSoft: string;
  /** Danger tint for decline buttons and error banners. */
  dangerSoft: string;
  /** Pressed-state fill for neutral controls. */
  pressed: string;
  /** Card shadow colour. */
  shadow: string;
}

const palettes = {
  light: {
    accent: "#2e5945",
    accentForeground: "#ffffff",
    background: "#ffffff",
    surface: "#f4f6f3",
    foreground: "#1f2621",
    muted: "#687169",
    border: "#e5e9e3",
    danger: "#c2413d",
    dangerForeground: "#ffffff",
    shadow: "#10261a",
  },
  dark: {
    accent: "#b8daa2",
    accentForeground: "#17291e",
    background: "#1b211d",
    surface: "#273029",
    foreground: "#f2f4ef",
    muted: "#a9b4a7",
    border: "#36403a",
    danger: "#ec8f89",
    dangerForeground: "#2a1512",
    shadow: "#000000",
  },
} as const;

type Rgba = [number, number, number, number];

/** Parse #rgb, #rrggbb, #rrggbbaa, rgb() and rgba(). Unknown formats return null. */
export function parseColor(color: string): Rgba | null {
  const value = color.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(value)?.[1];
  if (hex && [3, 4, 6, 8].includes(hex.length)) {
    const full =
      hex.length <= 4 ? hex.split("").map((c) => c + c).join("") : hex;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(value);
  if (rgb) {
    const alpha = rgb[4]
      ? rgb[4].endsWith("%")
        ? parseFloat(rgb[4]) / 100
        : parseFloat(rgb[4])
      : 1;
    return [+rgb[1], +rgb[2], +rgb[3], alpha];
  }
  return null;
}

/** Mix two colours; `amount` is the share of `b`. Falls back to `a` for unknown formats. */
export function mixColors(a: string, b: string, amount: number): string {
  const x = parseColor(a);
  const y = parseColor(b);
  if (!x || !y) return a;
  const t = Math.max(0, Math.min(1, amount));
  const c = x.map((v, i) => v + (y[i] - v) * t);
  return c[3] >= 0.999
    ? `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`
    : `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
}

/** Apply alpha to a colour. Falls back to the colour itself for unknown formats. */
export function withAlpha(color: string, alpha: number): string {
  const c = parseColor(color);
  if (!c) return color;
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${Math.max(0, Math.min(1, alpha * c[3])).toFixed(3)})`;
}

export function resolvePhoneTheme(
  theme: PhoneTheme = {},
  systemScheme: "light" | "dark" | null | undefined = "light",
): ResolvedPhoneTheme {
  const appearance =
    theme.appearance === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : (theme.appearance ?? "light");
  const base = palettes[appearance];
  const pick = (key: keyof typeof base) =>
    (theme[key as keyof PhoneTheme] as string | undefined) || base[key];
  const background = pick("background");
  const accent = pick("accent");
  const danger = pick("danger");
  const foreground = pick("foreground");
  return {
    appearance,
    accent,
    accentForeground: pick("accentForeground"),
    background,
    surface: pick("surface"),
    foreground,
    muted: pick("muted"),
    border: pick("border"),
    danger,
    dangerForeground: pick("dangerForeground"),
    radius:
      typeof theme.radius === "number" && Number.isFinite(theme.radius)
        ? Math.max(0, theme.radius)
        : 20,
    fontFamily: theme.fontFamily,
    accentSoft: mixColors(background, accent, appearance === "dark" ? 0.2 : 0.12),
    dangerSoft: mixColors(background, danger, appearance === "dark" ? 0.2 : 0.11),
    pressed: mixColors(pick("surface"), foreground, 0.08),
    shadow: base.shadow,
  };
}

const ThemeContext = createContext<ResolvedPhoneTheme>(resolvePhoneTheme());

/** Resolved tokens of the nearest PhoneRoot. */
export function usePhoneTheme(): ResolvedPhoneTheme {
  return useContext(ThemeContext);
}

export interface PhoneRootProps {
  children: ReactNode;
  theme?: PhoneTheme;
  style?: StyleProp<ViewStyle>;
  motion?: boolean | PhoneMotion;
  testID?: string;
}

/** Styling boundary for custom layouts; does not create a SIP connection. */
export function PhoneRoot({
  children,
  theme,
  style,
  motion = true,
  testID,
}: PhoneRootProps): ReactElement {
  const scheme = useColorScheme();
  const resolved = useMemo(
    () => resolvePhoneTheme(theme, scheme),
    // Tokens are compared by value so inline theme objects do not churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(theme ?? {}), scheme],
  );
  const motionValue = useMemo(
    () => (typeof motion === "boolean" ? { enabled: motion } : motion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(motion)],
  );
  return (
    <ThemeContext.Provider value={resolved}>
      <MotionContext.Provider value={motionValue}>
        <View style={style} testID={testID}>
          {children}
        </View>
      </MotionContext.Provider>
    </ThemeContext.Provider>
  );
}
