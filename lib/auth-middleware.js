import { createMiddleware } from "@tanstack/react-start";
import { serviceClient } from "@/lib/entities.server";

// Every server function and server route gets `context.getBase44()`. The name
// is kept from the original Base44 template so the store code stays unchanged;
// it now returns this app's own Postgres-backed client (src/lib/entities.server.js).
// Access control happens in store.server.js via the admin session token.
const withClient = (next) => next({ context: { getBase44: () => serviceClient } });

export const authMiddleware = createMiddleware({ type: "function" }).server(({ next }) => withClient(next));

export const appRequestMiddleware = createMiddleware({ type: "request" }).server(({ next }) => withClient(next));
