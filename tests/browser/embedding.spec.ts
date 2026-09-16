import { test, expect } from "@playwright/test";

const fixture = "/tests/fixtures/phone.html";

test("automatic prefilled calls survive StrictMode, rerenders and reconnects without redial", async ({
  page,
}) => {
  await page.goto(`${fixture}?auto&number=7003`);
  await expect(
    page.getByRole("button", { name: "End call", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.phoneHarness.events.filter((e) => e.type === "outgoing")
            .length,
      ),
    )
    .toBe(1);
  await page.evaluate(() => {
    window.phoneHarness.client.hangup();
    window.phoneHarness.update({ theme: { appearance: "dark" } });
  });
  await page.evaluate(() => {
    window.phoneHarness.client.disconnect();
    window.phoneHarness.client.startPreview();
  });
  await expect(page.getByRole("button", { name: "Start call" })).toBeVisible();
  // Let multiple React renders and reconnection effects settle.
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(
      () =>
        window.phoneHarness.events.filter((e) => e.type === "outgoing").length,
    ),
  ).toBe(1);
  await page.evaluate(() =>
    window.phoneHarness.update({ autoDialKey: "second-intent" }),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.phoneHarness.events.filter((e) => e.type === "outgoing")
            .length,
      ),
    )
    .toBe(2);
});

test("prefill stays editable, prop changes update it, and a busy auto request does not queue", async ({
  page,
}) => {
  await page.goto(fixture);
  const input = page.getByRole("textbox", {
    name: "Phone number or SIP address",
  });
  await expect(input).toHaveValue("7003");
  await input.fill("7009");
  await page.evaluate(() =>
    window.phoneHarness.update({ title: "Updated title" }),
  );
  await expect(input).toHaveValue("7009");
  await page.evaluate(() =>
    window.phoneHarness.update({ defaultNumber: "7010" }),
  );
  await expect(input).toHaveValue("7010");
  expect(
    await page.evaluate(() =>
      window.phoneHarness.events.filter((e) => e.type === "outgoing"),
    ),
  ).toHaveLength(0);
  await page.evaluate(() => {
    window.phoneHarness.client.simulateIncoming();
    window.phoneHarness.update({ autoDial: true });
  });
  await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(input).toBeVisible();
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(() =>
      window.phoneHarness.events.filter((e) => e.type === "outgoing"),
    ),
  ).toHaveLength(0);
});

test("playground configures real Orb, scrolling waveform and prefilled automatic calling", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("[data-orb]")).toHaveAttribute(
    "data-renderer",
    "webgl",
  );
  await page.getByLabel("Orb motion", { exact: true }).selectOption("0.4");
  await page.getByLabel("Waveform style").selectOption("scrolling");
  await page.getByLabel("Dial behavior").selectOption("prefill");
  await page.getByLabel("Prefilled number").fill("7012");
  await page.getByRole("button", { name: "Apply number" }).click();
  await expect(
    page.getByRole("textbox", { name: "Phone number or SIP address" }),
  ).toHaveValue("7012");
  await page.getByLabel("Dial behavior").selectOption("auto");
  await page.getByRole("button", { name: "Start automatic call" }).click();
  await expect(
    page.getByRole("button", { name: "End call", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Simulated audio", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Get embed code" }).click();
  const code = page.locator(".code-dialog pre");
  await expect(code).toContainText("autoDial");
  await expect(code).toContainText('defaultNumber={"7012"}');
  await expect(code).toContainText('"mode":"scrolling"');
  await expect(code).toContainText('"speed":0.4');
  expect(errors).toEqual([]);
});

test("visuals never capture microphones and release borrowed audio without stopping it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { captureCount: 0 });
    navigator.mediaDevices.getUserMedia = async () => {
      (window as unknown as { captureCount: number }).captureCount++;
      throw new Error("Unexpected microphone capture");
    };
  });
  await page.goto(fixture);
  await page.evaluate(async () => {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    oscillator.frequency.value = 440;
    const destination = audio.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.start();
    await audio.resume();
    Object.assign(window, {
      borrowedStream: destination.stream,
      sourceAudio: audio,
    });
    window.phoneHarness.visual(destination.stream);
  });
  const visual = page.getByTestId("borrowed-waveform");
  await expect(visual).toHaveAttribute("aria-label", "Live audio waveform");
  await expect
    .poll(() =>
      visual.locator("canvas").evaluate((canvas) => {
        const c = canvas as HTMLCanvasElement;
        const pixels = c
          .getContext("2d")!
          .getImageData(0, 0, c.width, c.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0);
      }),
    )
    .toBe(true);
  await page.evaluate(() => window.phoneHarness.visual(null));
  await expect(visual).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as { borrowedStream: MediaStream }
        ).borrowedStream.getAudioTracks()[0].readyState,
    ),
  ).toBe("live");
  expect(
    await page.evaluate(
      () => (window as unknown as { captureCount: number }).captureCount,
    ),
  ).toBe(0);
  await page.evaluate(async () => {
    const resources = window as unknown as {
      borrowedStream: MediaStream;
      sourceAudio: AudioContext;
    };
    resources.borrowedStream.getTracks().forEach((track) => track.stop());
    await resources.sourceAudio.close();
  });
});

test("Orb falls back without WebGL and waveform respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await page.goto(`${fixture}?auto`);
  await expect(page.locator("[data-orb]")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await expect(
    page.getByRole("button", { name: "End call", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Audio waveform idle" }),
  ).toBeVisible();
});
