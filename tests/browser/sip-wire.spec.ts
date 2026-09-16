import { test, expect, chromium, type Page } from "@playwright/test";
import type { PhoneClient } from "../../src/core/phone-client.ts";
import { startTestSipServer } from "./sip-server.ts";

declare global {
  interface Window {
    testPhone: PhoneClient;
  }
}

async function connect(
  page: Page,
  websocketUrl: string,
  username: string,
): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    async ({ websocketUrl, username }) => {
      const modulePath = "/src/core/phone-client.ts";
      const { PhoneClient } = await import(/* @vite-ignore */ modulePath);
      window.testPhone = new PhoneClient();
      await window.testPhone.connect({
        websocketUrl,
        uri: `sip:${username}@localhost`,
        authorizationUsername: username,
        password: "fixture-password",
      });
    },
    { websocketUrl, username },
  );
}

test("real SIP registration and two-browser WebRTC call: answer, media, mute, hold, DTMF and hangup", async () => {
  test.setTimeout(60000);
  const server = await startTestSipServer();
  const browser = await chromium.launch({
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const context = await browser.newContext({ permissions: ["microphone"] });
  const caller = await context.newPage();
  const recipient = await context.newPage();
  await caller.addInitScript(() => {
    const capture = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    Object.assign(window, { captureCount: 0 });
    navigator.mediaDevices.getUserMedia = (constraints) => {
      (window as unknown as { captureCount: number }).captureCount++;
      return capture(constraints);
    };
  });
  try {
    await connect(recipient, server.url, "1002");
    // Supply a destination before registration. The React embed must wait, then
    // originate one real SIP INVITE without a dial-button click.
    await caller.goto("/tests/fixtures/phone.html?live&auto&number=1002");
    await caller.waitForFunction(() => Boolean(window.phoneHarness));
    expect(
      await caller.evaluate(() =>
        window.phoneHarness.events.filter((e) => e.type === "outgoing"),
      ),
    ).toHaveLength(0);
    await caller.evaluate(async (websocketUrl) => {
      window.testPhone = window.phoneHarness.client;
      await window.testPhone.connect({
        websocketUrl,
        uri: "sip:1001@localhost",
        authorizationUsername: "1001",
        password: "fixture-password",
      });
    }, server.url);
    await expect
      .poll(() =>
        recipient.evaluate(() => window.testPhone.getSnapshot().status),
      )
      .toBe("incoming");
    await recipient.evaluate(() => window.testPhone.answer());
    for (const page of [caller, recipient]) {
      await expect
        .poll(() => page.evaluate(() => window.testPhone.getSnapshot().status))
        .toBe("active");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              window.testPhone.getSnapshot().remoteStream?.getAudioTracks()
                .length,
          ),
        )
        .toBe(1);
      await expect
        .poll(
          () =>
            page.evaluate(async () => {
              const audio = new AudioContext();
              const source = audio.createMediaStreamSource(
                window.testPhone.getSnapshot().remoteStream!,
              );
              const analyser = audio.createAnalyser();
              source.connect(analyser);
              await audio.resume();
              await new Promise((resolve) => setTimeout(resolve, 150));
              const data = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(data);
              const audible = data.some((value) => value > 0);
              source.disconnect();
              await audio.close();
              return audible;
            }),
          { timeout: 10000 },
        )
        .toBe(true);
    }
    await caller.evaluate(() => window.testPhone.setMuted(true));
    const orb = caller.locator("[data-orb]");
    await expect(orb).toHaveAttribute("data-renderer", "webgl");
    await expect(orb).toHaveAttribute("data-animated", "true");
    await expect(orb).toHaveAttribute("data-state", "talking");
    await expect
      .poll(async () =>
        Number(await orb.locator("canvas").getAttribute("data-output-level")),
      )
      .toBeGreaterThan(0.035);
    const phase = Number(
      await orb.locator("canvas").getAttribute("data-phase"),
    );
    await expect
      .poll(async () =>
        Number(await orb.locator("canvas").getAttribute("data-phase")),
      )
      .toBeGreaterThan(phase + 0.005);
    // Compare actual GPU output across two live frames, not just state labels.
    const frame = await orb.screenshot();
    await caller.waitForTimeout(250);
    expect((await orb.screenshot()).equals(frame)).toBe(false);
    expect(
      await caller.evaluate(
        () => (window as unknown as { captureCount: number }).captureCount,
      ),
    ).toBe(1);
    expect(
      await caller.evaluate(
        () =>
          window.testPhone.getSnapshot().localStream!.getAudioTracks()[0]
            .enabled,
      ),
    ).toBe(false);
    await caller.evaluate(() => window.testPhone.setMuted(false));
    await caller.evaluate(() => window.testPhone.setHeld(true));
    await expect(orb).toHaveAttribute("data-state", "held");
    await expect(orb).toHaveAttribute("data-animated", "false");
    const heldPhase = await orb.locator("canvas").getAttribute("data-phase");
    await caller.waitForTimeout(150);
    expect(await orb.locator("canvas").getAttribute("data-phase")).toBe(
      heldPhase,
    );
    await expect
      .poll(() =>
        recipient.evaluate(() => window.testPhone.getSnapshot().remoteHeld),
      )
      .toBe(true);
    await caller.evaluate(() => window.testPhone.setHeld(false));
    await expect
      .poll(() =>
        recipient.evaluate(() => window.testPhone.getSnapshot().remoteHeld),
      )
      .toBe(false);
    await caller.evaluate(() => window.testPhone.sendDTMF("5"));
    await caller.evaluate(() =>
      window.phoneHarness.update({ visualization: { type: "bars" } }),
    );
    await expect(caller.locator("[data-bar-visualizer]")).toHaveAttribute(
      "data-state",
      "speaking",
    );
    await caller.evaluate(() => window.testPhone.hangup());
    for (const page of [caller, recipient]) {
      await expect
        .poll(() => page.evaluate(() => window.testPhone.getSnapshot().status))
        .toBe("ended");
      expect(
        await page.evaluate(() => window.testPhone.getSnapshot().localStream),
      ).toBeNull();
    }
    expect(server.methods).toContain("REGISTER");
    expect(server.methods).toContain("INVITE");
    expect(server.methods).toContain("ACK");
    expect(server.methods).toContain("BYE");
    // Re-registration and a visual prop update cannot redial the supplied number.
    await caller.evaluate(async (websocketUrl) => {
      window.phoneHarness.update({ title: "Another render" });
      window.testPhone.disconnect();
      await window.testPhone.connect({
        websocketUrl,
        uri: "sip:1001@localhost",
        authorizationUsername: "1001",
        password: "fixture-password",
      });
    }, server.url);
    await expect(
      caller.getByRole("button", { name: "Start call" }),
    ).toBeVisible();
    expect(
      await caller.evaluate(() =>
        window.phoneHarness.events.filter((e) => e.type === "outgoing"),
      ),
    ).toHaveLength(1);
  } finally {
    await Promise.allSettled([
      caller.evaluate(() => window.testPhone?.dispose()),
      recipient.evaluate(() => window.testPhone?.dispose()),
    ]);
    await browser.close();
    await server.close();
  }
});

test("an automatic call denied microphone permission reports once and never retries", async ({
  page,
}) => {
  const server = await startTestSipServer();
  try {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException("Denied", "NotAllowedError");
      };
    });
    await page.goto("/tests/fixtures/phone.html?live&auto&number=1002");
    await page.waitForFunction(() => Boolean(window.phoneHarness));
    await page.evaluate(async (websocketUrl) => {
      await window.phoneHarness.client.connect({
        websocketUrl,
        uri: "sip:1001@localhost",
        authorizationUsername: "1001",
        password: "fixture-password",
      });
    }, server.url);
    await expect
      .poll(() =>
        page.evaluate(
          () => window.phoneHarness.client.getSnapshot().microphone,
        ),
      )
      .toBe("denied");
    await expect(page.getByRole("alert")).toContainText(/microphone/i);
    await page.evaluate(() => {
      window.phoneHarness.client.clearError();
      window.phoneHarness.update({ theme: { appearance: "dark" } });
    });
    await expect(
      page.getByRole("button", { name: "Start call" }),
    ).toBeVisible();
    await page.waitForTimeout(200);
    expect(
      await page.evaluate(() =>
        window.phoneHarness.events.filter((e) => e.type === "outgoing"),
      ),
    ).toHaveLength(1);
    expect(server.methods).not.toContain("INVITE");
  } finally {
    await page.evaluate(() => window.phoneHarness?.client.dispose());
    await server.close();
  }
});
