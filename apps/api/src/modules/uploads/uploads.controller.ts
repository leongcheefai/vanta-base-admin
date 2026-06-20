import { Body, Controller, Post } from "@nestjs/common";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import type { PresignAvatarDto } from "./dto/presign-avatar.dto";
import type { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
	constructor(private readonly uploadsService: UploadsService) {}

	@Post("avatar/presign")
	presignAvatar(
		@CurrentUser() user: SessionUser,
		@Body() dto: PresignAvatarDto,
	) {
		return this.uploadsService.presignAvatar(user.id, dto);
	}
}
