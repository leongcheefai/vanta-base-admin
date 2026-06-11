import { Controller, Get } from "@nestjs/common";
import { db } from "@vanta-base-admin/db";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";

@Controller("me")
export class MeController {
	@Get()
	getMe(@CurrentUser() user: SessionUser) {
		return { user };
	}

	@Get("has-password")
	async hasPassword(@CurrentUser() user: SessionUser) {
		const account = await db.query.account.findFirst({
			where: (acc, { and, eq }) =>
				and(eq(acc.userId, user.id), eq(acc.providerId, "credential")),
		});
		return { hasPassword: account !== undefined };
	}
}
