import {
	ConflictException,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";

const { mockDb, makeChain } = vi.hoisted(() => {
	function makeChain(resolveValue: unknown = []) {
		const chain: Record<string, unknown> & {
			then: (
				onFulfilled: (v: unknown) => unknown,
				onRejected?: (e: unknown) => unknown,
			) => Promise<unknown>;
			catch: (onRejected: (e: unknown) => unknown) => Promise<unknown>;
		} = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue(resolveValue),
			// biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for await support
			then: (
				onFulfilled: (v: unknown) => unknown,
				onRejected?: (e: unknown) => unknown,
			) => Promise.resolve(resolveValue).then(onFulfilled, onRejected),
			catch: (onRejected: (e: unknown) => unknown) =>
				Promise.resolve(resolveValue).catch(onRejected),
			finally: (fn: () => void) => Promise.resolve(resolveValue).finally(fn),
		};
		return chain;
	}

	const mockDb = {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		query: {
			inventoryCategory: { findFirst: vi.fn() },
			inventoryProduct: { findFirst: vi.fn() },
		},
		transaction: vi.fn(),
	};

	return { mockDb, makeChain };
});

vi.mock("drizzle-orm", () => ({
	eq: vi.fn((...a: unknown[]) => a),
	and: vi.fn((...a: unknown[]) => a),
	or: vi.fn((...a: unknown[]) => a),
	ilike: vi.fn((...a: unknown[]) => a),
	isNull: vi.fn((...a: unknown[]) => a),
	isNotNull: vi.fn((...a: unknown[]) => a),
	count: vi.fn(() => "count"),
	desc: vi.fn((...a: unknown[]) => a),
	sql: Object.assign(
		vi
			.fn()
			.mockImplementation(
				(_strings: TemplateStringsArray, ..._vals: unknown[]) => ({
					sql: true,
				}),
			),
		{ raw: vi.fn() },
	),
}));

vi.mock("@vanta-base-admin/db", () => {
	const col = (name: string) => ({ columnName: name });
	return {
		db: mockDb,
		schema: {
			inventoryCategory: {
				userId: col("cat.userId"),
				id: col("cat.id"),
				name: col("cat.name"),
			},
			inventoryProduct: {
				userId: col("prod.userId"),
				id: col("prod.id"),
				deletedAt: col("prod.deletedAt"),
				categoryId: col("prod.categoryId"),
				reorderPoint: col("prod.reorderPoint"),
				quantity: col("prod.quantity"),
				sku: col("prod.sku"),
				name: col("prod.name"),
				createdAt: col("prod.createdAt"),
				updatedAt: col("prod.updatedAt"),
			},
			inventoryStockMovement: {
				productId: col("mov.productId"),
				userId: col("mov.userId"),
				createdAt: col("mov.createdAt"),
			},
		},
	};
});

const mockCategory = {
	id: "c1",
	name: "Electronics",
	userId: "u1",
	createdAt: new Date(),
};

const mockProduct = {
	id: "p1",
	name: "Widget",
	sku: "W-001",
	price: "9.99",
	userId: "u1",
	categoryId: null as string | null,
	quantity: 100,
	reorderPoint: null as number | null,
	description: null as string | null,
	imageUrl: null as string | null,
	deletedAt: null as Date | null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("InventoryService", () => {
	let service: InventoryService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new InventoryService();
		mockDb.select.mockReturnValue(makeChain([]));
		mockDb.insert.mockReturnValue(makeChain([]));
		mockDb.update.mockReturnValue(makeChain([]));
		mockDb.delete.mockReturnValue(makeChain(undefined));
	});

	// ─── Categories ────────────────────────────────────────────────────────────

	describe("listCategories", () => {
		it("returns categories ordered by name", async () => {
			mockDb.select.mockReturnValue(makeChain([mockCategory]));
			const result = await service.listCategories("u1");
			expect(result).toEqual([mockCategory]);
		});
	});

	describe("createCategory", () => {
		it("inserts and returns new category", async () => {
			const chain = makeChain([mockCategory]);
			mockDb.insert.mockReturnValue(chain);
			const result = await service.createCategory("u1", {
				name: "Electronics",
			});
			expect(result).toEqual(mockCategory);
		});
	});

	describe("updateCategory", () => {
		it("updates and returns category", async () => {
			const updated = { ...mockCategory, name: "Updated" };
			const chain = makeChain([updated]);
			mockDb.update.mockReturnValue(chain);
			const result = await service.updateCategory("u1", "c1", {
				name: "Updated",
			});
			expect(result).toEqual(updated);
		});

		it("throws NotFoundException when category not found or not owned", async () => {
			const chain = makeChain([]);
			mockDb.update.mockReturnValue(chain);
			await expect(
				service.updateCategory("u1", "missing", { name: "x" }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("deleteCategory", () => {
		it("throws NotFoundException when category does not exist", async () => {
			mockDb.query.inventoryCategory.findFirst.mockResolvedValueOnce(undefined);
			await expect(service.deleteCategory("u1", "missing")).rejects.toThrow(
				NotFoundException,
			);
		});

		it("throws ConflictException when category has active products", async () => {
			mockDb.query.inventoryCategory.findFirst.mockResolvedValueOnce(
				mockCategory,
			);
			mockDb.select.mockReturnValue(makeChain([{ total: 2 }]));
			await expect(service.deleteCategory("u1", "c1")).rejects.toThrow(
				ConflictException,
			);
		});

		it("deletes and returns {deleted: true} when no active products", async () => {
			mockDb.query.inventoryCategory.findFirst.mockResolvedValueOnce(
				mockCategory,
			);
			mockDb.select.mockReturnValue(makeChain([{ total: 0 }]));
			const result = await service.deleteCategory("u1", "c1");
			expect(result).toEqual({ deleted: true });
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	// ─── Products ──────────────────────────────────────────────────────────────

	describe("listProducts", () => {
		it("returns paginated products and total", async () => {
			const productsChain = makeChain([mockProduct]);
			const countChain = makeChain([{ total: 1 }]);
			mockDb.select
				.mockReturnValueOnce(productsChain)
				.mockReturnValueOnce(countChain);

			const result = await service.listProducts("u1", { page: 1, limit: 20 });
			expect(result).toEqual({ products: [mockProduct], total: 1 });
		});

		it("returns zero total when no products match", async () => {
			mockDb.select
				.mockReturnValueOnce(makeChain([]))
				.mockReturnValueOnce(makeChain([{ total: 0 }]));

			const result = await service.listProducts("u1", {});
			expect(result).toEqual({ products: [], total: 0 });
		});
	});

	describe("createProduct", () => {
		const dto = { name: "Widget", sku: "W-001", price: 9.99 };

		it("inserts and returns new product", async () => {
			const chain = makeChain([mockProduct]);
			mockDb.insert.mockReturnValue(chain);
			const result = await service.createProduct("u1", dto as never);
			expect(result).toEqual(mockProduct);
		});

		it("throws ConflictException on duplicate SKU (pg 23505)", async () => {
			const chain = makeChain([]);
			(chain.returning as ReturnType<typeof vi.fn>).mockRejectedValue(
				Object.assign(new Error("unique violation"), { code: "23505" }),
			);
			mockDb.insert.mockReturnValue(chain);
			await expect(service.createProduct("u1", dto as never)).rejects.toThrow(
				ConflictException,
			);
		});
	});

	describe("getProduct", () => {
		it("returns product when found", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			const result = await service.getProduct("u1", "p1");
			expect(result).toEqual(mockProduct);
		});

		it("throws NotFoundException when product missing or deleted", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(undefined);
			await expect(service.getProduct("u1", "missing")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("updateProduct", () => {
		it("updates and returns modified product", async () => {
			const updated = { ...mockProduct, name: "Renamed" };
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			const chain = makeChain([updated]);
			mockDb.update.mockReturnValue(chain);
			const result = await service.updateProduct("u1", "p1", {
				name: "Renamed",
			} as never);
			expect(result).toEqual(updated);
		});

		it("throws NotFoundException when product not found before update", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(undefined);
			await expect(
				service.updateProduct("u1", "missing", { name: "x" } as never),
			).rejects.toThrow(NotFoundException);
		});

		it("throws ConflictException on duplicate SKU during update", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			const chain = makeChain([]);
			(chain.returning as ReturnType<typeof vi.fn>).mockRejectedValue(
				Object.assign(new Error("unique violation"), { code: "23505" }),
			);
			mockDb.update.mockReturnValue(chain);
			await expect(
				service.updateProduct("u1", "p1", { sku: "TAKEN" } as never),
			).rejects.toThrow(ConflictException);
		});
	});

	describe("softDeleteProduct", () => {
		it("sets deletedAt and returns product", async () => {
			const deleted = { ...mockProduct, deletedAt: new Date() };
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			mockDb.update.mockReturnValue(makeChain([deleted]));
			const result = await service.softDeleteProduct("u1", "p1");
			expect(result.deletedAt).not.toBeNull();
		});

		it("throws NotFoundException when product does not exist", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(undefined);
			await expect(service.softDeleteProduct("u1", "missing")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	// ─── Movements ─────────────────────────────────────────────────────────────

	describe("createMovement", () => {
		const mockMovement = {
			id: "m1",
			productId: "p1",
			userId: "u1",
			type: "restock",
			delta: 10,
		};

		function setupProductAndTransaction(quantity = 100) {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce({
				...mockProduct,
				quantity,
			});
			mockDb.transaction.mockImplementation(
				async (cb: (tx: unknown) => Promise<unknown>) => {
					const tx = {
						insert: vi.fn().mockReturnValue(makeChain([mockMovement])),
						update: vi
							.fn()
							.mockReturnValue(
								makeChain([{ ...mockProduct, quantity: quantity + 10 }]),
							),
					};
					return cb(tx);
				},
			);
		}

		it("creates movement and updates product quantity via transaction", async () => {
			setupProductAndTransaction(100);
			const result = await service.createMovement("u1", "p1", {
				type: "restock",
				delta: 10,
			} as never);
			expect(result).toEqual(mockMovement);
			expect(mockDb.transaction).toHaveBeenCalled();
		});

		it("throws UnprocessableEntityException when movement results in negative stock", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce({
				...mockProduct,
				quantity: 5,
			});
			await expect(
				service.createMovement("u1", "p1", {
					type: "sale",
					delta: -10,
				} as never),
			).rejects.toThrow(UnprocessableEntityException);
		});

		it("throws when restock delta is negative", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			await expect(
				service.createMovement("u1", "p1", {
					type: "restock",
					delta: -5,
				} as never),
			).rejects.toThrow(
				"Delta must be positive for restock and return movements",
			);
		});

		it("throws when return delta is negative", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			await expect(
				service.createMovement("u1", "p1", {
					type: "return",
					delta: -1,
				} as never),
			).rejects.toThrow(
				"Delta must be positive for restock and return movements",
			);
		});

		it("throws when sale delta is positive", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			await expect(
				service.createMovement("u1", "p1", { type: "sale", delta: 5 } as never),
			).rejects.toThrow(
				"Delta must be negative for sale, damage, and loss movements",
			);
		});

		it("throws when damage delta is positive", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			await expect(
				service.createMovement("u1", "p1", {
					type: "damage",
					delta: 5,
				} as never),
			).rejects.toThrow(
				"Delta must be negative for sale, damage, and loss movements",
			);
		});

		it("throws when loss delta is positive", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			await expect(
				service.createMovement("u1", "p1", { type: "loss", delta: 1 } as never),
			).rejects.toThrow(
				"Delta must be negative for sale, damage, and loss movements",
			);
		});

		it("adjustment type accepts positive delta", async () => {
			setupProductAndTransaction(100);
			await expect(
				service.createMovement("u1", "p1", {
					type: "adjustment",
					delta: 5,
				} as never),
			).resolves.toBeDefined();
		});

		it("adjustment type accepts negative delta", async () => {
			setupProductAndTransaction(100);
			mockDb.transaction.mockImplementation(
				async (cb: (tx: unknown) => Promise<unknown>) => {
					const tx = {
						insert: vi
							.fn()
							.mockReturnValue(makeChain([{ ...mockMovement, delta: -5 }])),
						update: vi
							.fn()
							.mockReturnValue(makeChain([{ ...mockProduct, quantity: 95 }])),
					};
					return cb(tx);
				},
			);
			await expect(
				service.createMovement("u1", "p1", {
					type: "adjustment",
					delta: -5,
				} as never),
			).resolves.toBeDefined();
		});
	});

	describe("listMovements", () => {
		it("returns movements for product ordered by createdAt desc", async () => {
			const movements = [
				{ id: "m2", type: "sale", delta: -5 },
				{ id: "m1", type: "restock", delta: 10 },
			];
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(
				mockProduct,
			);
			mockDb.select.mockReturnValue(makeChain(movements));
			const result = await service.listMovements("u1", "p1");
			expect(result).toEqual(movements);
		});

		it("throws NotFoundException when product not found", async () => {
			mockDb.query.inventoryProduct.findFirst.mockResolvedValueOnce(undefined);
			await expect(service.listMovements("u1", "missing")).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
