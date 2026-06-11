import { Controller, ForbiddenException, Get, Post } from "@nestjs/common";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { ReleasesService } from "./releases.service";

@Controller("releases")
export class ReleasesController {
	constructor(private readonly releasesService: ReleasesService) {}

	@Get()
	list() {
		return this.releasesService.list();
	}

	@Post("sync")
	async sync(@CurrentUser() user: SessionUser) {
		if (user.role !== "admin") throw new ForbiddenException();
		return this.releasesService.sync();
	}
}
