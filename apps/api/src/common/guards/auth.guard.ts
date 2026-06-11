import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS DI requires value import for constructor injection
import { Reflector } from "@nestjs/core";
import { auth } from "@vanta-base-admin/auth";
import type { Request } from "express";
import type {
	SessionSession,
	SessionUser,
} from "../decorators/current-user.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context
			.switchToHttp()
			.getRequest<
				Request & { user: SessionUser | null; session: SessionSession | null }
			>();

		const headers = new Headers();
		for (const [key, value] of Object.entries(request.headers)) {
			if (value !== undefined) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			}
		}

		const sessionData = await auth.api.getSession({ headers });
		request.user = sessionData?.user ?? null;
		request.session = sessionData?.session ?? null;

		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) return true;
		if (!request.user) throw new UnauthorizedException();
		return true;
	}
}
