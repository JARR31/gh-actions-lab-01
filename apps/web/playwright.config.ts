import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  reporter: [["list"], ["junit", { outputFile: "../../reports/junit-e2e.xml" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "pnpm --dir ../.. --filter @pulsecart/api dev",
      url: "http://127.0.0.1:3000/health",
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: "test",
        STORAGE_DRIVER: "memory",
        API_PORT: "3000"
      }
    },
    {
      command: "pnpm dev -- --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_BASE_URL: "http://127.0.0.1:3000"
      }
    }
  ]
});
