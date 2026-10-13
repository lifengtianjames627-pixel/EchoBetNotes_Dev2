import { defineConfig } from "vitest/config";

export default defineConfig({
  envFile: false,
  envDir: false,
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["tests/integration/**/*.test.ts"],
    maxWorkers: 1,
  },
});
