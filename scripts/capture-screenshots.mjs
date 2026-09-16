// Capture the actual preview UI only. Never connect an account while recording docs.
// Start `npm run dev` first. All captured callers and audio activity are simulated.
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const output = new URL("../docs/public/media/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const save = (page, name, options = {}) =>
  page.screenshot({ path: fileURLToPath(new URL(name, output)), ...options });
try {
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1060 },
    deviceScaleFactor: 1,
  });
  await desktop.goto("http://127.0.0.1:5173/");
  await desktop.locator('[data-orb][data-renderer="webgl"]').waitFor();
  await desktop.evaluate(() => document.fonts.ready);
  await save(desktop, "playground-desktop.png");
  await desktop.getByRole("button", { name: "Basic", exact: false }).click();
  await desktop
    .locator(".phone-stage .az-widget")
    .screenshot({ path: fileURLToPath(new URL("widget-basic.png", output)) });
  await desktop.getByRole("button", { name: "Advanced", exact: false }).click();
  await desktop.getByRole("button", { name: "Dark", exact: true }).click();
  await desktop.getByRole("button", { name: "Simulate incoming call" }).click();
  await desktop.getByRole("button", { name: "Answer", exact: true }).click();
  await desktop
    .getByRole("button", { name: "End call", exact: true })
    .waitFor();
  await desktop.locator('[data-orb][data-renderer="webgl"]').waitFor();
  await desktop.waitForTimeout(350);
  await desktop
    .locator(".phone-stage .az-widget")
    .screenshot({ path: fileURLToPath(new URL("widget-orb.png", output)) });
  await desktop.getByRole("button", { name: "End call", exact: true }).click();
  await desktop.getByText("Dynamic island", { exact: true }).click();
  await desktop.getByRole("switch", { name: "Use dynamic island" }).click();
  await desktop.getByLabel("Incoming call presentation").selectOption("notify");
  await desktop.getByRole("button", { name: "Simulate incoming call" }).click();
  await desktop.waitForTimeout(300);
  await desktop
    .locator(".az-island-shell")
    .screenshot({
      path: fileURLToPath(new URL("island-notification.png", output)),
    });
  await desktop
    .locator(".phone-stage")
    .screenshot({
      path: fileURLToPath(new URL("island-playground.png", output)),
    });
  const mobile = await browser.newPage({
    ...devices["iPhone 13"],
    browserName: undefined,
  });
  await mobile.goto("http://127.0.0.1:5173/");
  await mobile.locator('[data-orb][data-renderer="webgl"]').waitFor();
  await mobile.evaluate(() => document.fonts.ready);
  await save(mobile, "playground-mobile.png");
  console.log(
    "Saved six credential-free preview screenshots to docs/public/media.",
  );
} finally {
  await browser.close();
}
