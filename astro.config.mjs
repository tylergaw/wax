import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

const devPages = {
  name: "dev-pages",
  hooks: {
    "astro:config:setup": ({ command, injectRoute }) => {
      if (command === "dev") {
        injectRoute({
          pattern: "/covers",
          entrypoint: "./src/dev-pages/covers.astro",
        });
      }
    },
  },
};

// https://astro.build/config
export default defineConfig({
  inlineStylesheets: "auto",
  // NOTE: This will be the default in 3.x
  // See https://github.com/withastro/astro/releases/tag/astro%402.4.0
  scopedStyleStrategy: "class",
  output: "hybrid",
  adapter: netlify(),
  devToolbar: {
    enabled: false,
  },
  integrations: [devPages],
});
