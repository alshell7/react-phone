import type {
  IncomingCallBehavior,
  PhoneIslandPlacement,
  PhonePreset,
  PhoneTheme,
  PhoneTonePreset,
  PhoneVisualization,
  SipConfig,
} from "@azeer-ui-widget/react-native-phone";

export type Surface = "phone" | "island" | "card";
export type InspectorTab = "design" | "behavior" | "connection" | "code";

export interface PlaygroundConfig {
  mode: "preview" | "live";
  surface: Surface;
  /** Lives above the keyed provider so switching modes keeps the open tab. */
  inspectorTab: InspectorTab;
  /** Mobile tab bar selection; Configure is not a phone surface. */
  mobileTab: Surface | "configure";
  appearance: NonNullable<PhoneTheme["appearance"]>;
  accent: string;
  preset: PhonePreset;
  visual: NonNullable<PhoneVisualization["type"]>;
  answerStyle: "buttons" | "slide";
  placement: PhoneIslandPlacement;
  incomingBehavior: IncomingCallBehavior;
  islandTone: "contrast" | "surface";
  tonePreset: PhoneTonePreset | "off";
  haptics: boolean;
  motion: boolean;
  callerName: string;
  callerNumber: string;
  callerTags: string;
  defaultNumber: string;
  branding: boolean;
}

export const accents: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Theme default", value: "" },
  { label: "Ocean", value: "#285dab" },
  { label: "Violet", value: "#6b4fd8" },
  { label: "Coral", value: "#c2553d" },
  { label: "Graphite", value: "#2f3437" },
];

export const initialConfig: PlaygroundConfig = {
  mode: "preview",
  surface: "phone",
  inspectorTab: "design",
  mobileTab: "phone",
  appearance: "light",
  accent: "",
  preset: "advanced",
  visual: "orb",
  answerStyle: "buttons",
  placement: "top-center",
  incomingBehavior: "notify",
  islandTone: "contrast",
  tonePreset: "gentle",
  haptics: true,
  motion: true,
  callerName: "Alex Morgan",
  callerNumber: "7003",
  callerTags: "Preview call, Priority",
  defaultNumber: "",
  branding: true,
};

export function tagsOf(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);
}

/** Non-secret connection defaults. Never put a SIP password in EXPO_PUBLIC_ variables. */
export const liveDefaults: Partial<Omit<SipConfig, "password">> = {
  authorizationUsername: process.env.EXPO_PUBLIC_SIP_USERNAME ?? "",
  uri: process.env.EXPO_PUBLIC_SIP_URI ?? "",
  websocketUrl: process.env.EXPO_PUBLIC_SIP_WEBSOCKET_URL ?? "",
  displayName: process.env.EXPO_PUBLIC_SIP_DISPLAY_NAME || undefined,
};

const quote = (value: string) => JSON.stringify(value);

/** Generated embed code. Credentials are never included. */
export function embedCode(config: PlaygroundConfig): string {
  const theme = [
    config.appearance !== "light" ? `appearance: ${quote(config.appearance)}` : null,
    config.accent ? `accent: ${quote(config.accent)}` : null,
  ].filter(Boolean);
  const common = [
    "config={config}",
    "autoConnect",
    config.preset !== "advanced" ? `preset=${quote(config.preset)}` : null,
    theme.length ? `theme={{ ${theme.join(", ")} }}` : null,
    config.visual !== "waveform" ? `visualization={{ type: ${quote(config.visual)} }}` : null,
    config.answerStyle !== "buttons" ? `answerStyle=${quote(config.answerStyle)}` : null,
    config.tonePreset === "off"
      ? "tones={false}"
      : config.tonePreset !== "gentle" || config.haptics
        ? `tones={{ preset: ${quote(config.tonePreset)}${config.haptics ? ", haptics: true" : ""} }}`
        : null,
    config.motion ? null : "motion={false}",
    config.defaultNumber ? `defaultNumber=${quote(config.defaultNumber)}` : null,
    config.branding ? `branding={{ name: "Azeer", href: "https://alshell7.github.io/react-phone/" }}` : null,
    "audioSession={audioSession}",
  ].filter(Boolean) as string[];
  const imports =
    `import { ${config.surface === "island" ? "SipPhoneIsland" : "SipPhone"}, createInCallManagerAudioSession } from "@azeer-ui-widget/react-native-phone";\n` +
    `import InCallManager from "react-native-incall-manager";\n\n` +
    `const audioSession = createInCallManagerAudioSession(InCallManager);\n\n`;
  if (config.surface === "island") {
    const island = [
      ...common,
      config.placement !== "top-center" ? `placement=${quote(config.placement)}` : null,
      config.incomingBehavior !== "expand" ? `incomingBehavior=${quote(config.incomingBehavior)}` : null,
      config.islandTone !== "contrast" ? `tone=${quote(config.islandTone)}` : null,
      "insets={useSafeAreaInsets()}",
    ].filter(Boolean);
    return `${imports}// Render last in your root view so it floats above every screen.\n<SipPhoneIsland\n  ${island.join("\n  ")}\n/>`;
  }
  const phone = [...common, config.surface === "phone" ? `variant="screen"` : null, config.surface === "phone" ? "insets={useSafeAreaInsets()}" : null].filter(Boolean);
  return `${imports}<SipPhone\n  ${phone.join("\n  ")}\n/>`;
}
