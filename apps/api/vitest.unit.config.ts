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
    include: ["tests/**/*.unit.test.ts"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "../../reports/junit-api.xml"
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "../../reports/coverage/api-unit"
    }
  }
});
