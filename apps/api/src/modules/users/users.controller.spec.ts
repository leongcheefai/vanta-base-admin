import { ForbiddenException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

vi.mock("@vanta-base-admin/db", () => ({
	db: {},
	schema: { user: {}, session: {}, subscription: {} },
}));

vi.mock("@vanta-base-admin/auth", () => ({
	auth: { api: { adminCreateUser: vi.fn() } },
}));

const adminUser = { id: "u1", role: "admin" } as any;
const regularUser = { id: "u2", role: "user" } as any;

const mockUser = {
	id: "u3",
	name: "Alice",
	email: "alice@example.com",
	role: "user",
	banned: null,
	deletedAt: null,
};

const mockListResult = { users: [mockUser], total: 1 };
const mockDetail = { user: mockUser, subscription: null, sessions: [] };

describe("UsersController", () => {
	let controller: UsersController;
	let service: UsersService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: UsersService,
					useValue: {
						list: vi.fn().mockResolvedValue(mockListResult),
						findById: vi.fn().mockResolvedValue(mockDetail),
						create: vi.fn().mockResolvedValue(mockUser),
						edit: vi.fn().mockResolvedValue(mockUser),
						ban: vi.fn().mockResolvedValue({ ...mockUser, banned: true }),
						unban: vi.fn().mockResolvedValue(mockUser),
						softDelete: vi.fn().mockResolvedValue({
							...mockUser,
							deletedAt: new Date(),
						}),
						restore: vi.fn().mockResolvedValue(mockUser),
						revokeSessions: vi.fn().mockResolvedValue({ revoked: 2 }),
					},
				},
			],
		}).compile();

		controller = module.get(UsersController);
		service = module.get(UsersService);
	});

	describe("admin-only enforcement", () => {
		const endpoints: Array<[string, () => Promise<unknown>]> = [
			["list", async () => controller.list(regularUser, {} as any)],
			["findById", async () => controller.findById(regularUser, "u3")],
			["edit", async () => controller.edit(regularUser, "u3", {})],
			["ban", async () => controller.ban(regularUser, "u3", { banReason: "spam" })],
			["unban", async () => controller.unban(regularUser, "u3")],
			["softDelete", async () => controller.softDelete(regularUser, "u3")],
			["restore", async () => controller.restore(regularUser, "u3")],
			["revokeSessions", async () => controller.revokeSessions(regularUser, "u3")],
		];

		for (const [name, call] of endpoints) {
			it(`${name} throws ForbiddenException for non-admin`, async () => {
				await expect(call()).rejects.toThrow(ForbiddenException);
			});
		}
	});

	it("list returns users from service", async () => {
		const result = await controller.list(adminUser, {});
		expect(result).toEqual(mockListResult);
		expect(service.list).toHaveBeenCalled();
	});

	it("findById returns user detail from service", async () => {
		const result = await controller.findById(adminUser, "u3");
		expect(result).toEqual(mockDetail);
		expect(service.findById).toHaveBeenCalledWith("u3");
	});

	it("create delegates to service with admin headers", async () => {
		const mockReq = { headers: { cookie: "session=abc" } } as any;
		const result = await controller.create(adminUser, mockReq, {
			name: "Bob",
			email: "bob@example.com",
			password: "password1",
			role: "user",
		});
		expect(result).toEqual(mockUser);
		expect(service.create).toHaveBeenCalled();
	});

	it("edit delegates to service", async () => {
		await controller.edit(adminUser, "u3", { name: "Alice 2" });
		expect(service.edit).toHaveBeenCalledWith("u3", { name: "Alice 2" });
	});

	it("ban delegates to service", async () => {
		await controller.ban(adminUser, "u3", { banReason: "spam" });
		expect(service.ban).toHaveBeenCalledWith("u3", { banReason: "spam" });
	});

	it("unban delegates to service", async () => {
		await controller.unban(adminUser, "u3");
		expect(service.unban).toHaveBeenCalledWith("u3");
	});

	it("softDelete delegates to service with acting user id", async () => {
		await controller.softDelete(adminUser, "u3");
		expect(service.softDelete).toHaveBeenCalledWith("u3", "u1");
	});

	it("softDelete throws ForbiddenException when deleting self", async () => {
		vi.mocked(service.softDelete).mockRejectedValueOnce(
			new ForbiddenException("Cannot delete your own account"),
		);
		await expect(controller.softDelete(adminUser, "u1")).rejects.toThrow(
			ForbiddenException,
		);
	});

	it("restore delegates to service", async () => {
		await controller.restore(adminUser, "u3");
		expect(service.restore).toHaveBeenCalledWith("u3");
	});

	it("revokeSessions delegates to service", async () => {
		const result = await controller.revokeSessions(adminUser, "u3");
		expect(result).toEqual({ revoked: 2 });
		expect(service.revokeSessions).toHaveBeenCalledWith("u3");
	});
});
