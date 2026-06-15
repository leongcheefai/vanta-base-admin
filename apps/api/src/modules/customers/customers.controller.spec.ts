import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

vi.mock("@vanta-base-admin/db", () => ({
	db: {},
	schema: {},
}));

const mockUser = { id: "u1", email: "admin@example.com" } as any;

const mockCustomer = {
	id: "c1",
	firstName: "Jane",
	lastName: "Smith",
	name: "Jane Smith",
	email: "jane@example.com",
	phone: null,
	company: null,
	notes: null,
	status: "active",
	createdBy: "u1",
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null,
};

const mockService = {
	list: vi.fn(),
	create: vi.fn(),
	findById: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
};

describe("CustomersController", () => {
	let controller: CustomersController;
	let service: CustomersService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CustomersController],
			providers: [{ provide: CustomersService, useValue: mockService }],
		}).compile();
		controller = module.get(CustomersController);
		service = module.get(CustomersService);
	});

	describe("list", () => {
		it("requires customers:read permission", () => {
			const metadata = Reflect.getMetadata("permissions", CustomersController.prototype.list);
			expect(metadata).toContain("customers:read");
		});

		it("calls service.list and returns results", async () => {
			const listResult = { data: [mockCustomer], total: 1, page: 1, limit: 20 };
			mockService.list.mockResolvedValue(listResult);
			const result = await controller.list({});
			expect(service.list).toHaveBeenCalledWith({});
			expect(result).toEqual(listResult);
		});
	});

	describe("create", () => {
		it("requires customers:create permission", () => {
			const metadata = Reflect.getMetadata(
				"permissions",
				CustomersController.prototype.create,
			);
			expect(metadata).toContain("customers:create");
		});

		it("passes user id from current user to service.create", async () => {
			const dto = { firstName: "Jane", lastName: "Smith" } as any;
			mockService.create.mockResolvedValue(mockCustomer);
			const result = await controller.create(mockUser, dto);
			expect(service.create).toHaveBeenCalledWith("u1", dto);
			expect(result).toEqual(mockCustomer);
		});

		it("propagates ConflictException on duplicate email", async () => {
			mockService.create.mockRejectedValue(
				new ConflictException("A customer with this email already exists"),
			);
			await expect(
				controller.create(mockUser, { email: "taken@example.com" } as any),
			).rejects.toThrow(ConflictException);
		});
	});

	describe("findById", () => {
		it("requires customers:read permission", () => {
			const metadata = Reflect.getMetadata(
				"permissions",
				CustomersController.prototype.findById,
			);
			expect(metadata).toContain("customers:read");
		});

		it("calls service.findById and returns customer", async () => {
			mockService.findById.mockResolvedValue(mockCustomer);
			const result = await controller.findById("c1");
			expect(service.findById).toHaveBeenCalledWith("c1");
			expect(result).toEqual(mockCustomer);
		});

		it("propagates NotFoundException when customer not found", async () => {
			mockService.findById.mockRejectedValue(new NotFoundException("Customer not found"));
			await expect(controller.findById("missing")).rejects.toThrow(NotFoundException);
		});
	});

	describe("update", () => {
		it("requires customers:edit permission", () => {
			const metadata = Reflect.getMetadata(
				"permissions",
				CustomersController.prototype.update,
			);
			expect(metadata).toContain("customers:edit");
		});

		it("calls service.update with id and dto", async () => {
			const dto = { firstName: "Janet" } as any;
			const updated = { ...mockCustomer, firstName: "Janet", name: "Janet Smith" };
			mockService.update.mockResolvedValue(updated);
			const result = await controller.update("c1", dto);
			expect(service.update).toHaveBeenCalledWith("c1", dto);
			expect(result).toEqual(updated);
		});

		it("propagates ConflictException on duplicate email", async () => {
			mockService.update.mockRejectedValue(
				new ConflictException("A customer with this email already exists"),
			);
			await expect(
				controller.update("c1", { email: "taken@example.com" } as any),
			).rejects.toThrow(ConflictException);
		});
	});

	describe("softDelete", () => {
		it("requires customers:delete permission", () => {
			const metadata = Reflect.getMetadata(
				"permissions",
				CustomersController.prototype.softDelete,
			);
			expect(metadata).toContain("customers:delete");
		});

		it("calls service.softDelete and returns {deleted: true}", async () => {
			mockService.softDelete.mockResolvedValue({ deleted: true });
			const result = await controller.softDelete("c1");
			expect(service.softDelete).toHaveBeenCalledWith("c1");
			expect(result).toEqual({ deleted: true });
		});

		it("propagates NotFoundException when customer not found", async () => {
			mockService.softDelete.mockRejectedValue(new NotFoundException("Customer not found"));
			await expect(controller.softDelete("missing")).rejects.toThrow(NotFoundException);
		});
	});
});
