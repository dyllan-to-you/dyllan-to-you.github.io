import { defineConfig } from "vitest/config";

// Unit tests for the extracted PURE engine math (src/lib/geometry.ts,
// src/lib/routing.ts). Node environment — these functions touch no DOM.
// Playwright (tests/) owns the integration/visual/a11y layer; vitest owns
// the pure-function layer, so the two never collide on test discovery:
// vitest only globs src/**/*.test.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
