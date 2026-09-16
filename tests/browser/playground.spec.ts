import { test, expect } from "@playwright/test";

test("dial, hold, mute, keypad, transfer, history and callback log", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Make it your phone." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Phone number or SIP address" })
    .fill("7003");
  await page.getByRole("button", { name: "Start call" }).click();
  await expect(page.getByRole("button", { name: "End call" })).toBeVisible();
  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Hold", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Keypad", exact: true }).click();
  await page.getByRole("button", { name: "5", exact: true }).click();
  await page.getByRole("button", { name: "Transfer", exact: true }).click();
  await page.getByRole("textbox", { name: "Transfer call" }).fill("7004");
  await page
    .locator(".az-transfer")
    .getByRole("button", { name: "Transfer", exact: true })
    .click();
  await expect(page.locator(".az-call-status")).toContainText("Transferred");
  if (await page.getByRole("button", { name: "Open navigation" }).isVisible())
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Call history", exact: true }).click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  if (await page.getByRole("button", { name: "Open navigation" }).isVisible())
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: /Event log/ }).click();
  await expect(
    page.locator(".event-row code", { hasText: "answered" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("incoming call can be answered and declined", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await expect(page.getByText("Incoming call", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await expect(page.getByText("Declined", { exact: true })).toBeVisible();
});

test("presets, theme, caller details and safe embed snippet", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Basic Just the conversation" })
    .click();
  await expect(page.locator(".az-keypad")).toHaveCount(0);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator(".az-widget")).toHaveAttribute(
    "data-appearance",
    "dark",
  );
  await page.getByRole("button", { name: "Ocean accent" }).click();
  await page.getByRole("switch", { name: "Show caller details" }).click();
  await page
    .getByRole("textbox", { name: "Display name" })
    .fill("Support team");
  await expect(
    page.getByRole("heading", { name: "Support team" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Get embed code" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".code-dialog pre")).toContainText(
    'preset="basic"',
  );
  await expect(page.locator(".code-dialog pre")).toContainText("Support team");
  await expect(page.locator(".code-dialog pre")).not.toContainText("test_user");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Live SIP", exact: true }).click();
  await expect(page.locator(".az-widget")).toHaveAttribute(
    "data-appearance",
    "dark",
  );
  await expect(page.locator(".az-widget")).toHaveClass(/az-basic/);
  await expect(
    page.getByRole("textbox", { name: "Username", exact: true }),
  ).toBeVisible();
});

test("live mode asks for credentials without auto-dialing or storing a password", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Live SIP", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Username", exact: true }),
  ).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "SIP address", exact: true })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "WebSocket server", exact: true })).toHaveValue("");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Connect account", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Start call" })).toBeDisabled();
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    })),
  ).toEqual({ local: {}, session: {} });
});

test("responsive layout has no horizontal page overflow and captures the interface", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  await page.screenshot({
    path: `test-results/playground-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Compact A little space. A lot of possibility.",
    })
    .click();
  const compact = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(compact.scroll).toBeLessThanOrEqual(compact.viewport);
});
