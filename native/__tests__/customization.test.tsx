import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { NotebookPen } from "lucide-react-native";
import {
  PhoneClient,
  SipPhone,
  SipPhoneIsland,
  controlRadius,
  readableColor,
  resolvePhoneTheme,
  type Caller,
  type PhoneClientOptions,
} from "../src/index.ts";
import { createMedia, silent } from "./helpers/sip.ts";

jest.mock("jssip", () => require("./helpers/sip.ts").jssipMock);

const preview = { enabled: true as const, answerDelayMs: 1000 };
const contacts: Caller[] = [
  { name: "Alex Morgan", number: "7003", tags: ["VIP"] },
  { name: "Sam Lee", number: "7010" },
  { name: "Jamie Park", number: "+1 (415) 555-0101" },
];
function previewClient(options: PhoneClientOptions = {}): PhoneClient {
  return new PhoneClient({
    preview,
    media: createMedia().media,
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
async function press(user: ReturnType<typeof setupUser>, digits: string) {
  for (const digit of digits)
    await user.press(screen.getByRole("button", { name: digit }));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("contact suggestions", () => {
  it("suggests contacts by keypad letters and attaches the identity to the call", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        contacts={contacts}
      />,
    );
    await press(user, "26");
    await user.press(screen.getByRole("button", { name: "Use Alex Morgan" }));
    expect(screen.getByTestId("dial-input")).toHaveDisplayValue("7003");
    await user.press(screen.getByRole("button", { name: "Call Alex Morgan" }));
    expect(client.getSnapshot().call?.caller).toMatchObject({
      number: "7003",
      name: "Alex Morgan",
      tags: ["VIP"],
    });
  });

  it("names an exact number match and calls with it without tapping", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        contacts={contacts}
      />,
    );
    await press(user, "7010");
    expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Call Sam Lee" }));
    expect(client.getSnapshot().call?.caller.name).toBe("Sam Lee");
  });

  it("expands more matches, each with a direct call button", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        contacts={contacts}
      />,
    );
    await press(user, "70");
    await user.press(screen.getByRole("button", { name: "1 more" }));
    await user.press(screen.getByRole("button", { name: "Call Sam Lee" }));
    expect(client.getSnapshot().call?.caller).toMatchObject({
      number: "7010",
      name: "Sam Lee",
    });
  });

  it("searches a remote directory, ignoring stale answers", async () => {
    const user = setupUser();
    const searchContacts = jest.fn(async (query: string) =>
      query === "80" ? [{ name: "Directory Person", number: "8000" }] : [],
    );
    await render(
      <SipPhone
        client={previewClient()}
        preview={preview}
        motion={false}
        searchContacts={searchContacts}
      />,
    );
    await press(user, "80");
    await act(async () => {
      await jest.advanceTimersByTimeAsync(200);
    });
    expect(searchContacts).toHaveBeenLastCalledWith("80");
    expect(
      screen.getByRole("button", { name: "Use Directory Person" }),
    ).toBeOnTheScreen();
  });

  it("suggests callers from Recents, and can be turned off", async () => {
    const user = setupUser();
    const client = previewClient();
    const { rerender } = await render(
      <SipPhone client={client} preview={preview} motion={false} />,
    );
    await act(async () =>
      client.simulateIncoming({ name: "Taylor Reed", number: "7999" }),
    );
    await act(async () => client.hangup());
    await press(user, "79");
    expect(
      screen.getByRole("button", { name: "Use Taylor Reed" }),
    ).toBeOnTheScreen();
    await rerender(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        suggestions={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Use Taylor Reed" }),
    ).not.toBeOnTheScreen();
  });
});

describe("speed dial and keypad options", () => {
  it("long-presses a speed-dial key to call it, and announces the shortcut", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        speedDial={{ "1": { name: "Voicemail", number: "*97" }, "2": "7003" }}
      />,
    );
    expect(screen.getByRole("button", { name: "1" })).toHaveProp(
      "accessibilityHint",
      "Long press to call Voicemail",
    );
    await user.longPress(screen.getByRole("button", { name: "1" }));
    expect(client.getSnapshot().call?.caller).toMatchObject({
      number: "*97",
      name: "Voicemail",
    });
    // The digit typed on touch-down is cleared, so the keypad is empty after the call.
    await act(async () => client.hangup());
    expect(screen.getByTestId("dial-input")).toHaveDisplayValue("");
  });

  it("does not speed dial once a number is being typed", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        speedDial={{ "2": "7003" }}
      />,
    );
    await press(user, "1");
    await user.longPress(screen.getByRole("button", { name: "2" }));
    expect(client.getSnapshot().call).toBeNull();
    expect(screen.getByTestId("dial-input")).toHaveDisplayValue("12");
  });

  it("can hide keypad letters and control captions", async () => {
    const user = setupUser();
    await render(
      <SipPhone
        client={previewClient()}
        preview={preview}
        motion={false}
        keypadLetters={false}
        controlLabels={false}
        defaultNumber="7003"
      />,
    );
    expect(screen.queryByText("ABC")).not.toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Call 7003" }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole("button", { name: "Mute" })).toBeOnTheScreen();
    expect(screen.queryByText("Mute")).not.toBeOnTheScreen();
  });
});

describe("custom controls", () => {
  it("adds your own in-call buttons and lets controls position them", async () => {
    const user = setupUser();
    const onNotes = jest.fn();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        defaultNumber="7003"
        controls={["notes", "mute", "hangup"]}
        extraControls={[
          { key: "notes", label: "Notes", icon: NotebookPen, onPress: onNotes },
        ]}
      />,
    );
    await user.press(screen.getByRole("button", { name: "Call 7003" }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    const buttons = screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel);
    expect(buttons.indexOf("Notes")).toBeLessThan(buttons.indexOf("Mute"));
    expect(
      screen.queryByRole("button", { name: "Hold" }),
    ).not.toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Notes" }));
    expect(onNotes).toHaveBeenCalledWith(
      expect.objectContaining({
        caller: expect.objectContaining({ number: "7003" }),
      }),
    );
  });
});

describe("labels and number formatting", () => {
  const spanish = {
    answer: "Contestar",
    decline: "Rechazar",
    mute: "Silenciar",
    incomingCall: "Llamada entrante",
    endReasons: { "Call ended": "Llamada finalizada" },
    callNumber: (number: string) => `Llamar a ${number}`,
  };

  it("translates the phone, including end reasons", async () => {
    const user = setupUser();
    const client = previewClient();
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        labels={spanish}
      />,
    );
    await act(async () =>
      client.simulateIncoming({ name: "Alex Morgan", number: "7003" }),
    );
    expect(screen.getAllByText("Llamada entrante").length).toBeGreaterThan(0);
    await user.press(screen.getByRole("button", { name: "Contestar" }));
    await user.press(screen.getByRole("button", { name: "Silenciar" }));
    await act(async () => client.hangup());
    expect(screen.getByText("Llamada finalizada")).toBeOnTheScreen();
  });

  it("formats displayed numbers without changing what is dialed", async () => {
    const client = previewClient();
    const formatNumber = (number: string) =>
      number.replace(/^(\d{3})(\d{4})$/, "$1-$2");
    await render(
      <SipPhone
        client={client}
        preview={preview}
        motion={false}
        formatNumber={formatNumber}
      />,
    );
    await act(async () => client.simulateIncoming({ number: "5550101" }));
    expect(screen.getAllByText("555-0101").length).toBeGreaterThan(0);
    expect(client.getSnapshot().call?.caller.number).toBe("5550101");
  });

  it("translates the island capsule too", async () => {
    const client = previewClient();
    await render(
      <SipPhoneIsland
        client={client}
        preview={preview}
        motion={false}
        incomingBehavior="notify"
        labels={{ ...spanish, openCall: "Abrir llamada" }}
      />,
    );
    await act(async () => client.simulateIncoming({ number: "7003" }));
    expect(
      screen.getByRole("button", { name: "Abrir llamada" }),
    ).toBeOnTheScreen();
    expect(
      screen.getAllByRole("button", { name: "Contestar" }).length,
    ).toBeGreaterThan(0);
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Rechazar" })[0],
    );
    expect(client.getSnapshot().status).toBe("ended");
  });
});

describe("theme presets and tokens", () => {
  it("resolves presets per appearance and lets tokens override them", () => {
    expect(resolvePhoneTheme({ preset: "ocean" }).accent).toBe("#1f5fbf");
    expect(
      resolvePhoneTheme({ preset: "ocean", appearance: "dark" }).background,
    ).toBe("#111822");
    expect(
      resolvePhoneTheme({ preset: "ocean", accent: "#000000" }).accent,
    ).toBe("#000000");
    expect(resolvePhoneTheme({ preset: "nope" as never }).preset).toBe(
      "forest",
    );
  });

  it("derives answer, keypad, and island tokens", () => {
    const theme = resolvePhoneTheme({ preset: "sunset" });
    expect(theme.answer).toBe(theme.accent);
    expect(theme.keyBackground).toBe(theme.surface);
    expect(resolvePhoneTheme({ answer: "#1e9e4a" })).toMatchObject({
      answer: "#1e9e4a",
      answerForeground: "#ffffff",
    });
    expect(resolvePhoneTheme({ appearance: "dark" }).islandBackground).toBe(
      "#000000",
    );
  });

  it("supports rounded control shapes and readable text colours", () => {
    expect(controlRadius(resolvePhoneTheme(), 64)).toBe(32);
    expect(
      controlRadius(resolvePhoneTheme({ controlShape: "rounded" }), 64),
    ).toBe(19);
    expect(readableColor("#ffffff")).toBe("#0d1510");
    expect(readableColor("#101412")).toBe("#ffffff");
  });
});
