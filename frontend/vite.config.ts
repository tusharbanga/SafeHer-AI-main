// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import apiBackendProxyPlugin from "./vite-plugins/api-backend-proxy";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // NOTE: we intentionally do NOT use Vite's declarative `server.proxy` option here.
  // @lovable.dev/vite-tanstack-config strips `server.proxy` (along with `server.cors`
  // and `server.headers`) whenever it detects it is running inside a Lovable sandbox
  // (see `cleanServerConfig` in its source). When that happens, requests to /api/*
  // fall straight through to TanStack Start's own SSR request handler instead of being
  // forwarded to the Express backend, which has no matching route for them and (since
  // fetch() sends `Accept: application/json`, not `text/html`) responds with the
  // misleading `{"error":"Only HTML requests are supported here"}` / 500.
  // A real Vite *plugin* (registered below) is never touched by that config-stripping
  // logic, so it reliably forwards /api/* to Express in every environment.
  plugins: [apiBackendProxyPlugin()],
  vite: {
    server: {
      // Some containerized/sandboxed environments don't support binding to the
      // IPv6 wildcard address ("::") that this config normally defaults to,
      // and fail with EAFNOSUPPORT. 0.0.0.0 works everywhere IPv4 is available.
      host: "0.0.0.0",
    },
  },
});
