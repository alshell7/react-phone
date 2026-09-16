import { describe, expect, it } from "vitest";
import { PhoneClient } from "../src/core/phone-client.ts";
import { getCallVisualState } from "../src/core/visual-state.ts";
import type { PhoneSnapshot } from "../src/core/types.ts";

const base = new PhoneClient().getSnapshot();
describe("SIP visual lifecycle", () => {
  it.each([
    [{ status: "idle" }, "idle"],
    [{ connection: "connecting" }, "connecting"],
    [{ connection: "reconnecting" }, "connecting"],
    [{ status: "requesting-microphone" }, "initializing"],
    [{ status: "answering" }, "initializing"],
    [{ status: "dialing" }, "connecting"],
    [{ status: "incoming" }, "ringing"],
    [{ status: "ringing" }, "ringing"],
    [{ status: "active" }, "listening"],
    [{ status: "active", transferPending: true }, "thinking"],
    [{ status: "held" }, "held"],
    [{ status: "active", remoteHeld: true }, "held"],
    [{ status: "ended" }, "ended"],
    [{ connection: "error" }, "error"],
  ] as Array<[Partial<PhoneSnapshot>, string]>)(
    "maps %o to %s",
    (patch, result) =>
      expect(getCallVisualState({ ...base, ...patch })).toBe(result),
  );
  it("speaks from either audio direction but never from a muted local microphone", () => {
    const active: PhoneSnapshot = { ...base, status: "active" };
    expect(getCallVisualState(active, 0.2, 0)).toBe("speaking");
    expect(getCallVisualState(active, 0, 0.2)).toBe("speaking");
    expect(getCallVisualState({ ...active, muted: true }, 0.2, 0)).toBe(
      "listening",
    );
    expect(getCallVisualState({ ...active, remoteHeld: true }, 0.2, 0.2)).toBe(
      "held",
    );
  });
});
