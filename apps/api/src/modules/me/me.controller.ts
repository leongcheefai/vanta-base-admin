import { Controller, Get } from "@nestjs/common";
import { db } from "@vanta-base-admin/db";
import { ALL_PERMISSIONS } from "../../common/constants/permissions";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { RolesService } from "../roles/roles.service";

@Controller("me")
export class MeController {
	constructor(private readonly rolesService: RolesService) {}

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

	@Get("permissions")
	getPermissions(@CurrentUser() user: SessionUser) {
		const isAdmin = user.role === "admin";
		const permissions = isAdmin
			? ALL_PERMISSIONS
			: this.rolesService.getPermissions(user.role);
		return { role: user.role ?? null, permissions, isAdmin };
	}
}
