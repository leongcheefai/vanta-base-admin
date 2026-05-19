import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";
import { listReleases, syncReleases } from "./releases.service";

export const releasesRouter = new Hono<{ Variables: AppVariables }>();

releasesRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const releases = await listReleases();
  return c.json(releases);
});

releasesRouter.post("/sync", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  if (user.role !== "admin") throw new HTTPException(403, { message: "Forbidden" });
  const result = await syncReleases();
  return c.json(result);
});
