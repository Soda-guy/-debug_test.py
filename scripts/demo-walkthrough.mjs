import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(path.join(OUT, "screenshots"), { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    recordVideo: { dir: path.join(OUT, "videos"), size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();

  // Fresh demo state
  await page.goto(`${BASE}/discover`);
  await page.evaluate(() => localStorage.removeItem("billbless_demo_v1"));
  await page.reload();
  await page.waitForTimeout(400);

  // Landing
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT, "screenshots", "01_landing.png"),
    fullPage: false,
  });

  // Login
  await page.goto(`${BASE}/auth/login`);
  await page.fill('input[type="email"]', "demo@billbless.app");
  await page.fill('input[type="password"]', "demopass1");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("**/discover");
  await page.waitForTimeout(700);

  await page.screenshot({
    path: path.join(OUT, "screenshots", "02_discover_bill_card.png"),
    fullPage: false,
  });

  // Contribute via heart
  await page.getByRole("button", { name: "Contribute to bill" }).click();
  await page.getByTestId("confirm-contribution").waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT, "screenshots", "03_contribution_modal.png"),
    fullPage: false,
  });

  await page.getByTestId("confirm-contribution").click();
  await page.getByText("Thank you!").waitFor({ timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT, "screenshots", "04_contribution_success.png"),
    fullPage: false,
  });

  await page.getByText("Continue swiping").click();
  await page.waitForTimeout(400);

  await page.goto(`${BASE}/impact`);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT, "screenshots", "05_my_impact.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/explore`);
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(OUT, "screenshots", "06_explore.png"),
    fullPage: false,
  });

  // Admin path
  await page.goto(`${BASE}/auth/login`);
  await page.fill('input[type="email"]', "admin@billbless.app");
  await page.fill('input[type="password"]', "demopass1");
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(500);
  await page.goto(`${BASE}/admin`);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT, "screenshots", "07_admin.png"),
    fullPage: false,
  });

  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const raw = await video.path();
    const dest = path.join(OUT, "contribute_flow_demo.webm");
    fs.renameSync(raw, dest);
    console.log("video", dest);
  }
  console.log("screenshots written to", path.join(OUT, "screenshots"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
