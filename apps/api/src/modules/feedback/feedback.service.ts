import { Injectable } from "@nestjs/common";
import { db, schema } from "@vanta-base-admin/db";
import { createFeedbackIssue } from "../../lib/github";
import { log } from "../../lib/logger";
import type { CreateFeedbackDto } from "./dto/create-feedback.dto";

@Injectable()
export class FeedbackService {
  async create(userId: string, userEmail: string, input: CreateFeedbackDto) {
    const id = crypto.randomUUID();
    await db.insert(schema.feedback).values({ id, userId, ...input });

    let issueUrl: string | undefined;
    try {
      const issue = await createFeedbackIssue({
        id,
        userEmail,
        userId,
        ...input,
      });
      issueUrl = issue?.html_url ?? undefined;
    } catch (err) {
      log("warn", "github_issue_create_failed", {
        feedbackId: id,
        err: String(err),
      });
    }

    return { id, issueUrl };
  }
}
