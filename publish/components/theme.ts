// Generated from src/components/theme.tsx. Run npm run package:build; do not edit.
"use client";

import { createContext, useContext, type CSSProperties, type ReactElement, type ReactNode, type Ref } from "react";
import { phoneStyles } from "./styles.ts";
import { MotionContext, type PhoneMotion } from "./motion.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ThemeContext = createContext<PhoneTheme>({});
export function usePhoneTheme(): PhoneTheme {
  return useContext(ThemeContext);
}

/** All tokens are local to this wrapper, so multiple phones can have different themes. */
export interface PhoneTheme {
  appearance?: "light" | "dark";
  accent?: string;
  accentForeground?: string;
  background?: string;
  surface?: string;
  foreground?: string;
  muted?: string;
  border?: string;
  danger?: string;
  dangerForeground?: string;
  radius?: string;
  fontFamily?: string;
}
export interface PhoneRootProps {
  children: ReactNode;
  theme?: PhoneTheme;
  className?: string;
  style?: CSSProperties;
  /** Pass your style-src nonce when using a strict Content Security Policy. */
  nonce?: string;
  /** Host can render PhoneStyles once and disable per-instance style tags. */
  includeStyles?: boolean;
  motion?: boolean | PhoneMotion;
  /** Access the styling boundary for positioning/composed layouts. */
  elementRef?: Ref<HTMLDivElement>;
}

/** Self-contained styles: no Tailwind configuration or global stylesheet required. */
export function PhoneStyles({
  nonce
}: {
  nonce?: string;
}): ReactElement {
  return /*#__PURE__*/_jsx("style", {
    nonce: nonce,
    children: phoneStyles
  });
}

/** Styling boundary for custom layouts; does not create a SIP connection. */
export function PhoneRoot({
  children,
  theme = {},
  className = "",
  style,
  nonce,
  includeStyles = true,
  motion = true,
  elementRef
}: PhoneRootProps): ReactElement {
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value && key !== "appearance") variables[`--az-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`] = value;
  }
  return /*#__PURE__*/_jsx(ThemeContext.Provider, {
    value: theme,
    children: /*#__PURE__*/_jsx(MotionContext.Provider, {
      value: typeof motion === "boolean" ? {
        enabled: motion
      } : motion,
      children: /*#__PURE__*/_jsxs("div", {
        ref: elementRef,
        className: `az-phone ${className}`,
        "data-appearance": theme.appearance ?? "light",
        "data-motion": motion === false || typeof motion === "object" && motion.enabled === false ? "off" : "on",
        style: {
          ...variables,
          "--az-motion-duration": `${Math.max(80, Math.min(600, typeof motion === "object" ? motion.durationMs ?? 220 : 220))}ms`,
          ...style
        } as CSSProperties,
        children: [includeStyles && /*#__PURE__*/_jsx(PhoneStyles, {
          nonce: nonce
        }), children]
      })
    })
  });
}
