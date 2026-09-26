import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 40_000,
  retries: 0,
  reporter: "list",
  outputDir: "artifacts/test-results",
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1366, height: 768 },
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
