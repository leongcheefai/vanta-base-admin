import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

const {
	mockDbSelect,
	mockDbInsert,
	mockDbUpdate,
	mockDbDelete,
	mockDbTransaction,
	mockDbQueryRolesFindFirst,
} = vi.hoisted(() => ({
	mockDbSelect: vi.fn(),
	mockDbInsert: vi.fn(),
	mockDbUpdate: vi.fn(),
	mockDbDelete: vi.fn(),
	mockDbTransaction: vi.fn(),
	mockDbQueryRolesFindFirst: vi.fn(),
}));

const mockRoleAdmin = {
	id: "role_admin",
	slug: "admin",
	name: "Admin",
	isSystem: true,
};
const mockRoleUser = {
	id: "role_user",
	slug: "user",
	name: "User",
	isSystem: true,
};
const mockRoleMod = {
	id: "role_mod",
	slug: "moderator",
	name: "Moderator",
	isSystem: false,
};

vi.mock("@vanta-base-admin/db", () => {
	function chain(result: unknown) {
		const self: Record<string, unknown> = {};
		const proxy = new Proxy(self, {
			get(_t, key) {
				const chainableKeys = [
					"where",
					"from",
					"set",
					"orderBy",
					"limit",
					"offset",
					"innerJoin",
					"values",
				];
				if (key === "returning") return vi.fn().mockResolvedValue(result);
				if (typeof key === "string" && chainableKeys.includes(key))
					return () => proxy;
				if (key === "then") {
					return (
						resolve: (v: unknown) => unknown,
						reject: (e: unknown) => unknown,
					) => Promise.resolve(result).then(resolve, reject);
				}
				return undefined;
			},
		});
		return proxy;
	}

	const mockDb = {
		select: (cols?: unknown) => {
			const result = mockDbSelect(cols) ?? [];
			return chain(result);
		},
		insert: (tbl: unknown) => {
			mockDbInsert(tbl);
			return chain([]);
		},
		update: (tbl: unknown) => {
			mockDbUpdate(tbl);
			return chain([]);
		},
		delete: (tbl: unknown) => {
			mockDbDelete(tbl);
			return chain([]);
		},
		query: {
			roles: { findFirst: mockDbQueryRolesFindFirst },
		},
		transaction: mockDbTransaction,
	};

	mockDbTransaction.mockImplementation(
		async (cb: (tx: typeof mockDb) => Promise<unknown>) => cb(mockDb),
	);

	return {
		db: mockDb,
		schema: {
			roles: {},
			rolePermissions: {},
		},
		eq: vi.fn(),
	};
});

const mockAuditService = {
	record: vi.fn().mockResolvedValue(undefined),
};

import { RolesService } from "./roles.service";

describe("RolesService", () => {
	let service: RolesService;

	beforeEach(() => {
		service = new RolesService(mockAuditService as never);
		vi.clearAllMocks();
	});

	describe("onModuleInit / reloadCache", () => {
		it("loads permissions into the cache on init", async () => {
			mockDbSelect.mockReturnValueOnce([
				{ slug: "moderator", permission: "users:read" },
				{ slug: "moderator", permission: "users:ban" },
			]);

			await service.onModuleInit();

			expect(service.hasPermission("moderator", "users:read")).toBe(true);
			expect(service.hasPermission("moderator", "users:ban")).toBe(true);
			expect(service.hasPermission("moderator", "roles:write")).toBe(false);
		});

		it("returns empty permissions for unknown role after load", async () => {
			mockDbSelect.mockReturnValueOnce([]);
			await service.onModuleInit();
			expect(service.hasPermission("unknown", "users:read")).toBe(false);
		});

		it("replaces cache on reload", async () => {
			// First load
			mockDbSelect.mockReturnValueOnce([
				{ slug: "moderator", permission: "users:read" },
			]);
			await service.onModuleInit();
			expect(service.hasPermission("moderator", "users:read")).toBe(true);

			// Reload with new data
			mockDbSelect.mockReturnValueOnce([
				{ slug: "moderator", permission: "roles:read" },
			]);
			await service.reloadCache();
			expect(service.hasPermission("moderator", "users:read")).toBe(false);
			expect(service.hasPermission("moderator", "roles:read")).toBe(true);
		});
	});

	describe("hasPermission", () => {
		it("returns false for null role slug", async () => {
			mockDbSelect.mockReturnValueOnce([]);
			await service.onModuleInit();
			expect(service.hasPermission(null, "users:read")).toBe(false);
			expect(service.hasPermission(undefined, "users:read")).toBe(false);
		});
	});

	describe("getPermissions", () => {
		it("returns all permissions for a role slug", async () => {
			mockDbSelect.mockReturnValueOnce([
				{ slug: "moderator", permission: "users:read" },
				{ slug: "moderator", permission: "users:ban" },
			]);
			await service.onModuleInit();
			const perms = service.getPermissions("moderator");
			expect(perms).toContain("users:read");
			expect(perms).toContain("users:ban");
		});

		it("returns empty array for role with no permissions", async () => {
			mockDbSelect.mockReturnValueOnce([]);
			await service.onModuleInit();
			expect(service.getPermissions("user")).toEqual([]);
		});
	});

	describe("update", () => {
		it("throws NotFoundException when role not found", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(null);
			await expect(
				service.update("missing", { name: "X" }, "actor-id"),
			).rejects.toThrow(NotFoundException);
		});

		it("throws BadRequestException when renaming admin role", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(mockRoleAdmin);
			mockDbSelect.mockReturnValueOnce([]);
			await expect(
				service.update("role_admin", { name: "Superadmin" }, "actor-id"),
			).rejects.toThrow(BadRequestException);
		});

		it("throws BadRequestException when modifying admin permissions", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(mockRoleAdmin);
			mockDbSelect.mockReturnValueOnce([]);
			await expect(
				service.update(
					"role_admin",
					{ permissions: ["users:read"] },
					"actor-id",
				),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe("remove", () => {
		it("throws NotFoundException when role not found", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(null);
			await expect(service.remove("missing", "actor-id")).rejects.toThrow(
				NotFoundException,
			);
		});

		it("throws BadRequestException when deleting system role", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(mockRoleUser);
			await expect(service.remove("role_user", "actor-id")).rejects.toThrow(
				BadRequestException,
			);
		});

		it("allows deleting non-system roles", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(mockRoleMod);
			mockDbSelect.mockReturnValue([]);
			await expect(
				service.remove("role_mod", "actor-id"),
			).resolves.not.toThrow();
		});
	});

	describe("create", () => {
		it("throws BadRequestException when slug already exists", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(mockRoleMod);
			await expect(
				service.create({ name: "Moderator" }, "actor-id"),
			).rejects.toThrow(BadRequestException);
		});
	});
});
