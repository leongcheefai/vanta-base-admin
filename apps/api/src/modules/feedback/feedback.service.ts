import { db, schema } from "@praxor-kit/db";
import type { CreateFeedbackInput } from "./feedback.schema";

export async function createFeedback(userId: string, input: CreateFeedbackInput) {
  const id = crypto.randomUUID();
  await db.insert(schema.feedback).values({ id, userId, ...input });
  return { id };
}
