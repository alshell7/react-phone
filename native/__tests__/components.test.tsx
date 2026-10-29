import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  userEvent,
} from "@testing-library/react-native";
import type { ReactNode } from "react";
import {
  CallHistory,
  ConnectionForm,
  ErrorBanner,
  PhoneClient,
  PhoneProvider,
  PhoneRoot,
  SipPhone,
  SipPhoneIsland,
  usePhoneTheme,
  type PhoneClientOptions,
} from "../src/index.ts";
import {
  config as sipConfig,
  createMedia,
  flush,
  silent,
  ua,
  uas,
} from "./helpers/sip.ts";

jest.mock("jssip", () => require("./helpers/sip.ts").jssipMock);

let media: ReturnType<typeof createMedia>;
const preview = { enabled: true as const, answerDelayMs: 1000 };
function previewClient(options: PhoneClientOptions = {}): PhoneClient {
  return new PhoneClient({
    preview,
    media: media.media,
    haptics: silent,
    tones: false,
    ...options,
  });
}
function setupUser() {
  return userEvent.setup({
    advanceTimers: (ms) => jest.advanceTimersByTime(ms),
  });
}
async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}
async function dial(user: ReturnType<typeof setupUser>, digits: string) {
  for (const digit of digits)
    await user.press(screen.getByRole("button", { name: digit }));
}

beforeEach(() => {
  jest.useFakeTimers();
  uas.length = 0;
  media = createMedia();
});
afterEach(() => {
  jest.useRealTimers();
});

describe("SipPhone (preview)", () => {
  it("dials from the keypad and runs a complete outgoing call", async () => {
    const onAnswered = jest.fn();
    const onDisconnected = jest.fn();
    const user = setupUser();
    await render(
      <SipPhone
        client={previewClient({ onAnswered, onDisconnected })}
        preview={preview}
        motion={false}
        onAnswered={onAnswered}
        onDisconnected={onDisconnected}
      />,
    );
    expect(screen.getByLabelText("Preview mode")).toBeOnTheScreen();
    expect(screen.getByRole("tab", { name: "Keypad" })).toBeSelected();
    await dial(user, "7003");
    expect(screen.getByTestId("dial-input")).toHaveDisplayValue("7003");
    await user.press(screen.getByRole("button", { name: "Call 7003" }));
    expect(screen.getByText("Ringing…")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Cancel call" }),
    ).toBeOnTheScreen();
    await advance(1000);
    expect(screen.getByText("Connected")).toBeOnTheScreen();
    expect(onAnswered).toHaveBeenCalledTimes(1);
    for (const name of [
      "Mute",
      "Keypad",
      "Speaker",
      "Hold",
      "Transfer",
      "End call",
    ])
      expect(screen.getByRole("button", { name })).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Mute" }));
    expect(screen.getByRole("button", { name: "Unmute" })).toBeSelected();
    await user.press(screen.getByRole("button", { name: "Hold" }));
    expect(screen.getByText("On hold")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Resume" })).toBeSelected();
    await user.press(screen.getByRole("button", { name: "Resume" }));
    await user.press(screen.getByRole("button", { name: "Speaker" }));
    expect(screen.getByRole("button", { name: "Speaker" })).toBeSelected();

    await user.press(screen.getByRole("button", { name: "End call" }));
    expect(onDisconnected).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Call ended")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Call 7003" })).toBeOnTheScreen();
  });

  it("long-presses 0 for plus and long-presses delete to clear", async () => {
    const user = setupUser();
    await render(
      <SipPhone client={previewClient()} preview={preview} motion={false} />,
    );
    await user.press(screen.getByRole("button", { name: "0" }));
    await user.longPress(screen.getByRole("button", { name: "0" }));
    expect(screen.getByTestId("dial-input")).toHaveDisplayValue("0+");
    await user.press(screen.getByRole("button", { name: "Delete last digit" }));
    expect(screen.getByTestId("dial-input")).toHaveDisplayValue("0");
    await user.press(screen.getByRole("button", { name: "4" }));
    await user.longPress(
      screen.getByRole("button", { name: "Delete last digit" }),
    );
    expect(screen.getByTestId("dial-input")).toHaveDisplayValue("");
    expect(screen.getByRole("button", { name: "Start call" })).toBeDisabled();
  });

  it("sends DTMF from the in-call keypad and shows the digits sent", async () => {
    const onEvent = jest.fn();
    const user = setupUser();
    const client = previewClient({ onEvent });
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        onEvent={onEvent}
        defaultNumber="7003"
      />,
    );
    await user.press(screen.getByRole("button", { name: "Call 7003" }));
    await advance(1000);
    await user.press(screen.getByRole("button", { name: "Keypad" }));
    await user.press(screen.getByRole("button", { name: "5" }));
    await user.press(screen.getByRole("button", { name: "pound" }));
    expect(
      onEvent.mock.calls
        .map(([event]) => event)
        .filter((e) => e.type === "dtmf")
        .map((e) => e.value),
    ).toEqual(["5", "#"]);
    expect(screen.getByLabelText("Sent 5 #")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Hide keypad" }));
    expect(screen.getByRole("button", { name: "Mute" })).toBeOnTheScreen();
  });

  it("answers and declines incoming calls with real caller identity", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        resolveCaller={(caller) => ({ ...caller, tags: ["VIP"] })}
      />,
    );
    await act(async () =>
      client.simulateIncoming({ name: "Alex Morgan", number: "7003" }),
    );
    expect(screen.getByText("Incoming call")).toBeOnTheScreen();
    expect(screen.getByText("Alex Morgan")).toBeOnTheScreen();
    expect(screen.getByText("VIP")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Decline" }));
    expect(screen.getByText("Declined")).toBeOnTheScreen();

    await act(async () =>
      client.simulateIncoming({ name: "Sam Lee", number: "7004" }),
    );
    await user.press(screen.getByRole("button", { name: "Answer" }));
    expect(screen.getByText("Connected")).toBeOnTheScreen();
    expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  });

  it("supports slide-to-answer with a screen-reader activation action", async () => {
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        answerStyle="slide"
      />,
    );
    await act(async () => client.simulateIncoming({ number: "7003" }));
    const slider = screen.getByRole("button", { name: "Answer call" });
    await fireEvent(slider, "accessibilityAction", {
      nativeEvent: { actionName: "activate" },
    });
    expect(client.getSnapshot().status).toBe("active");
  });

  it("transfers only after the transfer succeeds", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        defaultNumber="7003"
      />,
    );
    await user.press(screen.getByRole("button", { name: "Call 7003" }));
    await advance(1000);
    await user.press(screen.getByRole("button", { name: "Transfer" }));
    expect(screen.getByText("Transfer call")).toBeOnTheScreen();
    await user.type(screen.getByLabelText("Destination"), "7010");
    await user.press(screen.getByRole("button", { name: "Transfer" }));
    expect(
      screen.getByRole("button", { name: "Transferring…" }),
    ).toBeDisabled();
    expect(client.getSnapshot().status).toBe("active");
    await advance(1000);
    expect(client.getSnapshot().call?.endReason).toBe("Transferred");
  });

  it("basic preset uses the system phone keyboard and a Call button", async () => {
    const user = setupUser();
    await render(
      <SipPhone
        client={previewClient()}
        preview={preview}
        motion={false}
        preset="basic"
      />,
    );
    expect(screen.queryByRole("button", { name: "5" })).not.toBeOnTheScreen();
    expect(
      screen.queryByRole("tab", { name: "Recents" }),
    ).not.toBeOnTheScreen();
    await user.type(
      screen.getByLabelText("Phone number or SIP address"),
      "7003",
    );
    await user.press(screen.getByRole("button", { name: "Call" }));
    await advance(1000);
    expect(
      screen.queryByRole("button", { name: "Hold" }),
    ).not.toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Transfer" }),
    ).not.toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Mute" })).toBeOnTheScreen();
  });

  it("compact preset and explicit controls limit the in-call buttons", async () => {
    const user = setupUser();
    await render(
      <SipPhone
        client={previewClient()}
        preview={preview}
        motion={false}
        preset="compact"
        controls={["hold", "hangup"]}
        defaultNumber="7003"
      />,
    );
    await user.press(screen.getByRole("button", { name: "Call" }));
    await advance(1000);
    expect(screen.getByRole("button", { name: "Hold" })).toBeOnTheScreen();
    for (const name of ["Mute", "Speaker", "Transfer", "Keypad"])
      expect(screen.queryByRole("button", { name })).not.toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Open audio settings" }),
    ).not.toBeOnTheScreen();
  });

  it("opens audio settings with an adjustable volume control", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(<SipPhone client={client} preview={preview} motion={false} />);
    await user.press(
      screen.getByRole("button", { name: "Open audio settings" }),
    );
    expect(
      screen.getByRole("header", { name: "Audio settings" }),
    ).toBeOnTheScreen();
    const slider = screen.getByRole("adjustable", { name: "Call volume" });
    expect(slider).toHaveAccessibilityValue({ now: 80 });
    await fireEvent(slider, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(client.getSnapshot().volume).toBeCloseTo(0.85);
    await user.press(
      screen.getByRole("button", { name: "Close audio settings" }),
    );
    expect(
      screen.getByRole("button", { name: "Start call" }),
    ).toBeOnTheScreen();
  });

  it("closes settings when a call arrives", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(<SipPhone client={client} preview={preview} motion={false} />);
    await user.press(
      screen.getByRole("button", { name: "Open audio settings" }),
    );
    await act(async () => client.simulateIncoming({ number: "7003" }));
    expect(screen.getByRole("button", { name: "Answer" })).toBeOnTheScreen();
  });

  it("lists recent calls and calls back from Recents", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        defaultNumber="7003"
      />,
    );
    await user.press(screen.getByRole("button", { name: "Call 7003" }));
    await user.press(screen.getByRole("button", { name: "Cancel call" }));
    await act(async () =>
      client.simulateIncoming({ name: "Sam Lee", number: "7004" }),
    );
    await act(async () => client.hangup());
    await user.press(screen.getByRole("tab", { name: "Recents" }));
    expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Call to 7003/)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Call Sam Lee" }));
    expect(client.getSnapshot().call?.caller).toMatchObject({
      number: "7004",
      name: "Sam Lee",
    });
  });

  it("auto-dials once per request key", async () => {
    const client = previewClient();
    const { rerender } = await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        defaultNumber="7003"
        autoDial
        autoDialKey="a"
      />,
    );
    await advance(1);
    expect(client.getSnapshot().call?.direction).toBe("outgoing");
    await act(async () => client.hangup());
    await rerender(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        defaultNumber="7003"
        autoDial
        autoDialKey="a"
      />,
    );
    await advance(10);
    expect(client.getSnapshot().status).toBe("ended");
    await rerender(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        defaultNumber="7003"
        autoDial
        autoDialKey="b"
      />,
    );
    await advance(10);
    expect(client.getSnapshot().status).toBe("ringing");
    expect(client.getSnapshot().history).toHaveLength(1);
  });

  it("renders branding as a link only for http(s) URLs", async () => {
    const { rerender } = await render(
      <SipPhone
        client={previewClient()}
        preview={preview}
        motion={false}
        branding={{ name: "Azeer", href: "https://example.com" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Azeer" })).toBeOnTheScreen();
    await rerender(
      <SipPhone
        client={previewClient()}
        preview={preview}
        motion={false}
        branding={{ name: "Azeer", href: "javascript:alert(1)" }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeOnTheScreen();
    expect(screen.getByText("Azeer")).toBeOnTheScreen();
  });

  it("gives every button an accessible name in every state", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        variant="screen"
        visualization={{ type: "orb" }}
      />,
    );
    const check = () =>
      screen
        .getAllByRole("button")
        .forEach((button) => expect(button).toHaveAccessibleName(/\S/));
    check();
    await act(async () => client.simulateIncoming({ number: "7003" }));
    check();
    await user.press(screen.getByRole("button", { name: "Answer" }));
    check();
    expect(screen.getByRole("image", { name: /Voice orb/ })).toBeOnTheScreen();
  });
});

describe("live connection UI", () => {
  async function registeredClient() {
    const client = new PhoneClient({
      media: media.media,
      haptics: silent,
      tones: false,
    });
    const connecting = client.connect(sipConfig);
    ua().emit("registered");
    await connecting;
    return client;
  }

  it("connects from the form, then clears the password", async () => {
    const onConnected = jest.fn();
    const user = setupUser();
    const client = new PhoneClient({
      media: media.media,
      haptics: silent,
      tones: false,
    });
    await render(
      <PhoneProvider client={client}>
        <PhoneRoot motion={false}>
          <ConnectionForm
            defaultValues={{
              uri: "sip:1001@voice.example.com",
              websocketUrl: "wss://voice.example.com/ws",
            }}
            onConnected={onConnected}
          />
        </PhoneRoot>
      </PhoneProvider>,
    );
    await user.type(screen.getByLabelText("Username"), "auth-user");
    await user.type(screen.getByLabelText("Password"), "test-only");
    await user.press(screen.getByRole("button", { name: "Connect account" }));
    expect(ua().config).toMatchObject({
      authorization_user: "auth-user",
      password: "test-only",
      uri: "sip:1001@voice.example.com",
    });
    expect(screen.getByRole("button", { name: "Connecting…" })).toBeDisabled();
    await act(async () => {
      ua().emit("registered");
      await flush();
    });
    expect(onConnected).toHaveBeenCalled();
    expect(screen.getByLabelText("Password")).toHaveDisplayValue("");
  });

  it("shows actionable errors and dismisses them", async () => {
    const user = setupUser();
    const client = new PhoneClient({
      media: media.media,
      haptics: silent,
      tones: false,
    });
    await render(
      <PhoneProvider client={client}>
        <ErrorBanner />
      </PhoneProvider>,
    );
    await act(async () => {
      await client.call("7003").catch(() => {});
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Connect your SIP account before calling.",
    );
    await user.press(screen.getByRole("button", { name: "Dismiss error" }));
    expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
  });

  it("offers Settings when the microphone permission is blocked", async () => {
    const user = setupUser();
    const client = await registeredClient();
    media.media.requestMicrophonePermission = jest.fn(
      async () => "blocked" as const,
    );
    await render(
      <PhoneProvider client={client}>
        <ErrorBanner />
      </PhoneProvider>,
    );
    await act(async () => {
      await client.call("7003").catch(() => {});
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/turned off/);
    await user.press(screen.getByRole("button", { name: "Open Settings" }));
    expect(media.media.openSettings).toHaveBeenCalled();
    client.dispose();
  });

  it("hides the speaker control when no audio route adapter exists", async () => {
    const user = setupUser();
    const client = await registeredClient();
    await render(
      <SipPhone client={client} motion={false} defaultNumber="7003" />,
    );
    await user.press(screen.getByRole("button", { name: "Call 7003" }));
    await act(async () => {
      ua().call.mock.results[0].value.emit("accepted");
    });
    expect(screen.getByRole("button", { name: "Mute" })).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Speaker" }),
    ).not.toBeOnTheScreen();
    client.dispose();
  });
});

describe("SipPhoneIsland", () => {
  const island = (client: PhoneClient, props: Record<string, unknown> = {}) => (
    <SipPhoneIsland
      client={client}
      preview={preview}
      motion={false}
      {...props}
    />
  );

  it("expands for incoming calls and collapses after the call", async () => {
    const onExpandedChange = jest.fn();
    const client = previewClient();
    await render(island(client, { onExpandedChange }));
    expect(screen.getByRole("button", { name: "Open phone" })).toBeCollapsed();
    await act(async () =>
      client.simulateIncoming({ name: "Alex Morgan", number: "7003" }),
    );
    expect(
      screen.getByRole("button", { name: "Collapse phone" }),
    ).toBeExpanded();
    expect(onExpandedChange).toHaveBeenLastCalledWith(true, "incoming");
    await act(async () => client.answer());
    await act(async () => client.hangup());
    await advance(1400);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false, "ended");
    expect(
      screen.getByRole("button", { name: "Open phone" }),
    ).toBeOnTheScreen();
  });

  it("shows a heads-up banner in notify mode without expanding", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(island(client, { incomingBehavior: "notify" }));
    await act(async () =>
      client.simulateIncoming({ name: "Alex Morgan", number: "7003" }),
    );
    expect(screen.getByRole("button", { name: "Open call" })).toBeCollapsed();
    expect(screen.getAllByText("Alex Morgan").length).toBeGreaterThan(0);
    await user.press(screen.getAllByRole("button", { name: "Answer" })[0]);
    expect(client.getSnapshot().status).toBe("active");
    expect(
      screen.getByRole("button", { name: "Collapse phone" }),
    ).toBeExpanded();
  });

  it("stays collapsed in manual mode and keeps calls alive across collapse", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(island(client, { incomingBehavior: "manual" }));
    await act(async () => client.simulateIncoming({ number: "7003" }));
    expect(screen.getByRole("button", { name: "Open call" })).toBeCollapsed();
    expect(screen.getByText("Incoming call")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Open call" }));
    await user.press(screen.getAllByRole("button", { name: "Answer" })[0]);
    await user.press(screen.getByRole("button", { name: "Collapse phone" }));
    expect(client.getSnapshot().status).toBe("active");
    expect(screen.getByText("In conversation")).toBeOnTheScreen();
    expect(screen.getByLabelText(/Call duration/)).toBeOnTheScreen();
  });

  it("supports controlled expansion", async () => {
    const user = setupUser();
    const onExpandedChange = jest.fn();
    const client = previewClient();
    await render(island(client, { expanded: false, onExpandedChange }));
    await user.press(screen.getByRole("button", { name: "Open phone" }));
    expect(onExpandedChange).toHaveBeenCalledWith(true, "user");
    expect(screen.getByRole("button", { name: "Open phone" })).toBeCollapsed();
  });

  it("expands for outgoing calls started from inside the island", async () => {
    const client = previewClient();
    await render(island(client, { defaultNumber: "7003", autoDial: true }));
    await advance(1);
    expect(
      screen.getByRole("button", { name: "Collapse phone" }),
    ).toBeExpanded();
    expect(screen.getByText("Calling")).toBeOnTheScreen();
  });
});

describe("standalone pieces", () => {
  it("resolves themes for custom components", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PhoneRoot theme={{ appearance: "dark", accent: "#285dab" }}>
        {children}
      </PhoneRoot>
    );
    const { result } = await renderHook(() => usePhoneTheme(), { wrapper });
    expect(result.current).toMatchObject({
      appearance: "dark",
      accent: "#285dab",
    });
  });

  it("shows an empty Recents state", async () => {
    await render(
      <PhoneProvider client={previewClient()} preview={preview}>
        <CallHistory />
      </PhoneProvider>,
    );
    expect(screen.getByText("No recent calls")).toBeOnTheScreen();
  });
});
