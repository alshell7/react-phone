import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

/**
 * Real SIP + WebRTC through the web build against your PBX, with Chromium's fake
 * microphone. Reads .env.local (git-ignored); skipped without credentials.
 * Set SIP_TEST_TARGET to a destination that answers (echo test or voicemail).
 */
const env: Record<string, string> = { ...process.env } as Record<string, string>;
const file = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(file))
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match && !env[match[1]]) env[match[1]] = match[2].trim();
  }
const ready = Boolean(env.SIP_WSS_URL && env.SIP_URI && env.SIP_PASSWORD);

test.skip(!ready, "Set SIP_* in native/.env.local to run live SIP tests.");

test("registers over WSS from the web build, then places and controls a real call", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  // Bars expose the stats-based activity state, proving real remote audio arrives.
  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByRole("radio", { name: "Bars" }).click();
  await page.getByRole("tab", { name: "Connection" }).click();
  await page.getByRole("radio", { name: "Live SIP" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill(env.SIP_USERNAME ?? "");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(env.SIP_PASSWORD);
  await page.getByRole("textbox", { name: "SIP address", exact: true }).fill(env.SIP_URI);
  await page.getByRole("textbox", { name: "WebSocket server" }).fill(env.SIP_WSS_URL);
  await page.getByRole("button", { name: "Connect account" }).click();
  await expect(page.getByText("Registered and ready for calls.")).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText("Ready for calls").first()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toHaveCount(0);

  test.skip(!env.SIP_TEST_TARGET, "Set SIP_TEST_TARGET to also place a call.");
  const target = env.SIP_TEST_TARGET;
  for (const digit of target)
    await page.getByRole("button", { name: digit === "*" ? "star" : digit === "#" ? "pound" : digit, exact: true }).click();
  await expect(page.getByTestId("dial-input")).toHaveValue(target);
  await page.getByRole("button", { name: `Call ${target}` }).click();
  await expect(page.getByRole("button", { name: "End call" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Connected")).toBeVisible();
  await expect(page.getByLabel(/Call duration/).first()).toBeVisible();
  await expect(page.getByRole("img", { name: "Voice bars: speaking" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unmute" })).toBeVisible();
  await page.getByRole("button", { name: "Unmute" }).click();

  await page.getByRole("button", { name: "Hold", exact: true }).click();
  await expect(page.getByText("On hold")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByText("Connected")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Keypad", exact: true }).click();
  await page.getByRole("button", { name: "1", exact: true }).click();
  await expect(page.getByLabel("Sent 1")).toBeVisible();
  await page.getByRole("button", { name: "Hide keypad" }).click();

  await page.getByRole("button", { name: "End call" }).click();
  await expect(page.getByText("Call ended").first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("tab", { name: "Recents" }).click();
  await expect(page.getByLabel(new RegExp(`Call to \\${target}`))).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
