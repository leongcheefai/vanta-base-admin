import { Body, Controller, Post } from "@nestjs/common";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import type { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackService } from "./feedback.service";

@Controller("feedback")
export class FeedbackController {
	constructor(private readonly feedbackService: FeedbackService) {}

	@Post()
	create(@CurrentUser() user: SessionUser, @Body() dto: CreateFeedbackDto) {
		return this.feedbackService.create(user.id, user.email, dto);
	}
}
