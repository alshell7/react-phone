// Generated from src/components/controls.tsx. Run npm run package:build; do not edit.
"use client";

import { useEffect, useId, useState } from "react";
import type { ReactElement, ReactNode } from "../react-types.d.ts";
import { ArrowUpRight, AudioLines, Check, ChevronRight, Delete, Headphones, Mic, MicOff, Pause, Phone, PhoneIncoming, PhoneOff, Play, Volume2, X } from "lucide-react";
import { usePhone } from "../react/phone-provider.ts";
import { formatDuration } from "../core/validation.ts";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import type { Caller, SipConfig } from "../core/types.ts";

/** Executes an action whose error is already available through state.error. */
function action(fn: () => void | Promise<void>): void {
  try {
    void Promise.resolve(fn()).catch(() => {});
  } catch {
    /* ErrorBanner renders client errors. */
  }
}
export function ConnectionStatus(): ReactElement {
  const {
    state,
    preview
  } = usePhone();
  const labels = {
    disconnected: "Not connected",
    connecting: "Connecting",
    registered: preview ? "Preview mode" : "Ready for calls",
    reconnecting: "Reconnecting",
    error: "Connection failed"
  };
  return /*#__PURE__*/_jsxs("span", {
    className: "az-status",
    "data-status": state.connection,
    role: "status",
    children: [/*#__PURE__*/_jsx("span", {
      className: "az-status-dot"
    }), labels[state.connection]]
  });
}
export function ErrorBanner(): ReactElement | null {
  const {
    state,
    client
  } = usePhone();
  if (!state.error && !state.playbackBlocked) return null;
  return /*#__PURE__*/_jsxs("div", {
    className: "az-notices",
    children: [state.error && /*#__PURE__*/_jsxs("div", {
      className: "az-error",
      role: "alert",
      children: [/*#__PURE__*/_jsx("span", {
        children: state.error.message
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "az-icon",
        "aria-label": "Dismiss error",
        onClick: () => client.clearError(),
        children: /*#__PURE__*/_jsx(X, {
          size: 16
        })
      })]
    }), state.playbackBlocked && /*#__PURE__*/_jsxs("button", {
      type: "button",
      className: "az-audio-recovery",
      onClick: () => action(() => client.playAudio()),
      children: [/*#__PURE__*/_jsx(Volume2, {
        size: 17
      }), "Enable call audio", /*#__PURE__*/_jsx(ChevronRight, {
        size: 16
      })]
    })]
  });
}
export interface CallerCardProps {
  caller?: Caller;
  showAvatar?: boolean;
  renderAvatar?: (caller: Caller) => ReactNode;
  renderTags?: (caller: Caller) => ReactNode;
}

/** Display supplied identity or the active SIP caller; slots accept your own UI. */
export function CallerCard({
  caller: supplied,
  renderAvatar,
  renderTags,
  showAvatar = true
}: CallerCardProps): ReactElement {
  const {
    state
  } = usePhone();
  const caller = supplied ?? state.call?.caller;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const busy = !["idle", "ended"].includes(state.status);
  const initials = (caller?.name || caller?.number || "").split(/\s+/).map(part => part[0]).slice(0, 2).join("");
  const status = {
    idle: "Ready to connect",
    "requesting-microphone": "Waiting for microphone…",
    dialing: "Calling…",
    ringing: "Ringing…",
    incoming: "Incoming call",
    answering: "Answering…",
    active: state.remoteHeld ? "Caller put you on hold" : "Connected",
    held: "On hold",
    ended: state.call?.endReason ?? "Call ended"
  }[state.status];
  return /*#__PURE__*/_jsxs("div", {
    className: "az-caller",
    "data-idle": state.status === "idle" && !caller,
    "data-avatar": showAvatar,
    children: [showAvatar && /*#__PURE__*/_jsx("div", {
      className: "az-avatar",
      "data-active": state.status === "active",
      children: caller && renderAvatar ? renderAvatar(caller) : caller?.avatarUrl && failedImage !== caller.avatarUrl ? /*#__PURE__*/_jsx("img", {
        src: caller.avatarUrl,
        alt: "",
        onError: () => setFailedImage(caller.avatarUrl ?? null)
      }) : initials ? /*#__PURE__*/_jsx("span", {
        children: initials
      }) : /*#__PURE__*/_jsx(AudioLines, {
        size: 34,
        strokeWidth: 1.6
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: "az-caller-copy",
      children: [/*#__PURE__*/_jsx("h3", {
        children: caller?.name || caller?.number || "Ready when you are"
      }), /*#__PURE__*/_jsx("p", {
        children: caller?.name ? caller.number : busy ? "" : "Dial a number. Make a connection."
      })]
    }), caller && (renderTags ? renderTags(caller) : caller.tags?.length ? /*#__PURE__*/_jsx("div", {
      className: "az-tags",
      children: caller.tags.map((tag, i) => /*#__PURE__*/_jsx("span", {
        children: tag
      }, `${tag}-${i}`))
    }) : null), state.status !== "idle" && /*#__PURE__*/_jsxs("div", {
      className: "az-call-status",
      role: "status",
      children: [busy && /*#__PURE__*/_jsx("span", {
        className: "az-status-dot"
      }), status, state.call?.answeredAt && /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx("span", {
          className: "az-status-separator",
          children: "·"
        }), /*#__PURE__*/_jsx(CallTimer, {})]
      })]
    })]
  });
}
export function CallTimer(): ReactElement {
  const {
    state
  } = usePhone();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!state.call?.answeredAt || state.call.endedAt) return;
    const timer = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(timer);
  }, [state.call?.answeredAt, state.call?.endedAt]);
  const seconds = state.call?.answeredAt ? ((state.call.endedAt ?? Date.now()) - state.call.answeredAt) / 1000 : 0;
  return /*#__PURE__*/_jsx("time", {
    className: "az-timer",
    "aria-label": `Call duration ${formatDuration(seconds)}`,
    children: formatDuration(seconds)
  });
}
export interface DialerProps {
  value?: string;
  onChange?: (value: string) => void;
  showKeypad?: boolean;
  caller?: Partial<Caller>;
}

/** Standalone dial input and keypad. During a connected call, keys send DTMF. */
export function Dialer({
  value: controlled,
  onChange,
  showKeypad = true,
  caller
}: DialerProps): ReactElement {
  const [localValue, setLocalValue] = useState("");
  const value = controlled ?? localValue;
  const update = (next: string) => {
    setLocalValue(next);
    onChange?.(next);
  };
  const {
    state,
    client
  } = usePhone();
  const id = useId();
  const inCall = ["active", "held"].includes(state.status);
  const canDial = ["idle", "ended"].includes(state.status);
  return /*#__PURE__*/_jsxs("div", {
    className: "az-dialer",
    children: [!inCall && /*#__PURE__*/_jsxs("form", {
      className: "az-number-form",
      onSubmit: event => {
        event.preventDefault();
        action(() => client.call(value, caller));
      },
      children: [/*#__PURE__*/_jsx("label", {
        className: "az-sr-only",
        htmlFor: id,
        children: "Phone number or SIP address"
      }), /*#__PURE__*/_jsxs("div", {
        className: "az-number-input",
        children: [/*#__PURE__*/_jsx("input", {
          id: id,
          type: "text",
          inputMode: "tel",
          autoComplete: "off",
          placeholder: "Enter a number",
          value: value,
          maxLength: 160,
          disabled: !canDial,
          onChange: event => update(event.target.value)
        }), /*#__PURE__*/_jsx("button", {
          className: "az-icon",
          type: "button",
          "aria-label": "Delete last digit",
          disabled: !value || !canDial,
          onClick: () => update(value.slice(0, -1)),
          children: /*#__PURE__*/_jsx(Delete, {
            size: 19
          })
        })]
      }), !showKeypad && /*#__PURE__*/_jsxs("button", {
        type: "submit",
        className: "az-button az-primary",
        disabled: !value.trim() || !canDial || state.connection !== "registered",
        children: [/*#__PURE__*/_jsx(Phone, {
          size: 18
        }), "Call"]
      })]
    }), showKeypad && /*#__PURE__*/_jsx("div", {
      className: "az-keypad",
      "aria-label": inCall ? "In-call keypad" : "Dial pad",
      children: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit, i) => /*#__PURE__*/_jsxs("button", {
        type: "button",
        "aria-label": digit,
        disabled: !canDial && !inCall,
        onClick: () => {
          if (inCall) action(() => client.sendDTMF(digit));else {
            client.playKeypadTone(digit);
            update(value + digit);
          }
        },
        children: [/*#__PURE__*/_jsx("span", {
          children: digit
        }), /*#__PURE__*/_jsx("small", {
          children: ["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ", "", "+", ""][i]
        })]
      }, digit))
    }), showKeypad && canDial && /*#__PURE__*/_jsxs("button", {
      type: "button",
      className: "az-button az-primary az-dial-button",
      disabled: !value.trim() || state.connection !== "registered",
      onClick: () => action(() => client.call(value, caller)),
      children: [/*#__PURE__*/_jsx(Phone, {
        size: 19
      }), "Start call", /*#__PURE__*/_jsx("kbd", {
        children: "↵"
      })]
    })]
  });
}
export type CallControl = "mute" | "keypad" | "hold" | "transfer" | "hangup";
export const defaultCallControls: readonly CallControl[] = ["mute", "keypad", "hold", "transfer", "hangup"];
export interface CallControlsProps {
  /** Utility buttons follow this order. Hangup occupies its own final row. */
  buttons?: readonly CallControl[];
  showMute?: boolean;
  showHold?: boolean;
  showTransfer?: boolean;
  showKeypad?: boolean;
  onKeypadToggle?: () => void;
  keypadOpen?: boolean;
}

/** Composable controls. Incoming answer/decline stay available in every preset. */
export function CallControls({
  buttons = defaultCallControls,
  showMute = true,
  showHold = true,
  showTransfer = true,
  showKeypad = true,
  onKeypadToggle,
  keypadOpen
}: CallControlsProps): ReactElement | null {
  const {
    state,
    client
  } = usePhone();
  const [transferOpen, setTransferOpen] = useState(false);
  const connected = ["active", "held"].includes(state.status);
  const available = Array.from(new Set(buttons)).filter(button => button === "mute" ? showMute : button === "hold" ? showHold : button === "transfer" ? showTransfer : button === "keypad" ? showKeypad && Boolean(onKeypadToggle) : true);
  const transferAvailable = available.includes("transfer");
  useEffect(() => {
    if (!connected || !transferAvailable) setTransferOpen(false);
  }, [connected, transferAvailable]);
  if (["idle", "ended"].includes(state.status)) return null;
  if (state.status === "incoming") return /*#__PURE__*/_jsxs("div", {
    className: "az-incoming-actions",
    children: [/*#__PURE__*/_jsxs("button", {
      className: "az-button az-decline",
      type: "button",
      onClick: () => client.hangup(),
      children: [/*#__PURE__*/_jsx(PhoneOff, {
        size: 19
      }), "Decline"]
    }), /*#__PURE__*/_jsxs("button", {
      className: "az-button az-primary",
      type: "button",
      onClick: () => action(() => client.answer()),
      children: [/*#__PURE__*/_jsx(PhoneIncoming, {
        size: 19
      }), "Answer"]
    })]
  });
  const utilities = available.filter(button => button !== "hangup");
  if (!available.length) return null;
  return /*#__PURE__*/_jsxs("div", {
    className: "az-call-controls",
    "data-controls": available.join(","),
    children: [connected && utilities.length > 0 && /*#__PURE__*/_jsx("div", {
      className: "az-control-row",
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(" + Math.min(utilities.length, 4) + ", minmax(0, 1fr))"
      },
      children: utilities.map(button => {
        if (button === "mute") return /*#__PURE__*/_jsxs("button", {
          type: "button",
          className: "az-control",
          "aria-pressed": state.muted,
          onClick: () => client.setMuted(!state.muted),
          children: [state.muted ? /*#__PURE__*/_jsx(MicOff, {
            size: 21
          }) : /*#__PURE__*/_jsx(Mic, {
            size: 21
          }), /*#__PURE__*/_jsx("span", {
            children: state.muted ? "Unmute" : "Mute"
          })]
        }, button);
        if (button === "keypad") return /*#__PURE__*/_jsxs("button", {
          type: "button",
          className: "az-control",
          "aria-expanded": keypadOpen,
          onClick: onKeypadToggle,
          children: [/*#__PURE__*/_jsx("span", {
            className: "az-keypad-icon",
            "aria-hidden": "true",
            children: Array.from({
              length: 9
            }, (_, i) => /*#__PURE__*/_jsx("i", {}, i))
          }), /*#__PURE__*/_jsx("span", {
            children: "Keypad"
          })]
        }, button);
        if (button === "hold") return /*#__PURE__*/_jsxs("button", {
          type: "button",
          className: "az-control",
          "aria-pressed": state.status === "held",
          disabled: state.transferPending,
          onClick: () => action(() => client.setHeld(state.status !== "held")),
          children: [state.status === "held" ? /*#__PURE__*/_jsx(Play, {
            size: 21
          }) : /*#__PURE__*/_jsx(Pause, {
            size: 21
          }), /*#__PURE__*/_jsx("span", {
            children: state.status === "held" ? "Resume" : "Hold"
          })]
        }, button);
        return /*#__PURE__*/_jsxs("button", {
          type: "button",
          className: "az-control",
          "aria-expanded": transferOpen,
          onClick: () => setTransferOpen(!transferOpen),
          children: [/*#__PURE__*/_jsx(ArrowUpRight, {
            size: 21
          }), /*#__PURE__*/_jsx("span", {
            children: "Transfer"
          })]
        }, button);
      })
    }), transferOpen && transferAvailable && /*#__PURE__*/_jsx(TransferPanel, {
      onClose: () => setTransferOpen(false)
    }), available.includes("hangup") && /*#__PURE__*/_jsxs("button", {
      className: "az-button az-danger",
      type: "button",
      onClick: () => client.hangup(),
      children: [/*#__PURE__*/_jsx(PhoneOff, {
        size: 19
      }), connected ? "End call" : "Cancel call"]
    })]
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
  const [target, setTarget] = useState("");
  const id = useId();
  return /*#__PURE__*/_jsxs("form", {
    className: "az-transfer",
    onSubmit: event => {
      event.preventDefault();
      action(() => client.transfer(target));
    },
    children: [/*#__PURE__*/_jsxs("div", {
      className: "az-row",
      children: [/*#__PURE__*/_jsx("label", {
        htmlFor: id,
        children: "Transfer call"
      }), onClose && /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "az-icon",
        "aria-label": "Close transfer",
        onClick: onClose,
        children: /*#__PURE__*/_jsx(X, {
          size: 16
        })
      })]
    }), /*#__PURE__*/_jsx("p", {
      children: "Send this call directly to another number."
    }), /*#__PURE__*/_jsxs("div", {
      className: "az-row",
      children: [/*#__PURE__*/_jsx("input", {
        id: id,
        value: target,
        inputMode: "tel",
        placeholder: "Extension or SIP address",
        onChange: event => setTarget(event.target.value),
        disabled: state.transferPending
      }), /*#__PURE__*/_jsx("button", {
        type: "submit",
        className: "az-button az-primary",
        disabled: !target || state.transferPending || !["active", "held"].includes(state.status),
        children: state.transferPending ? "Transferring…" : "Transfer"
      })]
    })]
  });
}
export interface ConnectionFormProps {
  defaultValues?: Partial<SipConfig>;
  onConnected?: () => void;
}

/** Credentials are never persisted. Password is cleared after a successful registration. */
export function ConnectionForm({
  defaultValues = {},
  onConnected
}: ConnectionFormProps): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const [username, setUsername] = useState(defaultValues.authorizationUsername ?? "");
  const [password, setPassword] = useState("");
  const [uri, setUri] = useState(defaultValues.uri ?? "");
  const [server, setServer] = useState(defaultValues.websocketUrl ?? "");
  const [iceUrl, setIceUrl] = useState("");
  const [turnUsername, setTurnUsername] = useState("");
  const [turnPassword, setTurnPassword] = useState("");
  const id = useId();
  const pending = ["connecting", "reconnecting"].includes(state.connection);
  return /*#__PURE__*/_jsxs("form", {
    className: "az-connection-form",
    onSubmit: event => {
      event.preventDefault();
      action(async () => {
        await client.connect({
          ...defaultValues,
          websocketUrl: server,
          uri,
          authorizationUsername: username,
          password,
          iceServers: iceUrl ? [{
            urls: iceUrl,
            ...(turnUsername ? {
              username: turnUsername,
              credential: turnPassword
            } : {})
          }] : defaultValues.iceServers
        });
        if (client.getSnapshot().connection === "registered") {
          setPassword("");
          setTurnPassword("");
          onConnected?.();
        }
      });
    },
    children: [/*#__PURE__*/_jsx("label", {
      htmlFor: `${id}-user`,
      children: "Username"
    }), /*#__PURE__*/_jsx("input", {
      id: `${id}-user`,
      value: username,
      onChange: event => setUsername(event.target.value),
      autoComplete: "username",
      placeholder: "Your SIP username",
      required: true,
      disabled: pending
    }), /*#__PURE__*/_jsx("label", {
      htmlFor: `${id}-password`,
      children: "Password"
    }), /*#__PURE__*/_jsx("input", {
      id: `${id}-password`,
      type: "password",
      value: password,
      onChange: event => setPassword(event.target.value),
      autoComplete: "current-password",
      placeholder: "Enter your SIP password",
      required: true,
      disabled: pending
    }), /*#__PURE__*/_jsxs("details", {
      open: !uri || !server || undefined,
      children: [/*#__PURE__*/_jsx("summary", {
        children: "Server & network settings"
      }), /*#__PURE__*/_jsxs("div", {
        className: "az-server-fields",
        children: [/*#__PURE__*/_jsx("label", {
          htmlFor: `${id}-uri`,
          children: "SIP address"
        }), /*#__PURE__*/_jsx("input", {
          id: `${id}-uri`,
          value: uri,
          onChange: event => setUri(event.target.value),
          placeholder: "sip:7002@pbx.example.com",
          required: true,
          disabled: pending
        }), /*#__PURE__*/_jsx("p", {
          children: "The extension in this address can differ from your username."
        }), /*#__PURE__*/_jsx("label", {
          htmlFor: `${id}-server`,
          children: "WebSocket server"
        }), /*#__PURE__*/_jsx("input", {
          id: `${id}-server`,
          value: server,
          onChange: event => setServer(event.target.value),
          placeholder: "wss://pbx.example.com/ws",
          required: true,
          disabled: pending
        }), /*#__PURE__*/_jsxs("label", {
          htmlFor: `${id}-ice`,
          children: ["STUN / TURN server ", /*#__PURE__*/_jsx("small", {
            children: "Optional"
          })]
        }), /*#__PURE__*/_jsx("input", {
          id: `${id}-ice`,
          value: iceUrl,
          onChange: event => setIceUrl(event.target.value),
          placeholder: "turn:relay.example.com:3478",
          disabled: pending
        }), iceUrl.startsWith("turn") && /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx("label", {
            htmlFor: `${id}-turn-user`,
            children: "TURN username"
          }), /*#__PURE__*/_jsx("input", {
            id: `${id}-turn-user`,
            value: turnUsername,
            onChange: event => setTurnUsername(event.target.value),
            disabled: pending
          }), /*#__PURE__*/_jsx("label", {
            htmlFor: `${id}-turn-password`,
            children: "TURN password"
          }), /*#__PURE__*/_jsx("input", {
            id: `${id}-turn-password`,
            type: "password",
            value: turnPassword,
            onChange: event => setTurnPassword(event.target.value),
            disabled: pending
          })]
        })]
      })]
    }), /*#__PURE__*/_jsxs("button", {
      type: "submit",
      className: "az-button az-primary",
      disabled: pending,
      children: [/*#__PURE__*/_jsx(Phone, {
        size: 17
      }), pending ? "Connecting…" : "Connect account"]
    }), pending && /*#__PURE__*/_jsx("button", {
      type: "button",
      className: "az-button az-secondary",
      onClick: () => client.disconnect(),
      children: "Cancel connection"
    }), /*#__PURE__*/_jsxs("p", {
      className: "az-privacy",
      children: [/*#__PURE__*/_jsx(Check, {
        size: 14
      }), "Credentials stay in this session."]
    })]
  });
}

/** Device selection, microphone preflight, and playback volume with capability detection. */
export function AudioSettings(): ReactElement {
  const {
    state,
    client
  } = usePhone();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const id = useId();
  const busy = !["idle", "ended"].includes(state.status);
  useEffect(() => {
    let live = true;
    const update = () => {
      void navigator.mediaDevices?.enumerateDevices().then(items => {
        if (live) setDevices(items);
      }).catch(() => {});
    };
    update();
    navigator.mediaDevices?.addEventListener("devicechange", update);
    return () => {
      live = false;
      navigator.mediaDevices?.removeEventListener("devicechange", update);
    };
  }, [state.microphone]);
  return /*#__PURE__*/_jsxs("div", {
    className: "az-audio-settings",
    children: [/*#__PURE__*/_jsxs("label", {
      htmlFor: `${id}-input`,
      children: [/*#__PURE__*/_jsx(Mic, {
        size: 16
      }), "Microphone"]
    }), /*#__PURE__*/_jsxs("select", {
      id: `${id}-input`,
      value: state.inputDeviceId,
      disabled: busy,
      onChange: event => action(() => client.setInputDevice(event.target.value)),
      children: [/*#__PURE__*/_jsx("option", {
        value: "",
        children: "System default"
      }), devices.filter(device => device.kind === "audioinput" && device.deviceId).map((device, i) => /*#__PURE__*/_jsx("option", {
        value: device.deviceId,
        children: device.label || `Microphone ${i + 1}`
      }, device.deviceId))]
    }), /*#__PURE__*/_jsxs("button", {
      type: "button",
      className: "az-button az-secondary",
      disabled: busy || state.microphone === "requesting",
      onClick: () => action(() => client.testMicrophone()),
      children: [state.microphone === "granted" ? /*#__PURE__*/_jsx(Check, {
        size: 16
      }) : /*#__PURE__*/_jsx(Mic, {
        size: 16
      }), state.microphone === "requesting" ? "Waiting for permission…" : state.microphone === "granted" ? "Microphone ready · test again" : "Check microphone access"]
    }), typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype && /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsxs("label", {
        htmlFor: `${id}-output`,
        children: [/*#__PURE__*/_jsx(Headphones, {
          size: 16
        }), "Speakers"]
      }), /*#__PURE__*/_jsxs("select", {
        id: `${id}-output`,
        value: state.outputDeviceId,
        onChange: event => action(() => client.setOutputDevice(event.target.value)),
        children: [/*#__PURE__*/_jsx("option", {
          value: "",
          children: "System default"
        }), devices.filter(device => device.kind === "audiooutput" && device.deviceId).map((device, i) => /*#__PURE__*/_jsx("option", {
          value: device.deviceId,
          children: device.label || `Speaker ${i + 1}`
        }, device.deviceId))]
      })]
    }), /*#__PURE__*/_jsxs("label", {
      htmlFor: `${id}-volume`,
      children: [/*#__PURE__*/_jsx(Volume2, {
        size: 16
      }), "Call volume ", /*#__PURE__*/_jsxs("span", {
        children: [Math.round(state.volume * 100), "%"]
      })]
    }), /*#__PURE__*/_jsx("input", {
      id: `${id}-volume`,
      type: "range",
      min: "0",
      max: "1",
      step: "0.05",
      value: state.volume,
      onChange: event => client.setVolume(Number(event.target.value))
    }), /*#__PURE__*/_jsx("p", {
      children: "Microphone changes apply to your next call."
    })]
  });
}
