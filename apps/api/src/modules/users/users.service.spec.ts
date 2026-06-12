import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

vi.mock("@vanta-base-admin/auth", () => ({
	auth: {
		api: { adminCreateUser: vi.fn() },
	},
}));

// vi.hoisted so variables are available when the vi.mock factory runs (which is hoisted too)
const { mockDbDelete, mockDbUpdate, mockDbSelect, mockDbQueryUserFindFirst, mockDbQuerySubscriptionFindFirst } = vi.hoisted(() => ({
	mockDbDelete: vi.fn(),
	mockDbUpdate: vi.fn(),
	mockDbSelect: vi.fn(),
	mockDbQueryUserFindFirst: vi.fn(),
	mockDbQuerySubscriptionFindFirst: vi.fn(),
}));

vi.mock("@vanta-base-admin/db", () => {
	// Drizzle-like chainable builder that ends with a returning() or execute()
	function chain(terminal: ReturnType<typeof vi.fn>) {
		const chainableKeys = new Set(["where", "from", "set", "orderBy", "limit", "offset"]);
		const obj: Record<string, unknown> = {};
		const self = new Proxy(obj, {
			get(_t, key) {
				if (key === "returning" || key === "execute") return terminal;
				// Only intercept known chainable keys — returning undefined for `then`/`catch`
				// prevents the proxy from being treated as a malformed thenable on await.
				if (typeof key === "string" && chainableKeys.has(key)) return () => self;
				return undefined;
			},
		});
		return self;
	}

	return {
		db: {
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
			query: {
				user: { findFirst: mockDbQueryUserFindFirst },
				subscription: { findFirst: mockDbQuerySubscriptionFindFirst },
			},
		},
		schema: {
			user: {},
			session: {},
			subscription: {},
		},
		count: vi.fn(() => "count"),
	};
});

import { auth } from "@vanta-base-admin/auth";
import { UsersService } from "./users.service";

const mockUserRow = {
	id: "u1",
	name: "Alice",
	email: "alice@example.com",
	role: "user" as const,
	banned: null,
	banReason: null,
	deletedAt: null,
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("UsersService", () => {
	let service: UsersService;

	beforeEach(() => {
		service = new UsersService();
		vi.clearAllMocks();
	});

	describe("create", () => {
		it("delegates to Better Auth admin API and returns result", async () => {
			const expectedResult = { user: mockUserRow };
			vi.mocked(auth.api.adminCreateUser).mockResolvedValue(
				expectedResult as any,
			);

			const headers = new Headers({ cookie: "session=abc" });
			const result = await service.create(
				{
					name: "Alice",
					email: "alice@example.com",
					password: "password1",
					role: "user",
				},
				headers,
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
	});

	describe("ban", () => {
		it("sets banned=true and passes banReason through", async () => {
			const banned = { ...mockUserRow, banned: true, banReason: "spam" };
			// Override update chain to return banned user
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({ where: () => ({ returning: vi.fn().mockResolvedValue([banned]) }) }),
			} as any);

			const result = await service.ban("u1", { banReason: "spam" });
			expect(result.banned).toBe(true);
			expect(result.banReason).toBe("spam");
		});

		it("throws NotFoundException when user not found", async () => {
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({ where: () => ({ returning: vi.fn().mockResolvedValue([]) }) }),
			} as any);

			await expect(service.ban("missing", { banReason: "x" })).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("unban", () => {
		it("sets banned=false and clears banReason", async () => {
			const unbanned = { ...mockUserRow, banned: false, banReason: null };
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({ where: () => ({ returning: vi.fn().mockResolvedValue([unbanned]) }) }),
			} as any);

			const result = await service.unban("u1");
			expect(result.banned).toBe(false);
			expect(result.banReason).toBeNull();
		});
	});

	describe("softDelete", () => {
		it("throws ForbiddenException when deleting own account", async () => {
			await expect(service.softDelete("u1", "u1")).rejects.toThrow(
				ForbiddenException,
			);
		});

		it("revokes sessions then sets deletedAt", async () => {
			const deletedAt = new Date();
			const { db } = await import("@vanta-base-admin/db");
			// First call: delete sessions
			vi.spyOn(db, "delete").mockReturnValueOnce({
				where: () => ({ returning: vi.fn().mockResolvedValue([]) }),
			} as any);
			// Second call: update user
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: vi.fn().mockResolvedValue([{ ...mockUserRow, deletedAt }]),
					}),
				}),
			} as any);

			const result = await service.softDelete("u1", "admin1");
			expect(db.delete).toHaveBeenCalled();
			expect(result.deletedAt).toEqual(deletedAt);
		});

		it("throws NotFoundException when user not found after delete", async () => {
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "delete").mockReturnValueOnce({
				where: () => ({ returning: vi.fn().mockResolvedValue([]) }),
			} as any);
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({ returning: vi.fn().mockResolvedValue([]) }),
				}),
			} as any);

			await expect(service.softDelete("missing", "admin1")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("restore", () => {
		it("clears deletedAt", async () => {
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: vi.fn().mockResolvedValue([{ ...mockUserRow, deletedAt: null }]),
					}),
				}),
			} as any);

			const result = await service.restore("u1");
			expect(result.deletedAt).toBeNull();
		});
	});

	describe("revokeSessions", () => {
		it("deletes all user sessions and returns count", async () => {
			const { db } = await import("@vanta-base-admin/db");
			vi.spyOn(db, "delete").mockReturnValueOnce({
				where: () => ({
					returning: vi.fn().mockResolvedValue([{ id: "s1" }, { id: "s2" }]),
				}),
			} as any);

			const result = await service.revokeSessions("u1");
			expect(result).toEqual({ revoked: 2 });
		});
	});
});
