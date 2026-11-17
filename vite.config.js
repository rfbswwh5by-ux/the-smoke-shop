import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Every runtime dependency is bundled at startup, for the browser and the SSR server: one first imported
// mid-session makes Vite re-bundle, and a page rendered meanwhile on the server loads a second React.
// Not listed: React itself, the TanStack Start/Router framework (its plugin bundles it) and build-time plugins.
const NOT_PREBUNDLED = new Set(["react", "react-dom", "@tanstack/react-start", "@tanstack/react-router", "@tanstack/react-router-ssr-query", "tailwindcss-animate", "nitro"]);
// Server-only packages, never imported by the browser.
const SERVER_ONLY = new Set(["@neondatabase/serverless", "@vercel/blob"]);
const { dependencies } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const PREBUNDLE = Object.keys(dependencies).filter((name) => !NOT_PREBUNDLED.has(name) && !SERVER_ONLY.has(name));
// In dev the browser otherwise fetches the router as ~100 separate files after the load event, delaying hydration
// by seconds behind the preview proxy. Browser only, and every browser entry point of the router, so one copy loads
// (templates/tests/tanstack-dev-router checks it).
const BROWSER_PREBUNDLE = [
  "@tanstack/react-router", "@tanstack/react-router/ssr/client", "@tanstack/router-core", "@tanstack/router-core/isServer",
  "@tanstack/router-core/ssr/client",
  "@tanstack/router-core/scroll-restoration-script", "@tanstack/history", "@tanstack/start-fn-stubs",
  "seroval", "seroval-plugins/web", "cookie-es",
];

// On Vercel (or NITRO_PRESET=vercel), emit .vercel/output. Locally, Nitro defaults to the Node preset.
const nitroPreset = process.env.NITRO_PRESET || (process.env.VERCEL ? "vercel" : undefined);

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  optimizeDeps: { include: [...PREBUNDLE, ...BROWSER_PREBUNDLE] },
  environments: {
    ssr: {
      optimizeDeps: { include: PREBUNDLE },
      build: { sourcemap: true, rolldownOptions: { output: { sourcemapExcludeSources: true } } },
    },
  },
  plugins: [
    tanstackStart({ srcDirectory: "src" }),
    nitro(nitroPreset ? { preset: nitroPreset } : {}),
    react(),
  ],
});
