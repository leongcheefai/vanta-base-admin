import { db, schema } from "@praxor-kit/db";
import { createFeedbackIssue } from "../../lib/github";
import { log } from "../../lib/logger";
import type { CreateFeedbackInput } from "./feedback.schema";

export async function createFeedback(
  userId: string,
  userEmail: string,
  input: CreateFeedbackInput,
) {
  const id = crypto.randomUUID();
  await db.insert(schema.feedback).values({ id, userId, ...input });

  let issueUrl: string | undefined;
  try {
    const issue = await createFeedbackIssue({ id, userEmail, userId, ...input });
    issueUrl = issue?.html_url ?? undefined;
  } catch (err) {
    log("warn", "github_issue_create_failed", { feedbackId: id, err: String(err) });
  }

  return { id, issueUrl };
}
