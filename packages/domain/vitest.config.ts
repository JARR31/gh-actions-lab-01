import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "../../reports/junit-domain.xml"
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "../../reports/coverage/domain"
    }
  }
});
