import {
	BadRequestException,
	Injectable,
	NotFoundException,
	type OnModuleInit,
} from "@nestjs/common";
import { db, schema } from "@vanta-base-admin/db";
import { eq } from "drizzle-orm";
import type { CreateRoleDto } from "./dto/create-role.dto";
import type { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService implements OnModuleInit {
	private permissionsCache = new Map<string, Set<string>>();

	async onModuleInit() {
		await this.reloadCache();
	}

	async reloadCache() {
		const data = await db
			.select({
				slug: schema.roles.slug,
				permission: schema.rolePermissions.permission,
			})
			.from(schema.roles)
			.innerJoin(
				schema.rolePermissions,
				eq(schema.roles.id, schema.rolePermissions.roleId),
			);

		this.permissionsCache.clear();
		for (const { slug, permission } of data) {
			if (!this.permissionsCache.has(slug)) {
				this.permissionsCache.set(slug, new Set());
			}
			this.permissionsCache.get(slug)?.add(permission);
		}
	}

	hasPermission(
		roleSlug: string | null | undefined,
		permission: string,
	): boolean {
		if (!roleSlug) return false;
		return this.permissionsCache.get(roleSlug)?.has(permission) ?? false;
	}

	getPermissions(roleSlug: string | null | undefined): string[] {
		if (!roleSlug) return [];
		return Array.from(this.permissionsCache.get(roleSlug) ?? []);
	}

	async list() {
		const allRoles = await db.select().from(schema.roles);
		const allPerms = await db.select().from(schema.rolePermissions);

		return allRoles.map((role) => ({
			...role,
			permissions: allPerms
				.filter((p) => p.roleId === role.id)
				.map((p) => p.permission),
		}));
	}

	async findById(id: string) {
		const role = await db.query.roles.findFirst({
			where: eq(schema.roles.id, id),
		});
		if (!role) throw new NotFoundException("Role not found");

		const perms = await db
			.select()
			.from(schema.rolePermissions)
			.where(eq(schema.rolePermissions.roleId, id));

		return { ...role, permissions: perms.map((p) => p.permission) };
	}

	async create(dto: CreateRoleDto) {
		const slug = dto.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		const existing = await db.query.roles.findFirst({
			where: eq(schema.roles.slug, slug),
		});
		if (existing)
			throw new BadRequestException("A role with this name already exists");

		const id = `role_${slug}_${Date.now()}`;
		const permissions = dto.permissions ?? [];

		const [role] = await db
			.insert(schema.roles)
			.values({
				id,
				slug,
				name: dto.name,
				isSystem: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		if (permissions.length > 0) {
			await db
				.insert(schema.rolePermissions)
				.values(
					permissions.map((permission) => ({ roleId: role.id, permission })),
				);
		}

		await this.reloadCache();
		return { ...role, permissions };
	}

	async update(id: string, dto: UpdateRoleDto) {
		const role = await db.query.roles.findFirst({
			where: eq(schema.roles.id, id),
		});
		if (!role) throw new NotFoundException("Role not found");

		if (dto.name !== undefined) {
			if (role.slug === "admin") {
				throw new BadRequestException("Cannot rename the admin role");
			}
			await db
				.update(schema.roles)
				.set({ name: dto.name, updatedAt: new Date() })
				.where(eq(schema.roles.id, id));
		}

		if (dto.permissions !== undefined) {
			if (role.slug === "admin") {
				throw new BadRequestException("Cannot modify admin role permissions");
			}
			await db
				.delete(schema.rolePermissions)
				.where(eq(schema.rolePermissions.roleId, id));

			if (dto.permissions.length > 0) {
				await db
					.insert(schema.rolePermissions)
					.values(
						dto.permissions.map((permission) => ({ roleId: id, permission })),
					);
			}

			await this.reloadCache();
		}

		return this.findById(id);
	}

	async remove(id: string) {
		const role = await db.query.roles.findFirst({
			where: eq(schema.roles.id, id),
		});
		if (!role) throw new NotFoundException("Role not found");
		if (role.isSystem)
			throw new BadRequestException("Cannot delete a system role");

		await db.delete(schema.roles).where(eq(schema.roles.id, id));
		await this.reloadCache();
	}
}
