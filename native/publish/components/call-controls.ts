// Generated from src/components/call-controls.tsx. Run npm run package:build; do not edit.
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "../react-types.d.ts";
import { Animated, Easing, PanResponder, View } from "react-native";
import { ArrowRightLeft, Grid3x3, Mic, MicOff, Pause, Phone, PhoneOff, Play, Volume2, X } from "lucide-react-native";
import { usePhone } from "../react/phone-provider.ts";
import { usePhoneMotion } from "./motion.ts";
import { usePhoneTheme, withAlpha } from "./theme.ts";
import { Appear, Button, Field, IconButton, PhoneText, PulseRings, RoundButton } from "./primitives.ts";
import { action } from "./status.ts";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export type CallControl = "mute" | "keypad" | "speaker" | "hold" | "transfer" | "hangup";
export const defaultCallControls: readonly CallControl[] = ["mute", "keypad", "speaker", "hold", "transfer", "hangup"];
export interface SlideToAnswerProps {
  onAnswer: () => void;
  label?: string;
  disabled?: boolean;
}

/** iOS-style slide-to-answer track. Screen readers get a direct "Answer" action. */
export function SlideToAnswer({
  onAnswer,
  label = "slide to answer",
  disabled
}: SlideToAnswerProps): ReactElement {
  const theme = usePhoneTheme();
  const motion = usePhoneMotion();
  const [width, setWidth] = useState(0);
  const thumb = 60;
  const max = Math.max(0, width - thumb - 8);
  const x = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0.45)).current;
  const done = useRef(false);
  const latest = useRef({
    max,
    onAnswer,
    disabled
  });
  latest.current = {
    max,
    onAnswer,
    disabled
  };
  useEffect(() => {
    if (!motion.enabled) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(shimmer, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true
    }), Animated.timing(shimmer, {
      toValue: 0.45,
      duration: 900,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true
    })]));
    loop.start();
    return () => loop.stop();
  }, [motion.enabled, shimmer]);
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.disabled,
    onMoveShouldSetPanResponder: (_, g) => !latest.current.disabled && Math.abs(g.dx) > 4,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => {
      x.setValue(Math.max(0, Math.min(latest.current.max, g.dx)));
    },
    onPanResponderRelease: (_, g) => {
      const {
        max: limit
      } = latest.current;
      if (limit > 0 && (g.dx > limit * 0.78 || g.vx > 1.2) && !done.current) {
        done.current = true;
        Animated.timing(x, {
          toValue: limit,
          duration: 120,
          useNativeDriver: true
        }).start(() => latest.current.onAnswer());
      } else {
        Animated.spring(x, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8
        }).start();
      }
    }
  })).current;
  return /*#__PURE__*/_jsxs(View, {
    accessible: true,
    accessibilityRole: "button",
    accessibilityLabel: "Answer call",
    accessibilityHint: "Slide right to answer",
    accessibilityActions: [{
      name: "activate",
      label: "Answer"
    }],
    onAccessibilityAction: () => onAnswer(),
    onLayout: event => setWidth(event.nativeEvent.layout.width),
    style: {
      alignSelf: "stretch",
      height: thumb + 8,
      borderRadius: (thumb + 8) / 2,
      backgroundColor: withAlpha(theme.foreground, theme.appearance === "dark" ? 0.14 : 0.07),
      justifyContent: "center",
      padding: 4,
      opacity: disabled ? 0.5 : 1
    },
    children: [/*#__PURE__*/_jsx(Animated.View, {
      pointerEvents: "none",
      style: {
        position: "absolute",
        left: thumb + 8,
        right: 12,
        alignItems: "center",
        opacity: Animated.multiply(shimmer, x.interpolate({
          inputRange: [0, Math.max(1, max * 0.6)],
          outputRange: [1, 0],
          extrapolate: "clamp"
        }))
      },
      children: /*#__PURE__*/_jsx(PhoneText, {
        size: 17,
        weight: "500",
        color: theme.foreground,
        children: label
      })
    }), /*#__PURE__*/_jsx(Animated.View, {
      ...responder.panHandlers,
      testID: "slide-to-answer",
      style: {
        width: thumb,
        height: thumb,
        borderRadius: thumb / 2,
        backgroundColor: theme.accent,
        alignItems: "center",
        justifyContent: "center",
        transform: [{
          translateX: x
        }]
      },
      children: /*#__PURE__*/_jsx(Phone, {
        size: 26,
        color: theme.accentForeground,
        fill: theme.accentForeground,
        strokeWidth: 1.5
      })
    })]
  });
}
export interface IncomingCallActionsProps {
  /** `buttons` (default) or `slide` to answer. */
  answerStyle?: "buttons" | "slide";
  /** Text colour for captions on immersive backgrounds. */
  labelColor?: string;
  size?: number;
}

/** Decline and Answer for a ringing incoming call. */
export function IncomingCallActions({
  answerStyle = "buttons",
  labelColor,
  size = 72
}: IncomingCallActionsProps): ReactElement {
  const {
    client
  } = usePhone();
  const theme = usePhoneTheme();
  if (answerStyle === "slide") return /*#__PURE__*/_jsxs(View, {
    style: {
      alignSelf: "stretch",
      gap: 18,
      alignItems: "center"
    },
    children: [/*#__PURE__*/_jsx(SlideToAnswer, {
      onAnswer: () => action(() => client.answer())
    }), /*#__PURE__*/_jsx(RoundButton, {
      icon: PhoneOff,
      tone: "danger",
      size: 56,
      label: "Decline",
      labelColor: labelColor,
      accessibilityLabel: "Decline",
      onPress: () => client.hangup()
    })]
  });
  return /*#__PURE__*/_jsxs(View, {
    style: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignSelf: "stretch"
    },
    children: [/*#__PURE__*/_jsx(RoundButton, {
      icon: PhoneOff,
      tone: "danger",
      size: size,
      label: "Decline",
      labelColor: labelColor,
      accessibilityLabel: "Decline",
      onPress: () => client.hangup()
    }), /*#__PURE__*/_jsxs(View, {
      style: {
        alignItems: "center"
      },
      children: [/*#__PURE__*/_jsx(View, {
        style: {
          position: "absolute",
          top: 0,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center"
        },
        children: /*#__PURE__*/_jsx(PulseRings, {
          size: size,
          color: theme.accent,
          active: true,
          rings: 2,
          spread: 1.45
        })
      }), /*#__PURE__*/_jsx(RoundButton, {
        icon: Phone,
        tone: "accent",
        size: size,
        label: "Answer",
        labelColor: labelColor,
        accessibilityLabel: "Answer",
        onPress: () => action(() => client.answer())
      })]
    })]
  });
}
export interface CallControlsProps {
  /** Utility buttons follow this order. Hangup occupies its own final row. */
  buttons?: readonly CallControl[];
  showMute?: boolean;
  showHold?: boolean;
  showTransfer?: boolean;
  showKeypad?: boolean;
  /** Shown when speaker routing is available (an audio session adapter, or preview). */
  showSpeaker?: boolean;
  onKeypadToggle?: () => void;
  keypadOpen?: boolean;
  answerStyle?: "buttons" | "slide";
  /** Diameter of utility buttons; defaults to 64. */
  buttonSize?: number;
  /** Caption colour for immersive backgrounds. */
  labelColor?: string;
  /** Neutral (`surface`) or translucent `glass` utility buttons. */
  tone?: "neutral" | "glass";
}

/** Composable controls. Incoming answer/decline stay available in every preset. */
export function CallControls({
  buttons = defaultCallControls,
  showMute = true,
  showHold = true,
  showTransfer = true,
  showKeypad = true,
  showSpeaker = true,
  onKeypadToggle,
  keypadOpen,
  answerStyle,
  buttonSize = 64,
  labelColor,
  tone = "neutral"
}: CallControlsProps): ReactElement | null {
  const {
    state,
    client
  } = usePhone();
  const [transferOpen, setTransferOpen] = useState(false);
  const connected = ["active", "held"].includes(state.status);
  const outgoing = ["requesting-microphone", "dialing", "ringing"].includes(state.status);
  const speakerAvailable = showSpeaker && client.capabilities.speaker;
  const available = Array.from(new Set(buttons)).filter(button => button === "mute" ? showMute : button === "hold" ? showHold : button === "transfer" ? showTransfer : button === "keypad" ? showKeypad && Boolean(onKeypadToggle) : button === "speaker" ? speakerAvailable : true);
  const transferAvailable = available.includes("transfer");
  useEffect(() => {
    if (!connected || !transferAvailable) setTransferOpen(false);
  }, [connected, transferAvailable]);
  if (["idle", "ended"].includes(state.status)) return null;
  if (state.status === "incoming") return /*#__PURE__*/_jsx(IncomingCallActions, {
    answerStyle: answerStyle,
    labelColor: labelColor
  });
  // Speaker is useful while the other side is still ringing; the rest need media.
  const utilities = available.filter(button => button !== "hangup" && (connected || outgoing && button === "speaker"));
  if (!available.length) return null;
  const rows: CallControl[][] = [];
  for (let i = 0; i < utilities.length; i += 3) rows.push(utilities.slice(i, i + 3));
  const render = (button: CallControl) => {
    if (button === "mute") return /*#__PURE__*/_jsx(RoundButton, {
      icon: state.muted ? MicOff : Mic,
      label: state.muted ? "Unmute" : "Mute",
      accessibilityLabel: state.muted ? "Unmute" : "Mute",
      selected: state.muted,
      tone: tone,
      size: buttonSize,
      labelColor: labelColor,
      onPress: () => client.setMuted(!state.muted)
    }, button);
    if (button === "keypad") return /*#__PURE__*/_jsx(RoundButton, {
      icon: Grid3x3,
      label: "Keypad",
      accessibilityLabel: keypadOpen ? "Hide keypad" : "Keypad",
      expanded: Boolean(keypadOpen),
      selected: Boolean(keypadOpen),
      tone: tone,
      size: buttonSize,
      labelColor: labelColor,
      onPress: onKeypadToggle
    }, button);
    if (button === "speaker") return /*#__PURE__*/_jsx(RoundButton, {
      icon: Volume2,
      label: "Speaker",
      accessibilityLabel: "Speaker",
      selected: state.speaker,
      tone: tone,
      size: buttonSize,
      labelColor: labelColor,
      onPress: () => action(() => client.setSpeaker(!state.speaker))
    }, button);
    if (button === "hold") return /*#__PURE__*/_jsx(RoundButton, {
      icon: state.status === "held" ? Play : Pause,
      label: state.status === "held" ? "Resume" : "Hold",
      accessibilityLabel: state.status === "held" ? "Resume" : "Hold",
      selected: state.status === "held",
      disabled: state.transferPending,
      tone: tone,
      size: buttonSize,
      labelColor: labelColor,
      onPress: () => action(() => client.setHeld(state.status !== "held"))
    }, button);
    return /*#__PURE__*/_jsx(RoundButton, {
      icon: ArrowRightLeft,
      label: "Transfer",
      accessibilityLabel: "Transfer",
      expanded: transferOpen,
      selected: transferOpen,
      tone: tone,
      size: buttonSize,
      labelColor: labelColor,
      onPress: () => setTransferOpen(!transferOpen)
    }, button);
  };
  return /*#__PURE__*/_jsxs(View, {
    style: {
      alignSelf: "stretch",
      gap: 20,
      alignItems: "center"
    },
    children: [transferOpen && transferAvailable ? /*#__PURE__*/_jsx(Appear, {
      style: {
        alignSelf: "stretch"
      },
      children: /*#__PURE__*/_jsx(TransferPanel, {
        onClose: () => setTransferOpen(false)
      })
    }) : rows.map((row, i) => /*#__PURE__*/_jsx(View, {
      style: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignSelf: "stretch"
      },
      children: row.map(render)
    }, i)), available.includes("hangup") ? /*#__PURE__*/_jsx(RoundButton, {
      icon: PhoneOff,
      tone: "danger",
      size: Math.max(64, buttonSize + 8),
      accessibilityLabel: connected ? "End call" : "Cancel call",
      onPress: () => client.hangup(),
      testID: "hangup"
    }) : null]
  });
}

/** A composable blind-transfer form; keeps the current call until success is confirmed. */
export function TransferPanel({
  onClose
}: {
  onClose?: () => void;
}): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const theme = usePhoneTheme();
  const [target, setTarget] = useState("");
  const submit = () => action(() => client.transfer(target));
  const disabled = !target.trim() || state.transferPending || !["active", "held"].includes(state.status);
  return /*#__PURE__*/_jsxs(View, {
    style: {
      alignSelf: "stretch",
      gap: 12,
      padding: 16,
      borderRadius: 18,
      backgroundColor: theme.surface
    },
    children: [/*#__PURE__*/_jsxs(View, {
      style: {
        flexDirection: "row",
        alignItems: "center"
      },
      children: [/*#__PURE__*/_jsxs(View, {
        style: {
          flex: 1,
          gap: 2
        },
        children: [/*#__PURE__*/_jsx(PhoneText, {
          size: 17,
          weight: "600",
          accessibilityRole: "header",
          children: "Transfer call"
        }), /*#__PURE__*/_jsx(PhoneText, {
          size: 13,
          color: theme.muted,
          children: "Send this call directly to another number."
        })]
      }), onClose ? /*#__PURE__*/_jsx(IconButton, {
        icon: X,
        accessibilityLabel: "Close transfer",
        onPress: onClose
      }) : null]
    }), /*#__PURE__*/_jsx(Field, {
      label: "Destination",
      value: target,
      onChangeText: setTarget,
      placeholder: "Extension or SIP address",
      keyboardType: "phone-pad",
      autoCapitalize: "none",
      autoCorrect: false,
      returnKeyType: "send",
      onSubmitEditing: () => !disabled && submit(),
      editable: !state.transferPending,
      autoFocus: true
    }), /*#__PURE__*/_jsx(Button, {
      label: state.transferPending ? "Transferring…" : "Transfer",
      icon: ArrowRightLeft,
      disabled: disabled,
      onPress: submit
    })]
  });
}
