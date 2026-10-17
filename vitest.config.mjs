/// <reference types="vitest" />
import { getViteConfig } from "astro/config";
import { configDefaults } from "vitest/config";

export default getViteConfig({
  test: {
    // The pipeline uses Node's native test runner. See pipeline:test
    exclude: [...configDefaults.exclude, "pipeline/**"],
  },
});
