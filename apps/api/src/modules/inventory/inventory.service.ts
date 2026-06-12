import {
	ConflictException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { db, schema } from "@vanta-base-admin/db";
import {
	and,
	count,
	desc,
	eq,
	ilike,
	isNotNull,
	isNull,
	or,
	sql,
} from "drizzle-orm";
import type { CreateCategoryDto } from "./dto/create-category.dto";
import type {
	CreateMovementDto,
	MovementType,
} from "./dto/create-movement.dto";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { ListProductsDto } from "./dto/list-products.dto";
import type { UpdateCategoryDto } from "./dto/update-category.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class InventoryService {
	// ─── Categories ──────────────────────────────────────────────────────────

	async listCategories(userId: string) {
		return db
			.select()
			.from(schema.inventoryCategory)
			.where(eq(schema.inventoryCategory.userId, userId))
			.orderBy(schema.inventoryCategory.name);
	}

	async createCategory(userId: string, dto: CreateCategoryDto) {
		const [category] = await db
			.insert(schema.inventoryCategory)
			.values({ id: crypto.randomUUID(), userId, name: dto.name })
			.returning();
		return category;
	}

	async updateCategory(userId: string, id: string, dto: UpdateCategoryDto) {
		const [category] = await db
			.update(schema.inventoryCategory)
			.set({ name: dto.name })
			.where(
				and(
					eq(schema.inventoryCategory.id, id),
					eq(schema.inventoryCategory.userId, userId),
				),
			)
			.returning();
		if (!category) throw new NotFoundException("Category not found");
		return category;
	}

	async deleteCategory(userId: string, id: string) {
		const category = await db.query.inventoryCategory.findFirst({
			where: and(
				eq(schema.inventoryCategory.id, id),
				eq(schema.inventoryCategory.userId, userId),
			),
		});
		if (!category) throw new NotFoundException("Category not found");

		const [result] = await db
			.select({ total: count() })
			.from(schema.inventoryProduct)
			.where(
				and(
					eq(schema.inventoryProduct.categoryId, id),
					isNull(schema.inventoryProduct.deletedAt),
				),
			);
		if ((result?.total ?? 0) > 0) {
			throw new ConflictException(
				"Category has products and cannot be deleted",
			);
		}

		await db
			.delete(schema.inventoryCategory)
			.where(
				and(
					eq(schema.inventoryCategory.id, id),
					eq(schema.inventoryCategory.userId, userId),
				),
			);

		return { deleted: true };
	}

	// ─── Products ────────────────────────────────────────────────────────────

	async listProducts(userId: string, query: ListProductsDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const offset = (page - 1) * limit;

		const conditions = [
			eq(schema.inventoryProduct.userId, userId),
			isNull(schema.inventoryProduct.deletedAt),
		];

		if (query.search) {
			const searchClause = or(
				ilike(schema.inventoryProduct.name, `%${query.search}%`),
				ilike(schema.inventoryProduct.sku, `%${query.search}%`),
			);
			if (searchClause) conditions.push(searchClause);
		}

		if (query.categoryId) {
			conditions.push(eq(schema.inventoryProduct.categoryId, query.categoryId));
		}

		if (query.lowStock) {
			const lowStockClause = and(
				isNotNull(schema.inventoryProduct.reorderPoint),
				sql`${schema.inventoryProduct.quantity} <= ${schema.inventoryProduct.reorderPoint}`,
			);
			if (lowStockClause) conditions.push(lowStockClause);
		}

		const where = and(...conditions);

		const [products, totals] = await Promise.all([
			db
				.select()
				.from(schema.inventoryProduct)
				.where(where)
				.orderBy(desc(schema.inventoryProduct.createdAt))
				.limit(limit)
				.offset(offset),
			db.select({ total: count() }).from(schema.inventoryProduct).where(where),
		]);

		return { products, total: totals[0]?.total ?? 0 };
	}

	async createProduct(userId: string, dto: CreateProductDto) {
		try {
			const [product] = await db
				.insert(schema.inventoryProduct)
				.values({
					id: crypto.randomUUID(),
					userId,
					name: dto.name,
					sku: dto.sku,
					price: String(dto.price),
					description: dto.description,
					reorderPoint: dto.reorderPoint,
					categoryId: dto.categoryId,
					imageUrl: dto.imageUrl,
				})
				.returning();
			return product;
		} catch (err) {
			const pgErr = err as { code?: string };
			if (pgErr.code === "23505") {
				throw new ConflictException("A product with this SKU already exists");
			}
			throw err;
		}
	}

	async getProduct(userId: string, id: string) {
		const product = await db.query.inventoryProduct.findFirst({
			where: and(
				eq(schema.inventoryProduct.id, id),
				eq(schema.inventoryProduct.userId, userId),
				isNull(schema.inventoryProduct.deletedAt),
			),
		});
		if (!product) throw new NotFoundException("Product not found");
		return product;
	}

	async updateProduct(userId: string, id: string, dto: UpdateProductDto) {
		await this.getProduct(userId, id);

		const updates: Partial<typeof schema.inventoryProduct.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (dto.name !== undefined) updates.name = dto.name;
		if (dto.sku !== undefined) updates.sku = dto.sku;
		if (dto.description !== undefined) updates.description = dto.description;
		if (dto.price !== undefined) updates.price = String(dto.price);
		if (dto.reorderPoint !== undefined) updates.reorderPoint = dto.reorderPoint;
		if ("categoryId" in dto) updates.categoryId = dto.categoryId ?? null;
		if ("imageUrl" in dto) updates.imageUrl = dto.imageUrl ?? null;

		try {
			const [product] = await db
				.update(schema.inventoryProduct)
				.set(updates)
				.where(
					and(
						eq(schema.inventoryProduct.id, id),
						eq(schema.inventoryProduct.userId, userId),
					),
				)
				.returning();
			if (!product) throw new NotFoundException("Product not found");
			return product;
		} catch (err) {
			const pgErr = err as { code?: string };
			if (pgErr.code === "23505") {
				throw new ConflictException("A product with this SKU already exists");
			}
			throw err;
		}
	}

	async softDeleteProduct(userId: string, id: string) {
		await this.getProduct(userId, id);

		const [product] = await db
			.update(schema.inventoryProduct)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(schema.inventoryProduct.id, id),
					eq(schema.inventoryProduct.userId, userId),
				),
			)
			.returning();

		if (!product) throw new NotFoundException("Product not found");
		return product;
	}

	// ─── Movements ───────────────────────────────────────────────────────────

	async createMovement(
		userId: string,
		productId: string,
		dto: CreateMovementDto,
	) {
		const product = await this.getProduct(userId, productId);

		this.validateDeltaSign(dto.type, dto.delta);

		const newQuantity = product.quantity + dto.delta;
		if (newQuantity < 0) {
			throw new UnprocessableEntityException(
				"Movement would result in negative stock quantity",
			);
		}

		const movement = await db.transaction(async (tx) => {
			const [mov] = await tx
				.insert(schema.inventoryStockMovement)
				.values({
					id: crypto.randomUUID(),
					productId,
					userId,
					type: dto.type,
					delta: dto.delta,
					notes: dto.notes,
					reference: dto.reference,
				})
				.returning();

			await tx
				.update(schema.inventoryProduct)
				.set({ quantity: newQuantity, updatedAt: new Date() })
				.where(eq(schema.inventoryProduct.id, productId));

			return mov;
		});

		return movement;
	}

	async listMovements(userId: string, productId: string) {
		await this.getProduct(userId, productId);

		return db
			.select()
			.from(schema.inventoryStockMovement)
			.where(
				and(
					eq(schema.inventoryStockMovement.productId, productId),
					eq(schema.inventoryStockMovement.userId, userId),
				),
			)
			.orderBy(desc(schema.inventoryStockMovement.createdAt));
	}

	private validateDeltaSign(type: MovementType, delta: number) {
		const positiveTypes: MovementType[] = ["restock", "return"];
		const negativeTypes: MovementType[] = ["sale", "damage", "loss"];

		if (positiveTypes.includes(type) && delta <= 0) {
			throw new UnprocessableEntityException(
				"Delta must be positive for restock and return movements",
			);
		}

		if (negativeTypes.includes(type) && delta >= 0) {
			throw new UnprocessableEntityException(
				"Delta must be negative for sale, damage, and loss movements",
			);
		}
	}
}
