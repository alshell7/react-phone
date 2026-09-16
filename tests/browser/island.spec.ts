import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const fixture = "/tests/fixtures/phone.html?island";

test("island expands on incoming, preserves the call when collapsed, and returns to idle", async ({
  page,
}) => {
  await page.goto(fixture);
  const shell = page.locator(".az-island-shell");
  await expect(shell).toHaveAttribute("data-expanded", "false");
  await expect(
    page.getByText("Preview mode", { exact: true }).first(),
  ).toBeVisible();
  await page.evaluate(() => {
    window.phoneHarness.update({
      collapseDelayMs: 20,
      visualization: { type: "avatar" },
    });
    window.phoneHarness.client.simulateIncoming();
  });
  await expect(shell).toHaveAttribute("data-expanded", "true");
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await page.getByRole("button", { name: "Collapse phone" }).click();
  await expect(shell).toHaveAttribute("data-expanded", "false");
  await expect(shell).toContainText("In conversation");
  expect(
    await page.evaluate(() => window.phoneHarness.client.getSnapshot().status),
  ).toBe("active");
  await page.getByRole("button", { name: "Open call" }).click();
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await expect(shell).toHaveAttribute("data-expanded", "false");
  expect(
    await page.evaluate(
      () =>
        window.phoneHarness.events.filter((e) => e.type === "disconnected")
          .length,
    ),
  ).toBe(1);
});

test("notification and manual incoming modes keep the phone collapsed", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.evaluate(() =>
    window.phoneHarness.update({ incomingBehavior: "notify" }),
  );
  await page.evaluate(() => window.phoneHarness.client.simulateIncoming());
  await expect(page.locator(".az-island-shell")).toHaveAttribute(
    "data-expanded",
    "false",
  );
  await expect(
    page.getByRole("button", { name: "Answer", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.evaluate(() =>
    window.phoneHarness.update({ incomingBehavior: "manual" }),
  );
  await page.evaluate(() =>
    window.phoneHarness.client.simulateIncoming({
      name: "New caller",
      number: "7004",
    }),
  );
  await expect(page.locator(".az-island-shell")).toHaveAttribute(
    "data-expanded",
    "false",
  );
  await expect(
    page.getByRole("button", { name: "Answer", exact: true }),
  ).not.toBeVisible();
  await expect(page.locator(".az-island-call-summary")).toContainText(
    "New caller",
  );
  await page.getByRole("button", { name: "Open call" }).click();
  await expect(
    page.getByRole("button", { name: "Answer", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  expect(
    (await new AxeBuilder({ page }).include(".az-island-anchor").analyze())
      .violations,
  ).toEqual([]);
});

test("all six placements stay in the container, including a short mobile viewport", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.evaluate(() =>
    window.phoneHarness.update({
      scope: "container",
      offset: 12,
      motion: false,
    }),
  );
  const host = (await page.locator("main").boundingBox())!;
  for (const placement of [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ] as const) {
    await page.evaluate(
      (p) => window.phoneHarness.update({ placement: p }),
      placement,
    );
    await expect(page.locator(".az-island-anchor")).toHaveAttribute(
      "data-placement",
      placement,
    );
    const box = (await page.locator(".az-island-shell").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(host.x + 11);
    expect(box.x + box.width).toBeLessThanOrEqual(host.x + host.width - 11);
    expect(box.y).toBeGreaterThanOrEqual(host.y + 11);
    expect(box.y + box.height).toBeLessThanOrEqual(host.y + host.height - 11);
    if (placement.startsWith("top"))
      expect(Math.abs(box.y - host.y - 12)).toBeLessThan(2);
    else
      expect(
        Math.abs(host.y + host.height - box.y - box.height - 12),
      ).toBeLessThan(2);
  }
  await page.setViewportSize({ width: 320, height: 480 });
  await page.evaluate(() =>
    window.phoneHarness.update({ scope: "window", expanded: true }),
  );
  const box = (await page.locator(".az-island-shell").boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(11);
  expect(box.y + box.height).toBeLessThanOrEqual(469);
  expect(box.width).toBeLessThanOrEqual(296);
  await page
    .getByRole("button", { name: "Start call" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Start call" }),
  ).toBeInViewport();
});

test("incoming focus is opt-in, Escape restores focus, and controlled expansion is respected", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.getByRole("button", { name: "Open phone" }).focus();
  await page.evaluate(() => window.phoneHarness.client.simulateIncoming());
  await expect(
    page.getByRole("button", { name: "Collapse phone" }),
  ).toBeFocused();
  await page.evaluate(() => window.phoneHarness.client.hangup());
  await page.evaluate(() =>
    window.phoneHarness.update({ expanded: false, focusOnIncoming: true }),
  );
  await page.evaluate(() => window.phoneHarness.client.simulateIncoming());
  await expect(page.locator(".az-island-shell")).toHaveAttribute(
    "data-expanded",
    "false",
  );
  await page.evaluate(() => window.phoneHarness.update({ expanded: true }));
  await expect(
    page.getByRole("button", { name: "Answer", exact: true }),
  ).toBeFocused();
  await page.evaluate(() =>
    window.phoneHarness.update({ expanded: undefined }),
  );
  await page
    .getByRole("button", { name: "Answer", exact: true })
    .press("Escape");
  await expect(page.locator(".az-island-shell")).toHaveAttribute(
    "data-expanded",
    "false",
  );
  await expect(page.getByRole("button", { name: "Open call" })).toBeFocused();
});

test("automatic calls expand once and remain consumed across collapse and reopening", async ({
  page,
}) => {
  await page.goto(`${fixture}&auto`);
  await expect(page.locator(".az-island-shell")).toHaveAttribute(
    "data-expanded",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "End call", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Collapse phone" }).click();
  await page.evaluate(() => window.phoneHarness.client.hangup());
  await page.getByRole("button", { name: "Open phone" }).click();
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(
      () =>
        window.phoneHarness.events.filter((e) => e.type === "outgoing").length,
    ),
  ).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".az-island")
      .evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
});

test("playground exposes island positioning and incoming behavior in embed code", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("Dynamic island", { exact: true }).click();
  await page.getByRole("switch", { name: "Use dynamic island" }).click();
  await page.getByLabel("Incoming call presentation").selectOption("notify");
  await page.getByLabel("Island position").selectOption("top-center");
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await expect(page.locator(".az-island-shell")).toHaveAttribute(
    "data-expanded",
    "false",
  );
  await page.getByRole("button", { name: "Get embed code" }).click();
  await expect(page.locator(".code-dialog pre")).toContainText(
    "WebPhoneIsland",
  );
  await expect(page.locator(".code-dialog pre")).toContainText(
    'incomingBehavior="notify"',
  );
  await expect(page.locator(".code-dialog pre")).toContainText(
    'placement="top-center"',
  );
});
