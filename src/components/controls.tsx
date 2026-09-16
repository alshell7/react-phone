"use client";
import {
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  AudioLines,
  Check,
  ChevronRight,
  Delete,
  Headphones,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneIncoming,
  PhoneOff,
  Play,
  Volume2,
  X,
} from "lucide-react";
import { usePhone } from "../react/phone-provider.tsx";
import { formatDuration } from "../core/validation.ts";
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
  const { state, preview } = usePhone();
  const labels = {
    disconnected: "Not connected",
    connecting: "Connecting",
    registered: preview ? "Preview mode" : "Ready for calls",
    reconnecting: "Reconnecting",
    error: "Connection failed",
  };
  return (
    <span className="az-status" data-status={state.connection} role="status">
      <span className="az-status-dot" />
      {labels[state.connection]}
    </span>
  );
}

export function ErrorBanner(): ReactElement | null {
  const { state, client } = usePhone();
  if (!state.error && !state.playbackBlocked) return null;
  return (
    <div className="az-notices">
      {state.error && (
        <div className="az-error" role="alert">
          <span>{state.error.message}</span>
          <button
            type="button"
            className="az-icon"
            aria-label="Dismiss error"
            onClick={() => client.clearError()}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {state.playbackBlocked && (
        <button
          type="button"
          className="az-audio-recovery"
          onClick={() => action(() => client.playAudio())}
        >
          <Volume2 size={17} />
          Enable call audio
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
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
  showAvatar = true,
}: CallerCardProps): ReactElement {
  const { state } = usePhone();
  const caller = supplied ?? state.call?.caller;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const busy = !["idle", "ended"].includes(state.status);
  const initials = (caller?.name || caller?.number || "")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const status = {
    idle: "Ready to connect",
    "requesting-microphone": "Waiting for microphone…",
    dialing: "Calling…",
    ringing: "Ringing…",
    incoming: "Incoming call",
    answering: "Answering…",
    active: state.remoteHeld ? "Caller put you on hold" : "Connected",
    held: "On hold",
    ended: state.call?.endReason ?? "Call ended",
  }[state.status];
  return (
    <div
      className="az-caller"
      data-idle={state.status === "idle" && !caller}
      data-avatar={showAvatar}
    >
      {showAvatar && (
        <div className="az-avatar" data-active={state.status === "active"}>
          {caller && renderAvatar ? (
            renderAvatar(caller)
          ) : caller?.avatarUrl && failedImage !== caller.avatarUrl ? (
            <img
              src={caller.avatarUrl}
              alt=""
              onError={() => setFailedImage(caller.avatarUrl ?? null)}
            />
          ) : initials ? (
            <span>{initials}</span>
          ) : (
            <AudioLines size={34} strokeWidth={1.6} />
          )}
        </div>
      )}
      <div className="az-caller-copy">
        <h3>{caller?.name || caller?.number || "Ready when you are"}</h3>
        <p>
          {caller?.name
            ? caller.number
            : busy
              ? ""
              : "Dial a number. Make a connection."}
        </p>
      </div>
      {caller &&
        (renderTags ? (
          renderTags(caller)
        ) : caller.tags?.length ? (
          <div className="az-tags">
            {caller.tags.map((tag, i) => (
              <span key={`${tag}-${i}`}>{tag}</span>
            ))}
          </div>
        ) : null)}
      {state.status !== "idle" && (
        <div className="az-call-status" role="status">
          {busy && <span className="az-status-dot" />}
          {status}
          {state.call?.answeredAt && (
            <>
              <span className="az-status-separator">·</span>
              <CallTimer />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CallTimer(): ReactElement {
  const { state } = usePhone();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!state.call?.answeredAt || state.call.endedAt) return;
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [state.call?.answeredAt, state.call?.endedAt]);
  const seconds = state.call?.answeredAt
    ? ((state.call.endedAt ?? Date.now()) - state.call.answeredAt) / 1000
    : 0;
  return (
    <time
      className="az-timer"
      aria-label={`Call duration ${formatDuration(seconds)}`}
    >
      {formatDuration(seconds)}
    </time>
  );
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
  caller,
}: DialerProps): ReactElement {
  const [localValue, setLocalValue] = useState("");
  const value = controlled ?? localValue;
  const update = (next: string) => {
    setLocalValue(next);
    onChange?.(next);
  };
  const { state, client } = usePhone();
  const id = useId();
  const inCall = ["active", "held"].includes(state.status);
  const canDial = ["idle", "ended"].includes(state.status);
  return (
    <div className="az-dialer">
      {!inCall && (
        <form
          className="az-number-form"
          onSubmit={(event) => {
            event.preventDefault();
            action(() => client.call(value, caller));
          }}
        >
          <label className="az-sr-only" htmlFor={id}>
            Phone number or SIP address
          </label>
          <div className="az-number-input">
            <input
              id={id}
              type="text"
              inputMode="tel"
              autoComplete="off"
              placeholder="Enter a number"
              value={value}
              maxLength={160}
              disabled={!canDial}
              onChange={(event) => update(event.target.value)}
            />
            <button
              className="az-icon"
              type="button"
              aria-label="Delete last digit"
              disabled={!value || !canDial}
              onClick={() => update(value.slice(0, -1))}
            >
              <Delete size={19} />
            </button>
          </div>
          {!showKeypad && (
            <button
              type="submit"
              className="az-button az-primary"
              disabled={
                !value.trim() || !canDial || state.connection !== "registered"
              }
            >
              <Phone size={18} />
              Call
            </button>
          )}
        </form>
      )}
      {showKeypad && (
        <div
          className="az-keypad"
          aria-label={inCall ? "In-call keypad" : "Dial pad"}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
            (digit, i) => (
              <button
                type="button"
                key={digit}
                aria-label={digit}
                disabled={!canDial && !inCall}
                onClick={() => {
                  if (inCall) action(() => client.sendDTMF(digit));
                  else {
                    client.playKeypadTone(digit);
                    update(value + digit);
                  }
                }}
              >
                <span>{digit}</span>
                <small>
                  {
                    [
                      "",
                      "ABC",
                      "DEF",
                      "GHI",
                      "JKL",
                      "MNO",
                      "PQRS",
                      "TUV",
                      "WXYZ",
                      "",
                      "+",
                      "",
                    ][i]
                  }
                </small>
              </button>
            ),
          )}
        </div>
      )}
      {showKeypad && canDial && (
        <button
          type="button"
          className="az-button az-primary az-dial-button"
          disabled={!value.trim() || state.connection !== "registered"}
          onClick={() => action(() => client.call(value, caller))}
        >
          <Phone size={19} />
          Start call<kbd>↵</kbd>
        </button>
      )}
    </div>
  );
}

export type CallControl = "mute" | "keypad" | "hold" | "transfer" | "hangup";
export const defaultCallControls: readonly CallControl[] = [
  "mute",
  "keypad",
  "hold",
  "transfer",
  "hangup",
];
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
  keypadOpen,
}: CallControlsProps): ReactElement | null {
  const { state, client } = usePhone();
  const [transferOpen, setTransferOpen] = useState(false);
  const connected = ["active", "held"].includes(state.status);
  const available = Array.from(new Set(buttons)).filter((button) =>
    button === "mute"
      ? showMute
      : button === "hold"
        ? showHold
        : button === "transfer"
          ? showTransfer
          : button === "keypad"
            ? showKeypad && Boolean(onKeypadToggle)
            : true,
  );
  const transferAvailable = available.includes("transfer");
  useEffect(() => {
    if (!connected || !transferAvailable) setTransferOpen(false);
  }, [connected, transferAvailable]);
  if (["idle", "ended"].includes(state.status)) return null;
  if (state.status === "incoming")
    return (
      <div className="az-incoming-actions">
        <button
          className="az-button az-decline"
          type="button"
          onClick={() => client.hangup()}
        >
          <PhoneOff size={19} />
          Decline
        </button>
        <button
          className="az-button az-primary"
          type="button"
          onClick={() => action(() => client.answer())}
        >
          <PhoneIncoming size={19} />
          Answer
        </button>
      </div>
    );
  const utilities = available.filter((button) => button !== "hangup");
  if (!available.length) return null;
  return (
    <div className="az-call-controls" data-controls={available.join(",")}>
      {connected && utilities.length > 0 && (
        <div
          className="az-control-row"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(" + Math.min(utilities.length, 4) + ", minmax(0, 1fr))",
          }}
        >
          {utilities.map((button) => {
            if (button === "mute")
              return (
                <button
                  key={button}
                  type="button"
                  className="az-control"
                  aria-pressed={state.muted}
                  onClick={() => client.setMuted(!state.muted)}
                >
                  {state.muted ? <MicOff size={21} /> : <Mic size={21} />}
                  <span>{state.muted ? "Unmute" : "Mute"}</span>
                </button>
              );
            if (button === "keypad")
              return (
                <button
                  key={button}
                  type="button"
                  className="az-control"
                  aria-expanded={keypadOpen}
                  onClick={onKeypadToggle}
                >
                  <span className="az-keypad-icon" aria-hidden="true">
                    {Array.from({ length: 9 }, (_, i) => (
                      <i key={i} />
                    ))}
                  </span>
                  <span>Keypad</span>
                </button>
              );
            if (button === "hold")
              return (
                <button
                  key={button}
                  type="button"
                  className="az-control"
                  aria-pressed={state.status === "held"}
                  disabled={state.transferPending}
                  onClick={() =>
                    action(() => client.setHeld(state.status !== "held"))
                  }
                >
                  {state.status === "held" ? (
                    <Play size={21} />
                  ) : (
                    <Pause size={21} />
                  )}
                  <span>{state.status === "held" ? "Resume" : "Hold"}</span>
                </button>
              );
            return (
              <button
                key={button}
                type="button"
                className="az-control"
                aria-expanded={transferOpen}
                onClick={() => setTransferOpen(!transferOpen)}
              >
                <ArrowUpRight size={21} />
                <span>Transfer</span>
              </button>
            );
          })}
        </div>
      )}
      {transferOpen && transferAvailable && (
        <TransferPanel onClose={() => setTransferOpen(false)} />
      )}
      {available.includes("hangup") && (
        <button
          className="az-button az-danger"
          type="button"
          onClick={() => client.hangup()}
        >
          <PhoneOff size={19} />
          {connected ? "End call" : "Cancel call"}
        </button>
      )}
    </div>
  );
}

/** A composable blind-transfer form; keeps the current call until success is confirmed. */
export function TransferPanel({
  onClose,
}: {
  onClose?: () => void;
}): ReactElement {
  const { state, client } = usePhone();
  const [target, setTarget] = useState("");
  const id = useId();
  return (
    <form
      className="az-transfer"
      onSubmit={(event) => {
        event.preventDefault();
        action(() => client.transfer(target));
      }}
    >
      <div className="az-row">
        <label htmlFor={id}>Transfer call</label>
        {onClose && (
          <button
            type="button"
            className="az-icon"
            aria-label="Close transfer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <p>Send this call directly to another number.</p>
      <div className="az-row">
        <input
          id={id}
          value={target}
          inputMode="tel"
          placeholder="Extension or SIP address"
          onChange={(event) => setTarget(event.target.value)}
          disabled={state.transferPending}
        />
        <button
          type="submit"
          className="az-button az-primary"
          disabled={
            !target ||
            state.transferPending ||
            !["active", "held"].includes(state.status)
          }
        >
          {state.transferPending ? "Transferring…" : "Transfer"}
        </button>
      </div>
    </form>
  );
}

export interface ConnectionFormProps {
  defaultValues?: Partial<SipConfig>;
  onConnected?: () => void;
}

/** Credentials are never persisted. Password is cleared after a successful registration. */
export function ConnectionForm({
  defaultValues = {},
  onConnected,
}: ConnectionFormProps): ReactElement {
  const { state, client } = usePhone();
  const [username, setUsername] = useState(
    defaultValues.authorizationUsername ?? "",
  );
  const [password, setPassword] = useState("");
  const [uri, setUri] = useState(defaultValues.uri ?? "");
  const [server, setServer] = useState(defaultValues.websocketUrl ?? "");
  const [iceUrl, setIceUrl] = useState("");
  const [turnUsername, setTurnUsername] = useState("");
  const [turnPassword, setTurnPassword] = useState("");
  const id = useId();
  const pending = ["connecting", "reconnecting"].includes(state.connection);
  return (
    <form
      className="az-connection-form"
      onSubmit={(event) => {
        event.preventDefault();
        action(async () => {
          await client.connect({
            ...defaultValues,
            websocketUrl: server,
            uri,
            authorizationUsername: username,
            password,
            iceServers: iceUrl
              ? [
                  {
                    urls: iceUrl,
                    ...(turnUsername
                      ? { username: turnUsername, credential: turnPassword }
                      : {}),
                  },
                ]
              : defaultValues.iceServers,
          });
          if (client.getSnapshot().connection === "registered") {
            setPassword("");
            setTurnPassword("");
            onConnected?.();
          }
        });
      }}
    >
      <label htmlFor={`${id}-user`}>Username</label>
      <input
        id={`${id}-user`}
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
        placeholder="Your SIP username"
        required
        disabled={pending}
      />
      <label htmlFor={`${id}-password`}>Password</label>
      <input
        id={`${id}-password`}
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        placeholder="Enter your SIP password"
        required
        disabled={pending}
      />
      <details open={!uri || !server || undefined}>
        <summary>Server & network settings</summary>
        <div className="az-server-fields">
          <label htmlFor={`${id}-uri`}>SIP address</label>
          <input
            id={`${id}-uri`}
            value={uri}
            onChange={(event) => setUri(event.target.value)}
            placeholder="sip:1001@pbx.example.com"
            required
            disabled={pending}
          />
          <p>The extension in this address can differ from your username.</p>
          <label htmlFor={`${id}-server`}>WebSocket server</label>
          <input
            id={`${id}-server`}
            value={server}
            onChange={(event) => setServer(event.target.value)}
            placeholder="wss://pbx.example.com/ws"
            required
            disabled={pending}
          />
          <label htmlFor={`${id}-ice`}>
            STUN / TURN server <small>Optional</small>
          </label>
          <input
            id={`${id}-ice`}
            value={iceUrl}
            onChange={(event) => setIceUrl(event.target.value)}
            placeholder="turn:relay.example.com:3478"
            disabled={pending}
          />
          {iceUrl.startsWith("turn") && (
            <>
              <label htmlFor={`${id}-turn-user`}>TURN username</label>
              <input
                id={`${id}-turn-user`}
                value={turnUsername}
                onChange={(event) => setTurnUsername(event.target.value)}
                disabled={pending}
              />
              <label htmlFor={`${id}-turn-password`}>TURN password</label>
              <input
                id={`${id}-turn-password`}
                type="password"
                value={turnPassword}
                onChange={(event) => setTurnPassword(event.target.value)}
                disabled={pending}
              />
            </>
          )}
        </div>
      </details>
      <button type="submit" className="az-button az-primary" disabled={pending}>
        <Phone size={17} />
        {pending ? "Connecting…" : "Connect account"}
      </button>
      {pending && (
        <button
          type="button"
          className="az-button az-secondary"
          onClick={() => client.disconnect()}
        >
          Cancel connection
        </button>
      )}
      <p className="az-privacy">
        <Check size={14} />
        Credentials stay in this session.
      </p>
    </form>
  );
}

/** Device selection, microphone preflight, and playback volume with capability detection. */
export function AudioSettings(): ReactElement {
  const { state, client } = usePhone();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const id = useId();
  const busy = !["idle", "ended"].includes(state.status);
  useEffect(() => {
    let live = true;
    const update = () => {
      void navigator.mediaDevices
        ?.enumerateDevices()
        .then((items) => {
          if (live) setDevices(items);
        })
        .catch(() => {});
    };
    update();
    navigator.mediaDevices?.addEventListener("devicechange", update);
    return () => {
      live = false;
      navigator.mediaDevices?.removeEventListener("devicechange", update);
    };
  }, [state.microphone]);
  return (
    <div className="az-audio-settings">
      <label htmlFor={`${id}-input`}>
        <Mic size={16} />
        Microphone
      </label>
      <select
        id={`${id}-input`}
        value={state.inputDeviceId}
        disabled={busy}
        onChange={(event) =>
          action(() => client.setInputDevice(event.target.value))
        }
      >
        <option value="">System default</option>
        {devices
          .filter((device) => device.kind === "audioinput" && device.deviceId)
          .map((device, i) => (
            <option value={device.deviceId} key={device.deviceId}>
              {device.label || `Microphone ${i + 1}`}
            </option>
          ))}
      </select>
      <button
        type="button"
        className="az-button az-secondary"
        disabled={busy || state.microphone === "requesting"}
        onClick={() => action(() => client.testMicrophone())}
      >
        {state.microphone === "granted" ? (
          <Check size={16} />
        ) : (
          <Mic size={16} />
        )}
        {state.microphone === "requesting"
          ? "Waiting for permission…"
          : state.microphone === "granted"
            ? "Microphone ready · test again"
            : "Check microphone access"}
      </button>
      {typeof HTMLMediaElement !== "undefined" &&
        "setSinkId" in HTMLMediaElement.prototype && (
          <>
            <label htmlFor={`${id}-output`}>
              <Headphones size={16} />
              Speakers
            </label>
            <select
              id={`${id}-output`}
              value={state.outputDeviceId}
              onChange={(event) =>
                action(() => client.setOutputDevice(event.target.value))
              }
            >
              <option value="">System default</option>
              {devices
                .filter(
                  (device) => device.kind === "audiooutput" && device.deviceId,
                )
                .map((device, i) => (
                  <option value={device.deviceId} key={device.deviceId}>
                    {device.label || `Speaker ${i + 1}`}
                  </option>
                ))}
            </select>
          </>
        )}
      <label htmlFor={`${id}-volume`}>
        <Volume2 size={16} />
        Call volume <span>{Math.round(state.volume * 100)}%</span>
      </label>
      <input
        id={`${id}-volume`}
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={state.volume}
        onChange={(event) => client.setVolume(Number(event.target.value))}
      />
      <p>Microphone changes apply to your next call.</p>
    </div>
  );
}
