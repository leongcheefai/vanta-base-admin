import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
} from "@nestjs/common";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { BanUserDto } from "./dto/ban-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { EditUserDto } from "./dto/edit-user.dto";
import { ListUsersDto } from "./dto/list-users.dto";
import { UsersService } from "./users.service";
import type { Request } from "express";

@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	private requireAdmin(user: SessionUser) {
		if (user.role !== "admin") throw new ForbiddenException();
	}

	@Get()
	list(@CurrentUser() user: SessionUser, @Query() query: ListUsersDto) {
		this.requireAdmin(user);
		return this.usersService.list(query);
	}

	@Get(":id")
	findById(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		this.requireAdmin(user);
		return this.usersService.findById(id);
	}

	@Post()
	async create(
		@CurrentUser() user: SessionUser,
		@Req() req: Request,
		@Body() dto: CreateUserDto,
	) {
		this.requireAdmin(user);
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value !== undefined) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			}
		}
		return this.usersService.create(dto, headers);
	}

	@Patch(":id")
	edit(
		@CurrentUser() user: SessionUser,
		@Param("id") id: string,
		@Body() dto: EditUserDto,
	) {
		this.requireAdmin(user);
		return this.usersService.edit(id, dto);
	}

	@Post(":id/ban")
	ban(
		@CurrentUser() user: SessionUser,
		@Param("id") id: string,
		@Body() dto: BanUserDto,
	) {
		this.requireAdmin(user);
		return this.usersService.ban(id, dto);
	}

	@Post(":id/unban")
	unban(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		this.requireAdmin(user);
		return this.usersService.unban(id);
	}

	@Delete(":id")
	softDelete(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		this.requireAdmin(user);
		return this.usersService.softDelete(id, user.id);
	}

	@Post(":id/restore")
	restore(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		this.requireAdmin(user);
		return this.usersService.restore(id);
	}

	@Post(":id/revoke-sessions")
	revokeSessions(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		this.requireAdmin(user);
		return this.usersService.revokeSessions(id);
	}
}
