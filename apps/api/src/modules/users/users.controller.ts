import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
} from "@nestjs/common";
import type { Request } from "express";
import { PERMISSIONS } from "../../common/constants/permissions";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import type { AuditContext } from "../audit/audit.service";
import type { AssignRoleDto } from "./dto/assign-role.dto";
import type { BanUserDto } from "./dto/ban-user.dto";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { EditUserDto } from "./dto/edit-user.dto";
import type { ListUsersDto } from "./dto/list-users.dto";
import { UsersService } from "./users.service";

function extractCtx(req: Request): AuditContext {
	return {
		ipAddress: req.ip ?? null,
		userAgent: req.get("user-agent") ?? null,
	};
}

@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@Permissions(PERMISSIONS.USERS_READ)
	list(@Query() query: ListUsersDto) {
		return this.usersService.list(query);
	}

	@Get(":id")
	@Permissions(PERMISSIONS.USERS_READ)
	findById(@Param("id") id: string) {
		return this.usersService.findById(id);
	}

	@Post()
	@Permissions(PERMISSIONS.USERS_CREATE)
	async create(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Body() dto: CreateUserDto,
	) {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value !== undefined) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			}
		}
		return this.usersService.create(dto, headers, actor.id, extractCtx(req));
	}

	@Patch(":id")
	@Permissions(PERMISSIONS.USERS_EDIT)
	edit(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
		@Body() dto: EditUserDto,
	) {
		return this.usersService.edit(id, dto, actor.id, extractCtx(req));
	}

	@Patch(":id/role")
	@Permissions(PERMISSIONS.ROLES_ASSIGN)
	assignRole(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
		@Body() dto: AssignRoleDto,
	) {
		return this.usersService.assignRole(
			id,
			dto.roleId,
			actor.id,
			extractCtx(req),
		);
	}

	@Post(":id/ban")
	@Permissions(PERMISSIONS.USERS_BAN)
	ban(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
		@Body() dto: BanUserDto,
	) {
		return this.usersService.ban(id, dto, actor.id, extractCtx(req));
	}

	@Post(":id/unban")
	@Permissions(PERMISSIONS.USERS_BAN)
	unban(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
	) {
		return this.usersService.unban(id, actor.id, extractCtx(req));
	}

	@Delete(":id")
	@Permissions(PERMISSIONS.USERS_DELETE)
	softDelete(
		@Req() req: Request,
		@CurrentUser() user: SessionUser,
		@Param("id") id: string,
	) {
		return this.usersService.softDelete(id, user.id, user.id, extractCtx(req));
	}

	@Post(":id/restore")
	@Permissions(PERMISSIONS.USERS_DELETE)
	restore(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
	) {
		return this.usersService.restore(id, actor.id, extractCtx(req));
	}

	@Post(":id/revoke-sessions")
	@Permissions(PERMISSIONS.USERS_SESSIONS)
	revokeSessions(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
	) {
		return this.usersService.revokeSessions(id, actor.id, extractCtx(req));
	}
}
