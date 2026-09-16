import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("default, connected dark phone, embed dialog, and connection form meet automated WCAG checks", async ({
  page,
}) => {
  await page.goto("/");
  const check = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({
          target,
          failureSummary,
        })),
      })),
    ).toEqual([]);
  };
  await check();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await check();
  await page.getByRole("button", { name: "End call", exact: true }).click();
  await page.getByText("Window & motion", { exact: true }).click();
  await page.getByRole("switch", { name: "Powered by branding" }).click();
  await page.getByText("Sounds & feedback", { exact: true }).click();
  await page.getByLabel("Visualization", { exact: true }).selectOption("bars");
  await check();
  await page.getByRole("button", { name: "Get embed code" }).click();
  await check();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Live SIP", exact: true }).click();
  await check();
});
