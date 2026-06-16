import { Injectable } from "@nestjs/common";
import { db, schema } from "@vanta-base-admin/db";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";

export interface AuditContext {
	ipAddress?: string | null;
	userAgent?: string | null;
}

export interface AuditRecordInput {
	action: string;
	actorId: string;
	targetType: "user" | "role";
	targetId: string;
	metadata: { before?: unknown; after?: unknown; reason?: string };
}

type TxOrDb = Pick<typeof db, "insert">;

@Injectable()
export class AuditService {
	async record(
		input: AuditRecordInput,
		ctx?: AuditContext,
		tx?: TxOrDb,
	): Promise<void> {
		const client = tx ?? db;
		await client.insert(schema.auditLog).values({
			id: crypto.randomUUID(),
			action: input.action,
			actorId: input.actorId,
			targetType: input.targetType,
			targetId: input.targetId,
			metadata: input.metadata,
			ipAddress: ctx?.ipAddress ?? null,
			userAgent: ctx?.userAgent ?? null,
			createdAt: new Date(),
		});
	}

	async list(params: {
		actor?: string;
		action?: string;
		targetType?: string;
		from?: Date;
		to?: Date;
		limit?: number;
		offset?: number;
	}) {
		const limit = params.limit ?? 20;
		const offset = params.offset ?? 0;

		const conditions = [];
		if (params.actor) conditions.push(eq(schema.auditLog.actorId, params.actor));
		if (params.action) conditions.push(eq(schema.auditLog.action, params.action));
		if (params.targetType)
			conditions.push(eq(schema.auditLog.targetType, params.targetType));
		if (params.from) conditions.push(gte(schema.auditLog.createdAt, params.from));
		if (params.to) conditions.push(lte(schema.auditLog.createdAt, params.to));

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const [data, totals] = await Promise.all([
			db
				.select()
				.from(schema.auditLog)
				.where(where)
				.orderBy(desc(schema.auditLog.createdAt))
				.limit(limit)
				.offset(offset),
			db.select({ total: count() }).from(schema.auditLog).where(where),
		]);

		return { data, total: totals[0]?.total ?? 0 };
	}
}
