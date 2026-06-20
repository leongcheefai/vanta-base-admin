import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

vi.mock("@vanta-base-admin/db", () => ({
	db: {},
	schema: { roles: {}, rolePermissions: {} },
}));

const mockRoleAdmin = {
	id: "role_admin",
	slug: "admin",
	name: "Admin",
	isSystem: true,
	permissions: [],
};
const mockRoleMod = {
	id: "role_mod",
	slug: "moderator",
	name: "Moderator",
	isSystem: false,
	permissions: ["users:read"],
};

const mockReq = {
	ip: "127.0.0.1",
	get: vi.fn().mockReturnValue("TestAgent/1.0"),
} as unknown as Request;

const mockActor = { id: "actor-1" } as never;

describe("RolesController", () => {
	let controller: RolesController;
	let service: RolesService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [RolesController],
			providers: [
				{
					provide: RolesService,
					useValue: {
						list: vi.fn().mockResolvedValue([mockRoleAdmin, mockRoleMod]),
						findById: vi.fn().mockResolvedValue(mockRoleMod),
						create: vi.fn().mockResolvedValue(mockRoleMod),
						update: vi.fn().mockResolvedValue(mockRoleMod),
						remove: vi.fn().mockResolvedValue(undefined),
					},
				},
			],
		}).compile();

		controller = module.get(RolesController);
		service = module.get(RolesService);
	});

	it("list returns all roles", async () => {
		const result = await controller.list();
		expect(result).toHaveLength(2);
		expect(service.list).toHaveBeenCalled();
	});

	it("findById returns role", async () => {
		const result = await controller.findById("role_mod");
		expect(result).toEqual(mockRoleMod);
		expect(service.findById).toHaveBeenCalledWith("role_mod");
	});

	it("create delegates to service with actor and context", async () => {
		const result = await controller.create(mockReq, mockActor, {
			name: "Moderator",
		});
		expect(result).toEqual(mockRoleMod);
		expect(service.create).toHaveBeenCalledWith(
			{ name: "Moderator" },
			"actor-1",
			expect.objectContaining({ ipAddress: "127.0.0.1" }),
		);
	});

	it("update delegates to service with actor and context", async () => {
		await controller.update(mockReq, mockActor, "role_mod", {
			permissions: ["users:read", "users:ban"],
		});
		expect(service.update).toHaveBeenCalledWith(
			"role_mod",
			{ permissions: ["users:read", "users:ban"] },
			"actor-1",
			expect.objectContaining({ ipAddress: "127.0.0.1" }),
		);
	});

	it("remove delegates to service with actor and context", async () => {
		await controller.remove(mockReq, mockActor, "role_mod");
		expect(service.remove).toHaveBeenCalledWith(
			"role_mod",
			"actor-1",
			expect.objectContaining({ ipAddress: "127.0.0.1" }),
		);
	});

	it("remove propagates NotFoundException for missing role", async () => {
		vi.mocked(service.remove).mockRejectedValueOnce(
			new NotFoundException("Role not found"),
		);
		await expect(
			controller.remove(mockReq, mockActor, "missing"),
		).rejects.toThrow(NotFoundException);
	});

	it("remove propagates BadRequestException for system role", async () => {
		vi.mocked(service.remove).mockRejectedValueOnce(
			new BadRequestException("Cannot delete a system role"),
		);
		await expect(
			controller.remove(mockReq, mockActor, "role_admin"),
		).rejects.toThrow(BadRequestException);
	});
});
