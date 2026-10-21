import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  inlineStylesheets: "auto",
  // NOTE: This will be the default in 3.x
  // See https://github.com/withastro/astro/releases/tag/astro%402.4.0
  scopedStyleStrategy: "class",
  output: "hybrid",
  adapter: netlify(),
  // Old URLs for releases moved to another artist with overrides
  redirects: {
    "/bruce-springsteen-the-e-street-band/": "/bruce-springsteen/",
    "/bruce-springsteen-the-e-street-band/live-1975-85-947430/":
      "/bruce-springsteen/live-1975-85-947430/",
  },
  devToolbar: {
    enabled: false,
  },
});
