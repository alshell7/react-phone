import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Scan settled UI: with reduced motion the phone renders without entrance fades.
test.use({ reducedMotion: "reduce" });

const scan = async (page: import("@playwright/test").Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    // react-native-web renders text inputs without <label for>; names come from aria-label.
    .disableRules(["region"])
    .analyze();
  return results.violations.map(
    (v) => `${v.id}: ${v.nodes.length} × ${v.help}`,
  );
};

test("idle, incoming, and active phones have no WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start call" })).toBeVisible();
  expect(await scan(page)).toEqual([]);
  if ((page.viewportSize()?.width ?? 0) < 980)
    await page.getByRole("tab", { name: "Configure" }).click();
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  if ((page.viewportSize()?.width ?? 0) < 980)
    await page.getByRole("tab", { name: "Phone" }).click();
  await expect(
    page.getByRole("button", { name: "Answer", exact: true }),
  ).toBeVisible();
  expect(await scan(page)).toEqual([]);
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "End call" })).toBeVisible();
  expect(await scan(page)).toEqual([]);
});

test("dark theme keeps WCAG AA contrast during a call", async ({ page }) => {
  await page.goto("/");
  const mobile = (page.viewportSize()?.width ?? 0) < 980;
  if (mobile) await page.getByRole("tab", { name: "Configure" }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  if (mobile) await page.getByRole("tab", { name: "Phone" }).click();
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "End call" })).toBeVisible();
  expect(await scan(page)).toEqual([]);
});

test("reduced motion stops the orb and ring animations", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Call 7003" })
    .or(page.getByRole("button", { name: "Start call" }))
    .waitFor();
  const mobile = (page.viewportSize()?.width ?? 0) < 980;
  if (mobile) await page.getByRole("tab", { name: "Configure" }).click();
  await page.getByRole("button", { name: "Simulate incoming call" }).click();
  if (mobile) await page.getByRole("tab", { name: "Phone" }).click();
  await page.getByRole("button", { name: "Answer", exact: true }).click();
  const orb = page.getByRole("img", { name: /Voice orb/ });
  const first = await orb.screenshot();
  await page.waitForTimeout(700);
  expect((await orb.screenshot()).equals(first)).toBe(true);
});

test("every control has an accessible name and touch-sized target", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start call" })).toBeVisible();
  const small = await page.$$eval('[role="button"], button', (nodes) =>
    nodes
      .filter((node) => node.closest("[data-testid='dial-input']") === null)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          name:
            node.getAttribute("aria-label") || node.textContent?.trim() || "",
          w: rect.width,
          h: rect.height,
        };
      })
      .filter(
        (item) => item.w > 0 && (item.w < 40 || item.h < 32 || !item.name),
      ),
  );
  expect(small).toEqual([]);
});
