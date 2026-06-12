import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
} from "@nestjs/common";
import { PERMISSIONS } from "../../common/constants/permissions";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

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
	create(@Body() dto: CreateRoleDto) {
		return this.rolesService.create(dto);
	}

	@Patch(":id")
	@Permissions(PERMISSIONS.ROLES_WRITE)
	update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
		return this.rolesService.update(id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	@Permissions(PERMISSIONS.ROLES_WRITE)
	remove(@Param("id") id: string) {
		return this.rolesService.remove(id);
	}
}
