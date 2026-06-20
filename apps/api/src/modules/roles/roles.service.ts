import {
  BadRequestException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { db, schema } from "@vanta-base-admin/db";
import { eq } from "drizzle-orm";
import { type AuditContext, AuditService } from "../audit/audit.service";
import type { CreateRoleDto } from "./dto/create-role.dto";
import type { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService implements OnModuleInit {
  private permissionsCache = new Map<string, Set<string>>();

  constructor(private readonly auditService: AuditService) {}

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
      .innerJoin(schema.rolePermissions, eq(schema.roles.id, schema.rolePermissions.roleId));

    this.permissionsCache.clear();
    for (const { slug, permission } of data) {
      if (!this.permissionsCache.has(slug)) {
        this.permissionsCache.set(slug, new Set());
      }
      this.permissionsCache.get(slug)?.add(permission);
    }
  }

  hasPermission(roleSlug: string | null | undefined, permission: string): boolean {
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
      permissions: allPerms.filter((p) => p.roleId === role.id).map((p) => p.permission),
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

  async create(dto: CreateRoleDto, actorId: string, ctx?: AuditContext) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await db.query.roles.findFirst({
      where: eq(schema.roles.slug, slug),
    });
    if (existing) throw new BadRequestException("A role with this name already exists");

    const id = `role_${slug}_${Date.now()}`;
    const permissions = dto.permissions ?? [];

    const result = await db.transaction(async (tx) => {
      const [role] = await tx
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
        await tx
          .insert(schema.rolePermissions)
          .values(permissions.map((permission) => ({ roleId: role.id, permission })));
      }

      await this.auditService.record(
        {
          action: "role.create",
          actorId,
          targetType: "role",
          targetId: role.id,
          metadata: {
            after: { name: dto.name, slug, permissions },
          },
        },
        ctx,
        tx,
      );

      return { ...role, permissions };
    });

    await this.reloadCache();
    return result;
  }

  async update(id: string, dto: UpdateRoleDto, actorId: string, ctx?: AuditContext) {
    const role = await db.query.roles.findFirst({
      where: eq(schema.roles.id, id),
    });
    if (!role) throw new NotFoundException("Role not found");

    const currentPerms = await db
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, id));
    const beforePermissions = currentPerms.map((p) => p.permission);

    await db.transaction(async (tx) => {
      if (dto.name !== undefined) {
        if (role.slug === "admin") {
          throw new BadRequestException("Cannot rename the admin role");
        }
        await tx
          .update(schema.roles)
          .set({ name: dto.name, updatedAt: new Date() })
          .where(eq(schema.roles.id, id));
      }

      if (dto.permissions !== undefined) {
        if (role.slug === "admin") {
          throw new BadRequestException("Cannot modify admin role permissions");
        }
        await tx.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, id));

        if (dto.permissions.length > 0) {
          await tx.insert(schema.rolePermissions).values(
            dto.permissions.map((permission) => ({
              roleId: id,
              permission,
            })),
          );
        }
      }

      const afterPermissions = dto.permissions ?? beforePermissions;
      const beforeSet = new Set(beforePermissions);
      const afterSet = new Set(afterPermissions);
      const added = afterPermissions.filter((p) => !beforeSet.has(p));
      const removed = beforePermissions.filter((p) => !afterSet.has(p));

      await this.auditService.record(
        {
          action: "role.update",
          actorId,
          targetType: "role",
          targetId: id,
          metadata: {
            before: {
              name: role.name,
              permissions: beforePermissions,
            },
            after: {
              name: dto.name ?? role.name,
              permissions: afterPermissions,
              added,
              removed,
            },
          },
        },
        ctx,
        tx,
      );
    });

    await this.reloadCache();
    return this.findById(id);
  }

  async remove(id: string, actorId: string, ctx?: AuditContext) {
    const role = await db.query.roles.findFirst({
      where: eq(schema.roles.id, id),
    });
    if (!role) throw new NotFoundException("Role not found");
    if (role.isSystem) throw new BadRequestException("Cannot delete a system role");

    const perms = await db
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, id));

    await db.transaction(async (tx) => {
      await tx.delete(schema.roles).where(eq(schema.roles.id, id));

      await this.auditService.record(
        {
          action: "role.delete",
          actorId,
          targetType: "role",
          targetId: id,
          metadata: {
            before: {
              name: role.name,
              slug: role.slug,
              permissions: perms.map((p) => p.permission),
            },
          },
        },
        ctx,
        tx,
      );
    });

    await this.reloadCache();
  }
}
