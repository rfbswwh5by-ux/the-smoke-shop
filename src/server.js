// Server entry (Nitro / Vercel). Wraps TanStack Start's default handler so a
// page's loader and beforeLoad errors show up in the Vercel function logs.
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

const handler = createStartHandler((ctx) => {
  for (const match of ctx.router.state.matches) {
    if (match.status === "error") {
      console.error(`Route error in ${match.routeId}:`, match.error?.stack || match.error?.message || match.error);
    }
  }
  return defaultStreamHandler(ctx);
});

export default { fetch: handler };
