import {
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { db, schema } from "@vanta-base-admin/db";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { type AuditContext, AuditService } from "../audit/audit.service";
import { buildDisplayName } from "./build-display-name";
import type { CreateCustomerDto } from "./dto/create-customer.dto";
import type { ListCustomersDto } from "./dto/list-customers.dto";
import type { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
	constructor(private readonly auditService: AuditService) {}

	async list(query: ListCustomersDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const offset = (page - 1) * limit;

		const conditions = [isNull(schema.customer.deletedAt)];

		if (query.q) {
			const searchClause = or(
				ilike(schema.customer.name, `%${query.q}%`),
				ilike(schema.customer.email, `%${query.q}%`),
				ilike(schema.customer.company, `%${query.q}%`),
			);
			if (searchClause) conditions.push(searchClause);
		}

		if (query.status) {
			conditions.push(eq(schema.customer.status, query.status));
		}

		const where = and(...conditions);

		const orderCol =
			query.sort === "name" ? schema.customer.name : schema.customer.createdAt;
		const orderFn = query.dir === "asc" ? asc : desc;

		const [data, totals] = await Promise.all([
			db
				.select()
				.from(schema.customer)
				.where(where)
				.orderBy(orderFn(orderCol))
				.limit(limit)
				.offset(offset),
			db.select({ total: count() }).from(schema.customer).where(where),
		]);

		return { data, total: totals[0]?.total ?? 0, page, limit };
	}

	async create(userId: string, dto: CreateCustomerDto, ctx?: AuditContext) {
		const name = buildDisplayName({
			firstName: dto.firstName,
			lastName: dto.lastName,
			company: dto.company,
		});

		try {
			const [record] = await db
				.insert(schema.customer)
				.values({
					id: crypto.randomUUID(),
					firstName: dto.firstName ?? null,
					lastName: dto.lastName ?? null,
					name,
					email: dto.email ?? null,
					phone: dto.phone ?? null,
					company: dto.company ?? null,
					notes: dto.notes ?? null,
					status: dto.status ?? "active",
					createdBy: userId,
				})
				.returning();

			await this.auditService.record(
				{
					action: "customer.create",
					actorId: userId,
					targetType: "customer",
					targetId: record!.id,
					metadata: {
						after: {
							name: record!.name,
							email: record!.email,
							company: record!.company,
							status: record!.status,
						},
					},
				},
				ctx,
			);

			return record;
		} catch (err) {
			const pgErr = err as { code?: string };
			if (pgErr.code === "23505") {
				throw new ConflictException(
					"A customer with this email already exists",
				);
			}
			throw err;
		}
	}

	async findById(id: string) {
		const record = await db.query.customer.findFirst({
			where: and(eq(schema.customer.id, id), isNull(schema.customer.deletedAt)),
		});
		if (!record) throw new NotFoundException("Customer not found");
		return record;
	}

	async update(
		id: string,
		dto: UpdateCustomerDto,
		actorId: string,
		ctx?: AuditContext,
	) {
		const existing = await this.findById(id);

		const firstName =
			dto.firstName !== undefined ? dto.firstName : existing.firstName;
		const lastName =
			dto.lastName !== undefined ? dto.lastName : existing.lastName;
		const company = dto.company !== undefined ? dto.company : existing.company;

		const name = buildDisplayName({ firstName, lastName, company });

		const updates: Partial<typeof schema.customer.$inferInsert> = {
			name,
			updatedAt: new Date(),
		};

		if (dto.firstName !== undefined) updates.firstName = dto.firstName ?? null;
		if (dto.lastName !== undefined) updates.lastName = dto.lastName ?? null;
		if ("email" in dto) updates.email = dto.email ?? null;
		if (dto.phone !== undefined) updates.phone = dto.phone ?? null;
		if (dto.company !== undefined) updates.company = dto.company ?? null;
		if (dto.notes !== undefined) updates.notes = dto.notes ?? null;
		if (dto.status !== undefined) updates.status = dto.status;

		try {
			const [record] = await db
				.update(schema.customer)
				.set(updates)
				.where(
					and(
						eq(schema.customer.id, id),
						isNull(schema.customer.deletedAt),
					),
				)
				.returning();
			if (!record) throw new NotFoundException("Customer not found");

			await this.auditService.record(
				{
					action: "customer.update",
					actorId,
					targetType: "customer",
					targetId: id,
					metadata: {
						before: {
							name: existing.name,
							email: existing.email,
							status: existing.status,
						},
						after: {
							name: record.name,
							email: record.email,
							status: record.status,
						},
					},
				},
				ctx,
			);

			return record;
		} catch (err) {
			const pgErr = err as { code?: string };
			if (pgErr.code === "23505") {
				throw new ConflictException(
					"A customer with this email already exists",
				);
			}
			throw err;
		}
	}

	async softDelete(id: string, actorId: string, ctx?: AuditContext) {
		await this.findById(id);

		const [record] = await db
			.update(schema.customer)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(eq(schema.customer.id, id), isNull(schema.customer.deletedAt)),
			)
			.returning();

		if (!record) throw new NotFoundException("Customer not found");

		await this.auditService.record(
			{
				action: "customer.delete",
				actorId,
				targetType: "customer",
				targetId: id,
				metadata: {},
			},
			ctx,
		);

		return { deleted: true };
	}
}
