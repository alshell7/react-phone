"use client";
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AudioLines,
  GripHorizontal,
  Headphones,
  Settings2,
  X,
} from "lucide-react";
import {
  PhoneProvider,
  usePhone,
  type PhoneProviderProps,
} from "../react/phone-provider.tsx";
import type { Caller } from "../core/types.ts";
import { PhoneRoot, type PhoneRootProps } from "./theme.tsx";
import {
  AudioSettings,
  CallControls,
  CallerCard,
  ConnectionStatus,
  Dialer,
  ErrorBanner,
  type CallerCardProps,
  type CallControl,
} from "./controls.tsx";
import { CallWaveform, type CallWaveformProps } from "./call-waveform.tsx";
import { CallOrb, type CallOrbProps } from "./call-orb.tsx";
import { useAutoDial } from "../react/use-auto-dial.ts";
import {
  CallBarVisualizer,
  type CallBarVisualizerProps,
} from "./call-bar-visualizer.tsx";
import { useDraggable, type PhoneDragOptions } from "../react/use-draggable.ts";
import { useAnimatedSize } from "../react/use-animated-size.ts";

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
export const phonePresets: Readonly<
  Record<PhonePreset, Readonly<PhoneFeatures>>
> = {
  basic: {
    mute: true,
    keypad: false,
    hold: false,
    transfer: false,
    waveform: true,
    audioSettings: true,
  },
  advanced: {
    mute: true,
    keypad: true,
    hold: true,
    transfer: true,
    waveform: true,
    audioSettings: true,
  },
  compact: {
    mute: true,
    keypad: false,
    hold: true,
    transfer: false,
    waveform: false,
    audioSettings: false,
  },
};

export interface PhoneWidgetProps
  extends Omit<PhoneRootProps, "children">, Omit<CallerCardProps, "caller"> {
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
  branding?: { name: string; href?: string };
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
  const { state } = usePhone();
  const windowRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drag = useDraggable(windowRef, draggable);
  useAnimatedSize(panelRef, contentRef, root.motion);
  const [number, setNumber] = useState(defaultNumber || caller?.number || "");
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const options = { ...phonePresets[preset], ...features };
  const idle = ["idle", "ended"].includes(state.status);
  const active = ["active", "held"].includes(state.status);
  const visual =
    visualization?.type ?? (options.waveform ? "waveform" : "none");
  const prefilled = defaultNumber || caller?.number || "";
  useAutoDial({
    number: prefilled,
    enabled: autoDial,
    requestId: autoDialKey,
    caller: caller?.number === prefilled ? caller : undefined,
  });
  useEffect(() => {
    if (idle || !options.keypad || (controls && !controls.includes("keypad")))
      setKeypadOpen(false);
  }, [idle, options.keypad, controls]);
  useEffect(() => {
    setNumber(prefilled);
  }, [prefilled]);
  const currentCaller = !idle ? state.call?.caller : caller;
  const identity =
    currentCaller && resolveCaller
      ? resolveCaller(currentCaller)
      : currentCaller;
  return (
    <PhoneRoot
      {...root}
      elementRef={windowRef}
      style={{ ...root.style, ...drag.style }}
      className={`az-widget az-${preset} ${root.className ?? ""}`}
    >
      <section
        aria-label={title}
        ref={panelRef}
        className="az-size-frame"
        data-dragging={drag.dragging}
      >
        <div ref={contentRef}>
          {drag.enabled && (
            <div className="az-drag-strip">
              <button
                type="button"
                className="az-drag-handle"
                {...drag.handleProps}
              >
                <GripHorizontal size={18} />
                <span className="az-sr-only">
                  Arrow keys move the phone. Shift moves faster. Home resets.
                </span>
              </button>
            </div>
          )}
          {header !== undefined ? (
            header
          ) : (
            <header className="az-widget-header">
              <span className="az-widget-title">
                <AudioLines size={19} />
                {title}
              </span>
              <div className="az-row">
                <ConnectionStatus />
                {options.audioSettings && (
                  <button
                    className="az-icon"
                    type="button"
                    aria-label={
                      settingsOpen
                        ? "Close audio settings"
                        : "Open audio settings"
                    }
                    aria-expanded={settingsOpen}
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    {settingsOpen ? <X size={17} /> : <Settings2 size={17} />}
                  </button>
                )}
              </div>
            </header>
          )}
          <ErrorBanner />
          {settingsOpen ? (
            <div className="az-settings-body">
              <h3>Audio settings</h3>
              <AudioSettings />
            </div>
          ) : (
            <div className="az-widget-body">
              {(visual === "orb" || visual === "both") && (
                <div className="az-orb-wrap">
                  <CallOrb
                    appearance={root.theme?.appearance}
                    {...visualization?.orb}
                  />
                </div>
              )}
              <CallerCard
                caller={identity}
                showAvatar={
                  showAvatar ??
                  (visual === "avatar" ||
                    (visual === "none" && visualization?.type === undefined))
                }
                renderAvatar={renderAvatar}
                renderTags={renderTags}
              />
              {(visual === "waveform" || visual === "both") && (
                <CallWaveform {...visualization?.waveform} />
              )}
              {visual === "bars" && (
                <div className="az-bars-wrap">
                  <CallBarVisualizer {...visualization?.bars} />
                </div>
              )}
              {(idle || (active && keypadOpen && options.keypad)) && (
                <Dialer
                  value={number}
                  onChange={setNumber}
                  showKeypad={options.keypad}
                  caller={
                    caller && caller.number === number ? caller : undefined
                  }
                />
              )}
              <CallControls
                buttons={controls}
                showMute={options.mute}
                showHold={options.hold}
                showTransfer={options.transfer}
                showKeypad={options.keypad}
                keypadOpen={keypadOpen}
                onKeypadToggle={() => setKeypadOpen(!keypadOpen)}
              />
            </div>
          )}
          {footer !== undefined ? (
            footer
          ) : (
            <footer className="az-widget-footer">
              <Headphones size={13} />
              <span>
                {state.connection === "registered"
                  ? "Audio handled by your browser"
                  : "Connect an account to make calls"}
              </span>
            </footer>
          )}
          {branding?.name.trim() && (
            <div className="az-powered-by">
              Powered by{" "}
              {branding.href && /^https?:\/\//i.test(branding.href) ? (
                <a href={branding.href} target="_blank" rel="noreferrer">
                  {branding.name}
                </a>
              ) : (
                <span>{branding.name}</span>
              )}
            </div>
          )}
        </div>
      </section>
    </PhoneRoot>
  );
}

/** All-in-one phone. For composable controls, use PhoneProvider + PhoneWidget. */
export interface WebPhoneProps
  extends Omit<PhoneProviderProps, "children">, PhoneWidgetProps {}

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
  return (
    <PhoneProvider
      config={config}
      autoConnect={autoConnect}
      preview={preview}
      client={client}
      onEvent={onEvent}
      onIncomingCall={onIncomingCall}
      onAnswered={onAnswered}
      onDisconnected={onDisconnected}
      onConnectionChange={onConnectionChange}
      onError={onError}
      tones={tones}
    >
      <PhoneWidget {...widget} />
    </PhoneProvider>
  );
}
