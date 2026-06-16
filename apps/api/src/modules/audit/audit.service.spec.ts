import { describe, expect, it, vi } from "vitest";

const {
	mockDbInsert,
	mockDbSelect,
} = vi.hoisted(() => ({
	mockDbInsert: vi.fn(),
	mockDbSelect: vi.fn(),
}));

vi.mock("@vanta-base-admin/db", () => {
	function chain(terminal: ReturnType<typeof vi.fn>) {
		const chainableKeys = new Set([
			"where",
			"from",
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
				if (key === "then") {
					return (resolve: (v: unknown) => unknown) => resolve(terminal());
				}
				return undefined;
			},
		});
		return self;
	}

	return {
		db: {
			insert: (tbl: unknown) => {
				mockDbInsert(tbl);
				return {
					values: vi.fn().mockResolvedValue([]),
				};
			},
			select: (cols?: unknown) => {
				mockDbSelect(cols);
				return chain(vi.fn().mockResolvedValue([]));
			},
		},
		schema: {
			auditLog: {
				actorId: "actor_id",
				action: "action",
				targetType: "target_type",
				createdAt: "created_at",
			},
		},
	};
});

import { AuditService } from "./audit.service";

describe("AuditService", () => {
	let service: AuditService;

	beforeEach(() => {
		service = new AuditService();
		vi.clearAllMocks();
	});

	describe("record()", () => {
		it("inserts a row with the correct action, actorId, targetType, and targetId", async () => {
			const { db } = await import("@vanta-base-admin/db");
			const insertValues = vi.fn().mockResolvedValue([]);
			vi.spyOn(db, "insert").mockReturnValueOnce({
				values: insertValues,
			} as ReturnType<typeof db.insert>);

			await service.record({
				action: "user.ban",
				actorId: "actor-1",
				targetType: "user",
				targetId: "user-1",
				metadata: { after: { banReason: "spam" } },
			});

			expect(db.insert).toHaveBeenCalled();
			const [row] = insertValues.mock.calls[0] as [Record<string, unknown>];
			expect(row.action).toBe("user.ban");
			expect(row.actorId).toBe("actor-1");
			expect(row.targetType).toBe("user");
			expect(row.targetId).toBe("user-1");
			expect(row.metadata).toEqual({ after: { banReason: "spam" } });
			expect(typeof row.id).toBe("string");
			expect(row.id).toHaveLength(36);
		});

		it("includes ipAddress and userAgent from ctx", async () => {
			const { db } = await import("@vanta-base-admin/db");
			const insertValues = vi.fn().mockResolvedValue([]);
			vi.spyOn(db, "insert").mockReturnValueOnce({
				values: insertValues,
			} as ReturnType<typeof db.insert>);

			await service.record(
				{
					action: "user.create",
					actorId: "actor-1",
					targetType: "user",
					targetId: "user-2",
					metadata: {},
				},
				{ ipAddress: "1.2.3.4", userAgent: "TestBrowser/1.0" },
			);

			const [row] = insertValues.mock.calls[0] as [Record<string, unknown>];
			expect(row.ipAddress).toBe("1.2.3.4");
			expect(row.userAgent).toBe("TestBrowser/1.0");
		});

		it("uses the provided transaction handle instead of the global db client", async () => {
			const txInsertValues = vi.fn().mockResolvedValue([]);
			const mockTx = {
				insert: vi.fn().mockReturnValue({ values: txInsertValues }),
			};

			const { db } = await import("@vanta-base-admin/db");
			const globalInsertSpy = vi.spyOn(db, "insert");

			await service.record(
				{
					action: "role.create",
					actorId: "actor-1",
					targetType: "role",
					targetId: "role-1",
					metadata: { after: { name: "Viewer" } },
				},
				undefined,
				mockTx as Parameters<Parameters<typeof db.transaction>[0]>[0],
			);

			expect(mockTx.insert).toHaveBeenCalled();
			expect(globalInsertSpy).not.toHaveBeenCalled();
		});
	});

	describe("list()", () => {
		it("returns data and total with defaults when no filters are given", async () => {
			const { db } = await import("@vanta-base-admin/db");

			const mockRows = [
				{
					id: "log-1",
					action: "user.ban",
					actorId: "actor-1",
					targetType: "user",
					targetId: "user-1",
					metadata: {},
					createdAt: new Date(),
				},
			];

			vi.spyOn(db, "select")
				.mockReturnValueOnce({
					from: () => ({
						where: () => ({
							orderBy: () => ({
								limit: () => ({
									offset: () => Promise.resolve(mockRows),
								}),
							}),
						}),
					}),
				} as ReturnType<typeof db.select>)
				.mockReturnValueOnce({
					from: () => ({
						where: () => Promise.resolve([{ total: 1 }]),
					}),
				} as ReturnType<typeof db.select>);

			const result = await service.list({});

			expect(result.data).toEqual(mockRows);
			expect(result.total).toBe(1);
		});

		it("returns newest-first ordering and respects limit/offset", async () => {
			const { db } = await import("@vanta-base-admin/db");

			const orderBySpy = vi.fn().mockReturnValue({
				limit: (l: number) => ({
					offset: (o: number) => {
						expect(l).toBe(5);
						expect(o).toBe(10);
						return Promise.resolve([]);
					},
				}),
			});

			vi.spyOn(db, "select")
				.mockReturnValueOnce({
					from: () => ({
						where: () => ({
							orderBy: orderBySpy,
						}),
					}),
				} as ReturnType<typeof db.select>)
				.mockReturnValueOnce({
					from: () => ({
						where: () => Promise.resolve([{ total: 0 }]),
					}),
				} as ReturnType<typeof db.select>);

			await service.list({ limit: 5, offset: 10 });

			expect(orderBySpy).toHaveBeenCalled();
		});

		it("applies actor filter when provided", async () => {
			const { db } = await import("@vanta-base-admin/db");

			const whereSpy = vi
				.fn()
				.mockReturnValue({
					orderBy: () => ({ limit: () => ({ offset: () => Promise.resolve([]) }) }),
				});

			vi.spyOn(db, "select")
				.mockReturnValueOnce({
					from: () => ({ where: whereSpy }),
				} as ReturnType<typeof db.select>)
				.mockReturnValueOnce({
					from: () => ({ where: () => Promise.resolve([{ total: 0 }]) }),
				} as ReturnType<typeof db.select>);

			await service.list({ actor: "actor-99" });

			expect(whereSpy).toHaveBeenCalledWith(expect.anything());
		});
	});

	describe("role.update permission delta", () => {
		it("records added and removed permissions in metadata", async () => {
			const { db } = await import("@vanta-base-admin/db");
			const insertValues = vi.fn().mockResolvedValue([]);
			vi.spyOn(db, "insert").mockReturnValueOnce({
				values: insertValues,
			} as ReturnType<typeof db.insert>);

			await service.record(
				{
					action: "role.update",
					actorId: "actor-1",
					targetType: "role",
					targetId: "role-1",
					metadata: {
						before: { permissions: ["roles:read", "users:read"] },
						after: {
							permissions: ["roles:read", "roles:write"],
							added: ["roles:write"],
							removed: ["users:read"],
						},
					},
				},
			);

			const [row] = insertValues.mock.calls[0] as [Record<string, unknown>];
			const meta = row.metadata as {
				after: { added: string[]; removed: string[] };
			};
			expect(meta.after.added).toEqual(["roles:write"]);
			expect(meta.after.removed).toEqual(["users:read"]);
		});
	});
});
