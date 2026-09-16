// Render authored Mermaid sources once. The public site needs no Mermaid runtime.
import { chromium } from "@playwright/test";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = new URL("docs/diagrams/", root);
const target = new URL("docs/public/diagrams/", root);
await mkdir(target, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body></body></html>',
  );
  await page.addScriptTag({
    path: fileURLToPath(
      new URL("docs/node_modules/mermaid/dist/mermaid.min.js", root),
    ),
  });
  await page.evaluate(() =>
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        darkMode: true,
        background: "#090909",
        primaryColor: "#15261e",
        primaryTextColor: "#fafafa",
        primaryBorderColor: "#4a8065",
        lineColor: "#a1a1a1",
        secondaryColor: "#181818",
        tertiaryColor: "#222222",
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
      },
    }),
  );
  for (const filename of await readdir(source)) {
    if (!filename.endsWith(".mmd")) continue;
    const text = await readFile(new URL(filename, source), "utf8");
    const svg = await page.evaluate(
      async ({ text, id }) => (await window.mermaid.render(id, text)).svg,
      { text, id: filename.replace(".mmd", "") },
    );
    await writeFile(new URL(filename.replace(".mmd", ".svg"), target), svg);
    console.log(`Rendered ${filename}`);
  }
} finally {
  await browser.close();
}
