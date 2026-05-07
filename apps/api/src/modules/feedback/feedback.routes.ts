import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";
import { createFeedbackSchema } from "./feedback.schema";
import { createFeedback } from "./feedback.service";

export const feedbackRouter = new Hono<{ Variables: AppVariables }>();

feedbackRouter.post("/", zValidator("json", createFeedbackSchema), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await createFeedback(user.id, input);
  return c.json(result);
});
