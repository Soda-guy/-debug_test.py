import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("BROWSER:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));

  await page.goto(`${BASE}/discover`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Login via localStorage-backed demo by evaluating login through UI
  await page.goto(`${BASE}/auth/login`);
  await page.fill('input[type="email"]', "demo@billbless.app");
  await page.fill('input[type="password"]', "demopass1");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("**/discover", { timeout: 5000 });
  await page.waitForTimeout(500);

  // Open contribute via heart button
  const heart = page.getByRole("button", { name: "Contribute to bill" });
  await heart.click({ timeout: 5000 });
  await page.waitForTimeout(500);

  const confirm = page.getByTestId("confirm-contribution");
  const visible = await confirm.isVisible().catch(() => false);
  console.log("confirm_visible", visible);

  if (!visible) {
    // Try swipe via mouse drag on card
    const card = page.locator(".absolute.inset-x-3").first();
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(600);
    }
  }

  await page.getByTestId("confirm-contribution").waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId("confirm-contribution").click();
  await page.waitForTimeout(1500);

  const thankYou = await page.getByText("Thank you!").isVisible().catch(() => false);
  const funded = await page.getByText("Funding goal reached!").isVisible().catch(() => false);
  const processing = await page.getByText("Processing simulated payment").isVisible().catch(() => false);
  console.log({ thankYou, funded, processing });

  if (thankYou || funded) {
    await page.getByText("Continue swiping").click();
  }

  await page.goto(`${BASE}/impact`);
  await page.waitForTimeout(800);
  const empty = await page.getByText("No contributions yet").isVisible().catch(() => false);
  const body = await page.locator("body").innerText();
  console.log("impact_empty", empty);
  console.log("impact_snippet", body.slice(0, 500));

  // Dump localStorage
  const store = await page.evaluate(() => localStorage.getItem("billbless_demo_v1"));
  const parsed = store ? JSON.parse(store) : null;
  console.log("contrib_count", parsed?.contributions?.length ?? 0);
  console.log("user", parsed?.user?.email ?? null);

  await browser.close();
  if ((parsed?.contributions?.length ?? 0) < 1) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
