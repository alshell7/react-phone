import { expect, test, type Page } from "@playwright/test";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 980;

async function open(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start call" })).toBeVisible();
}
async function openConfigure(page: Page) {
  if (isMobile(page))
    await page.getByRole("tab", { name: "Configure" }).click();
}
async function openSurface(page: Page, surface: "Phone" | "Island" | "Card") {
  if (isMobile(page)) await page.getByRole("tab", { name: surface }).click();
  else
    await page
      .getByRole("tab", { name: surface === "Phone" ? "Full screen" : surface })
      .click();
}

test("dials from the keypad and completes a preview call", async ({ page }) => {
  await open(page);
  for (const digit of "7003")
    await page.getByRole("button", { name: digit, exact: true }).click();
  await expect(page.getByTestId("dial-input")).toHaveValue("7003");
  // 7003 is a sample contact in Preview, so the call carries its name.
  await page.getByRole("button", { name: "Call Alex Morgan" }).click();
  await expect(page.getByText("Ringing…")).toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible({ timeout: 4000 });
  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unmute" })).toBeVisible();
  await page.getByRole("button", { name: "Keypad", exact: true }).click();
  await page.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByLabel("Sent 5")).toBeVisible();
  await page.getByRole("button", { name: "Hide keypad" }).click();
  await page.getByRole("button", { name: "End call" }).click();
  await expect(page.getByText("Call ended")).toBeVisible();
  await page.getByRole("tab", { name: "Recents" }).click();
  await expect(page.getByLabel(/Call to Alex Morgan/)).toBeVisible();
});

test("suggests contacts while typing on the keypad", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.getByRole("button", { name: "Use Alex Morgan" }).click();
  await expect(page.getByTestId("dial-input")).toHaveValue("7003");
  await page.getByTestId("dial-input").fill("70");
  await page.getByRole("button", { name: /^\d+ more$/ }).click();
  await page.getByRole("button", { name: "Call Sam Lee" }).click();
  await expect(page.getByText("Sam Lee").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel call" })).toBeVisible();
});

test("theme presets, rounded controls, and Spanish labels apply live", async ({
  page,
}) => {
  await open(page);
  await openConfigure(page);
  await page.getByRole("radio", { name: "Midnight" }).click();
  await page.getByRole("radio", { name: "Rounded" }).click();
  await page.getByRole("radio", { name: "Español" }).click();
  await openSurface(page, "Phone");
  await expect(
    page.getByRole("button", { name: "Iniciar llamada" }),
  ).toBeVisible();
  const key = page.getByTestId("key-5");
  const radius = await key.evaluate((node) =>
    parseFloat(getComputedStyle(node).borderTopLeftRadius),
  );
  const size = (await key.boundingBox())!.width;
  expect(radius).toBeLessThan(size / 2 - 2);
  const call = page.getByTestId("start-call");
  expect(
    await call.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(75, 79, 209)");
});

test("answers a simulated incoming call and shows the configured identity", async ({
  page,
}) => {
  await open(page);
  await openConfigure(page);
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await openSurface(page, "Phone");
  await expect(
    page.getByText("Incoming call", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Alex Morgan").first()).toBeVisible();
  await expect(page.getByText("Priority").first()).toBeVisible();
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await expect(page.getByText("Connected")).toBeVisible();
  await expect(page.getByRole("img", { name: /Voice orb/ })).toBeVisible();
});

test("island banner answers without stealing focus and the call survives collapse", async ({
  page,
}) => {
  await open(page);
  await openSurface(page, "Island");
  const trigger = page.getByTestId("island-trigger");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await openConfigure(page);
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  // An incoming call must never pull keyboard focus into the phone.
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("[data-testid='island-shell']")),
    ),
  ).toBe(false);
  await openSurface(page, "Island");
  await expect(page.getByTestId("island-trigger")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page
    .getByRole("button", { name: "Answer", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("island-trigger")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.getByRole("button", { name: "Collapse phone" }).click();
  await expect(page.getByTestId("island-trigger")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.getByText("In conversation")).toBeVisible();
  await expect(
    page
      .getByTestId("island-trigger")
      .locator("..")
      .getByLabel(/Call duration/),
  ).toBeVisible();
});

test("island stays inside its container when expanded", async ({ page }) => {
  await open(page);
  await openSurface(page, "Island");
  await page.getByTestId("island-trigger").click();
  const shell = await page.getByTestId("island-shell").boundingBox();
  const viewport = page.viewportSize()!;
  expect(shell).not.toBeNull();
  expect(shell!.x).toBeGreaterThanOrEqual(0);
  expect(shell!.x + shell!.width).toBeLessThanOrEqual(viewport.width);
  if (!isMobile(page)) expect(shell!.width).toBeLessThanOrEqual(420);
});

test("theme, preset, and visual choices update the phone", async ({ page }) => {
  await open(page);
  await openConfigure(page);
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("radio", { name: "Basic" }).click();
  await page.getByRole("radio", { name: "Bars" }).click();
  await openSurface(page, "Phone");
  await expect(
    page.getByRole("button", { name: "5", exact: true }),
  ).toHaveCount(0);
  const input = page.getByLabel("Phone number or SIP address");
  await input.fill("7003");
  await page.getByRole("button", { name: "Call", exact: true }).click();
  await expect(page.getByRole("img", { name: /Voice bars/ })).toBeVisible();
  const background = await page.evaluate(
    () =>
      getComputedStyle(
        document.body.querySelector(
          "[data-testid='island-shell'], #root > div",
        )!,
      ).backgroundColor,
  );
  expect(background).toBeTruthy();
  await expect(page.getByRole("button", { name: "Hold" })).toHaveCount(0);
});

test("generated embed code never contains credentials", async ({ page }) => {
  await open(page);
  await openConfigure(page);
  await page.getByRole("tab", { name: "Code" }).click();
  const code = await page.getByText(/<SipPhone/).textContent();
  expect(code).toContain('variant="screen"');
  expect(code).not.toMatch(/password/i);
});

test("live mode shows an empty connection form and validates input", async ({
  page,
}) => {
  await open(page);
  await openConfigure(page);
  await page.getByRole("tab", { name: "Connection" }).click();
  await page.getByRole("radio", { name: "Live SIP" }).click();
  await expect(
    page.getByRole("textbox", { name: "Password", exact: true }),
  ).toHaveValue("");
  await page.getByRole("textbox", { name: "Username" }).fill("1001");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("not-a-real-password");
  await page
    .getByRole("textbox", { name: "SIP address", exact: true })
    .fill("sip:1001@pbx.example.com");
  await page
    .getByRole("textbox", { name: "WebSocket server" })
    .fill("ws://pbx.example.com/ws");
  await page.getByRole("button", { name: "Connect account" }).click();
  // The form explains the problem in place; no network request is made.
  await expect(page.getByRole("alert").first()).toContainText("wss://");
});

test("the orb is still before a call and moves with call audio", async ({
  page,
}) => {
  await open(page);
  await openConfigure(page);
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await openSurface(page, "Phone");
  const orb = page.getByRole("img", { name: /Voice orb/ });
  const ringing = await orb.screenshot();
  await page.waitForTimeout(500);
  expect((await orb.screenshot()).equals(ringing)).toBe(true);
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await page.waitForTimeout(400);
  const a = await orb.screenshot();
  await page.waitForTimeout(600);
  expect((await orb.screenshot()).equals(a)).toBe(false);
});
