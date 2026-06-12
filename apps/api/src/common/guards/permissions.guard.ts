import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS DI requires value import for constructor injection
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Permission } from "../constants/permissions";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import type { SessionUser } from "../decorators/current-user.decorator";
import { RolesService } from "../../modules/roles/roles.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		// biome-ignore lint/style/useImportType: NestJS DI requires value import for constructor injection
		private readonly rolesService: RolesService,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const required = this.reflector.getAllAndOverride<Permission[]>(
			PERMISSIONS_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!required || required.length === 0) return true;

		const request = context
			.switchToHttp()
			.getRequest<Request & { user: SessionUser | null }>();
		const user = request.user;

		if (!user) throw new ForbiddenException();

		if (user.role === "admin") return true;

		const hasAll = required.every((p) =>
			this.rolesService.hasPermission(user.role, p),
		);

		if (!hasAll) throw new ForbiddenException();
		return true;
	}
}
