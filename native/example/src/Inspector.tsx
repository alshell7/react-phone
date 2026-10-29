import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Button,
  ConnectionForm,
  usePhone,
  usePhoneTheme,
} from "@azeer-ui-widget/react-native-phone";
import { PhoneIncoming, Copy, Check } from "lucide-react-native";
import {
  accents,
  embedCode,
  liveDefaults,
  tagsOf,
  type PlaygroundConfig,
} from "./config";
import { Chips, Input, Section, Swatches, Toggle } from "./ui";


export function Inspector({
  config,
  update,
}: {
  config: PlaygroundConfig;
  update: (patch: Partial<PlaygroundConfig>) => void;
}) {
  const theme = usePhoneTheme();
  const { client, state, preview } = usePhone();
  const tab = config.inspectorTab;
  const setTab = (inspectorTab: PlaygroundConfig["inspectorTab"]) => update({ inspectorTab });
  const [copied, setCopied] = useState(false);
  const busy = !["idle", "ended"].includes(state.status);
  const code = embedCode(config);
  return (
    <View style={{ gap: 22 }}>
      <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 4, padding: 3, borderRadius: 12, backgroundColor: theme.surface }}>
        {(["design", "behavior", "connection", "code"] as const).map((value) => {
          const selected = tab === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() => setTab(value)}
              style={{ flex: 1, minHeight: 36, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: selected ? theme.background : "transparent" }}
            >
              <Text style={{ fontSize: 13, fontWeight: selected ? "700" : "500", color: selected ? theme.foreground : theme.muted, textTransform: "capitalize" }}>
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {preview ? (
        <Button
          label="Simulate incoming call"
          icon={PhoneIncoming}
          tone="secondary"
          disabled={busy}
          onPress={() =>
            client.simulateIncoming({
              name: config.callerName || undefined,
              number: config.callerNumber || "7003",
              tags: tagsOf(config.callerTags),
            })
          }
          testID="simulate-incoming"
        />
      ) : null}

      {tab === "design" ? (
        <>
          <Section title="Appearance">
            <Chips
              label="Appearance"
              value={config.appearance}
              onChange={(appearance) => update({ appearance })}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ]}
            />
          </Section>
          <Section title="Accent">
            <Swatches value={config.accent} options={accents} onChange={(accent) => update({ accent })} />
          </Section>
          <Section title="Preset">
            <Chips
              label="Preset"
              value={config.preset}
              onChange={(preset) => update({ preset })}
              options={[
                { value: "advanced", label: "Advanced" },
                { value: "basic", label: "Basic" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </Section>
          <Section title="Caller visual">
            <Chips
              label="Caller visual"
              value={config.visual}
              onChange={(visual) => update({ visual })}
              options={[
                { value: "orb", label: "Orb" },
                { value: "avatar", label: "Avatar" },
                { value: "waveform", label: "Waveform" },
                { value: "bars", label: "Bars" },
                { value: "both", label: "Orb + wave" },
                { value: "none", label: "None" },
              ]}
            />
          </Section>
          <Section title="Caller identity">
            <Input label="Name" value={config.callerName} onChange={(callerName) => update({ callerName })} />
            <Input label="Number" value={config.callerNumber} onChange={(callerNumber) => update({ callerNumber })} />
            <Input label="Tags (comma separated)" value={config.callerTags} onChange={(callerTags) => update({ callerTags })} />
          </Section>
          <Toggle label="Powered-by branding" value={config.branding} onChange={(branding) => update({ branding })} />
        </>
      ) : null}

      {tab === "behavior" ? (
        <>
          <Section title="Answer with">
            <Chips
              label="Answer with"
              value={config.answerStyle}
              onChange={(answerStyle) => update({ answerStyle })}
              options={[
                { value: "buttons", label: "Buttons" },
                { value: "slide", label: "Slide to answer" },
              ]}
            />
          </Section>
          <Section title="Island placement">
            <Chips
              label="Island placement"
              value={config.placement}
              onChange={(placement) => update({ placement })}
              options={[
                { value: "top-left", label: "Top left" },
                { value: "top-center", label: "Top" },
                { value: "top-right", label: "Top right" },
                { value: "bottom-left", label: "Bottom left" },
                { value: "bottom-center", label: "Bottom" },
                { value: "bottom-right", label: "Bottom right" },
              ]}
            />
          </Section>
          <Section title="Incoming on island">
            <Chips
              label="Incoming on island"
              value={config.incomingBehavior}
              onChange={(incomingBehavior) => update({ incomingBehavior })}
              options={[
                { value: "notify", label: "Banner" },
                { value: "expand", label: "Expand" },
                { value: "manual", label: "Stay collapsed" },
              ]}
            />
          </Section>
          <Section title="Island tone">
            <Chips
              label="Island tone"
              value={config.islandTone}
              onChange={(islandTone) => update({ islandTone })}
              options={[
                { value: "contrast", label: "Contrast capsule" },
                { value: "surface", label: "Surface" },
              ]}
            />
          </Section>
          <Section title="Sound & touch">
            <Chips
              label="Tones"
              value={config.tonePreset}
              onChange={(tonePreset) => update({ tonePreset })}
              options={[
                { value: "gentle", label: "Gentle" },
                { value: "classic", label: "Classic" },
                { value: "minimal", label: "Minimal" },
                { value: "off", label: "Off" },
              ]}
            />
            <Toggle label="Haptics" hint="Keypad taps and call milestones" value={config.haptics} onChange={(haptics) => update({ haptics })} />
            <Toggle label="Motion" hint="Reduce Motion in system settings always wins" value={config.motion} onChange={(motion) => update({ motion })} />
          </Section>
          <Section title="Dialing">
            <Input label="Prefilled number" value={config.defaultNumber} onChange={(defaultNumber) => update({ defaultNumber })} placeholder="Optional" />
          </Section>
        </>
      ) : null}

      {tab === "connection" ? (
        <>
          <Section title="Mode">
            <Chips
              label="Mode"
              value={config.mode}
              onChange={(mode) => update({ mode })}
              options={[
                { value: "preview", label: "Preview" },
                { value: "live", label: "Live SIP" },
              ]}
            />
            <Text style={{ fontSize: 13, color: theme.muted }}>
              {config.mode === "preview"
                ? "Preview simulates calls with no network or microphone."
                : "Live SIP registers your account over secure WebSocket. Credentials stay in memory."}
            </Text>
          </Section>
          {config.mode === "live" ? (
            state.connection === "registered" ? (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 15, color: theme.foreground }}>Registered and ready for calls.</Text>
                <Button label="Disconnect" tone="secondary" onPress={() => client.disconnect()} />
              </View>
            ) : (
              <ConnectionForm defaultValues={liveDefaults} />
            )
          ) : null}
        </>
      ) : null}

      {tab === "code" ? (
        <Section title="Embed">
          <View style={{ borderRadius: 14, backgroundColor: "#0f1411", padding: 14 }}>
            <Text selectable style={{ color: "#d9e6dc", fontSize: 12, lineHeight: 18, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, SFMono-Regular, Menlo, monospace" }) }}>
              {code}
            </Text>
          </View>
          <Button
            label={copied ? "Copied" : "Copy code"}
            icon={copied ? Check : Copy}
            tone="secondary"
            onPress={() => {
              void Clipboard.setStringAsync(code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              });
            }}
          />
          <Text style={{ fontSize: 12, color: theme.muted }}>Generated code never includes credentials.</Text>
        </Section>
      ) : null}
    </View>
  );
}
