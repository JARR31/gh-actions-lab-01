import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "../../reports/junit-web.xml"
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx"],
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "../../reports/coverage/web"
    }
  }
});
