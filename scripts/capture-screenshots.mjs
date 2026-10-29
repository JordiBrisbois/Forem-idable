/**
 * Regenerates the screenshots used by the README and docs/screenshots.
 *
 *   node scripts/capture-screenshots.mjs
 *   SCREENSHOT_BASE_URL=http://localhost:3000 node scripts/capture-screenshots.mjs
 *
 * Only public pages are captured: the app requires a session for everything
 * else, and a portfolio screenshot should never contain someone's data.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "https://forem.brisbois.dev";
const OUTPUT_DIR = path.join("docs", "screenshots");
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const SHOTS = [
  { name: "home-desktop.png", path: "/", viewport: DESKTOP, fullPage: false },
  { name: "home-mobile.png", path: "/", viewport: MOBILE, fullPage: false },
  { name: "about.png", path: "/about", viewport: DESKTOP, fullPage: false },
  { name: "privacy.png", path: "/privacy", viewport: DESKTOP, fullPage: false },
];

await fs.mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch();

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: shot.viewport,
    // 1x keeps the PNG small: the README renders them around 900px wide, so a
    // 2x capture would only add weight to the repository.
    deviceScaleFactor: 1,
    locale: "fr-BE",
    colorScheme: "light",
  });
  const page = await context.newPage();

  const response = await page.goto(`${BASE_URL}${shot.path}`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });

  if (!response || !response.ok()) {
    throw new Error(`${shot.path} answered ${response?.status() ?? "no response"}`);
  }

  // Let webfonts settle so the capture does not show a fallback typeface.
  await page.evaluate(() => document.fonts.ready);

  const target = path.join(OUTPUT_DIR, shot.name);
  await page.screenshot({ path: target, fullPage: shot.fullPage });
  const { size } = await fs.stat(target);
  console.log(`${shot.name.padEnd(20)} ${shot.viewport.width}x${shot.viewport.height}  ${Math.round(size / 1024)} KB`);

  await context.close();
}

await browser.close();
console.log(`\n${SHOTS.length} screenshots written to ${OUTPUT_DIR}`);
