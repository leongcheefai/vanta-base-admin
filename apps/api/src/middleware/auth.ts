import { auth } from "@vanta-base-admin/auth";
import type { MiddlewareHandler } from "hono";
import type { AppVariables } from "../lib/context";

export const sessionMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (
  c,
  next,
) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
};
