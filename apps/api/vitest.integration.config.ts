import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@pulsecart/domain": resolve(__dirname, "../../packages/domain/src/index.ts")
    }
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.integration.test.ts"],
    testTimeout: 30000,
    reporters: ["default", "junit"],
    outputFile: {
      junit: "../../reports/junit-api-integration.xml"
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "../../reports/coverage/api-integration"
    }
  }
});
