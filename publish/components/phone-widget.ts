// Generated from src/components/phone-widget.tsx. Run npm run package:build; do not edit.
"use client";

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { AudioLines, GripHorizontal, Headphones, Settings2, X } from "lucide-react";
import { PhoneProvider, usePhone, type PhoneProviderProps } from "../react/phone-provider.ts";
import type { Caller } from "../core/types.ts";
import { PhoneRoot, type PhoneRootProps } from "./theme.ts";
import { AudioSettings, CallControls, CallerCard, ConnectionStatus, Dialer, ErrorBanner, type CallerCardProps, type CallControl } from "./controls.ts";
import { CallWaveform, type CallWaveformProps } from "./call-waveform.ts";
import { CallOrb, type CallOrbProps } from "./call-orb.ts";
import { useAutoDial } from "../react/use-auto-dial.ts";
import { CallBarVisualizer, type CallBarVisualizerProps } from "./call-bar-visualizer.ts";
import { useDraggable, type PhoneDragOptions } from "../react/use-draggable.ts";
import { useAnimatedSize } from "../react/use-animated-size.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export type PhonePreset = "basic" | "advanced" | "compact";
export interface PhoneVisualization {
  /** Defaults to waveform; explicit selection overrides features.waveform. */
  type?: "avatar" | "orb" | "waveform" | "bars" | "both" | "none";
  orb?: CallOrbProps;
  waveform?: CallWaveformProps;
  bars?: CallBarVisualizerProps;
}
export interface PhoneFeatures {
  keypad: boolean;
  hold: boolean;
  transfer: boolean;
  waveform: boolean;
  audioSettings: boolean;
  mute: boolean;
}

/** Presets are ordinary feature objects; override any feature per instance. */
export const phonePresets: Readonly<Record<PhonePreset, Readonly<PhoneFeatures>>> = {
  basic: {
    mute: true,
    keypad: false,
    hold: false,
    transfer: false,
    waveform: true,
    audioSettings: true
  },
  advanced: {
    mute: true,
    keypad: true,
    hold: true,
    transfer: true,
    waveform: true,
    audioSettings: true
  },
  compact: {
    mute: true,
    keypad: false,
    hold: true,
    transfer: false,
    waveform: false,
    audioSettings: false
  }
};
export interface PhoneWidgetProps extends Omit<PhoneRootProps, "children">, Omit<CallerCardProps, "caller"> {
  preset?: PhonePreset;
  features?: Partial<PhoneFeatures>;
  title?: string;
  /** Contact used for an outgoing call. Actual incoming identity is kept separate. */
  caller?: Caller;
  /** Enrich incoming and outgoing caller metadata from your CRM. */
  resolveCaller?: (caller: Caller) => Caller;
  header?: ReactNode;
  footer?: ReactNode;
  defaultNumber?: string;
  /** Call defaultNumber (or caller.number) once after registration. */
  autoDial?: boolean;
  /** Change to explicitly repeat an automatic call to the same number. */
  autoDialKey?: string;
  visualization?: PhoneVisualization;
  controls?: readonly CallControl[];
  draggable?: boolean | PhoneDragOptions;
  /** Omit to hide attribution. Invalid/non-HTTP links render as plain text. */
  branding?: {
    name: string;
    href?: string;
  };
}

/** A styled preset sharing the parent provider's single connection. */
export function PhoneWidget({
  preset = "advanced",
  features,
  title = "Your phone",
  caller,
  resolveCaller,
  renderAvatar,
  renderTags,
  header,
  footer,
  defaultNumber = "",
  autoDial = false,
  autoDialKey,
  visualization,
  controls,
  draggable = false,
  branding,
  showAvatar,
  ...root
}: PhoneWidgetProps): ReactElement {
  const {
    state
  } = usePhone();
  const windowRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drag = useDraggable(windowRef, draggable);
  useAnimatedSize(panelRef, contentRef, root.motion);
  const [number, setNumber] = useState(defaultNumber || caller?.number || "");
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const options = {
    ...phonePresets[preset],
    ...features
  };
  const idle = ["idle", "ended"].includes(state.status);
  const active = ["active", "held"].includes(state.status);
  const visual = visualization?.type ?? (options.waveform ? "waveform" : "none");
  const prefilled = defaultNumber || caller?.number || "";
  useAutoDial({
    number: prefilled,
    enabled: autoDial,
    requestId: autoDialKey,
    caller: caller?.number === prefilled ? caller : undefined
  });
  useEffect(() => {
    if (idle || !options.keypad || controls && !controls.includes("keypad")) setKeypadOpen(false);
  }, [idle, options.keypad, controls]);
  useEffect(() => {
    setNumber(prefilled);
  }, [prefilled]);
  const currentCaller = !idle ? state.call?.caller : caller;
  const identity = currentCaller && resolveCaller ? resolveCaller(currentCaller) : currentCaller;
  return /*#__PURE__*/_jsx(PhoneRoot, {
    ...root,
    elementRef: windowRef,
    style: {
      ...root.style,
      ...drag.style
    },
    className: `az-widget az-${preset} ${root.className ?? ""}`,
    children: /*#__PURE__*/_jsx("section", {
      "aria-label": title,
      ref: panelRef,
      className: "az-size-frame",
      "data-dragging": drag.dragging,
      children: /*#__PURE__*/_jsxs("div", {
        ref: contentRef,
        children: [drag.enabled && /*#__PURE__*/_jsx("div", {
          className: "az-drag-strip",
          children: /*#__PURE__*/_jsxs("button", {
            type: "button",
            className: "az-drag-handle",
            ...drag.handleProps,
            children: [/*#__PURE__*/_jsx(GripHorizontal, {
              size: 18
            }), /*#__PURE__*/_jsx("span", {
              className: "az-sr-only",
              children: "Arrow keys move the phone. Shift moves faster. Home resets."
            })]
          })
        }), header !== undefined ? header : /*#__PURE__*/_jsxs("header", {
          className: "az-widget-header",
          children: [/*#__PURE__*/_jsxs("span", {
            className: "az-widget-title",
            children: [/*#__PURE__*/_jsx(AudioLines, {
              size: 19
            }), title]
          }), /*#__PURE__*/_jsxs("div", {
            className: "az-row",
            children: [/*#__PURE__*/_jsx(ConnectionStatus, {}), options.audioSettings && /*#__PURE__*/_jsx("button", {
              className: "az-icon",
              type: "button",
              "aria-label": settingsOpen ? "Close audio settings" : "Open audio settings",
              "aria-expanded": settingsOpen,
              onClick: () => setSettingsOpen(!settingsOpen),
              children: settingsOpen ? /*#__PURE__*/_jsx(X, {
                size: 17
              }) : /*#__PURE__*/_jsx(Settings2, {
                size: 17
              })
            })]
          })]
        }), /*#__PURE__*/_jsx(ErrorBanner, {}), settingsOpen ? /*#__PURE__*/_jsxs("div", {
          className: "az-settings-body",
          children: [/*#__PURE__*/_jsx("h3", {
            children: "Audio settings"
          }), /*#__PURE__*/_jsx(AudioSettings, {})]
        }) : /*#__PURE__*/_jsxs("div", {
          className: "az-widget-body",
          children: [(visual === "orb" || visual === "both") && /*#__PURE__*/_jsx("div", {
            className: "az-orb-wrap",
            children: /*#__PURE__*/_jsx(CallOrb, {
              appearance: root.theme?.appearance,
              ...visualization?.orb
            })
          }), /*#__PURE__*/_jsx(CallerCard, {
            caller: identity,
            showAvatar: showAvatar ?? (visual === "avatar" || visual === "none" && visualization?.type === undefined),
            renderAvatar: renderAvatar,
            renderTags: renderTags
          }), (visual === "waveform" || visual === "both") && /*#__PURE__*/_jsx(CallWaveform, {
            ...visualization?.waveform
          }), visual === "bars" && /*#__PURE__*/_jsx("div", {
            className: "az-bars-wrap",
            children: /*#__PURE__*/_jsx(CallBarVisualizer, {
              ...visualization?.bars
            })
          }), (idle || active && keypadOpen && options.keypad) && /*#__PURE__*/_jsx(Dialer, {
            value: number,
            onChange: setNumber,
            showKeypad: options.keypad,
            caller: caller && caller.number === number ? caller : undefined
          }), /*#__PURE__*/_jsx(CallControls, {
            buttons: controls,
            showMute: options.mute,
            showHold: options.hold,
            showTransfer: options.transfer,
            showKeypad: options.keypad,
            keypadOpen: keypadOpen,
            onKeypadToggle: () => setKeypadOpen(!keypadOpen)
          })]
        }), footer !== undefined ? footer : /*#__PURE__*/_jsxs("footer", {
          className: "az-widget-footer",
          children: [/*#__PURE__*/_jsx(Headphones, {
            size: 13
          }), /*#__PURE__*/_jsx("span", {
            children: state.connection === "registered" ? "Audio handled by your browser" : "Connect an account to make calls"
          })]
        }), branding?.name.trim() && /*#__PURE__*/_jsxs("div", {
          className: "az-powered-by",
          children: ["Powered by", " ", branding.href && /^https?:\/\//i.test(branding.href) ? /*#__PURE__*/_jsx("a", {
            href: branding.href,
            target: "_blank",
            rel: "noreferrer",
            children: branding.name
          }) : /*#__PURE__*/_jsx("span", {
            children: branding.name
          })]
        })]
      })
    })
  });
}

/** All-in-one phone. For composable controls, use PhoneProvider + PhoneWidget. */
export interface WebPhoneProps extends Omit<PhoneProviderProps, "children">, PhoneWidgetProps {}
export function WebPhone({
  config,
  autoConnect,
  preview,
  client,
  onEvent,
  onIncomingCall,
  onAnswered,
  onDisconnected,
  onConnectionChange,
  onError,
  tones,
  ...widget
}: WebPhoneProps): ReactElement {
  return /*#__PURE__*/_jsx(PhoneProvider, {
    config: config,
    autoConnect: autoConnect,
    preview: preview,
    client: client,
    onEvent: onEvent,
    onIncomingCall: onIncomingCall,
    onAnswered: onAnswered,
    onDisconnected: onDisconnected,
    onConnectionChange: onConnectionChange,
    onError: onError,
    tones: tones,
    children: /*#__PURE__*/_jsx(PhoneWidget, {
      ...widget
    })
  });
}
