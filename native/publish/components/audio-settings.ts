// Generated from src/components/audio-settings.tsx. Run npm run package:build; do not edit.
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "../react-types.d.ts";
import { PanResponder, Platform, View } from "react-native";
import { Check, Headphones, Mic, Settings, Volume1, Volume2 } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.ts";
import { usePhoneTheme } from "./theme.ts";
import { Button, Divider, PhoneText, PressableScale, type PhoneIcon } from "./primitives.ts";
import { action } from "./status.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  accessibilityLabel?: string;
  step?: number;
}

/** Touch slider (0–1) with adjustable accessibility actions. */
export function VolumeSlider({
  value,
  onChange,
  accessibilityLabel = "Call volume",
  step = 0.05
}: VolumeSliderProps): ReactElement {
  const theme = usePhoneTheme();
  const [width, setWidth] = useState(0);
  const latest = useRef({
    width,
    onChange
  });
  latest.current = {
    width,
    onChange
  };
  const set = (x: number) => {
    const w = latest.current.width;
    if (w > 0) latest.current.onChange(Math.max(0, Math.min(1, x / w)));
  };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => set(event.nativeEvent.locationX),
    onPanResponderMove: event => set(event.nativeEvent.locationX)
  })).current;
  const safe = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const percent = Math.round(safe * 100);
  return /*#__PURE__*/_jsxs(View, {
    accessible: true,
    accessibilityRole: "adjustable",
    accessibilityLabel: accessibilityLabel,
    accessibilityValue: {
      min: 0,
      max: 100,
      now: percent,
      text: `${percent}%`
    },
    ...(Platform.OS === "web" ? {
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": percent,
      "aria-valuetext": `${percent}%`
    } : {}),
    accessibilityActions: [{
      name: "increment"
    }, {
      name: "decrement"
    }],
    onAccessibilityAction: event => {
      const delta = event.nativeEvent.actionName === "increment" ? step : -step;
      onChange(Math.max(0, Math.min(1, Math.round((safe + delta) * 100) / 100)));
    },
    onLayout: event => setWidth(event.nativeEvent.layout.width),
    ...responder.panHandlers,
    style: {
      height: 36,
      justifyContent: "center"
    },
    children: [/*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: {
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.border
      },
      children: /*#__PURE__*/_jsx(View, {
        style: {
          width: `${percent}%`,
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.accent
        }
      })
    }), /*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: {
        position: "absolute",
        left: Math.max(0, safe * width - 13),
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)"
      }
    })]
  });
}
function Section({
  icon: Icon,
  title,
  children
}: {
  icon: PhoneIcon;
  title: string;
  children: ReactElement | ReactElement[] | null;
}) {
  const theme = usePhoneTheme();
  return /*#__PURE__*/_jsxs(View, {
    style: {
      gap: 10
    },
    children: [/*#__PURE__*/_jsxs(View, {
      style: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
      },
      children: [/*#__PURE__*/_jsx(Icon, {
        size: 16,
        color: theme.muted,
        strokeWidth: 2
      }), /*#__PURE__*/_jsx(PhoneText, {
        size: 13,
        weight: "700",
        color: theme.muted,
        style: {
          letterSpacing: 0.4,
          textTransform: "uppercase"
        },
        accessibilityRole: "header",
        children: title
      })]
    }), children]
  });
}
function Option({
  label,
  selected,
  onPress,
  disabled
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = usePhoneTheme();
  return /*#__PURE__*/_jsxs(PressableScale, {
    onPress: onPress,
    disabled: disabled,
    accessibilityRole: "radio",
    accessibilityLabel: label,
    accessibilityState: {
      checked: selected
    },
    scaleTo: 0.98,
    style: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 46,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: selected ? theme.accentSoft : "transparent"
    },
    children: [/*#__PURE__*/_jsx(PhoneText, {
      size: 15,
      weight: selected ? "600" : "400",
      color: selected ? theme.accent : theme.foreground,
      style: {
        flex: 1
      },
      numberOfLines: 1,
      children: label
    }), selected ? /*#__PURE__*/_jsx(Check, {
      size: 18,
      color: theme.accent
    }) : null]
  });
}

/** Microphone access, device choice (web), speaker routing status, and volume. */
export function AudioSettings(): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const theme = usePhoneTheme();
  const capabilities = client.capabilities;
  const [devices, setDevices] = useState<Array<{
    deviceId: string;
    kind: string;
    label: string;
  }>>([]);
  const busy = !["idle", "ended"].includes(state.status);
  useEffect(() => {
    if (!capabilities.inputSelection) return;
    let live = true;
    const update = () => {
      void client.listDevices().then(items => {
        if (live) setDevices(items);
      });
    };
    update();
    const unsubscribe = client.onDeviceChange(update);
    return () => {
      live = false;
      unsubscribe();
    };
  }, [client, capabilities.inputSelection, state.microphone]);
  const inputs = devices.filter(d => d.kind === "audioinput" && d.deviceId);
  const outputs = devices.filter(d => d.kind === "audiooutput" && d.deviceId);
  const micLabel = state.microphone === "requesting" ? "Waiting for permission…" : state.microphone === "granted" ? "Microphone ready · test again" : "Check microphone access";
  return /*#__PURE__*/_jsxs(View, {
    style: {
      gap: 20,
      alignSelf: "stretch"
    },
    children: [/*#__PURE__*/_jsx(Section, {
      icon: Mic,
      title: "Microphone",
      children: /*#__PURE__*/_jsxs(View, {
        style: {
          gap: 10
        },
        children: [/*#__PURE__*/_jsx(PhoneText, {
          size: 14,
          color: theme.muted,
          children: state.microphone === "blocked" ? "Access is turned off in system settings." : state.microphone === "denied" ? "Access was denied. You can allow it and try again." : state.microphone === "granted" ? "This app can use your microphone during calls." : "The microphone is used only while you are on a call."
        }), /*#__PURE__*/_jsx(Button, {
          label: micLabel,
          icon: state.microphone === "granted" ? Check : Mic,
          tone: "secondary",
          disabled: busy || state.microphone === "requesting",
          onPress: () => action(() => client.testMicrophone())
        }), (state.microphone === "blocked" || state.microphone === "denied") && capabilities.settings ? /*#__PURE__*/_jsx(Button, {
          label: "Open Settings",
          icon: Settings,
          tone: "ghost",
          onPress: () => action(() => client.openSettings())
        }) : null, capabilities.inputSelection && inputs.length > 0 ? /*#__PURE__*/_jsxs(View, {
          accessibilityRole: "radiogroup",
          accessibilityLabel: "Microphone",
          style: {
            gap: 2
          },
          children: [/*#__PURE__*/_jsx(Option, {
            label: "System default",
            selected: !state.inputDeviceId,
            disabled: busy,
            onPress: () => action(() => client.setInputDevice(""))
          }), inputs.map((device, i) => /*#__PURE__*/_jsx(Option, {
            label: device.label || `Microphone ${i + 1}`,
            selected: state.inputDeviceId === device.deviceId,
            disabled: busy,
            onPress: () => action(() => client.setInputDevice(device.deviceId))
          }, device.deviceId))]
        }) : null]
      })
    }), /*#__PURE__*/_jsx(Divider, {}), /*#__PURE__*/_jsx(Section, {
      icon: Headphones,
      title: "Output",
      children: capabilities.outputSelection && outputs.length > 0 ? /*#__PURE__*/_jsxs(View, {
        accessibilityRole: "radiogroup",
        accessibilityLabel: "Speakers",
        style: {
          gap: 2
        },
        children: [/*#__PURE__*/_jsx(Option, {
          label: "System default",
          selected: !state.outputDeviceId,
          onPress: () => action(() => client.setOutputDevice(""))
        }), outputs.map((device, i) => /*#__PURE__*/_jsx(Option, {
          label: device.label || `Speaker ${i + 1}`,
          selected: state.outputDeviceId === device.deviceId,
          onPress: () => action(() => client.setOutputDevice(device.deviceId))
        }, device.deviceId))]
      }) : /*#__PURE__*/_jsx(PhoneText, {
        size: 14,
        color: theme.muted,
        children: capabilities.speaker ? "Use the Speaker button during a call to switch between earpiece and loudspeaker." : client.platform === "web" ? "Audio plays through your system's default output." : "Audio follows the system route. Add an audio session adapter to enable the Speaker button."
      })
    }), /*#__PURE__*/_jsx(Divider, {}), /*#__PURE__*/_jsx(Section, {
      icon: Volume2,
      title: "Call volume",
      children: /*#__PURE__*/_jsxs(View, {
        style: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12
        },
        children: [/*#__PURE__*/_jsx(Volume1, {
          size: 18,
          color: theme.muted
        }), /*#__PURE__*/_jsx(View, {
          style: {
            flex: 1
          },
          children: /*#__PURE__*/_jsx(VolumeSlider, {
            value: state.volume,
            onChange: v => client.setVolume(v)
          })
        }), /*#__PURE__*/_jsx(PhoneText, {
          size: 14,
          weight: "600",
          color: theme.muted,
          style: {
            width: 44,
            textAlign: "right",
            fontVariant: ["tabular-nums"]
          },
          children: `${Math.round(state.volume * 100)}%`
        })]
      })
    }), /*#__PURE__*/_jsx(PhoneText, {
      size: 12,
      color: theme.muted,
      children: "Microphone changes apply to your next call."
    })]
  });
}
