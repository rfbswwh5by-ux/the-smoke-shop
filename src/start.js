import { createStart } from "@tanstack/react-start";
import { appRequestMiddleware, authMiddleware } from "@/lib/auth-middleware";

// Every server function and server route gets `context.getBase44()` (the app's own data client).
export const startInstance = createStart(() => ({
  requestMiddleware: [appRequestMiddleware],
  functionMiddleware: [authMiddleware],
}));
