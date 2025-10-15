import { chromium } from "@playwright/test";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });

// chatgpt is aided to allow admin/user session
export default async () => {
  const storageDir = path.resolve("tests/ui/.auth");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Helper to wait for a URL to be ready
  async function waitFor(page, url, opts = { attempts: 120, delayMs: 1000 }) {
    const { attempts, delayMs } = opts;
    for (let i = 0; i < attempts; i++) {
      try {
        const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
        if (resp && resp.ok()) return;
      } catch {}
      await page.waitForTimeout(delayMs);
    }
    throw new Error(`Timeout waiting for ${url}`);
  }

  // === Reusable login helper ===
  async function loginAndSave(email, password, saveAs) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Ensure backend/frontend are ready before login
    await waitFor(page, "http://127.0.0.1:6060/api/v1/auth/health");
    await waitFor(page, "http://127.0.0.1:3000/health.txt");

    await page.goto("http://127.0.0.1:3000/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(password);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://127.0.0.1:3000/");

    await page.context().storageState({ path: path.join(storageDir, saveAs) });
    await browser.close();
  }

  // === Logins ===
  const { TEST_EMAIL, TEST_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("Missing TEST_EMAIL or TEST_PASSWORD in .env");
  }

  await loginAndSave(TEST_EMAIL, TEST_PASSWORD, "user.json");

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await loginAndSave(ADMIN_EMAIL, ADMIN_PASSWORD, "admin.json");
  }

  console.log("✅ Auth states saved for user and admin!");
};
