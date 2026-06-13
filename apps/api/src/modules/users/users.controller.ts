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
import { AssignRoleDto } from "./dto/assign-role.dto";
import { BanUserDto } from "./dto/ban-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { EditUserDto } from "./dto/edit-user.dto";
import { ListUsersDto } from "./dto/list-users.dto";
import { UsersService } from "./users.service";

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
	async create(@Req() req: Request, @Body() dto: CreateUserDto) {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value !== undefined) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			}
		}
		return this.usersService.create(dto, headers);
	}

	@Patch(":id")
	@Permissions(PERMISSIONS.USERS_EDIT)
	edit(@Param("id") id: string, @Body() dto: EditUserDto) {
		return this.usersService.edit(id, dto);
	}

	@Patch(":id/role")
	@Permissions(PERMISSIONS.ROLES_ASSIGN)
	assignRole(@Param("id") id: string, @Body() dto: AssignRoleDto) {
		return this.usersService.assignRole(id, dto.roleId);
	}

	@Post(":id/ban")
	@Permissions(PERMISSIONS.USERS_BAN)
	ban(@Param("id") id: string, @Body() dto: BanUserDto) {
		return this.usersService.ban(id, dto);
	}

	@Post(":id/unban")
	@Permissions(PERMISSIONS.USERS_BAN)
	unban(@Param("id") id: string) {
		return this.usersService.unban(id);
	}

	@Delete(":id")
	@Permissions(PERMISSIONS.USERS_DELETE)
	softDelete(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		return this.usersService.softDelete(id, user.id);
	}

	@Post(":id/restore")
	@Permissions(PERMISSIONS.USERS_DELETE)
	restore(@Param("id") id: string) {
		return this.usersService.restore(id);
	}

	@Post(":id/revoke-sessions")
	@Permissions(PERMISSIONS.USERS_SESSIONS)
	revokeSessions(@Param("id") id: string) {
		return this.usersService.revokeSessions(id);
	}
}
