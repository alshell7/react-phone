import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  CodeXml as Github,
  Headphones,
  History,
  LayoutGrid,
  Link2,
  List,
  Menu,
  Monitor,
  Moon,
  Paintbrush,
  PanelBottom,
  Phone,
  PhoneIncoming,
  Plug,
  Plus,
  Radio,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  AudioSettings,
  ConnectionForm,
  ConnectionStatus,
  ErrorBanner,
  PhoneClient,
  PhoneProvider,
  PhoneRoot,
  PhoneWidget,
  PhoneIsland,
  formatDuration,
  usePhone,
  type Caller,
  type PhoneEvent,
  type PhoneFeatures,
  type PhonePreset,
  type PhoneTheme,
  type PhoneVisualization,
  type CallControl,
  type PhoneToneOptions,
  type PhoneToneEvent,
  defaultCallControls,
  type PhoneIslandPlacement,
  type IncomingCallBehavior,
} from "../src/index.ts";

type View = "playground" | "history" | "events" | "guide";
type InspectorTab = "customize" | "account";
const swatches = [
  { name: "Forest", color: "#2e5945" },
  { name: "Graphite", color: "#30343b" },
  { name: "Ocean", color: "#285dab" },
  { name: "Terracotta", color: "#ad4e35" },
  { name: "Plum", color: "#755075" },
];
const previewOptions = { enabled: true as const };

function Brand({ small = false }: { small?: boolean }): ReactElement {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <span className="brand-mark">
        <AudioLines size={22} strokeWidth={1.8} />
      </span>
      <span>
        azeer<span className="brand-light"> / phone</span>
      </span>
    </div>
  );
}

export function App(): ReactElement {
  const [mode, setMode] = useState<"preview" | "live">("preview");
  const [events, setEvents] = useState<PhoneEvent[]>([]);
  // Replace the connection without remounting the user's layout/theme editor.
  const client = useMemo(
    () =>
      new PhoneClient({
        preview: mode === "preview" ? previewOptions : undefined,
      }),
    [mode],
  );
  useEffect(() => {
    if (mode === "preview") client.startPreview();
    return () => client.dispose();
  }, [client, mode]);
  return (
    <PhoneProvider
      client={client}
      preview={mode === "preview" ? previewOptions : undefined}
      onEvent={(event) => setEvents((items) => [event, ...items].slice(0, 100))}
    >
      <Playground
        mode={mode}
        onModeChange={(next) => {
          client.disconnect();
          setMode(next);
          setEvents([]);
        }}
        events={events}
        clearEvents={() => setEvents([])}
      />
    </PhoneProvider>
  );
}

function Playground({
  mode,
  onModeChange,
  events,
  clearEvents,
}: {
  mode: "preview" | "live";
  onModeChange: (mode: "preview" | "live") => void;
  events: PhoneEvent[];
  clearEvents: () => void;
}): ReactElement {
  const { state, client } = usePhone();
  const [view, setView] = useState<View>("playground");
  const [tab, setTab] = useState<InspectorTab>(
    mode === "live" ? "account" : "customize",
  );
  useEffect(() => {
    if (mode === "live") setTab("account");
  }, [mode]);
  const [preset, setPreset] = useState<PhonePreset>("advanced");
  const [islandEnabled, setIslandEnabled] = useState(false);
  const [islandScope, setIslandScope] = useState<"container" | "window">(
    "container",
  );
  const [islandPlacement, setIslandPlacement] =
    useState<PhoneIslandPlacement>("bottom-center");
  const [incomingBehavior, setIncomingBehavior] =
    useState<IncomingCallBehavior>("expand");
  const [islandOffset, setIslandOffset] = useState(20);
  const [focusIncoming, setFocusIncoming] = useState(false);
  const [collapseAfterCall, setCollapseAfterCall] = useState(true);
  const PhoneSurface = islandEnabled ? PhoneIsland : PhoneWidget;
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState(swatches[0].color);
  const [radius, setRadius] = useState("16px");
  const [callerEnabled, setCallerEnabled] = useState(false);
  const [callerName, setCallerName] = useState("Alex Morgan");
  const [callerNumber, setCallerNumber] = useState("7003");
  const [callerTags, setCallerTags] = useState("Customer, Priority");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [features, setFeatures] = useState<Partial<PhoneFeatures>>({});
  const [visualType, setVisualType] =
    useState<NonNullable<PhoneVisualization["type"]>>("both");
  const [orbColors, setOrbColors] = useState<[string, string]>([
    "#2e5945",
    "#b8daa2",
  ]);
  const [orbSpeed, setOrbSpeed] = useState(1);
  const [orbFollowsTheme, setOrbFollowsTheme] = useState(true);
  const [barCount, setBarCount] = useState(12);
  const [buttons, setButtons] =
    useState<readonly CallControl[]>(defaultCallControls);
  const [canDrag, setCanDrag] = useState(false);
  const [dragBounds, setDragBounds] = useState<"viewport" | "parent">(
    "viewport",
  );
  const [phonePosition, setPhonePosition] = useState({ x: 0, y: 0 });
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [motionDuration, setMotionDuration] = useState(220);
  const [brandEnabled, setBrandEnabled] = useState(false);
  const [brandName, setBrandName] = useState("Azeer");
  const [brandUrl, setBrandUrl] = useState("");
  const [tones, setTones] = useState<PhoneToneOptions>({
    enabled: true,
    preset: "gentle",
    volume: 0.35,
    haptics: false,
  });
  const [previewCue, setPreviewCue] = useState<PhoneToneEvent>("incoming");
  useEffect(() => client.setTones(tones), [client, tones]);
  const [waveMode, setWaveMode] = useState<"static" | "scrolling">("static");
  const [waveSource, setWaveSource] = useState<"remote" | "local">("remote");
  const [outgoingMode, setOutgoingMode] = useState<
    "manual" | "prefill" | "auto"
  >("manual");
  const [prefillNumber, setPrefillNumber] = useState("");
  const [outgoingRequest, setOutgoingRequest] = useState<{
    number: string;
    auto: boolean;
    key: string;
    mode: typeof mode;
  } | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const busy = !["idle", "ended"].includes(state.status);
  const theme: PhoneTheme = {
    appearance,
    accent:
      appearance === "dark" && accent === swatches[0].color
        ? "#b8daa2"
        : accent,
    accentForeground:
      appearance === "dark" && accent === swatches[0].color
        ? "#17291e"
        : "#ffffff",
    radius,
  };
  const caller: Caller | undefined = callerEnabled
    ? {
        name: callerName,
        number: callerNumber,
        tags: callerTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        ...(avatarUrl ? { avatarUrl } : {}),
      }
    : undefined;
  const visualization: PhoneVisualization = {
    type: visualType,
    orb: {
      ...(orbFollowsTheme ? {} : { colors: orbColors }),
      speed: orbSpeed,
      size: 100,
    },
    waveform: { mode: waveMode, source: waveSource },
    bars: { barCount },
  };
  const asCode = (value: unknown) =>
    JSON.stringify(value).replace(/</g, "\\u003c");
  const code = [
    `import { ${islandEnabled ? "WebPhoneIsland" : "WebPhone"} } from "@azeer-ui-widget/react-phone";`,
    "",
    "// Supply credentials from your sign-in flow.",
    "export function MyPhone({ sipConfig }) {",
    "  return (",
    `    <${islandEnabled ? "WebPhoneIsland" : "WebPhone"}`,
    ...(islandEnabled
      ? [
          "      scope=" + asCode(islandScope),
          "      placement=" + asCode(islandPlacement),
          "      offset={" + islandOffset + "}",
          "      incomingBehavior=" + asCode(incomingBehavior),
          "      focusOnIncoming={" + focusIncoming + "}",
          "      collapseAfterCall={" + collapseAfterCall + "}",
        ]
      : []),
    "      config={sipConfig}",
    "      autoConnect",
    '      preset="' + preset + '"',
    "      theme={" + asCode(theme) + "}",
    "      visualization={" + asCode(visualization) + "}",
    "      controls={" + asCode(buttons) + "}",
    "      motion={" +
      asCode({ enabled: motionEnabled, durationMs: motionDuration }) +
      "}",
    "      tones={" + asCode(tones) + "}",
    ...(canDrag && !islandEnabled
      ? ["      draggable={" + asCode({ bounds: dragBounds }) + "}"]
      : []),
    ...(brandEnabled
      ? [
          "      branding={" +
            asCode({
              name: brandName,
              ...(brandUrl ? { href: brandUrl } : {}),
            }) +
            "}",
        ]
      : []),
    ...(Object.keys(features).length
      ? ["      features={" + asCode(features) + "}"]
      : []),
    ...(caller ? ["      caller={" + asCode(caller) + "}"] : []),
    ...(outgoingMode !== "manual"
      ? ["      defaultNumber={" + asCode(prefillNumber) + "}"]
      : []),
    ...(outgoingMode === "auto"
      ? ["      autoDial", '      autoDialKey="customer-call-1"']
      : []),
    '      onAnswered={(call) => console.info("Answered", call.id)}',
    '      onDisconnected={(call) => console.info("Ended", call.id)}',
    "    />",
    "  );",
    "}",
  ].join("\n");
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCodeOpen(true);
    }
  };
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  const changeMode = (next: "preview" | "live") => {
    if (!busy && next !== mode) onModeChange(next);
  };
  const navigate = (next: View) => {
    setView(next);
    setMenuOpen(false);
  };
  const reset = () => {
    setPreset("advanced");
    setAppearance("light");
    setAccent(swatches[0].color);
    setRadius("16px");
    setFeatures({});
    setCallerEnabled(false);
    setVisualType("both");
    setOrbColors(["#2e5945", "#b8daa2"]);
    setOrbSpeed(1);
    setWaveMode("static");
    setWaveSource("remote");
    setOrbFollowsTheme(true);
    setCanDrag(false);
    setPhonePosition({ x: 0, y: 0 });
    setMotionEnabled(true);
    setMotionDuration(220);
    setButtons(defaultCallControls);
    setBrandEnabled(false);
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="plain-icon mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={21} />
          </button>
          <Brand />
          <span className="header-divider" />
          <span className="workspace-label">Component playground</span>
        </div>
        <div className="topbar-right">
          <a
            href="https://github.com/alshell7/react-phone"
            target="_blank"
            rel="noreferrer"
            className="github-link"
            aria-label="View source on GitHub"
          >
            <Github size={16} />
            <span>GitHub</span>
            <ArrowUpRight size={13} />
          </a>
          <span className="version">v0.1.0</span>
        </div>
      </header>
      <aside
        className={`sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-top">
          <div className="project-label">
            <span className="project-icon">
              <Phone size={16} />
            </span>
            <div>
              <strong>React Phone</strong>
              <small>Voice, in your product.</small>
            </div>
          </div>
          <nav>
            {[
              {
                id: "playground" as const,
                label: "Playground",
                icon: LayoutGrid,
              },
              { id: "history" as const, label: "Call history", icon: History },
              { id: "events" as const, label: "Event log", icon: List },
              {
                id: "guide" as const,
                label: "Integration guide",
                icon: BookOpen,
              },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                aria-label={label}
                onClick={() => navigate(id)}
                className={`nav-item ${view === id ? "active" : ""}`}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === "events" && events.length > 0 && (
                  <span className="nav-count">{events.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-divider" />
          <span className="sidebar-label">RESOURCES</span>
          <a
            className="nav-item"
            href="https://ui.elevenlabs.io/"
            aria-label="ElevenLabs UI"
            target="_blank"
            rel="noreferrer"
          >
            <AudioLines size={17} />
            <span>ElevenLabs UI</span>
            <ArrowUpRight size={13} />
          </a>
          <a
            className="nav-item"
            href="https://jsr.io/@azeer-ui-widget/react-phone"
            aria-label="Package on JSR"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={17} />
            <span>Package on JSR</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-signal">
              <Radio size={17} />
            </span>
            <strong>One line. Your interface.</strong>
            <p>Everything you need for a conversation, wherever it belongs.</p>
            <button onClick={() => navigate("guide")}>
              Explore the components
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="sidebar-account">
            <span className="user-avatar">A</span>
            <div>
              <strong>Azeer workspace</strong>
              <small>Local development</small>
            </div>
          </div>
        </div>
      </aside>
      <main id="main" className="main-area">
        <div className="page-heading">
          <div>
            <div className="breadcrumb">
              React Phone
              <ChevronRight size={12} />
              <span>
                {view === "playground"
                  ? "Playground"
                  : view === "history"
                    ? "Call history"
                    : view === "events"
                      ? "Event log"
                      : "Integration guide"}
              </span>
            </div>
            <h1>
              {view === "playground"
                ? "Make it your phone."
                : view === "history"
                  ? "Your conversations."
                  : view === "events"
                    ? "Every call has a story."
                    : "A little code. A real connection."}
            </h1>
            <p>
              {view === "playground"
                ? "A familiar voice experience, designed to fit right in."
                : view === "history"
                  ? "Calls from this session, with the details that matter."
                  : view === "events"
                    ? "Follow the phone lifecycle as it happens."
                    : "From a ready-made phone to your own calling interface."}
            </p>
          </div>
          {view === "playground" && (
            <button
              className="button dark-button"
              onClick={() => setCodeOpen(true)}
            >
              <Code2 size={16} />
              Get embed code
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
        <div
          className={`workspace-grid ${view !== "playground" ? "single-view" : ""}`}
        >
          <div className="workspace-main">
            <div className="stage-toolbar">
              <div className="toolbar-label">
                <span className="live-dot" />
                Live playground<span className="toolbar-slash">/</span>
                <span>{preset.charAt(0).toUpperCase() + preset.slice(1)}</span>
              </div>
              <div className="toolbar-controls">
                <div className="device-switch" aria-label="Preview size">
                  <button
                    className={!mobilePreview ? "selected" : ""}
                    aria-label="Desktop preview"
                    aria-pressed={!mobilePreview}
                    onClick={() => setMobilePreview(false)}
                  >
                    <Monitor size={15} />
                  </button>
                  <button
                    className={mobilePreview ? "selected" : ""}
                    aria-label="Mobile preview"
                    aria-pressed={mobilePreview}
                    onClick={() => setMobilePreview(true)}
                  >
                    <Smartphone size={15} />
                  </button>
                </div>
                <button
                  className="plain-icon"
                  aria-label="Reset appearance"
                  onClick={reset}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            <div className="stage-mode">
              <div className="mode-switch" aria-label="Calling mode">
                <button
                  aria-pressed={mode === "preview"}
                  className={mode === "preview" ? "selected" : ""}
                  disabled={busy}
                  onClick={() => changeMode("preview")}
                >
                  Preview
                </button>
                <button
                  aria-pressed={mode === "live"}
                  className={mode === "live" ? "selected" : ""}
                  disabled={busy}
                  onClick={() => changeMode("live")}
                >
                  <span className="mode-dot" />
                  Live SIP
                </button>
              </div>
              <span>
                {mode === "preview"
                  ? "Try the interface. No real calls."
                  : state.connection === "registered"
                    ? "Your SIP account is connected."
                    : "Connect your account to make real calls."}
              </span>
            </div>
            <div
              className={`phone-stage ${mobilePreview ? "mobile-preview" : ""} ${islandEnabled ? "island-stage" : ""}`}
              style={view !== "playground" ? { display: "none" } : undefined}
            >
              <div
                className={`phone-positioner ${preset === "compact" ? "is-compact" : ""} ${islandEnabled ? "island-container" : ""}`}
              >
                {islandEnabled && (
                  <div className="island-stage-hint">
                    <AudioLines size={30} strokeWidth={1.2} />
                    <strong>A phone that stays out of the way.</strong>
                    <p>
                      Open the island to dial, or simulate an incoming call.
                    </p>
                  </div>
                )}
                <PhoneSurface
                  {...(islandEnabled
                    ? {
                        scope: islandScope,
                        placement: islandPlacement,
                        offset: islandOffset,
                        incomingBehavior,
                        focusOnIncoming: focusIncoming,
                        collapseAfterCall,
                      }
                    : {})}
                  preset={preset}
                  theme={theme}
                  features={features}
                  caller={caller}
                  visualization={visualization}
                  controls={buttons}
                  draggable={
                    canDrag && !islandEnabled
                      ? {
                          bounds: dragBounds,
                          position: phonePosition,
                          onPositionChange: setPhonePosition,
                        }
                      : false
                  }
                  motion={{
                    enabled: motionEnabled,
                    durationMs: motionDuration,
                  }}
                  branding={
                    brandEnabled
                      ? { name: brandName, href: brandUrl }
                      : undefined
                  }
                  defaultNumber={
                    outgoingRequest?.mode === mode
                      ? outgoingRequest.number
                      : undefined
                  }
                  autoDial={
                    outgoingRequest?.mode === mode && outgoingRequest.auto
                  }
                  autoDialKey={outgoingRequest?.key}
                />
              </div>
              <div className="stage-actions">
                {mode === "preview" ? (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      client.simulateIncoming({
                        name: callerEnabled ? callerName : "Alex Morgan",
                        number: callerEnabled ? callerNumber : "7003",
                        tags: ["Preview call"],
                      })
                    }
                  >
                    <PhoneIncoming size={15} />
                    Simulate incoming call
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => setTab("account")}
                  >
                    <Plug size={15} />
                    {state.connection === "registered"
                      ? "Manage connection"
                      : "Connect a SIP account"}
                    <ArrowRight size={14} />
                  </button>
                )}
                <span className="preview-note">
                  <ShieldCheck size={12} />
                  {mode === "preview"
                    ? "A safe space to try every state"
                    : "Credentials are kept in memory only"}
                </span>
              </div>
            </div>
            {view === "history" && (
              <div className="content-panel">
                <div className="panel-heading">
                  <h2>
                    Recent calls <span>{state.history.length}</span>
                  </h2>
                  <button
                    className="text-button"
                    disabled={!state.history.length}
                    onClick={() => client.clearHistory()}
                  >
                    <Trash2 size={14} />
                    Clear history
                  </button>
                </div>
                {state.history.length ? (
                  <div className="history-list">
                    {state.history.map((call) => (
                      <div className="history-row" key={call.id}>
                        <span className={`history-icon ${call.direction}`}>
                          {call.direction === "incoming" ? (
                            <ArrowDownLeft size={19} />
                          ) : (
                            <ArrowUpRight size={19} />
                          )}
                        </span>
                        <div>
                          <strong>
                            {call.caller.name || call.caller.number}
                          </strong>
                          <small>
                            {call.caller.number} · {call.endReason}
                          </small>
                        </div>
                        <div className="history-time">
                          <strong>
                            {formatDuration(
                              call.answeredAt
                                ? ((call.endedAt ?? Date.now()) -
                                    call.answeredAt) /
                                    1000
                                : 0,
                            )}
                          </strong>
                          <small>
                            {new Date(call.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                        <button
                          className="plain-icon"
                          aria-label={`Call ${call.caller.number}`}
                          disabled={busy || state.connection !== "registered"}
                          onClick={() => {
                            navigate("playground");
                            void client
                              .call(call.caller.number, call.caller)
                              .catch(() => {});
                          }}
                        >
                          <Phone size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<History size={28} />}
                    title="Your next call starts the story"
                    description="Calls you make and receive will appear here. History stays in this browser session."
                    actionLabel="Open the phone"
                    onAction={() => navigate("playground")}
                  />
                )}
              </div>
            )}
            {view === "events" && (
              <div className="content-panel">
                <div className="panel-heading">
                  <h2>
                    Session events <span>{events.length}</span>
                  </h2>
                  <button
                    className="text-button"
                    disabled={!events.length}
                    onClick={clearEvents}
                  >
                    <Trash2 size={14} />
                    Clear log
                  </button>
                </div>
                {events.length ? (
                  <div className="event-list">
                    {events.map((event, i) => (
                      <div
                        className="event-row"
                        key={`${event.timestamp}-${i}`}
                      >
                        <span
                          className={`event-dot ${event.type === "error" ? "error" : ""}`}
                        />
                        <code>{event.type}</code>
                        <span>
                          {event.error?.message ??
                            event.call?.caller.number ??
                            event.connection}
                        </span>
                        <time>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </time>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Radio size={28} />}
                    title="Listening for your first event"
                    description="Connect, dial, answer, mute, or transfer a call to see lifecycle callbacks here."
                    actionLabel="Try a preview call"
                    onAction={() => navigate("playground")}
                  />
                )}
              </div>
            )}
            {view === "guide" && (
              <IntegrationGuide onCode={() => setCodeOpen(true)} />
            )}
            <div className="workspace-foot">
              <span>
                <AudioLines size={14} />
                Built with ElevenLabs UI
              </span>
              <button onClick={() => navigate("guide")}>
                Composable by design
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
          {view === "playground" && (
            <aside className="inspector" aria-label="Phone configuration">
              <div className="inspector-tabs">
                <button
                  className={tab === "customize" ? "selected" : ""}
                  onClick={() => setTab("customize")}
                >
                  <SlidersHorizontal size={15} />
                  Customize
                </button>
                <button
                  className={tab === "account" ? "selected" : ""}
                  onClick={() => setTab("account")}
                >
                  <Link2 size={15} />
                  Connection
                  {mode === "live" && state.connection === "registered" && (
                    <span className="live-dot" />
                  )}
                </button>
              </div>
              {tab === "customize" ? (
                <div className="inspector-content">
                  <section className="inspector-section">
                    <div className="section-title">
                      <LayoutGrid size={15} />
                      <h2>Choose your layout</h2>
                    </div>
                    <p>Start with the essentials. Make it yours.</p>
                    <div className="preset-options">
                      {[
                        {
                          id: "basic" as const,
                          title: "Basic",
                          description: "Just the conversation",
                          icon: Phone,
                        },
                        {
                          id: "advanced" as const,
                          title: "Advanced",
                          description: "The complete calling toolkit",
                          icon: LayoutGrid,
                        },
                        {
                          id: "compact" as const,
                          title: "Compact",
                          description: "A little space. A lot of possibility.",
                          icon: PanelBottom,
                        },
                      ].map(({ id, title, description, icon: Icon }) => (
                        <button
                          key={id}
                          className={`preset-option ${preset === id ? "selected" : ""}`}
                          aria-pressed={preset === id}
                          onClick={() => {
                            setPreset(id);
                            setFeatures({});
                            setVisualType(id === "compact" ? "none" : "both");
                            setButtons(
                              id === "basic"
                                ? ["mute", "hangup"]
                                : id === "compact"
                                  ? ["mute", "hold", "hangup"]
                                  : defaultCallControls,
                            );
                          }}
                        >
                          <span className={`preset-art preset-${id}`}>
                            <Icon size={22} strokeWidth={1.4} />
                          </span>
                          <span>
                            <strong>{title}</strong>
                            <small>{description}</small>
                          </span>
                          <span className="radio-ring">
                            {preset === id && <span />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <details className="inspector-section config-details">
                    <summary className="section-title">
                      <PanelBottom size={15} />
                      <h2>Dynamic island</h2>
                    </summary>
                    <p>
                      Keep your line visible. Open the full phone when you need
                      it.
                    </p>
                    <Toggle
                      label="Use dynamic island"
                      checked={islandEnabled}
                      onChange={setIslandEnabled}
                    />
                    {islandEnabled && (
                      <>
                        <label className="field">
                          Dock inside
                          <select
                            aria-label="Island scope"
                            value={islandScope}
                            onChange={(e) =>
                              setIslandScope(
                                e.target.value as typeof islandScope,
                              )
                            }
                          >
                            <option value="container">Preview container</option>
                            <option value="window">Browser window</option>
                          </select>
                        </label>
                        <label className="field">
                          Position
                          <select
                            aria-label="Island position"
                            value={islandPlacement}
                            onChange={(e) =>
                              setIslandPlacement(
                                e.target.value as PhoneIslandPlacement,
                              )
                            }
                          >
                            {(
                              [
                                "top-left",
                                "top-center",
                                "top-right",
                                "bottom-left",
                                "bottom-center",
                                "bottom-right",
                              ] as const
                            ).map((value) => (
                              <option key={value} value={value}>
                                {value.replace("-", " ")}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          Edge spacing
                          <input
                            aria-label="Island edge spacing"
                            type="range"
                            min="0"
                            max="64"
                            value={islandOffset}
                            onChange={(e) =>
                              setIslandOffset(Number(e.target.value))
                            }
                          />
                        </label>
                        <label className="field">
                          Incoming calls
                          <select
                            aria-label="Incoming call presentation"
                            value={incomingBehavior}
                            onChange={(e) =>
                              setIncomingBehavior(
                                e.target.value as IncomingCallBehavior,
                              )
                            }
                          >
                            <option value="expand">
                              Expand the full phone
                            </option>
                            <option value="notify">
                              Compact answer / decline
                            </option>
                            <option value="manual">
                              Keep the island collapsed
                            </option>
                          </select>
                        </label>
                        <Toggle
                          label="Focus incoming call controls"
                          checked={focusIncoming}
                          onChange={setFocusIncoming}
                        />
                        <Toggle
                          label="Collapse after a call"
                          checked={collapseAfterCall}
                          onChange={setCollapseAfterCall}
                        />
                      </>
                    )}
                  </details>
                  <section className="inspector-section">
                    <div className="section-title">
                      <Paintbrush size={15} />
                      <h2>Look & feel</h2>
                    </div>
                    <label className="inspector-label">Appearance</label>
                    <div className="appearance-options">
                      <button
                        aria-pressed={appearance === "light"}
                        className={appearance === "light" ? "selected" : ""}
                        onClick={() => setAppearance("light")}
                      >
                        <Sun size={15} />
                        Light
                      </button>
                      <button
                        aria-pressed={appearance === "dark"}
                        className={appearance === "dark" ? "selected" : ""}
                        onClick={() => setAppearance("dark")}
                      >
                        <Moon size={15} />
                        Dark
                      </button>
                    </div>
                    <div className="label-row">
                      <label className="inspector-label" htmlFor="accent-color">
                        Accent color
                      </label>
                      <span>
                        {swatches.find((item) => item.color === accent)?.name ??
                          "Custom"}
                      </span>
                    </div>
                    <div className="swatches">
                      {swatches.map((swatch) => (
                        <button
                          key={swatch.name}
                          className={`swatch ${accent === swatch.color ? "selected" : ""}`}
                          style={
                            { "--swatch": swatch.color } as React.CSSProperties
                          }
                          aria-label={`${swatch.name} accent`}
                          aria-pressed={accent === swatch.color}
                          onClick={() => setAccent(swatch.color)}
                        >
                          {accent === swatch.color && <Check size={15} />}
                        </button>
                      ))}
                      <label className="custom-swatch" title="Custom accent">
                        <Plus size={16} />
                        <input
                          id="accent-color"
                          type="color"
                          value={accent}
                          onChange={(event) => setAccent(event.target.value)}
                          aria-label="Custom accent color"
                        />
                      </label>
                    </div>
                    <div className="label-row radius-row">
                      <label htmlFor="radius">Corner radius</label>
                      <select
                        id="radius"
                        value={radius}
                        onChange={(event) => setRadius(event.target.value)}
                      >
                        <option value="8px">Subtle</option>
                        <option value="16px">Rounded</option>
                        <option value="0px">Square</option>
                      </select>
                    </div>
                  </section>
                  <section className="inspector-section">
                    <div className="section-title">
                      <AudioLines size={15} />
                      <h2>ElevenLabs visuals</h2>
                    </div>
                    <p>
                      Choose the caller visual. Live motion follows the call.
                    </p>
                    <div className="caller-fields">
                      <label htmlFor="visual-type">Visualization</label>
                      <select
                        id="visual-type"
                        value={visualType}
                        onChange={(e) =>
                          setVisualType(e.target.value as typeof visualType)
                        }
                      >
                        <option value="both">Orb + Live Waveform</option>
                        <option value="avatar">Caller avatar</option>
                        <option value="orb">Orb</option>
                        <option value="waveform">Live Waveform</option>
                        <option value="bars">Stateful bars</option>
                        <option value="none">None</option>
                      </select>
                      {(visualType === "orb" || visualType === "both") && (
                        <>
                          <div className="feature-row">
                            <span>Follow theme color</span>
                            <Toggle
                              label="Orb follows theme color"
                              checked={orbFollowsTheme}
                              onChange={setOrbFollowsTheme}
                            />
                          </div>
                          {!orbFollowsTheme && (
                            <div className="orb-color-fields">
                              {orbColors.map((color, index) => (
                                <label key={index}>
                                  Orb color {index + 1}
                                  <input
                                    aria-label={`Orb color ${index + 1}`}
                                    type="color"
                                    value={color}
                                    onChange={(e) =>
                                      setOrbColors(
                                        index === 0
                                          ? [e.target.value, orbColors[1]]
                                          : [orbColors[0], e.target.value],
                                      )
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          )}
                          <label htmlFor="orb-speed">Orb motion</label>
                          <select
                            id="orb-speed"
                            value={orbSpeed}
                            onChange={(e) =>
                              setOrbSpeed(Number(e.target.value))
                            }
                          >
                            <option value={0}>Still</option>
                            <option value={0.4}>Subtle</option>
                            <option value={1}>Natural</option>
                            <option value={1.7}>Expressive</option>
                          </select>
                        </>
                      )}
                      {visualType === "bars" && (
                        <>
                          <label htmlFor="bar-count">Number of bars</label>
                          <select
                            id="bar-count"
                            value={barCount}
                            onChange={(e) =>
                              setBarCount(Number(e.target.value))
                            }
                          >
                            <option value={5}>5</option>
                            <option value={12}>12</option>
                            <option value={20}>20</option>
                          </select>
                          <p className="field-hint">
                            Connecting, initializing, listening and speaking
                            follow your call automatically.
                          </p>
                        </>
                      )}
                      {(visualType === "waveform" || visualType === "both") && (
                        <>
                          <label htmlFor="wave-mode">Waveform style</label>
                          <select
                            id="wave-mode"
                            value={waveMode}
                            onChange={(e) =>
                              setWaveMode(e.target.value as typeof waveMode)
                            }
                          >
                            <option value="static">Mirrored bars</option>
                            <option value="scrolling">Scrolling history</option>
                          </select>
                          <label htmlFor="wave-source">Audio source</label>
                          <select
                            id="wave-source"
                            value={waveSource}
                            onChange={(e) =>
                              setWaveSource(e.target.value as typeof waveSource)
                            }
                          >
                            <option value="remote">Other participant</option>
                            <option value="local">Your microphone</option>
                          </select>
                        </>
                      )}
                    </div>
                  </section>
                  <details className="inspector-section config-details">
                    <summary className="section-title">
                      <PanelBottom size={15} />
                      <h2>Window & motion</h2>
                    </summary>
                    <div className="feature-row">
                      <span>Draggable phone</span>
                      <Toggle
                        label="Draggable phone"
                        checked={canDrag}
                        onChange={setCanDrag}
                      />
                    </div>
                    {canDrag && (
                      <div className="caller-fields">
                        <label htmlFor="drag-bounds">Drag boundary</label>
                        <select
                          id="drag-bounds"
                          value={dragBounds}
                          onChange={(e) =>
                            setDragBounds(e.target.value as typeof dragBounds)
                          }
                        >
                          <option value="viewport">Browser window</option>
                          <option value="parent">Embed container</option>
                        </select>
                        <button
                          className="button secondary-button"
                          onClick={() => setPhonePosition({ x: 0, y: 0 })}
                        >
                          Reset phone position
                        </button>
                        <p className="field-hint">
                          Drag the grip or focus it and use arrow keys.
                        </p>
                      </div>
                    )}
                    <div className="feature-row">
                      <span>Smooth animations</span>
                      <Toggle
                        label="Smooth animations"
                        checked={motionEnabled}
                        onChange={setMotionEnabled}
                      />
                    </div>
                    {motionEnabled && (
                      <div className="caller-fields">
                        <label htmlFor="motion-speed">Transition timing</label>
                        <select
                          id="motion-speed"
                          value={motionDuration}
                          onChange={(e) =>
                            setMotionDuration(Number(e.target.value))
                          }
                        >
                          <option value={120}>Quick</option>
                          <option value={220}>Balanced</option>
                          <option value={360}>Relaxed</option>
                        </select>
                      </div>
                    )}
                    <div className="feature-row">
                      <span>Powered by branding</span>
                      <Toggle
                        label="Powered by branding"
                        checked={brandEnabled}
                        onChange={setBrandEnabled}
                      />
                    </div>
                    {brandEnabled && (
                      <div className="caller-fields">
                        <label htmlFor="brand-name">Brand name</label>
                        <input
                          id="brand-name"
                          value={brandName}
                          maxLength={80}
                          onChange={(e) => setBrandName(e.target.value)}
                        />
                        <label htmlFor="brand-url">Brand link (optional)</label>
                        <input
                          id="brand-url"
                          type="url"
                          value={brandUrl}
                          placeholder="https://example.com"
                          onChange={(e) => setBrandUrl(e.target.value)}
                        />
                      </div>
                    )}
                  </details>
                  <details className="inspector-section config-details">
                    <summary className="section-title">
                      <Headphones size={15} />
                      <h2>Sounds & feedback</h2>
                    </summary>
                    <div className="feature-row">
                      <span>Call tones</span>
                      <Toggle
                        label="Call tones"
                        checked={tones.enabled !== false}
                        onChange={(enabled) => setTones({ ...tones, enabled })}
                      />
                    </div>
                    <div className="caller-fields">
                      <label htmlFor="tone-preset">Tone preset</label>
                      <select
                        id="tone-preset"
                        value={tones.preset}
                        onChange={(e) =>
                          setTones({
                            ...tones,
                            preset: e.target
                              .value as PhoneToneOptions["preset"],
                          })
                        }
                      >
                        <option value="gentle">Gentle</option>
                        <option value="classic">Classic telephone</option>
                        <option value="minimal">Minimal</option>
                      </select>
                      <label htmlFor="tone-volume">Tone volume</label>
                      <input
                        id="tone-volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={tones.volume}
                        onChange={(e) =>
                          setTones({ ...tones, volume: Number(e.target.value) })
                        }
                      />
                      <label htmlFor="tone-cue">Preview a tone</label>
                      <select
                        id="tone-cue"
                        value={previewCue}
                        onChange={(e) =>
                          setPreviewCue(e.target.value as PhoneToneEvent)
                        }
                      >
                        {[
                          "incoming",
                          "outgoing",
                          "ringing",
                          "connected",
                          "disconnected",
                          "dtmf",
                        ].map((cue) => (
                          <option value={cue} key={cue}>
                            {cue === "dtmf"
                              ? "Keypad / DTMF"
                              : cue[0].toUpperCase() + cue.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="button secondary-button"
                        disabled={busy || tones.enabled === false}
                        onClick={() => client.previewTone(previewCue)}
                      >
                        Play tone
                      </button>
                    </div>
                    <div className="feature-row">
                      <span>Keypad vibration</span>
                      <Toggle
                        label="Keypad vibration"
                        checked={Boolean(tones.haptics)}
                        onChange={(haptics) => setTones({ ...tones, haptics })}
                      />
                    </div>
                    <p className="field-hint">
                      Vibration works on supported devices. Browser audio may
                      require a click first.
                    </p>
                  </details>
                  <section className="inspector-section">
                    <div className="section-title">
                      <Phone size={15} />
                      <h2>Outgoing calls</h2>
                    </div>
                    <p>
                      Dial freely, prefill a number, or start a call
                      automatically.
                    </p>
                    <div className="caller-fields">
                      <label htmlFor="outgoing-mode">Dial behavior</label>
                      <select
                        id="outgoing-mode"
                        value={outgoingMode}
                        onChange={(e) => {
                          setOutgoingMode(
                            e.target.value as typeof outgoingMode,
                          );
                          setOutgoingRequest(null);
                        }}
                      >
                        <option value="manual">Manual dialer</option>
                        <option value="prefill">Prefill number</option>
                        <option value="auto">
                          Call prefilled number automatically
                        </option>
                      </select>
                      {outgoingMode !== "manual" && (
                        <>
                          <label htmlFor="prefill-number">
                            Prefilled number
                          </label>
                          <input
                            id="prefill-number"
                            type="tel"
                            value={prefillNumber}
                            onChange={(e) => setPrefillNumber(e.target.value)}
                            placeholder="Extension or phone number"
                          />
                          <button
                            className="button dark-button"
                            disabled={
                              busy ||
                              !prefillNumber.trim() ||
                              (outgoingMode === "auto" &&
                                state.connection !== "registered")
                            }
                            onClick={() =>
                              setOutgoingRequest({
                                number: prefillNumber,
                                auto: outgoingMode === "auto",
                                key: crypto.randomUUID(),
                                mode,
                              })
                            }
                          >
                            {outgoingMode === "auto"
                              ? "Start automatic call"
                              : "Apply number"}
                          </button>
                          <p className="field-hint">
                            {outgoingMode === "auto"
                              ? mode === "preview"
                                ? "Starts one simulated call. Your embed waits for registration before dialing."
                                : "Starts one real call to this number. Connect your account first."
                              : "Fills the dialer. You choose when to call."}
                          </p>
                        </>
                      )}
                    </div>
                  </section>
                  <section className="inspector-section">
                    <div className="section-title">
                      <UserRound size={15} />
                      <h2>Caller details</h2>
                      <Toggle
                        label="Show caller details"
                        checked={callerEnabled}
                        onChange={setCallerEnabled}
                      />
                    </div>
                    <p>Bring a little context to every call.</p>
                    {callerEnabled ? (
                      <div className="caller-fields">
                        <label htmlFor="caller-name">Display name</label>
                        <input
                          id="caller-name"
                          value={callerName}
                          onChange={(event) =>
                            setCallerName(event.target.value)
                          }
                        />
                        <label htmlFor="caller-number">
                          Number / extension
                        </label>
                        <input
                          id="caller-number"
                          value={callerNumber}
                          onChange={(event) =>
                            setCallerNumber(event.target.value)
                          }
                        />
                        <label htmlFor="caller-tags">
                          Tags <span>Comma separated</span>
                        </label>
                        <input
                          id="caller-tags"
                          value={callerTags}
                          onChange={(event) =>
                            setCallerTags(event.target.value)
                          }
                        />
                        <label htmlFor="caller-avatar">Avatar URL</label>
                        <input
                          id="caller-avatar"
                          type="url"
                          placeholder="https://…"
                          value={avatarUrl}
                          onChange={(event) => setAvatarUrl(event.target.value)}
                        />
                        <p className="field-hint">
                          Preview contact details are illustrative. Incoming
                          calls use the actual SIP identity.
                        </p>
                      </div>
                    ) : (
                      <div className="caller-placeholder">
                        <span className="mini-avatar">
                          <UserRound size={16} />
                        </span>
                        <div>
                          <span>Names, avatars & tags</span>
                          <small>Your contacts, your context</small>
                        </div>
                      </div>
                    )}
                  </section>
                  <section className="inspector-section">
                    <div className="section-title">
                      <Settings2 size={15} />
                      <h2>Call buttons</h2>
                    </div>
                    <p>Choose the controls in your embedded phone.</p>
                    {defaultCallControls.map((button) => (
                      <div className="feature-row" key={button}>
                        <span>
                          {
                            {
                              mute: "Mute / unmute",
                              keypad: "Keypad",
                              hold: "Hold / resume",
                              transfer: "Transfer",
                              hangup: "End call",
                            }[button]
                          }
                        </span>
                        <Toggle
                          label={`Show ${button} button`}
                          checked={buttons.includes(button)}
                          onChange={(enabled) => {
                            setButtons(
                              defaultCallControls.filter((item) =>
                                item === button
                                  ? enabled
                                  : buttons.includes(item),
                              ),
                            );
                            if (button !== "hangup")
                              setFeatures({ ...features, [button]: enabled });
                          }}
                        />
                      </div>
                    ))}
                  </section>
                  <button
                    className="inspector-code-button"
                    onClick={() => setCodeOpen(true)}
                  >
                    <Code2 size={16} />
                    Use this configuration
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="inspector-content">
                  <section className="inspector-section">
                    <div className="section-title">
                      <Plug size={16} />
                      <h2>Your SIP account</h2>
                    </div>
                    <p>Connect once. Make and receive calls here.</p>
                    {mode === "preview" ? (
                      <div className="connect-preview">
                        <span className="connect-symbol">
                          <Plug size={27} />
                        </span>
                        <h3>Ready for a real conversation?</h3>
                        <p>
                          Switch to live mode to connect your SIP account.
                          You’ll be asked for your password.
                        </p>
                        <button
                          className="button dark-button"
                          disabled={busy}
                          onClick={() => changeMode("live")}
                        >
                          Switch to Live SIP
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    ) : (
                      <PhoneRoot>
                        <ErrorBanner />
                        {state.connection === "registered" ? (
                          <div className="connected-account">
                            <span className="connected-check">
                              <Check size={24} />
                            </span>
                            <h3>You're connected</h3>
                            <ConnectionStatus />
                            <p>You can now make and receive calls.</p>
                            <button
                              className="button secondary-button"
                              onClick={() => client.disconnect()}
                            >
                              Disconnect account
                            </button>
                          </div>
                        ) : (
                          <ConnectionForm />
                        )}
                      </PhoneRoot>
                    )}
                  </section>
                  <section className="inspector-section">
                    <div className="section-title">
                      <Headphones size={15} />
                      <h2>Audio devices</h2>
                    </div>
                    <PhoneRoot>
                      <AudioSettings />
                    </PhoneRoot>
                  </section>
                  <div className="connection-note">
                    <ShieldCheck size={18} />
                    <p>
                      Your password is used only to authenticate with your SIP
                      server. It is never saved in this app.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
        <footer className="page-footer">
          <span>Made for conversations that matter.</span>
          <span>
            React + WebRTC<span className="footer-dot">·</span>Open source
          </span>
        </footer>
      </main>
      {codeOpen && (
        <CodeDialog
          code={code}
          copied={copied}
          onCopy={() => void copyCode()}
          onClose={() => setCodeOpen(false)}
        />
      )}
      <div className="copy-announcement" role="status">
        {copied ? "Configuration copied to clipboard" : ""}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}): ReactElement {
  return (
    <button
      type="button"
      className="toggle"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}): ReactElement {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="button dark-button" onClick={onAction}>
        {actionLabel}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

function IntegrationGuide({ onCode }: { onCode: () => void }): ReactElement {
  return (
    <div className="integration-guide">
      <section>
        <h2>One component to get started.</h2>
        <p>
          Install the package, bring your SIP credentials, and choose a layout.
          Styles come with the phone and stay scoped to it.
        </p>
        <pre>
          <code>npx jsr add @azeer-ui-widget/react-phone</code>
        </pre>
        <button className="text-button" onClick={onCode}>
          <Code2 size={15} />
          Open your configured example
          <ArrowRight size={15} />
        </button>
      </section>
      <section>
        <h2>Build only what you need.</h2>
        <p>
          Share a single SIP connection across individual controls, inside your
          own application layout.
        </p>
        <pre>
          <code>{`<PhoneProvider config={sipConfig} autoConnect>\n  <PhoneRoot>\n    <CallerCard />\n    <Dialer />\n    <CallControls />\n    <ErrorBanner />\n  </PhoneRoot>\n</PhoneProvider>`}</code>
        </pre>
      </section>
      <section>
        <h2>Keep your application in the loop.</h2>
        <div className="guide-table">
          <div>
            <code>onIncomingCall</code>
            <span>Identify the caller and show their context.</span>
          </div>
          <div>
            <code>onAnswered</code>
            <span>Start your connected-call experience.</span>
          </div>
          <div>
            <code>onDisconnected</code>
            <span>Save the outcome and reset your workflow.</span>
          </div>
          <div>
            <code>onEvent</code>
            <span>Observe connection, hold, mute, and transfer events.</span>
          </div>
        </div>
      </section>
      <a
        className="docs-link"
        href="https://alshell7.github.io/react-phone/"
        target="_blank"
        rel="noreferrer"
      >
        <BookOpen size={18} />
        <span>
          Read the full documentation
          <small>Configuration, callbacks, customization, and deployment</small>
        </span>
        <ExternalLink size={16} />
      </a>
    </div>
  );
}

function CodeDialog({
  code,
  copied,
  onCopy,
  onClose,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}): ReactElement {
  useEffect(() => {
    const dialog = document.getElementById("embed-dialog") as HTMLDialogElement;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      id="embed-dialog"
      className="code-dialog"
      aria-labelledby="code-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-inner">
        <header>
          <span className="dialog-icon">
            <Code2 size={22} />
          </span>
          <button
            className="plain-icon"
            aria-label="Close embed code"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <h2 id="code-title">Your phone. In your app.</h2>
        <p>
          Copy your configuration and supply credentials from your sign-in flow.
        </p>
        <div className="install-command">
          <span>Install</span>
          <code>npx jsr add @azeer-ui-widget/react-phone</code>
        </div>
        <div className="code-header">
          <span>MyPhone.jsx</span>
          <button onClick={onCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
        <footer>
          <ShieldCheck size={14} />
          <span>Your SIP credentials are never included in this snippet.</span>
        </footer>
      </div>
    </dialog>
  );
}
