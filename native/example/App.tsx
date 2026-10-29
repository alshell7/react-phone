import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  PhoneIsland,
  PhoneProvider,
  PhoneRoot,
  PhoneWidget,
  usePhone,
  usePhoneTheme,
  withAlpha,
  type Caller,
  type PhoneTheme,
  type PhoneToneOptions,
  type PhoneWidgetProps,
} from "@azeer-ui-widget/react-native-phone";
import { Layers, SlidersHorizontal, Smartphone, SquareDashed } from "lucide-react-native";
import { initialConfig, tagsOf, type PlaygroundConfig, type Surface } from "./src/config";
import { Inspector } from "./src/Inspector";
import { HostScreen } from "./src/HostScreen";
import { audioSession } from "./src/audio-session";

type MobileTab = PlaygroundConfig["mobileTab"];

export default function App() {
  return (
    <SafeAreaProvider>
      <Playground />
    </SafeAreaProvider>
  );
}

function Playground() {
  const [config, setConfig] = useState(initialConfig);
  const update = useCallback(
    (patch: Partial<PlaygroundConfig>) => setConfig((current) => ({ ...current, ...patch })),
    [],
  );
  const theme = useMemo<PhoneTheme>(
    () => ({ appearance: config.appearance, accent: config.accent || undefined }),
    [config.appearance, config.accent],
  );
  const tones = useMemo<PhoneToneOptions | false>(
    () => (config.tonePreset === "off" ? false : { preset: config.tonePreset, haptics: config.haptics }),
    [config.tonePreset, config.haptics],
  );
  const preview = useMemo(
    () => (config.mode === "preview" ? { enabled: true as const, answerDelayMs: 1800 } : undefined),
    [config.mode],
  );
  return (
    // A new mode intentionally creates a new line: preview and live never share state.
    <PhoneProvider key={config.mode} preview={preview} tones={tones} audioSession={audioSession}>
      <PhoneRoot theme={theme} motion={config.motion} style={{ flex: 1 }}>
        <Layout config={config} update={update} theme={theme} />
      </PhoneRoot>
    </PhoneProvider>
  );
}

function useSurfaceProps(config: PlaygroundConfig, theme: PhoneTheme): PhoneWidgetProps {
  const caller = useMemo<Caller | undefined>(
    () =>
      config.callerNumber
        ? { name: config.callerName || undefined, number: config.callerNumber, tags: tagsOf(config.callerTags) }
        : undefined,
    [config.callerName, config.callerNumber, config.callerTags],
  );
  return {
    theme,
    motion: config.motion,
    preset: config.preset,
    visualization: { type: config.visual },
    answerStyle: config.answerStyle,
    defaultNumber: config.defaultNumber,
    branding: config.branding ? { name: "Azeer", href: "https://alshell7.github.io/react-phone/" } : undefined,
    resolveCaller: (incoming) =>
      caller && incoming.number === caller.number ? { ...caller, ...incoming, name: incoming.name ?? caller.name, tags: incoming.tags ?? caller.tags } : incoming,
  };
}

function SurfaceView({
  surface,
  config,
  theme,
  insets,
}: {
  surface: Surface;
  config: PlaygroundConfig;
  theme: PhoneTheme;
  insets: { top: number; bottom: number; left: number; right: number };
}) {
  const props = useSurfaceProps(config, theme);
  const phoneTheme = usePhoneTheme();
  if (surface === "phone") return <PhoneWidget {...props} variant="screen" insets={insets} title="Phone" />;
  if (surface === "island")
    return (
      <View style={{ flex: 1 }}>
        <HostScreen topInset={insets.top} />
        <PhoneIsland
          {...props}
          scope="container"
          placement={config.placement}
          incomingBehavior={config.incomingBehavior}
          tone={config.islandTone}
          insets={insets}
          offset={{ x: 12, y: config.placement.startsWith("top") ? insets.top + 6 : insets.bottom + 6 }}
        />
      </View>
    );
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: phoneTheme.surface }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20, paddingHorizontal: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <PhoneWidget {...props} variant="card" draggable />
    </ScrollView>
  );
}

function Layout({
  config,
  update,
  theme,
}: {
  config: PlaygroundConfig;
  update: (patch: Partial<PlaygroundConfig>) => void;
  theme: PhoneTheme;
}) {
  const { width } = useWindowDimensions();
  const phoneTheme = usePhoneTheme();
  const wide = width >= 980;
  return (
    <View style={{ flex: 1, backgroundColor: phoneTheme.surface }}>
      <StatusBar style={phoneTheme.appearance === "dark" ? "light" : "dark"} />
      {wide ? <WideLayout config={config} update={update} theme={theme} /> : <MobileLayout config={config} update={update} theme={theme} />}
    </View>
  );
}

const surfaces: ReadonlyArray<{ value: Surface; label: string }> = [
  { value: "phone", label: "Full screen" },
  { value: "island", label: "Island" },
  { value: "card", label: "Card" },
];

function ModeBadge() {
  const { preview, state } = usePhone();
  const theme = usePhoneTheme();
  const live = !preview;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, minHeight: 28, borderRadius: 999, backgroundColor: live ? theme.accentSoft : withAlpha(theme.foreground, 0.06) }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: live && state.connection === "registered" ? theme.accent : theme.muted }} />
      <Text style={{ fontSize: 12, fontWeight: "700", color: live ? theme.accent : theme.muted }}>{live ? "Live SIP" : "Preview"}</Text>
    </View>
  );
}

function WideLayout({ config, update, theme }: { config: PlaygroundConfig; update: (patch: Partial<PlaygroundConfig>) => void; theme: PhoneTheme }) {
  const { height } = useWindowDimensions();
  const phoneTheme = usePhoneTheme();
  const frameHeight = Math.max(560, Math.min(844, height - 112));
  const frameWidth = Math.round(frameHeight * (390 / 844));
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 14, borderBottomWidth: 1, borderBottomColor: phoneTheme.border, backgroundColor: phoneTheme.background }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: phoneTheme.foreground }}>Azeer / Phone</Text>
        <Text style={{ fontSize: 14, color: phoneTheme.muted }}>React Native playground</Text>
        <ModeBadge />
        <View style={{ flex: 1 }} />
        <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 4, padding: 3, borderRadius: 12, backgroundColor: phoneTheme.surface }}>
          {surfaces.map((item) => {
            const selected = item.value === config.surface;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                aria-selected={selected}
                onPress={() => update({ surface: item.value })}
                style={{ paddingHorizontal: 14, minHeight: 34, justifyContent: "center", borderRadius: 9, backgroundColor: selected ? phoneTheme.background : "transparent" }}
              >
                <Text style={{ fontSize: 14, fontWeight: selected ? "700" : "500", color: selected ? phoneTheme.foreground : phoneTheme.muted }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            testID="device-frame"
            style={{
              width: frameWidth + 24,
              height: frameHeight + 24,
              borderRadius: 58,
              padding: 12,
              backgroundColor: "#0b0d0c",
              boxShadow: "0 30px 80px -30px rgba(10,30,20,0.55)",
            }}
          >
            <View style={{ flex: 1, borderRadius: 46, overflow: "hidden", backgroundColor: phoneTheme.background }}>
              <DeviceStatusBar />
              <SurfaceView surface={config.surface} config={config} theme={theme} insets={{ top: 44, bottom: 24, left: 0, right: 0 }} />
            </View>
          </View>
        </View>
        <ScrollView
          style={{ width: 420, flexGrow: 0, borderLeftWidth: 1, borderLeftColor: phoneTheme.border, backgroundColor: phoneTheme.background }}
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <Inspector config={config} update={update} />
        </ScrollView>
      </View>
    </View>
  );
}

function DeviceStatusBar() {
  const theme = usePhoneTheme();
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, zIndex: 100, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 30 }}>
      <Text style={{ fontSize: 15, fontWeight: "600", color: theme.foreground }}>9:41</Text>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[10, 13, 16].map((h) => (
          <View key={h} style={{ width: 4, height: h * 0.7, borderRadius: 1, backgroundColor: theme.foreground, alignSelf: "flex-end" }} />
        ))}
        <View style={{ width: 22, height: 11, borderRadius: 3, borderWidth: 1, borderColor: theme.foreground, marginLeft: 4, padding: 1 }}>
          <View style={{ flex: 1, borderRadius: 1.5, backgroundColor: theme.foreground }} />
        </View>
      </View>
    </View>
  );
}

function MobileLayout({ config, update, theme }: { config: PlaygroundConfig; update: (patch: Partial<PlaygroundConfig>) => void; theme: PhoneTheme }) {
  const safe = useSafeAreaInsets();
  const phoneTheme = usePhoneTheme();
  const tab = config.mobileTab;
  const tabBarHeight = 64;
  const insets = { top: safe.top, bottom: safe.bottom + tabBarHeight + 12, left: safe.left, right: safe.right };
  const tabs: ReadonlyArray<{ value: MobileTab; label: string; icon: (p: { size: number; color: string }) => ReactNode }> = [
    { value: "phone", label: "Phone", icon: Smartphone },
    { value: "island", label: "Island", icon: Layers },
    { value: "card", label: "Card", icon: SquareDashed },
    { value: "configure", label: "Configure", icon: SlidersHorizontal },
  ];
  return (
    <View style={{ flex: 1 }}>
      {tab === "configure" ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: phoneTheme.background }}
          contentContainerStyle={{ paddingTop: safe.top + 16, paddingBottom: insets.bottom + 16, paddingHorizontal: 20, gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text accessibilityRole="header" style={{ fontSize: 30, fontWeight: "700", letterSpacing: -0.5, color: phoneTheme.foreground, flex: 1 }}>
              Configure
            </Text>
            <ModeBadge />
          </View>
          <Inspector config={config} update={update} />
        </ScrollView>
      ) : (
        <SurfaceView surface={tab} config={config} theme={theme} insets={insets} />
      )}
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", left: 0, right: 0, bottom: safe.bottom + 8, alignItems: "center" }}
      >
        <View
          accessibilityRole="tablist"
          style={{
            flexDirection: "row",
            height: tabBarHeight,
            padding: 6,
            gap: 4,
            borderRadius: 32,
            backgroundColor: phoneTheme.appearance === "dark" ? "#0c0f0d" : "#ffffff",
            borderWidth: 1,
            borderColor: phoneTheme.border,
            boxShadow: "0 12px 30px -10px rgba(0,0,0,0.35)",
          }}
        >
          {tabs.map(({ value, label, icon: Icon }) => {
            const selected = value === tab;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                aria-selected={selected}
                onPress={() => update(value === "configure" ? { mobileTab: value } : { mobileTab: value, surface: value })}
                style={{ width: 78, borderRadius: 26, alignItems: "center", justifyContent: "center", gap: 2, backgroundColor: selected ? phoneTheme.accentSoft : "transparent" }}
              >
                <Icon size={20} color={selected ? phoneTheme.accent : phoneTheme.muted} />
                <Text style={{ fontSize: 11, fontWeight: selected ? "700" : "500", color: selected ? phoneTheme.accent : phoneTheme.muted }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
