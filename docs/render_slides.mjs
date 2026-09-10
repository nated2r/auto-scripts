/**
 * Render ppt-export.html slides to PNG (real Traditional Chinese text).
 * Usage: node docs/render_slides.mjs
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "ppt-export.html");
const outDir = path.join(__dirname, "ppt-slides");
const files = [
  ["slide-01", "slide-01-cover.png"],
  ["slide-02", "slide-02-pain.png"],
  ["slide-03", "slide-03-product.png"],
  ["slide-04", "slide-04-modes.png"],
  ["slide-05", "slide-05-rules.png"],
  ["slide-06", "slide-06-steps.png"],
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), {
  waitUntil: "networkidle",
});
// Wait for webfont
await page.waitForTimeout(1500);

for (const [id, name] of files) {
  const el = page.locator(`#${id}`);
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({ path: path.join(outDir, name), type: "png" });
  console.log("ok", name);
}

await browser.close();
console.log("done", outDir);
