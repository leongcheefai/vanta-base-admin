import { z } from "zod";

export const createFeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "other"]),
  message: z.string().min(1).max(2000),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
