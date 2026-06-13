import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { auth } from "@vanta-base-admin/auth";
import { db, schema } from "@vanta-base-admin/db";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import type { BanUserDto } from "./dto/ban-user.dto";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { EditUserDto } from "./dto/edit-user.dto";
import type { ListUsersDto } from "./dto/list-users.dto";

@Injectable()
export class UsersService {
	async list(query: ListUsersDto) {
		const limit = query.limit ?? 20;
		const offset = query.offset ?? 0;

		const conditions = [];

		if (!query.includeDeleted) {
			conditions.push(isNull(schema.user.deletedAt));
		}

		if (query.role) {
			conditions.push(eq(schema.user.role, query.role));
		}

		if (query.banned !== undefined) {
			conditions.push(
				query.banned
					? eq(schema.user.banned, true)
					: or(eq(schema.user.banned, false), isNull(schema.user.banned)),
			);
		}

		if (query.search) {
			conditions.push(
				or(
					ilike(schema.user.name, `%${query.search}%`),
					ilike(schema.user.email, `%${query.search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const orderBy =
			query.sortBy === "name"
				? asc(schema.user.name)
				: query.sortBy === "email"
					? asc(schema.user.email)
					: desc(schema.user.createdAt);

		const [users, totals] = await Promise.all([
			db
				.select()
				.from(schema.user)
				.where(where)
				.orderBy(orderBy)
				.limit(limit)
				.offset(offset),
			db.select({ total: count() }).from(schema.user).where(where),
		]);

		return { users, total: totals[0]?.total ?? 0 };
	}

	async findById(id: string) {
		const user = await db.query.user.findFirst({
			where: eq(schema.user.id, id),
		});

		if (!user) throw new NotFoundException("User not found");

		const sessions = await db.select().from(schema.session).where(eq(schema.session.userId, id));

		return {
			user,
			sessions: sessions.map((s) => ({
				id: s.id,
				createdAt: s.createdAt,
				expiresAt: s.expiresAt,
				ipAddress: s.ipAddress,
				userAgent: s.userAgent,
			})),
		};
	}

	async create(dto: CreateUserDto, adminHeaders: Headers) {
		const roleSlug = dto.roleId
			? await this.resolveRoleSlug(dto.roleId)
			: "user";

		const result = await auth.api.adminCreateUser({
			body: {
				email: dto.email,
				name: dto.name,
				password: dto.password,
				role: roleSlug,
			},
			headers: adminHeaders,
		});
		return result;
	}

	async edit(id: string, dto: EditUserDto) {
		const updates: Partial<typeof schema.user.$inferInsert> = {
			updatedAt: new Date(),
		};
		if (dto.name !== undefined) updates.name = dto.name;

		const [user] = await db
			.update(schema.user)
			.set(updates)
			.where(eq(schema.user.id, id))
			.returning();

		if (!user) throw new NotFoundException("User not found");
		return user;
	}

	async assignRole(userId: string, roleId: string) {
		const role = await db.query.roles.findFirst({
			where: eq(schema.roles.id, roleId),
		});
		if (!role) throw new NotFoundException("Role not found");

		const [user] = await db
			.update(schema.user)
			.set({ roleId: role.id, role: role.slug, updatedAt: new Date() })
			.where(eq(schema.user.id, userId))
			.returning();

		if (!user) throw new NotFoundException("User not found");
		return user;
	}

	async ban(id: string, dto: BanUserDto) {
		await db.delete(schema.session).where(eq(schema.session.userId, id));

		const [user] = await db
			.update(schema.user)
			.set({ banned: true, banReason: dto.banReason, updatedAt: new Date() })
			.where(eq(schema.user.id, id))
			.returning();

		if (!user) throw new NotFoundException("User not found");
		return user;
	}

	async unban(id: string) {
		const [user] = await db
			.update(schema.user)
			.set({ banned: false, banReason: null, updatedAt: new Date() })
			.where(eq(schema.user.id, id))
			.returning();

		if (!user) throw new NotFoundException("User not found");
		return user;
	}

	async softDelete(id: string, actingUserId: string) {
		if (id === actingUserId) {
			throw new ForbiddenException("Cannot delete your own account");
		}

		await db.delete(schema.session).where(eq(schema.session.userId, id));

		const [user] = await db
			.update(schema.user)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(schema.user.id, id))
			.returning();

		if (!user) throw new NotFoundException("User not found");
		return user;
	}

	async restore(id: string) {
		const [user] = await db
			.update(schema.user)
			.set({ deletedAt: null, updatedAt: new Date() })
			.where(eq(schema.user.id, id))
			.returning();

		if (!user) throw new NotFoundException("User not found");
		return user;
	}

	async revokeSessions(id: string) {
		const deleted = await db
			.delete(schema.session)
			.where(eq(schema.session.userId, id))
			.returning();

		return { revoked: deleted.length };
	}

	private async resolveRoleSlug(roleId: string): Promise<string> {
		const role = await db.query.roles.findFirst({
			where: eq(schema.roles.id, roleId),
		});
		return role?.slug ?? "user";
	}
}
