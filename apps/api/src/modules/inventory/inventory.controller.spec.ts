import {
	ConflictException,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

vi.mock("@vanta-base-admin/db", () => ({
	db: {},
	schema: {},
}));

const mockUser = { id: "u1", email: "a@b.com" } as any;

const mockService = {
	listCategories: vi.fn(),
	createCategory: vi.fn(),
	updateCategory: vi.fn(),
	deleteCategory: vi.fn(),
	listProducts: vi.fn(),
	createProduct: vi.fn(),
	getProduct: vi.fn(),
	updateProduct: vi.fn(),
	softDeleteProduct: vi.fn(),
	createMovement: vi.fn(),
	listMovements: vi.fn(),
};

describe("InventoryController", () => {
	let controller: InventoryController;
	let service: InventoryService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const module: TestingModule = await Test.createTestingModule({
			controllers: [InventoryController],
			providers: [{ provide: InventoryService, useValue: mockService }],
		}).compile();
		controller = module.get(InventoryController);
		service = module.get(InventoryService);
	});

	describe("listCategories", () => {
		it("calls service.listCategories with user id", async () => {
			mockService.listCategories.mockResolvedValue([]);
			const result = await controller.listCategories(mockUser);
			expect(service.listCategories).toHaveBeenCalledWith("u1");
			expect(result).toEqual([]);
		});
	});

	describe("createCategory", () => {
		it("calls service.createCategory and returns the category", async () => {
			const dto = { name: "Electronics" };
			const category = { id: "c1", name: "Electronics" };
			mockService.createCategory.mockResolvedValue(category);
			const result = await controller.createCategory(mockUser, dto);
			expect(service.createCategory).toHaveBeenCalledWith("u1", dto);
			expect(result).toEqual(category);
		});
	});

	describe("deleteCategory", () => {
		it("propagates ConflictException when category has products", async () => {
			mockService.deleteCategory.mockRejectedValue(
				new ConflictException("Category has products and cannot be deleted"),
			);
			await expect(controller.deleteCategory(mockUser, "c1")).rejects.toThrow(
				ConflictException,
			);
		});
	});

	describe("createProduct", () => {
		it("calls service.createProduct and returns the product", async () => {
			const dto = { name: "Widget", sku: "W-001", price: 9.99 };
			const product = { id: "p1", name: "Widget", sku: "W-001" };
			mockService.createProduct.mockResolvedValue(product);
			const result = await controller.createProduct(mockUser, dto as any);
			expect(service.createProduct).toHaveBeenCalledWith("u1", dto);
			expect(result).toEqual(product);
		});
	});

	describe("getProduct", () => {
		it("propagates NotFoundException when product not found", async () => {
			mockService.getProduct.mockRejectedValue(
				new NotFoundException("Product not found"),
			);
			await expect(controller.getProduct(mockUser, "p1")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("softDeleteProduct", () => {
		it("calls service.softDeleteProduct", async () => {
			const product = { id: "p1", deletedAt: new Date() };
			mockService.softDeleteProduct.mockResolvedValue(product);
			const result = await controller.softDeleteProduct(mockUser, "p1");
			expect(service.softDeleteProduct).toHaveBeenCalledWith("u1", "p1");
			expect(result).toEqual(product);
		});
	});

	describe("createMovement", () => {
		it("calls service.createMovement and returns movement", async () => {
			const dto = { type: "restock" as const, delta: 10 };
			const movement = { id: "m1", type: "restock", delta: 10 };
			mockService.createMovement.mockResolvedValue(movement);
			const result = await controller.createMovement(
				mockUser,
				"p1",
				dto as any,
			);
			expect(service.createMovement).toHaveBeenCalledWith("u1", "p1", dto);
			expect(result).toEqual(movement);
		});

		it("propagates UnprocessableEntityException for invalid movement", async () => {
			mockService.createMovement.mockRejectedValue(
				new UnprocessableEntityException(
					"Movement would result in negative stock quantity",
				),
			);
			await expect(
				controller.createMovement(mockUser, "p1", {
					type: "sale",
					delta: -999,
				} as any),
			).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe("listMovements", () => {
		it("calls service.listMovements and returns movements", async () => {
			const movements = [{ id: "m1" }];
			mockService.listMovements.mockResolvedValue(movements);
			const result = await controller.listMovements(mockUser, "p1");
			expect(service.listMovements).toHaveBeenCalledWith("u1", "p1");
			expect(result).toEqual(movements);
		});
	});
});
