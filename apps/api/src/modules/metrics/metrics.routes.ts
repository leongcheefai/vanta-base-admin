import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";
import { generateMockMetrics } from "./metrics.mock";

export const metricsRouter = new Hono<{ Variables: AppVariables }>();

metricsRouter.get("/overview", (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  return c.json(generateMockMetrics());
});
