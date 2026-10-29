import { expect, test, type Page } from "@playwright/test";
import { startTestSipServer } from "./helpers/sip-server.ts";

/**
 * Real SIP + WebRTC through the React Native web build: two playground pages register
 * with digest auth on a local registrar, call each other, and exchange Chromium's
 * fake-microphone audio. Everything is driven through the phone's own UI.
 */
async function signIn(page: Page, websocketUrl: string, user: string, password = "fixture-password") {
  await page.goto("/");
  await page.getByRole("tab", { name: "Connection" }).click();
  await page.getByRole("radio", { name: "Live SIP" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill(user);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "SIP address", exact: true }).fill(`sip:${user}@localhost`);
  await page.getByRole("textbox", { name: "WebSocket server" }).fill(websocketUrl);
  await page.getByRole("button", { name: "Connect account" }).click();
}

test("registers with digest auth, calls another phone, and controls the call end to end", async ({ browser }) => {
  test.setTimeout(90_000);
  const server = await startTestSipServer();
  const context = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1440, height: 960 } });
  const caller = await context.newPage();
  const callee = await context.newPage();
  try {
    await signIn(callee, server.url, "1002");
    await signIn(caller, server.url, "1001");
    for (const page of [caller, callee]) {
      await expect(page.getByText("Registered and ready for calls.")).toBeVisible({ timeout: 15_000 });
      // The password field is cleared after a successful registration.
      await expect(page.getByText("Ready for calls").first()).toBeVisible();
    }

    for (const digit of "1002") await caller.getByRole("button", { name: digit, exact: true }).click();
    await caller.getByRole("button", { name: "Call 1002" }).click();
    await expect(callee.getByText("Incoming call", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(callee.getByText("1001").first()).toBeVisible();
    await callee.getByRole("button", { name: "Answer", exact: true }).click();
    for (const page of [caller, callee]) await expect(page.getByText("Connected")).toBeVisible({ timeout: 15_000 });

    // Real remote audio drives the stats-based activity: bars reach "speaking".
    await caller.getByRole("tab", { name: "Design" }).click();
    await caller.getByRole("radio", { name: "Bars" }).click();
    await expect(caller.getByRole("img", { name: "Voice bars: speaking" })).toBeVisible({ timeout: 15_000 });

    await caller.getByRole("button", { name: "Mute", exact: true }).click();
    await expect(caller.getByRole("button", { name: "Unmute" })).toBeVisible();
    await caller.getByRole("button", { name: "Unmute" }).click();

    await caller.getByRole("button", { name: "Hold", exact: true }).click();
    await expect(caller.getByText("On hold")).toBeVisible({ timeout: 10_000 });
    await expect(callee.getByText("Caller put you on hold")).toBeVisible({ timeout: 10_000 });
    await caller.getByRole("button", { name: "Resume" }).click();
    await expect(callee.getByText("Connected")).toBeVisible({ timeout: 10_000 });

    await caller.getByRole("button", { name: "Keypad", exact: true }).click();
    await caller.getByRole("button", { name: "5", exact: true }).click();
    await expect(caller.getByLabel("Sent 5")).toBeVisible();
    await caller.getByRole("button", { name: "Hide keypad" }).click();

    await caller.getByRole("button", { name: "End call" }).click();
    for (const page of [caller, callee]) await expect(page.getByText("Call ended").first()).toBeVisible({ timeout: 10_000 });
    expect(server.methods).toEqual(expect.arrayContaining(["REGISTER", "INVITE", "ACK", "BYE"]));
    expect(server.methods.filter((method) => method === "INVITE").length).toBeGreaterThanOrEqual(3); // call + hold + resume
  } finally {
    await context.close();
    await server.close();
  }
});

test("a rejected password is explained in the form and never registers", async ({ page }) => {
  const server = await startTestSipServer();
  try {
    await signIn(page, server.url, "1001", "wrong-password");
    await expect(page.getByRole("alert").first()).toContainText("Registration was rejected", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Connect account" })).toBeEnabled();
  } finally {
    await server.close();
  }
});

test("calling an unregistered extension reports a clear failure", async ({ browser }) => {
  const server = await startTestSipServer();
  const context = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  try {
    await signIn(page, server.url, "1001");
    await expect(page.getByText("Registered and ready for calls.")).toBeVisible({ timeout: 15_000 });
    for (const digit of "1999") await page.getByRole("button", { name: digit, exact: true }).click();
    await page.getByRole("button", { name: "Call 1999" }).click();
    await expect(page.getByRole("alert").first()).toContainText("Number not found", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Call 1999" })).toBeVisible();
  } finally {
    await context.close();
    await server.close();
  }
});
