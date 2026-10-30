import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['server/tests/integration/**/*.test.js'],
    setupFiles: ['./server/tests/integration/setup.js'],
    fileParallelism: false,
  },
});
