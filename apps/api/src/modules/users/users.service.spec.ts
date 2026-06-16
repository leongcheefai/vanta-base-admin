import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

vi.mock("@vanta-base-admin/auth", () => ({
	auth: {
		api: { adminCreateUser: vi.fn() },
	},
}));

const {
	mockDbDelete,
	mockDbUpdate,
	mockDbSelect,
	mockDbInsert,
	mockDbTransaction,
	mockDbQueryUserFindFirst,
	mockDbQuerySubscriptionFindFirst,
	mockDbQueryRolesFindFirst,
} = vi.hoisted(() => ({
	mockDbDelete: vi.fn(),
	mockDbUpdate: vi.fn(),
	mockDbSelect: vi.fn(),
	mockDbInsert: vi.fn(),
	mockDbTransaction: vi.fn(),
	mockDbQueryUserFindFirst: vi.fn(),
	mockDbQuerySubscriptionFindFirst: vi.fn(),
	mockDbQueryRolesFindFirst: vi.fn(),
}));

vi.mock("@vanta-base-admin/db", () => {
	function chain(terminal: ReturnType<typeof vi.fn>) {
		const chainableKeys = new Set([
			"where",
			"from",
			"set",
			"orderBy",
			"limit",
			"offset",
		]);
		const obj: Record<string, unknown> = {};
		const self = new Proxy(obj, {
			get(_t, key) {
				if (key === "returning" || key === "execute") return terminal;
				if (typeof key === "string" && chainableKeys.has(key))
					return () => self;
				return undefined;
			},
		});
		return self;
	}

	const mockDb = {
		delete: (tbl: unknown) => {
			mockDbDelete(tbl);
			return chain(vi.fn().mockResolvedValue([]));
		},
		update: (tbl: unknown) => {
			mockDbUpdate(tbl);
			return chain(vi.fn().mockResolvedValue([]));
		},
		select: (cols?: unknown) => {
			mockDbSelect(cols);
			return chain(vi.fn().mockResolvedValue([]));
		},
		insert: (tbl: unknown) => {
			mockDbInsert(tbl);
			return { values: vi.fn().mockResolvedValue([]) };
		},
		query: {
			user: { findFirst: mockDbQueryUserFindFirst },
			subscription: { findFirst: mockDbQuerySubscriptionFindFirst },
			roles: { findFirst: mockDbQueryRolesFindFirst },
		},
		transaction: mockDbTransaction,
	};

	// transaction mock calls the callback with the same mock db so that
	// vi.spyOn(db, "update") spies remain active inside transactions
	mockDbTransaction.mockImplementation(async (cb: (tx: typeof mockDb) => Promise<unknown>) =>
		cb(mockDb),
	);

	return {
		db: mockDb,
		schema: {
			user: {},
			session: {},
			subscription: {},
			roles: {},
		},
		count: vi.fn(() => "count"),
	};
});

import { auth } from "@vanta-base-admin/auth";
import { UsersService } from "./users.service";

const mockAuditService = {
	record: vi.fn().mockResolvedValue(undefined),
};

const mockUserRow = {
	id: "u1",
	name: "Alice",
	email: "alice@example.com",
	role: "user" as const,
	roleId: "role_user",
	banned: null,
	banReason: null,
	deletedAt: null,
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockRoleRow = {
	id: "role_user",
	slug: "user",
	name: "User",
	isSystem: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("UsersService", () => {
	let service: UsersService;

	beforeEach(() => {
		service = new UsersService(mockAuditService as never);
		vi.clearAllMocks();
		// Re-apply transaction mock after clearAllMocks resets call counts
		// (implementation is preserved — clearAllMocks only resets call history)
	});

	describe("create", () => {
		it("resolves role slug from roleId and delegates to Better Auth admin API", async () => {
			const expectedResult = { user: mockUserRow };
			vi.mocked(auth.api.adminCreateUser).mockResolvedValue(
				expectedResult as never,
			);
			mockDbQueryRolesFindFirst.mockResolvedValue(mockRoleRow);

			const headers = new Headers({ cookie: "session=abc" });
			const result = await service.create(
				{
					name: "Alice",
					email: "alice@example.com",
					password: "password1",
					roleId: "role_user",
				},
				headers,
				"actor-id",
			);

			expect(auth.api.adminCreateUser).toHaveBeenCalledWith({
				body: {
					email: "alice@example.com",
					name: "Alice",
					password: "password1",
					role: "user",
				},
				headers,
			});
			expect(result).toEqual(expectedResult);
		});

		it("defaults to user role when roleId is not provided", async () => {
			const expectedResult = { user: mockUserRow };
			vi.mocked(auth.api.adminCreateUser).mockResolvedValue(
				expectedResult as never,
			);

			const headers = new Headers({ cookie: "session=abc" });
			await service.create(
				{ name: "Alice", email: "alice@example.com", password: "password1" },
				headers,
				"actor-id",
			);

			expect(auth.api.adminCreateUser).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.objectContaining({ role: "user" }),
				}),
			);
		});
	});

	describe("assignRole", () => {
		it("updates user roleId and role slug", async () => {
			const adminRole = { id: "role_admin", slug: "admin", name: "Admin" };
			mockDbQueryRolesFindFirst.mockResolvedValueOnce(adminRole);
			mockDbQueryUserFindFirst.mockResolvedValueOnce(mockUserRow);
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: vi
							.fn()
							.mockResolvedValue([
								{ ...mockUserRow, role: "admin", roleId: "role_admin" },
							]),
					}),
				}),
			} as never);

			const result = await service.assignRole("u1", "role_admin", "actor-id");
			expect(result.role).toBe("admin");
			expect(result.roleId).toBe("role_admin");
		});

		it("throws NotFoundException when role not found", async () => {
			mockDbQueryRolesFindFirst.mockResolvedValue(null);
			await expect(
				service.assignRole("u1", "role_missing", "actor-id"),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("ban", () => {
		it("sets banned=true and passes banReason through", async () => {
			const banned = { ...mockUserRow, banned: true, banReason: "spam" };
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({ returning: vi.fn().mockResolvedValue([banned]) }),
				}),
			} as never);

			const result = await service.ban("u1", { banReason: "spam" }, "actor-id");
			expect(result.banned).toBe(true);
			expect(result.banReason).toBe("spam");
		});

		it("throws NotFoundException when user not found", async () => {
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({ returning: vi.fn().mockResolvedValue([]) }),
				}),
			} as never);

			await expect(
				service.ban("missing", { banReason: "x" }, "actor-id"),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("softDelete", () => {
		it("throws ForbiddenException when deleting own account", async () => {
			await expect(service.softDelete("u1", "u1", "u1")).rejects.toThrow(
				ForbiddenException,
			);
		});

		it("revokes sessions then sets deletedAt", async () => {
			const deletedAt = new Date();
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "delete").mockReturnValueOnce({
				where: () => ({ returning: vi.fn().mockResolvedValue([]) }),
			} as never);
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: vi
							.fn()
							.mockResolvedValue([{ ...mockUserRow, deletedAt }]),
					}),
				}),
			} as never);

			const result = await service.softDelete("u1", "admin1", "admin1");
			expect(result.deletedAt).toEqual(deletedAt);
		});
	});

	describe("revokeSessions", () => {
		it("deletes all user sessions and returns count", async () => {
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "delete").mockReturnValueOnce({
				where: () => ({
					returning: vi.fn().mockResolvedValue([{ id: "s1" }, { id: "s2" }]),
				}),
			} as never);

			const result = await service.revokeSessions("u1", "actor-id");
			expect(result).toEqual({ revoked: 2 });
		});
	});
});
