import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import type { RolesService } from "../../modules/roles/roles.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { PermissionsGuard } from "./permissions.guard";

function makeContext(user: { role: string } | null, permissions: string[] | undefined) {
	const reflector = new Reflector();
	vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(permissions);

	const request = { user };
	const context = {
		switchToHttp: () => ({ getRequest: () => request }),
		getHandler: () => ({}),
		getClass: () => ({}),
	} as any;

	return { reflector, context };
}

function makeRolesService(cache: Record<string, string[]>): RolesService {
	return {
		hasPermission(slug: string | null | undefined, permission: string) {
			if (!slug) return false;
			return cache[slug]?.includes(permission) ?? false;
		},
	} as unknown as RolesService;
}

describe("PermissionsGuard", () => {
	it("passes when no permissions required (no decorator)", () => {
		const { reflector, context } = makeContext(null, undefined);
		const guard = new PermissionsGuard(reflector, makeRolesService({}));
		expect(guard.canActivate(context)).toBe(true);
	});

	it("passes when permissions array is empty", () => {
		const { reflector, context } = makeContext(null, []);
		const guard = new PermissionsGuard(reflector, makeRolesService({}));
		expect(guard.canActivate(context)).toBe(true);
	});

	it("throws ForbiddenException when user is null", () => {
		const { reflector, context } = makeContext(null, ["users:read"]);
		const guard = new PermissionsGuard(reflector, makeRolesService({}));
		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
	});

	it("passes for admin role regardless of required permissions", () => {
		const { reflector, context } = makeContext(
			{ role: "admin" },
			["users:read", "roles:write"],
		);
		const guard = new PermissionsGuard(reflector, makeRolesService({}));
		expect(guard.canActivate(context)).toBe(true);
	});

	it("passes when user has all required permissions (AND semantics)", () => {
		const { reflector, context } = makeContext(
			{ role: "moderator" },
			["users:read", "users:ban"],
		);
		const rolesService = makeRolesService({ moderator: ["users:read", "users:ban"] });
		const guard = new PermissionsGuard(reflector, rolesService);
		expect(guard.canActivate(context)).toBe(true);
	});

	it("throws ForbiddenException when user is missing one permission", () => {
		const { reflector, context } = makeContext(
			{ role: "moderator" },
			["users:read", "roles:write"],
		);
		const rolesService = makeRolesService({ moderator: ["users:read"] });
		const guard = new PermissionsGuard(reflector, rolesService);
		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
	});

	it("throws ForbiddenException when user has no permissions", () => {
		const { reflector, context } = makeContext(
			{ role: "user" },
			["users:read"],
		);
		const rolesService = makeRolesService({});
		const guard = new PermissionsGuard(reflector, rolesService);
		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
	});

	it("respects the PERMISSIONS_KEY metadata key", () => {
		const reflector = new Reflector();
		const spy = vi.spyOn(reflector, "getAllAndOverride");
		const context = {
			switchToHttp: () => ({ getRequest: () => ({ user: { role: "admin" } }) }),
			getHandler: () => ({}),
			getClass: () => ({}),
		} as any;
		const guard = new PermissionsGuard(reflector, makeRolesService({}));
		guard.canActivate(context);
		expect(spy).toHaveBeenCalledWith(PERMISSIONS_KEY, expect.any(Array));
	});
});
