import { chromium } from "@playwright/test";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });

export default async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Helper to poll a URL until it responds OK
  async function waitFor(url, opts = { attempts: 120, delayMs: 1000 }) {
    const { attempts, delayMs } = opts;
    for (let i = 0; i < attempts; i++) {
      try {
        const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
        if (resp && resp.ok()) return;
      } catch {
        // ignore
      }
      await page.waitForTimeout(delayMs);
    }
    throw new Error(`Timeout waiting for ${url}`);
  }

  // Ensure servers are up before attempting login
  await waitFor("http://127.0.0.1:6060/api/v1/auth/health");
  await waitFor("http://127.0.0.1:3000/health.txt");

  const { TEST_EMAIL, TEST_PASSWORD } = process.env;
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Missing TEST_EMAIL or TEST_PASSWORD in .env for globalSetup"
    );
  }

  // Navigate to login page
  await page.goto("http://127.0.0.1:3000/login");

  // Fill in login form
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(TEST_EMAIL);
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://127.0.0.1:3000/");

  // Ensure storage directory exists and save storage state
  const storageDir = path.resolve("tests/ui/.auth");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  await page
    .context()
    .storageState({ path: path.join(storageDir, "user.json") });
  await browser.close();
};
