/**
 * Capture documentation screenshots from the exported web playground (Preview mode).
 * Run `npm run playground:build` first; writes to ../docs/public/media/native/.
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const out = fileURLToPath(
  new URL("../../docs/public/media/native/", import.meta.url),
);
await mkdir(out, { recursive: true });
const server = spawn(
  process.execPath,
  [fileURLToPath(new URL("serve.mjs", import.meta.url))],
  {
    env: { ...process.env, PORT: "4174" },
    stdio: "ignore",
  },
);
await new Promise((resolve) => setTimeout(resolve, 600));
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const frame = page.getByTestId("device-frame");
  const shot = (name) =>
    frame.screenshot({ path: `${out}/${name}.png`, omitBackground: true });
  const tab = (name) => page.getByRole("tab", { name, exact: true }).click();
  await page.goto("http://127.0.0.1:4174/");
  await page.getByRole("button", { name: "Start call" }).waitFor();
  await page.addStyleTag({ content: "*{caret-color:transparent!important}" });

  for (const digit of "7003")
    await page.getByRole("button", { name: digit, exact: true }).click();
  await page.waitForTimeout(300);
  await shot("screen-keypad");

  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await page.waitForTimeout(700);
  await shot("screen-incoming");
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await page.waitForTimeout(2300);
  await shot("screen-active");

  await page.getByRole("radio", { name: "Dark" }).click();
  await page.waitForTimeout(600);
  await shot("screen-dark");
  await page.getByRole("radio", { name: "Light" }).click();

  await tab("Card");
  await page.waitForTimeout(600);
  await shot("card-active");
  await page.getByRole("button", { name: "End call" }).click();
  await page.waitForTimeout(300);

  // Contact suggestions (sample contacts in Preview).
  await tab("Full screen");
  await page.getByTestId("dial-input").fill("");
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.waitForTimeout(400);
  await shot("suggest-pill");
  await page.getByTestId("dial-input").fill("70");
  await page.getByRole("button", { name: /^\d+ more$/ }).click();
  await page.waitForTimeout(400);
  await shot("suggest-list");
  await page.getByTestId("dial-input").fill("");

  await tab("Island");
  await page.waitForTimeout(800);
  await shot("island-idle");
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await page.waitForTimeout(800);
  await shot("island-banner");
  await page
    .getByRole("button", { name: "Answer", exact: true })
    .first()
    .click();
  await page.waitForTimeout(900);
  await shot("island-expanded");
  await page.getByRole("button", { name: "Collapse phone" }).click();
  await page.waitForTimeout(2200);
  await shot("island-call");

  // End the island's call before the theme shots.
  await page.getByTestId("island-trigger").click();
  await page.getByRole("button", { name: "End call" }).click();
  await page.waitForTimeout(300);

  // Theme presets, rounded controls, a custom button, and a translation.
  await tab("Full screen");
  await page.getByRole("radio", { name: "Midnight" }).click();
  await page.getByRole("radio", { name: "Rounded" }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("tab", { name: "Behavior" }).click();
  await page.getByRole("switch", { name: "Custom Notes button" }).click();
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await page.waitForTimeout(2300);
  await shot("theme-midnight");
  await page.getByRole("button", { name: "End call" }).click();
  await page.getByRole("tab", { name: "Design" }).click();
  await page.getByRole("radio", { name: "Light" }).click();
  await page.getByRole("radio", { name: "Sunset" }).click();
  await page.getByRole("radio", { name: "Español" }).click();
  await page.getByRole("radio", { name: "Green answer" }).click();
  await page.getByTestId("dial-input").fill("");
  await page.getByRole("button", { name: "7", exact: true }).click();
  await page.waitForTimeout(500);
  await shot("theme-sunset-es");

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
  });
  const wide = await desktop.newPage();
  await wide.goto("http://127.0.0.1:4174/");
  await wide.getByRole("button", { name: "Simulate incoming call" }).click();
  await wide.getByRole("button", { name: "Answer", exact: true }).click();
  await wide.waitForTimeout(1500);
  await wide.screenshot({ path: `${out}/playground-desktop.png` });
  console.log(`Screenshots written to ${out}`);
} finally {
  await browser.close();
  server.kill();
}
