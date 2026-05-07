import { db } from "@praxor-kit/db";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";

export const meRouter = new Hono<{ Variables: AppVariables }>();

meRouter.get("/", (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  return c.json({ user });
});

meRouter.get("/has-password", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });

  const account = await db.query.account.findFirst({
    where: (acc, { and, eq }) => and(eq(acc.userId, user.id), eq(acc.providerId, "credential")),
  });

  return c.json({ hasPassword: account !== undefined });
});
