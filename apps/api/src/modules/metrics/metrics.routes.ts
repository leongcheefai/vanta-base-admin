import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";
import { getMetricsOverview } from "./metrics.service";

export const metricsRouter = new Hono<{ Variables: AppVariables }>();

metricsRouter.get("/overview", (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  return c.json(getMetricsOverview());
});
