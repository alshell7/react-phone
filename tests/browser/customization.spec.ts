import { test, expect } from "@playwright/test";

const fixture = "/tests/fixtures/phone.html";

test("caller visual replaces avatar, follows theme, and stays still outside active calls", async ({
  page,
}) => {
  await page.goto(fixture);
  const orb = page.locator("[data-orb]");
  await expect(orb).toHaveAttribute("data-renderer", "webgl");
  await expect(orb).toHaveAttribute("data-animated", "false");
  const idlePhase = await orb.locator("canvas").getAttribute("data-phase");
  await page.waitForTimeout(150);
  expect(await orb.locator("canvas").getAttribute("data-phase")).toBe(
    idlePhase,
  );
  await expect(orb).toHaveAttribute("data-state", "idle");
  await expect(page.locator(".az-avatar")).toHaveCount(0);
  await page.evaluate(() =>
    window.phoneHarness.update({ theme: { accent: "#285dab" } }),
  );
  await expect(orb).toHaveAttribute("data-colors", /^rgb\(40,93,171\)/);
  await page.evaluate(() =>
    window.phoneHarness.update({
      visualization: { type: "avatar" },
      caller: { number: "7003", name: "Support Team" },
    }),
  );
  await expect(page.locator(".az-avatar")).toHaveText("ST");
  await expect(orb).toHaveCount(0);
  await page.evaluate(() =>
    window.phoneHarness.update({ visualization: { type: "waveform" } }),
  );
  await expect(page.locator(".az-avatar")).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "Audio waveform idle" }),
  ).toBeVisible();
  await page.evaluate(() =>
    window.phoneHarness.update({
      visualization: { type: "bars", bars: { barCount: 5 } },
    }),
  );
  await expect(page.locator("[data-bar-visualizer] > span")).toHaveCount(5);
  await expect(page.locator("[data-bar-visualizer]")).toHaveAttribute(
    "data-state",
    "idle",
  );
  await page.evaluate(() => window.phoneHarness.client.simulateIncoming());
  await expect(page.locator("[data-bar-visualizer]")).toHaveAttribute(
    "data-state",
    "ringing",
  );
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await expect(page.locator("[data-bar-visualizer]")).toHaveAttribute(
    "data-state",
    "speaking",
  );
  await page.getByRole("button", { name: "Hold", exact: true }).click();
  await expect(page.locator("[data-bar-visualizer]")).toHaveAttribute(
    "data-state",
    "held",
  );
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await expect(page.locator("[data-bar-visualizer]")).toHaveAttribute(
    "data-state",
    "ended",
  );
});

test("dragging supports pointer, keyboard, boundaries and disabling", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.evaluate(() =>
    window.phoneHarness.update({
      draggable: true,
      preset: "basic",
      visualization: { type: "avatar" },
    }),
  );
  const grip = page.getByRole("button", { name: "Move phone", exact: true });
  await expect(grip).toBeVisible();
  await grip.focus();
  const before = await page.locator(".az-widget").boundingBox();
  await grip.press("ArrowDown");
  await expect
    .poll(async () => (await page.locator(".az-widget").boundingBox())!.y)
    .toBeGreaterThan(before!.y + 5);
  await grip.press("Home");
  const bounds = (await grip.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 30,
    bounds.y + bounds.height / 2 + 50,
    { steps: 5 },
  );
  await page.mouse.up();
  const moved = (await page.locator(".az-widget").boundingBox())!;
  expect(moved.y).toBeGreaterThan(before!.y + 20);
  await grip.press("ArrowUp");
  await page.setViewportSize({ width: 390, height: 700 });
  await expect
    .poll(async () => (await page.locator(".az-widget").boundingBox())!.x)
    .toBeGreaterThanOrEqual(0);
  await page.evaluate(() => window.phoneHarness.update({ draggable: false }));
  await expect(grip).toHaveCount(0);
  expect(
    await page
      .locator(".az-widget")
      .evaluate((node) => getComputedStyle(node).transform),
  ).toBe("none");
});

test("configured controls resize, mute works, branding stays last, and motion can be disabled", async ({
  page,
}) => {
  await page.goto(`${fixture}?auto`);
  await expect(
    page.getByRole("button", { name: "End call", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    window.phoneHarness.update({
      controls: ["mute", "hold", "hangup"],
      branding: { name: "Example Voice", href: "https://example.com" },
      motion: false,
    }),
  );
  await expect(page.locator(".az-control-row button")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Transfer", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Unmute", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mute", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".az-powered-by")).toHaveText(
    "Powered by Example Voice",
  );
  await expect(page.locator(".az-powered-by a")).toHaveAttribute(
    "href",
    "https://example.com",
  );
  await expect(page.locator("[data-orb]")).toHaveAttribute(
    "data-animated",
    "false",
  );
  await expect(page.locator(".az-widget")).toHaveAttribute(
    "data-motion",
    "off",
  );
  const full = (await page.locator(".az-widget").boundingBox())!.height;
  await page.evaluate(() =>
    window.phoneHarness.update({
      controls: ["hangup"],
    }),
  );
  await expect(page.locator(".az-control-row")).toHaveCount(0);
  expect((await page.locator(".az-widget").boundingBox())!.height).toBeLessThan(
    full,
  );
  await page.evaluate(() =>
    window.phoneHarness.update({
      branding: { name: "Safe label", href: "javascript:alert(1)" },
      footer: null,
    }),
  );
  await expect(page.locator(".az-powered-by a")).toHaveCount(0);
  await expect(page.locator(".az-widget-footer")).toHaveCount(0);
});

test("playground exports window, tones, motion and control configuration", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("Window & motion", { exact: true }).click();
  await page.getByRole("switch", { name: "Powered by branding" }).click();
  await page.getByLabel("Brand name", { exact: true }).fill("Support Co");
  await expect(page.locator(".az-powered-by")).toContainText("Support Co");
  await page.getByRole("switch", { name: "Smooth animations" }).click();
  await page.getByText("Sounds & feedback", { exact: true }).click();
  await page.getByLabel("Tone preset").selectOption("classic");
  await page.getByRole("button", { name: "Get embed code" }).click();
  await expect(page.locator(".code-dialog pre")).toContainText(
    '"preset":"classic"',
  );
  await expect(page.locator(".code-dialog pre")).toContainText(
    '"enabled":false',
  );
  await expect(page.locator(".code-dialog pre")).toContainText("Support Co");
  await expect(page.locator(".code-dialog pre")).toContainText("controls=");
});

test("parent drag bounds keep a moved phone inside its host", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.evaluate(() => {
    document.querySelector("main")!.style.height = "1000px";
    window.phoneHarness.update({
      preset: "basic",
      visualization: { type: "avatar" },
      draggable: { bounds: "parent" },
    });
  });
  const grip = page.getByRole("button", { name: "Move phone", exact: true });
  await grip.focus();
  for (let i = 0; i < 5; i++) await grip.press("Shift+ArrowRight");
  for (let i = 0; i < 8; i++) await grip.press("Shift+ArrowDown");
  const bounds = (await page.locator("main").boundingBox())!;
  const phone = (await page.locator(".az-widget").boundingBox())!;
  expect(phone.x).toBeGreaterThanOrEqual(bounds.x - 1);
  expect(phone.x + phone.width).toBeLessThanOrEqual(
    bounds.x + bounds.width + 1,
  );
  expect(phone.y).toBeGreaterThan(bounds.y + 50);
  expect(phone.y + phone.height).toBeLessThanOrEqual(
    bounds.y + bounds.height + 1,
  );
});

test("panel resizing uses configured motion timing and reduced motion cancels it", async ({
  page,
}) => {
  await page.goto(`${fixture}?auto`);
  await expect(
    page.getByRole("button", { name: "End call", exact: true }),
  ).toBeVisible();
  const animations = await page.evaluate(async () => {
    const paint = () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      );
    window.phoneHarness.update({ motion: { durationMs: 500 } });
    await paint();
    window.phoneHarness.update({ controls: ["hangup"] });
    await paint();
    return document
      .querySelector(".az-size-frame")!
      .getAnimations()
      .map((animation) => ({
        state: animation.playState,
        duration: animation.effect?.getTiming().duration,
      }));
  });
  expect(animations).toContainEqual({ state: "running", duration: 500 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-orb]")).toHaveAttribute(
    "data-animated",
    "false",
  );
  expect(
    await page
      .locator(".az-size-frame")
      .evaluate((node) => node.getAnimations().length),
  ).toBe(0);
});
