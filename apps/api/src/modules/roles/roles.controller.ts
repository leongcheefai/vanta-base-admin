import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
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
import type { CreateRoleDto } from "./dto/create-role.dto";
import type { UpdateRoleDto } from "./dto/update-role.dto";
import type { RolesService } from "./roles.service";

function extractCtx(req: Request): AuditContext {
	return {
		ipAddress: req.ip ?? null,
		userAgent: req.get("user-agent") ?? null,
	};
}

@Controller("roles")
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Get()
	@Permissions(PERMISSIONS.ROLES_READ)
	list() {
		return this.rolesService.list();
	}

	@Get(":id")
	@Permissions(PERMISSIONS.ROLES_READ)
	findById(@Param("id") id: string) {
		return this.rolesService.findById(id);
	}

	@Post()
	@Permissions(PERMISSIONS.ROLES_WRITE)
	create(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Body() dto: CreateRoleDto,
	) {
		return this.rolesService.create(dto, actor.id, extractCtx(req));
	}

	@Patch(":id")
	@Permissions(PERMISSIONS.ROLES_WRITE)
	update(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
		@Body() dto: UpdateRoleDto,
	) {
		return this.rolesService.update(id, dto, actor.id, extractCtx(req));
	}

	@Delete(":id")
	@HttpCode(204)
	@Permissions(PERMISSIONS.ROLES_WRITE)
	remove(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
	) {
		return this.rolesService.remove(id, actor.id, extractCtx(req));
	}
}
