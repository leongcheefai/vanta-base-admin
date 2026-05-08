import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://kit.praxor.dev",
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes("/og/") })],
  vite: {
    plugins: [tailwindcss()],
  },
});
