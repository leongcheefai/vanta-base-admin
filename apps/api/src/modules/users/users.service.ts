import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { auth } from "@vanta-base-admin/auth";
import { db, schema } from "@vanta-base-admin/db";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import type { AuditContext, AuditService } from "../audit/audit.service";
import type { BanUserDto } from "./dto/ban-user.dto";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { EditUserDto } from "./dto/edit-user.dto";
import type { ListUsersDto } from "./dto/list-users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly auditService: AuditService) {}

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
      db.select().from(schema.user).where(where).orderBy(orderBy).limit(limit).offset(offset),
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

  async create(dto: CreateUserDto, adminHeaders: Headers, actorId: string, ctx?: AuditContext) {
    const roleSlug = dto.roleId ? await this.resolveRoleSlug(dto.roleId) : "user";

    const result = await auth.api.createUser({
      body: {
        email: dto.email,
        name: dto.name,
        password: dto.password,
        role: roleSlug,
      },
      headers: adminHeaders,
    });

    const createdUser = (result as { user: { id: string } }).user;
    await this.auditService.record(
      {
        action: "user.create",
        actorId,
        targetType: "user",
        targetId: createdUser.id,
        metadata: {
          after: { email: dto.email, name: dto.name, role: roleSlug },
        },
      },
      ctx,
    );

    return result;
  }

  async edit(id: string, dto: EditUserDto, actorId: string, ctx?: AuditContext) {
    const before = await db.query.user.findFirst({
      where: eq(schema.user.id, id),
    });
    if (!before) throw new NotFoundException("User not found");

    const updates: Partial<typeof schema.user.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (dto.name !== undefined) updates.name = dto.name;

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.user)
        .set(updates)
        .where(eq(schema.user.id, id))
        .returning();

      if (!updated) throw new NotFoundException("User not found");

      await this.auditService.record(
        {
          action: "user.update",
          actorId,
          targetType: "user",
          targetId: id,
          metadata: {
            before: { name: before.name },
            after: { name: updated.name },
          },
        },
        ctx,
        tx,
      );

      return updated;
    });
  }

  async assignRole(userId: string, roleId: string, actorId: string, ctx?: AuditContext) {
    const role = await db.query.roles.findFirst({
      where: eq(schema.roles.id, roleId),
    });
    if (!role) throw new NotFoundException("Role not found");

    const before = await db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    });

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.user)
        .set({ roleId: role.id, role: role.slug, updatedAt: new Date() })
        .where(eq(schema.user.id, userId))
        .returning();

      if (!updated) throw new NotFoundException("User not found");

      await this.auditService.record(
        {
          action: "user.role_change",
          actorId,
          targetType: "user",
          targetId: userId,
          metadata: {
            before: {
              roleId: before?.roleId ?? null,
              role: before?.role ?? null,
            },
            after: { roleId: role.id, role: role.slug },
          },
        },
        ctx,
        tx,
      );

      return updated;
    });
  }

  async ban(id: string, dto: BanUserDto, actorId: string, ctx?: AuditContext) {
    return db.transaction(async (tx) => {
      await tx.delete(schema.session).where(eq(schema.session.userId, id));

      const [updated] = await tx
        .update(schema.user)
        .set({ banned: true, banReason: dto.banReason, updatedAt: new Date() })
        .where(eq(schema.user.id, id))
        .returning();

      if (!updated) throw new NotFoundException("User not found");

      await this.auditService.record(
        {
          action: "user.ban",
          actorId,
          targetType: "user",
          targetId: id,
          metadata: { after: { banReason: dto.banReason } },
        },
        ctx,
        tx,
      );

      return updated;
    });
  }

  async unban(id: string, actorId: string, ctx?: AuditContext) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.user)
        .set({ banned: false, banReason: null, updatedAt: new Date() })
        .where(eq(schema.user.id, id))
        .returning();

      if (!updated) throw new NotFoundException("User not found");

      await this.auditService.record(
        {
          action: "user.unban",
          actorId,
          targetType: "user",
          targetId: id,
          metadata: {},
        },
        ctx,
        tx,
      );

      return updated;
    });
  }

  async softDelete(id: string, actingUserId: string, actorId: string, ctx?: AuditContext) {
    if (id === actingUserId) {
      throw new ForbiddenException("Cannot delete your own account");
    }

    return db.transaction(async (tx) => {
      await tx.delete(schema.session).where(eq(schema.session.userId, id));

      const [updated] = await tx
        .update(schema.user)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.user.id, id))
        .returning();

      if (!updated) throw new NotFoundException("User not found");

      await this.auditService.record(
        {
          action: "user.delete",
          actorId,
          targetType: "user",
          targetId: id,
          metadata: {},
        },
        ctx,
        tx,
      );

      return updated;
    });
  }

  async restore(id: string, actorId: string, ctx?: AuditContext) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.user)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(schema.user.id, id))
        .returning();

      if (!updated) throw new NotFoundException("User not found");

      await this.auditService.record(
        {
          action: "user.restore",
          actorId,
          targetType: "user",
          targetId: id,
          metadata: {},
        },
        ctx,
        tx,
      );

      return updated;
    });
  }

  async revokeSessions(id: string, actorId: string, ctx?: AuditContext) {
    return db.transaction(async (tx) => {
      const deleted = await tx
        .delete(schema.session)
        .where(eq(schema.session.userId, id))
        .returning();

      await this.auditService.record(
        {
          action: "user.sessions_revoke",
          actorId,
          targetType: "user",
          targetId: id,
          metadata: { after: { revokedCount: deleted.length } },
        },
        ctx,
        tx,
      );

      return { revoked: deleted.length };
    });
  }

  private async resolveRoleSlug(roleId: string): Promise<string> {
    const role = await db.query.roles.findFirst({
      where: eq(schema.roles.id, roleId),
    });
    return role?.slug ?? "user";
  }
}
