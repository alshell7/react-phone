// Generated from src/components/theme.tsx. Run npm run package:build; do not edit.
import { createContext, useContext, useMemo } from "react";
import type { ReactElement, ReactNode } from "../react-types.d.ts";
import { View, useColorScheme, type StyleProp, type ViewStyle } from "react-native";
import { MotionContext, type PhoneMotion } from "./motion.ts";
import { LabelsContext, NumberFormatContext, type PhoneLabels, type PhoneNumberFormatter } from "./locale.ts";

/** Built-in palettes, each with a light and a dark variant. */
import { jsx as _jsx } from "react/jsx-runtime";
export type PhoneThemePreset = "forest" | "ocean" | "midnight" | "graphite" | "sunset" | "lavender";

/** Shape of round controls and keypad keys. */
export type PhoneControlShape = "circle" | "rounded";

/** Design tokens. Every phone instance can use different values. */
export interface PhoneTheme {
  /** `system` follows the device's light/dark setting. Defaults to `light`. */
  appearance?: "light" | "dark" | "system";
  /** Start from a built-in palette; any token below overrides it. Defaults to `forest`. */
  preset?: PhoneThemePreset;
  accent?: string;
  accentForeground?: string;
  background?: string;
  surface?: string;
  foreground?: string;
  muted?: string;
  border?: string;
  danger?: string;
  dangerForeground?: string;
  /** Answer and call buttons. Defaults to `accent`. */
  answer?: string;
  answerForeground?: string;
  /** Keypad keys. Default to `surface` / `foreground`. */
  keyBackground?: string;
  keyForeground?: string;
  /** Collapsed dynamic island capsule (contrast tone). */
  islandBackground?: string;
  islandForeground?: string;
  /** `circle` (default) or `rounded` squircle-like controls and keys. */
  controlShape?: PhoneControlShape;
  /** Corner radius of cards and sheets, in points. Defaults to 20. */
  radius?: number;
  fontFamily?: string;
}

/** Fully resolved tokens plus derived tints used by the components. */
export interface ResolvedPhoneTheme {
  appearance: "light" | "dark";
  preset: PhoneThemePreset;
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  danger: string;
  dangerForeground: string;
  answer: string;
  answerForeground: string;
  keyBackground: string;
  keyForeground: string;
  islandBackground: string;
  islandForeground: string;
  controlShape: PhoneControlShape;
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
type Palette = {
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  danger: string;
  dangerForeground: string;
  shadow: string;
};
const base: Record<"light" | "dark", Palette> = {
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
    shadow: "#10261a"
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
    shadow: "#000000"
  }
};

/** Palettes behind `theme.preset`. Exported so you can build on them. */
export const phoneThemes: Readonly<Record<PhoneThemePreset, Readonly<Record<"light" | "dark", Readonly<Palette>>>>> = {
  forest: base,
  ocean: {
    light: {
      ...base.light,
      accent: "#1f5fbf",
      background: "#ffffff",
      surface: "#f2f5fa",
      foreground: "#18202c",
      muted: "#5f6b7d",
      border: "#e1e7f0",
      shadow: "#0d1f3d"
    },
    dark: {
      ...base.dark,
      accent: "#8fbaf5",
      accentForeground: "#0c1d36",
      background: "#111822",
      surface: "#1b2431",
      foreground: "#eef3fa",
      muted: "#9eabbd",
      border: "#2a3646"
    }
  },
  midnight: {
    light: {
      ...base.light,
      accent: "#4b4fd1",
      background: "#ffffff",
      surface: "#f3f3fb",
      foreground: "#1b1c2e",
      muted: "#64667f",
      border: "#e4e4f2",
      shadow: "#14153a"
    },
    dark: {
      ...base.dark,
      accent: "#a9abff",
      accentForeground: "#15163d",
      background: "#0e0f1a",
      surface: "#191a2b",
      foreground: "#eeeefc",
      muted: "#a1a3c2",
      border: "#2a2c45"
    }
  },
  graphite: {
    light: {
      ...base.light,
      accent: "#24282c",
      background: "#ffffff",
      surface: "#f3f4f5",
      foreground: "#17191b",
      muted: "#676c72",
      border: "#e3e5e7",
      shadow: "#000000"
    },
    dark: {
      ...base.dark,
      accent: "#eceef0",
      accentForeground: "#16181a",
      background: "#121314",
      surface: "#1e2022",
      foreground: "#f4f5f6",
      muted: "#a3a8ad",
      border: "#2e3134"
    }
  },
  sunset: {
    light: {
      ...base.light,
      accent: "#b8482a",
      background: "#ffffff",
      surface: "#faf4f1",
      foreground: "#2a1d18",
      muted: "#7a665e",
      border: "#f0e3dd",
      shadow: "#3d1a0d"
    },
    dark: {
      ...base.dark,
      accent: "#ffab8a",
      accentForeground: "#3a1408",
      background: "#1c1412",
      surface: "#2a1f1b",
      foreground: "#fbf1ec",
      muted: "#c0a99f",
      border: "#3d2d27"
    }
  },
  lavender: {
    light: {
      ...base.light,
      accent: "#6a4dd6",
      background: "#ffffff",
      surface: "#f6f3fc",
      foreground: "#211b30",
      muted: "#6c6580",
      border: "#e8e2f4",
      shadow: "#21123d"
    },
    dark: {
      ...base.dark,
      accent: "#c6b6ff",
      accentForeground: "#211344",
      background: "#15121e",
      surface: "#211d2d",
      foreground: "#f3f0fb",
      muted: "#aba3c2",
      border: "#332d45"
    }
  }
};

/** Black or white text, whichever reads better on `background`. */
export function readableColor(background: string): string {
  const c = parseColor(background);
  if (!c) return "#ffffff";
  const [r, g, b] = c.slice(0, 3).map(v => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#0d1510" : "#ffffff";
}

/** Corner radius for a control of `size` points in the theme's control shape. */
export function controlRadius(theme: Pick<ResolvedPhoneTheme, "controlShape">, size: number): number {
  return theme.controlShape === "rounded" ? Math.round(size * 0.3) : size / 2;
}
type Rgba = [number, number, number, number];

/** Parse #rgb, #rrggbb, #rrggbbaa, rgb() and rgba(). Unknown formats return null. */
export function parseColor(color: string): Rgba | null {
  const value = color.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(value)?.[1];
  if (hex && [3, 4, 6, 8].includes(hex.length)) {
    const full = hex.length <= 4 ? hex.split("").map(c => c + c).join("") : hex;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(value);
  if (rgb) {
    const alpha = rgb[4] ? rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]) : 1;
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
  return c[3] >= 0.999 ? `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})` : `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
}

/** Apply alpha to a colour. Falls back to the colour itself for unknown formats. */
export function withAlpha(color: string, alpha: number): string {
  const c = parseColor(color);
  if (!c) return color;
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${Math.max(0, Math.min(1, alpha * c[3])).toFixed(3)})`;
}
export function resolvePhoneTheme(theme: PhoneTheme = {}, systemScheme: "light" | "dark" | null | undefined = "light"): ResolvedPhoneTheme {
  const appearance = theme.appearance === "system" ? systemScheme === "dark" ? "dark" : "light" : theme.appearance ?? "light";
  const preset: PhoneThemePreset = theme.preset && theme.preset in phoneThemes ? theme.preset : "forest";
  const palette = phoneThemes[preset][appearance];
  const pick = (key: keyof Palette) => theme[key as keyof PhoneTheme] as string | undefined || palette[key];
  const background = pick("background");
  const surface = pick("surface");
  const accent = pick("accent");
  const accentForeground = pick("accentForeground");
  const danger = pick("danger");
  const foreground = pick("foreground");
  return {
    appearance,
    preset,
    accent,
    accentForeground,
    background,
    surface,
    foreground,
    muted: pick("muted"),
    border: pick("border"),
    danger,
    dangerForeground: pick("dangerForeground"),
    answer: theme.answer || accent,
    answerForeground: theme.answerForeground || (theme.answer ? "#ffffff" : accentForeground),
    keyBackground: theme.keyBackground || surface,
    keyForeground: theme.keyForeground || foreground,
    islandBackground: theme.islandBackground || (appearance === "dark" ? "#000000" : "#101412"),
    islandForeground: theme.islandForeground || "#f4f7f2",
    controlShape: theme.controlShape === "rounded" ? "rounded" : "circle",
    radius: typeof theme.radius === "number" && Number.isFinite(theme.radius) ? Math.max(0, theme.radius) : 20,
    fontFamily: theme.fontFamily,
    accentSoft: mixColors(background, accent, appearance === "dark" ? 0.2 : 0.12),
    dangerSoft: mixColors(background, danger, appearance === "dark" ? 0.2 : 0.11),
    pressed: mixColors(surface, foreground, 0.08),
    shadow: palette.shadow
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
  /** Translate or reword any string; unspecified keys keep English. */
  labels?: Partial<PhoneLabels>;
  /** Format numbers for display (for example with libphonenumber). Dialing is unaffected. */
  formatNumber?: PhoneNumberFormatter;
  testID?: string;
}

/** Styling boundary for custom layouts; does not create a SIP connection. */
export function PhoneRoot({
  children,
  theme,
  style,
  motion = true,
  labels,
  formatNumber,
  testID
}: PhoneRootProps): ReactElement {
  const parentLabels = useContext(LabelsContext);
  const parentFormat = useContext(NumberFormatContext);
  const mergedLabels = useMemo<PhoneLabels>(() => labels ? {
    ...parentLabels,
    ...labels,
    endReasons: {
      ...parentLabels.endReasons,
      ...labels.endReasons
    }
  } : parentLabels, [parentLabels, labels]);
  const scheme = useColorScheme();
  const resolved = useMemo(() => resolvePhoneTheme(theme, scheme),
  // Tokens are compared by value so inline theme objects do not churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [JSON.stringify(theme ?? {}), scheme]);
  const motionValue = useMemo(() => typeof motion === "boolean" ? {
    enabled: motion
  } : motion,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [JSON.stringify(motion)]);
  return /*#__PURE__*/_jsx(ThemeContext.Provider, {
    value: resolved,
    children: /*#__PURE__*/_jsx(MotionContext.Provider, {
      value: motionValue,
      children: /*#__PURE__*/_jsx(LabelsContext.Provider, {
        value: mergedLabels,
        children: /*#__PURE__*/_jsx(NumberFormatContext.Provider, {
          value: formatNumber ?? parentFormat,
          children: /*#__PURE__*/_jsx(View, {
            style: style,
            testID: testID,
            children: children
          })
        })
      })
    })
  });
}
