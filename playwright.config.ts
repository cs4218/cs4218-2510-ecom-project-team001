// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const isCI = !!process.env.CI;

export default defineConfig({
  globalSetup: "./tests/ui/globalSetup.js",
  testDir: "./tests/ui",
  timeout: 30_000,

  expect: { timeout: 10_000 },

  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  reporter: [["html"], ["list"]],

  use: {
    actionTimeout: 0,
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    storageState: "./tests/ui/.auth/user.json", // Default user session
  },

  projects: [
    {
      name: "chromium-user",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./tests/ui/.auth/user.json",
      },
    },
    {
      name: "chromium-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./tests/ui/.auth/admin.json",
      },
    },
  ],

  webServer: [
    {
      // Backend API server
      command: "npm run server",
      cwd: "./",
      url: "http://127.0.0.1:6060/api/v1/auth/health",
      timeout: 180_000,
      reuseExistingServer: true,
      env: {
        HOST: "127.0.0.1",
        PORT: "6060",
        NODE_ENV: process.env.NODE_ENV ?? "development",
      },
    },
    {
      // Frontend dev server
      command: "npm start",
      cwd: "./client",
      url: "http://127.0.0.1:3000/health.txt",
      timeout: 180_000,
      reuseExistingServer: true,
      env: {
        HOST: "127.0.0.1",
        PORT: "3000",
        BROWSER: "none",
        WDS_ALLOWED_HOSTS: "all",
        CI: "true",
      },
    },
  ],
});
