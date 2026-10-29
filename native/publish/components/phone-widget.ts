// Generated from src/components/phone-widget.tsx. Run npm run package:build; do not edit.
import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "../react-types.d.ts";
import { Animated, Linking, Platform, ScrollView, View, useWindowDimensions, type HostInstance } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { AudioLines, ChevronDown, GripHorizontal, Headphones, Settings2, X } from "lucide-react-native";
import { PhoneProvider, usePhone, type PhoneProviderProps } from "../react/phone-provider.ts";
import { useAutoDial } from "../react/use-auto-dial.ts";
import { useDraggable, type PhoneDragHandle, type PhoneDragOptions } from "../react/use-draggable.ts";
import type { Caller } from "../core/types.ts";
import { PhoneRoot, mixColors, usePhoneTheme, type PhoneRootProps } from "./theme.ts";
import { animateNextLayout, usePhoneMotion } from "./motion.ts";
import { Appear, IconButton, PhoneText, PressableScale } from "./primitives.ts";
import { CallTimer, ConnectionStatus, ErrorBanner } from "./status.ts";
import { Avatar, CallerCard, type CallerCardProps } from "./caller-card.ts";
import { Dialer } from "./dialer.ts";
import { CallControls, IncomingCallActions, type CallControl } from "./call-controls.ts";
import { AudioSettings } from "./audio-settings.ts";
import { CallHistory } from "./call-history.ts";
import { CallBarVisualizer, CallOrb, CallWaveform, type CallBarVisualizerProps, type CallOrbProps, type CallWaveformProps } from "./call-visuals.ts";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
  /** Earpiece/loudspeaker toggle (shown when routing is available). */
  speaker: boolean;
  /** Keypad / Recents tabs while idle. */
  recents: boolean;
}

/** Presets are ordinary feature objects; override any feature per instance. */
export const phonePresets: Readonly<Record<PhonePreset, Readonly<PhoneFeatures>>> = {
  basic: {
    mute: true,
    keypad: false,
    hold: false,
    transfer: false,
    waveform: true,
    audioSettings: true,
    speaker: true,
    recents: false
  },
  advanced: {
    mute: true,
    keypad: true,
    hold: true,
    transfer: true,
    waveform: true,
    audioSettings: true,
    speaker: true,
    recents: true
  },
  compact: {
    mute: true,
    keypad: false,
    hold: true,
    transfer: false,
    waveform: false,
    audioSettings: false,
    speaker: true,
    recents: false
  }
};
export interface SafeAreaInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}
export interface PhoneWidgetProps extends Omit<PhoneRootProps, "children">, Omit<CallerCardProps, "caller" | "visual" | "size" | "color"> {
  preset?: PhonePreset;
  features?: Partial<PhoneFeatures>;
  /**
   * `card` embeds in your layout; `screen` fills its parent as a full phone; `sheet`
   * drops the outer chrome for your own modal or bottom sheet.
   */
  variant?: "card" | "screen" | "sheet";
  title?: string;
  /** Contact used for an outgoing call. Actual incoming identity is kept separate. */
  caller?: Caller;
  /** Enrich incoming and outgoing caller metadata from your CRM. */
  resolveCaller?: (caller: Caller) => Caller;
  /** Replace the header; `null` hides it. */
  header?: ReactNode;
  /** Replace the footer; `null` hides it. */
  footer?: ReactNode;
  defaultNumber?: string;
  /** Call defaultNumber (or caller.number) once after registration. */
  autoDial?: boolean;
  /** Change to explicitly repeat an automatic call to the same number. */
  autoDialKey?: string;
  visualization?: PhoneVisualization;
  controls?: readonly CallControl[];
  /** Answer with round buttons (default) or an iOS-style slider. */
  answerStyle?: "buttons" | "slide";
  /** Card variant only: drag the phone by its grip. */
  draggable?: boolean | PhoneDragOptions;
  /** Omit to hide attribution. Non-HTTP links render as plain text. */
  branding?: {
    name: string;
    href?: string;
  };
  /** Screen variant: safe-area insets, for example from react-native-safe-area-context. */
  insets?: SafeAreaInsets;
  /** Screen variant: tint the background during calls. Defaults to true. */
  immersive?: boolean;
  /** Shows a minimize control during calls (used by PhoneIsland). */
  onMinimize?: () => void;
}
type Phase = "settings" | "idle" | "incoming" | "call";
function ImmersiveBackground(): ReactElement {
  const theme = usePhoneTheme();
  const top = mixColors(theme.background, theme.accent, theme.appearance === "dark" ? 0.32 : 0.2);
  return /*#__PURE__*/_jsxs(Svg, {
    pointerEvents: "none",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "none",
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    children: [/*#__PURE__*/_jsx(Defs, {
      children: /*#__PURE__*/_jsxs(LinearGradient, {
        id: "azImmersive",
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1",
        children: [/*#__PURE__*/_jsx(Stop, {
          offset: "0",
          stopColor: top
        }), /*#__PURE__*/_jsx(Stop, {
          offset: "0.62",
          stopColor: theme.background
        }), /*#__PURE__*/_jsx(Stop, {
          offset: "1",
          stopColor: theme.background
        })]
      })
    }), /*#__PURE__*/_jsx(Rect, {
      x: "0",
      y: "0",
      width: "100%",
      height: "100%",
      fill: "url(#azImmersive)"
    })]
  });
}
function Segmented({
  value,
  options,
  onChange
}: {
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (value: string) => void;
}) {
  const theme = usePhoneTheme();
  return /*#__PURE__*/_jsx(View, {
    accessibilityRole: "tablist",
    style: {
      flexDirection: "row",
      padding: 3,
      borderRadius: 12,
      backgroundColor: theme.surface,
      alignSelf: "stretch"
    },
    children: options.map(option => {
      const selected = option.value === value;
      return /*#__PURE__*/_jsx(PressableScale, {
        onPress: () => onChange(option.value),
        accessibilityRole: "tab",
        accessibilityLabel: option.label,
        accessibilityState: {
          selected
        },
        scaleTo: 0.97,
        style: {
          flex: 1,
          minHeight: 36,
          borderRadius: 9,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: selected ? theme.background : "transparent",
          boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.12)" : undefined
        },
        children: /*#__PURE__*/_jsx(PhoneText, {
          size: 14,
          weight: selected ? "600" : "500",
          color: selected ? theme.foreground : theme.muted,
          children: option.label
        })
      }, option.value);
    })
  });
}

/** Compact summary of the call that just ended, shown above the keypad. */
function LastCall({
  caller,
  renderAvatar
}: {
  caller?: Caller;
  renderAvatar?: (caller: Caller) => ReactNode;
}) {
  const {
    state
  } = usePhone();
  const theme = usePhoneTheme();
  const call = state.call;
  if (!call) return null;
  const name = caller?.name || caller?.number || "Last call";
  const reason = call.endReason ?? "Call ended";
  return /*#__PURE__*/_jsxs(View, {
    accessible: true,
    accessibilityLabel: `${name}, ${reason}`,
    style: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 10,
      paddingRight: 16,
      borderRadius: 18,
      backgroundColor: theme.surface,
      alignSelf: "center",
      maxWidth: "100%"
    },
    children: [/*#__PURE__*/_jsx(Avatar, {
      caller: caller,
      size: 40,
      render: renderAvatar
    }), /*#__PURE__*/_jsxs(View, {
      style: {
        flexShrink: 1
      },
      children: [/*#__PURE__*/_jsx(PhoneText, {
        size: 15,
        weight: "600",
        numberOfLines: 1,
        children: name
      }), /*#__PURE__*/_jsxs(View, {
        style: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6
        },
        children: [/*#__PURE__*/_jsx(PhoneText, {
          size: 13,
          color: theme.muted,
          numberOfLines: 1,
          children: reason
        }), call.answeredAt ? /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx(PhoneText, {
            size: 13,
            color: theme.muted,
            children: "\xB7"
          }), /*#__PURE__*/_jsx(CallTimer, {
            size: 13
          })]
        }) : null]
      })]
    })]
  });
}
function Branding({
  branding
}: {
  branding?: {
    name: string;
    href?: string;
  };
}) {
  const theme = usePhoneTheme();
  if (!branding?.name.trim()) return null;
  const link = branding.href && /^https?:\/\//i.test(branding.href) ? branding.href : null;
  return /*#__PURE__*/_jsxs(View, {
    style: {
      flexDirection: "row",
      justifyContent: "center",
      paddingBottom: 12,
      paddingTop: 2
    },
    children: [/*#__PURE__*/_jsxs(PhoneText, {
      size: 11,
      color: theme.muted,
      children: ["Powered by", " "]
    }), link ? /*#__PURE__*/_jsx(PhoneText, {
      size: 11,
      weight: "600",
      color: theme.muted,
      accessibilityRole: "link",
      style: {
        textDecorationLine: "underline"
      },
      onPress: () => void Linking.openURL(link).catch(() => {}),
      children: branding.name
    }) : /*#__PURE__*/_jsx(PhoneText, {
      size: 11,
      weight: "600",
      color: theme.muted,
      children: branding.name
    })]
  });
}

/** A styled phone sharing the parent provider's single connection. */
export function PhoneWidget({
  theme,
  motion,
  style,
  testID,
  draggable = false,
  variant = "card",
  ...props
}: PhoneWidgetProps): ReactElement {
  const viewRef = useRef<HostInstance>(null);
  const drag = useDraggable(viewRef, variant === "card" ? draggable : false);
  const screen = variant === "screen";
  return /*#__PURE__*/_jsx(PhoneRoot, {
    theme: theme,
    motion: motion,
    testID: testID,
    style: [screen ? {
      flex: 1
    } : variant === "sheet" ? {
      alignSelf: "stretch"
    } : {
      alignSelf: "center",
      width: "100%",
      maxWidth: 400
    }, style],
    children: /*#__PURE__*/_jsx(Animated.View, {
      ref: viewRef,
      style: [screen ? {
        flex: 1
      } : null, {
        transform: drag.transform,
        zIndex: drag.dragging ? 50 : undefined
      }],
      children: /*#__PURE__*/_jsx(WidgetBody, {
        ...props,
        variant: variant,
        drag: drag
      })
    })
  });
}
function WidgetBody({
  preset = "advanced",
  features,
  variant,
  title = "Your phone",
  caller,
  resolveCaller,
  renderAvatar,
  renderTags,
  showAvatar,
  header,
  footer,
  defaultNumber = "",
  autoDial = false,
  autoDialKey,
  visualization,
  controls,
  answerStyle,
  branding,
  insets = {},
  immersive = true,
  onMinimize,
  drag
}: Omit<PhoneWidgetProps, "theme" | "motion" | "style" | "testID" | "draggable"> & {
  drag: PhoneDragHandle;
}): ReactElement {
  const {
    state
  } = usePhone();
  const theme = usePhoneTheme();
  const motion = usePhoneMotion();
  const window = useWindowDimensions();
  const screen = variant === "screen";
  const options = {
    ...phonePresets[preset],
    ...features
  };
  const prefilled = defaultNumber || caller?.number || "";
  const [number, setNumber] = useState(prefilled);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"keypad" | "recents">("keypad");
  const idle = ["idle", "ended"].includes(state.status);
  const connected = ["active", "held"].includes(state.status);
  const visual = visualization?.type ?? (options.waveform ? "waveform" : "none");
  const keypadAllowed = options.keypad && (!controls || controls.includes("keypad"));
  useAutoDial({
    number: prefilled,
    enabled: autoDial,
    requestId: autoDialKey,
    caller: caller?.number === prefilled ? caller : undefined
  });
  useEffect(() => {
    if (!connected || !keypadAllowed) setKeypadOpen(false);
  }, [connected, keypadAllowed]);
  useEffect(() => {
    setNumber(prefilled);
  }, [prefilled]);
  useEffect(() => {
    // An incoming call always takes precedence over the settings page.
    if (!idle) setSettingsOpen(false);
  }, [idle]);
  const phase: Phase = settingsOpen ? "settings" : idle ? "idle" : state.status === "incoming" ? "incoming" : "call";
  // Configure native layout animation for the commit that switches phases.
  const lastPhase = useRef(phase);
  if (lastPhase.current !== phase) {
    lastPhase.current = phase;
    animateNextLayout(motion.enabled, motion.duration);
  }
  const toggle = (fn: () => void) => {
    animateNextLayout(motion.enabled, motion.duration);
    fn();
  };
  const currentCaller = !idle ? state.call?.caller : state.status === "ended" ? state.call?.caller : caller;
  const identity = currentCaller && resolveCaller ? resolveCaller(currentCaller) : currentCaller;
  const inCall = phase === "call" || phase === "incoming";
  const large = screen;
  const orbSize = large ? 168 : 120;
  const visualNode = visual === "orb" || visual === "both" ? /*#__PURE__*/_jsx(View, {
    style: {
      margin: 6
    },
    children: /*#__PURE__*/_jsx(CallOrb, {
      size: orbSize,
      ...visualization?.orb
    })
  }) : undefined;
  const avatar = showAvatar ?? (visual === "avatar" || visual === "none" && visualization?.type === undefined || visual === "waveform" || visual === "bars");
  const audioVisual = connected && (visual === "waveform" || visual === "both") ? /*#__PURE__*/_jsx(CallWaveform, {
    ...visualization?.waveform
  }) : connected || state.status === "dialing" || state.status === "ringing" ? visual === "bars" ? /*#__PURE__*/_jsx(CallBarVisualizer, {
    height: 56,
    ...visualization?.bars
  }) : null : null;
  const settingsButton = options.audioSettings ? /*#__PURE__*/_jsx(IconButton, {
    icon: settingsOpen ? X : Settings2,
    accessibilityLabel: settingsOpen ? "Close audio settings" : "Open audio settings",
    accessibilityState: {
      expanded: settingsOpen
    },
    onPress: () => toggle(() => setSettingsOpen(!settingsOpen)),
    testID: "audio-settings-toggle"
  }) : null;
  const headerNode = header !== undefined ? header : /*#__PURE__*/_jsxs(View, {
    style: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 56,
      paddingHorizontal: screen ? 0 : 18,
      paddingRight: screen ? 0 : 8,
      borderBottomWidth: screen ? 0 : 1,
      borderBottomColor: theme.border
    },
    children: [onMinimize && !idle ? /*#__PURE__*/_jsx(IconButton, {
      icon: ChevronDown,
      accessibilityLabel: "Minimize call",
      onPress: onMinimize,
      color: theme.foreground
    }) : /*#__PURE__*/_jsx(AudioLines, {
      size: 19,
      color: theme.foreground,
      strokeWidth: 2
    }), /*#__PURE__*/_jsx(PhoneText, {
      size: 16,
      weight: "600",
      numberOfLines: 1,
      style: {
        flex: 1
      },
      accessibilityRole: "header",
      children: title
    }), /*#__PURE__*/_jsx(ConnectionStatus, {}), settingsButton]
  });

  // Fit the keypad to short phones (iPhone SE) without scrolling where possible.
  const keySize = screen ? Math.max(56, Math.min(80, (window.height - (insets.top ?? 0) - (insets.bottom ?? 0) - 330) / 5.4)) : 66;
  let body: ReactNode;
  if (phase === "settings") {
    body = /*#__PURE__*/_jsx(Appear, {
      children: /*#__PURE__*/_jsxs(View, {
        style: {
          gap: 14
        },
        children: [/*#__PURE__*/_jsx(PhoneText, {
          size: 20,
          weight: "600",
          accessibilityRole: "header",
          children: "Audio settings"
        }), /*#__PURE__*/_jsx(AudioSettings, {})]
      })
    }, "settings");
  } else if (phase === "idle") {
    const showTabs = options.recents && keypadAllowed;
    body = /*#__PURE__*/_jsxs(View, {
      style: {
        gap: 18,
        flex: screen ? 1 : undefined
      },
      children: [showTabs ? /*#__PURE__*/_jsx(Segmented, {
        value: tab,
        onChange: next => toggle(() => setTab(next as "keypad" | "recents")),
        options: [{
          value: "keypad",
          label: "Keypad"
        }, {
          value: "recents",
          label: "Recents"
        }]
      }) : null, showTabs && tab === "recents" ? /*#__PURE__*/_jsx(CallHistory, {
        onSelect: call => {
          setNumber(call.caller.number);
          toggle(() => setTab("keypad"));
        }
      }) : /*#__PURE__*/_jsxs(View, {
        style: {
          gap: 18,
          flex: screen ? 1 : undefined,
          justifyContent: screen ? "flex-end" : undefined
        },
        children: [!keypadAllowed ? /*#__PURE__*/_jsx(Appear, {
          children: /*#__PURE__*/_jsx(CallerCard, {
            caller: identity,
            showAvatar: !visualNode && avatar,
            visual: visualNode,
            renderAvatar: renderAvatar,
            renderTags: renderTags
          })
        }, state.call?.id ?? "greeting") : state.status === "ended" && state.call ? /*#__PURE__*/_jsx(Appear, {
          children: /*#__PURE__*/_jsx(LastCall, {
            caller: identity,
            renderAvatar: renderAvatar
          })
        }, state.call.id) : null, /*#__PURE__*/_jsx(Dialer, {
          value: number,
          onChange: setNumber,
          showKeypad: keypadAllowed,
          keySize: keySize,
          caller: caller && caller.number === number ? caller : undefined
        })]
      })]
    }, "idle");
  } else if (phase === "incoming") {
    body = /*#__PURE__*/_jsxs(View, {
      style: {
        gap: 28,
        flex: screen ? 1 : undefined
      },
      children: [/*#__PURE__*/_jsx(Appear, {
        style: {
          flex: screen ? 1 : undefined,
          justifyContent: screen ? "center" : undefined
        },
        children: /*#__PURE__*/_jsx(CallerCard, {
          caller: identity,
          size: large ? "large" : "regular",
          showAvatar: !visualNode && avatar,
          visual: visualNode,
          renderAvatar: renderAvatar,
          renderTags: renderTags
        })
      }), /*#__PURE__*/_jsx(IncomingCallActions, {
        answerStyle: answerStyle,
        size: screen ? 76 : 68
      })]
    }, "incoming");
  } else if (keypadOpen && connected) {
    body = /*#__PURE__*/_jsxs(View, {
      style: {
        gap: 18,
        flex: screen ? 1 : undefined,
        justifyContent: screen ? "flex-end" : undefined
      },
      children: [/*#__PURE__*/_jsxs(View, {
        style: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        },
        children: [/*#__PURE__*/_jsx(PhoneText, {
          size: 15,
          weight: "600",
          numberOfLines: 1,
          children: identity?.name || identity?.number
        }), /*#__PURE__*/_jsx(CallTimer, {})]
      }), /*#__PURE__*/_jsx(Dialer, {
        showKeypad: true,
        keySize: keySize
      }), /*#__PURE__*/_jsx(CallControls, {
        buttons: ["hangup"]
      }), /*#__PURE__*/_jsx(PressableScale, {
        onPress: () => toggle(() => setKeypadOpen(false)),
        accessibilityLabel: "Hide keypad",
        style: {
          alignSelf: "center",
          minHeight: 40,
          justifyContent: "center",
          paddingHorizontal: 16
        },
        children: /*#__PURE__*/_jsx(PhoneText, {
          size: 15,
          weight: "600",
          color: theme.accent,
          children: "Hide"
        })
      })]
    }, "dtmf");
  } else {
    body = /*#__PURE__*/_jsxs(View, {
      style: {
        gap: screen ? 20 : 18,
        flex: screen ? 1 : undefined
      },
      children: [/*#__PURE__*/_jsxs(Appear, {
        style: {
          flex: screen ? 1 : undefined,
          justifyContent: screen ? "center" : undefined,
          gap: 16
        },
        children: [/*#__PURE__*/_jsx(CallerCard, {
          caller: identity,
          size: large ? "large" : "regular",
          showAvatar: !visualNode && avatar,
          visual: visualNode,
          renderAvatar: renderAvatar,
          renderTags: renderTags
        }), audioVisual]
      }), /*#__PURE__*/_jsx(CallControls, {
        buttons: controls,
        showMute: options.mute,
        showHold: options.hold,
        showTransfer: options.transfer,
        showKeypad: keypadAllowed,
        showSpeaker: options.speaker,
        keypadOpen: keypadOpen,
        onKeypadToggle: () => toggle(() => setKeypadOpen(!keypadOpen)),
        buttonSize: screen ? 72 : 62,
        tone: screen && immersive ? "glass" : "neutral"
      })]
    }, "call");
  }
  const footerNode = footer !== undefined ? footer : screen ? null : /*#__PURE__*/_jsxs(View, {
    style: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border
    },
    children: [/*#__PURE__*/_jsx(Headphones, {
      size: 13,
      color: theme.muted
    }), /*#__PURE__*/_jsx(PhoneText, {
      size: 12,
      color: theme.muted,
      children: state.connection === "registered" ? Platform.OS === "web" ? "Audio handled by your browser" : "Audio handled by your device" : "Connect an account to make calls"
    })]
  });
  const grip = drag.enabled ? /*#__PURE__*/_jsx(View, {
    ...drag.handlers,
    accessible: true,
    accessibilityRole: "adjustable",
    accessibilityLabel: "Move phone",
    accessibilityHint: "Drag to move. Activate to reset its position.",
    accessibilityActions: [{
      name: "activate",
      label: "Reset position"
    }],
    onAccessibilityAction: drag.reset,
    style: {
      alignItems: "center",
      paddingTop: 6,
      minHeight: 24
    },
    children: /*#__PURE__*/_jsx(GripHorizontal, {
      size: 18,
      color: theme.muted
    })
  }) : null;
  if (screen) return /*#__PURE__*/_jsxs(View, {
    accessibilityLabel: title,
    style: {
      flex: 1,
      backgroundColor: theme.background,
      overflow: "hidden"
    },
    children: [immersive && inCall ? /*#__PURE__*/_jsx(ImmersiveBackground, {}) : null, /*#__PURE__*/_jsxs(View, {
      style: {
        flex: 1,
        paddingTop: (insets.top ?? 0) + 4,
        paddingBottom: (insets.bottom ?? 0) + 20,
        paddingLeft: (insets.left ?? 0) + 22,
        paddingRight: (insets.right ?? 0) + 22,
        gap: 14
      },
      children: [headerNode, /*#__PURE__*/_jsx(ErrorBanner, {}), /*#__PURE__*/_jsx(ScrollView, {
        style: {
          flex: 1
        },
        contentContainerStyle: {
          flexGrow: 1
        },
        bounces: false,
        keyboardShouldPersistTaps: "handled",
        showsVerticalScrollIndicator: false,
        children: body
      }), footerNode, /*#__PURE__*/_jsx(Branding, {
        branding: branding
      })]
    })]
  });
  if (variant === "sheet") return /*#__PURE__*/_jsxs(View, {
    accessibilityLabel: title,
    children: [headerNode, /*#__PURE__*/_jsxs(View, {
      style: {
        paddingHorizontal: 20,
        paddingTop: header === null ? 8 : 16,
        paddingBottom: 20,
        gap: 18
      },
      children: [/*#__PURE__*/_jsx(ErrorBanner, {}), body]
    }), footerNode, /*#__PURE__*/_jsx(Branding, {
      branding: branding
    })]
  });
  return /*#__PURE__*/_jsxs(View, {
    accessibilityLabel: title,
    style: {
      backgroundColor: theme.background,
      borderRadius: theme.radius,
      borderWidth: theme.appearance === "dark" ? 1 : 0,
      borderColor: theme.border,
      boxShadow: theme.appearance === "dark" ? "0 18px 50px -18px rgba(0,0,0,0.65)" : "0 12px 40px -14px rgba(16,38,26,0.28), 0 1px 4px rgba(16,38,26,0.07)",
      overflow: Platform.OS === "android" ? "hidden" : "visible"
    },
    children: [grip, headerNode, /*#__PURE__*/_jsxs(View, {
      style: {
        padding: 20,
        gap: 18
      },
      children: [/*#__PURE__*/_jsx(ErrorBanner, {}), body]
    }), footerNode, /*#__PURE__*/_jsx(Branding, {
      branding: branding
    })]
  });
}

/** All-in-one phone. For shared lines and custom layouts, use PhoneProvider + PhoneWidget. */
export interface SipPhoneProps extends Omit<PhoneProviderProps, "children">, PhoneWidgetProps {}
export function SipPhone({
  config,
  autoConnect,
  preview,
  client,
  tones,
  media,
  audioSession,
  haptics,
  refreshOnForeground,
  onEvent,
  onIncomingCall,
  onAnswered,
  onDisconnected,
  onConnectionChange,
  onError,
  ...widget
}: SipPhoneProps): ReactElement {
  return /*#__PURE__*/_jsx(PhoneProvider, {
    config: config,
    autoConnect: autoConnect,
    preview: preview,
    client: client,
    tones: tones,
    media: media,
    audioSession: audioSession,
    haptics: haptics,
    refreshOnForeground: refreshOnForeground,
    onEvent: onEvent,
    onIncomingCall: onIncomingCall,
    onAnswered: onAnswered,
    onDisconnected: onDisconnected,
    onConnectionChange: onConnectionChange,
    onError: onError,
    children: /*#__PURE__*/_jsx(PhoneWidget, {
      ...widget
    })
  });
}
