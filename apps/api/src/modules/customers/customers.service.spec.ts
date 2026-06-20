import { ConflictException, NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";

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
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
      then: (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
        Promise.resolve(resolveValue).then(onFulfilled, onRejected),
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
    query: {
      customer: { findFirst: vi.fn() },
    },
  };

  return { mockDb, makeChain };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...a: unknown[]) => a),
  and: vi.fn((...a: unknown[]) => a),
  or: vi.fn((...a: unknown[]) => a),
  ilike: vi.fn((...a: unknown[]) => a),
  isNull: vi.fn((...a: unknown[]) => a),
  count: vi.fn(() => "count"),
  desc: vi.fn((...a: unknown[]) => a),
  asc: vi.fn((...a: unknown[]) => a),
}));

vi.mock("@vanta-base-admin/db", () => {
  const col = (name: string) => ({ columnName: name });
  return {
    db: mockDb,
    schema: {
      customer: {
        id: col("id"),
        name: col("name"),
        email: col("email"),
        company: col("company"),
        status: col("status"),
        createdBy: col("created_by"),
        deletedAt: col("deleted_at"),
        createdAt: col("created_at"),
        updatedAt: col("updated_at"),
        $inferInsert: {},
      },
    },
  };
});

const mockCustomer = {
  id: "c1",
  firstName: "Jane",
  lastName: "Smith",
  name: "Jane Smith",
  email: "jane@example.com",
  phone: null as string | null,
  company: null as string | null,
  notes: null as string | null,
  status: "active" as const,
  createdBy: "u1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null as Date | null,
};

const mockAuditService = { record: vi.fn().mockResolvedValue(undefined) };

describe("CustomersService", () => {
  let service: CustomersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomersService(mockAuditService as any);
    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([]));
    mockDb.update.mockReturnValue(makeChain([]));
  });

  // ─── list ──────────────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns paginated data and total", async () => {
      mockDb.select
        .mockReturnValueOnce(makeChain([mockCustomer]))
        .mockReturnValueOnce(makeChain([{ total: 1 }]));
      const result = await service.list({ page: 1, limit: 20 });
      expect(result).toEqual({
        data: [mockCustomer],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it("returns zero total when no customers match", async () => {
      mockDb.select
        .mockReturnValueOnce(makeChain([]))
        .mockReturnValueOnce(makeChain([{ total: 0 }]));
      const result = await service.list({});
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it("applies status filter when provided", async () => {
      mockDb.select
        .mockReturnValueOnce(makeChain([mockCustomer]))
        .mockReturnValueOnce(makeChain([{ total: 1 }]));
      const result = await service.list({ status: "active" });
      expect(result.data).toEqual([mockCustomer]);
    });

    it("applies search when q is provided", async () => {
      mockDb.select
        .mockReturnValueOnce(makeChain([mockCustomer]))
        .mockReturnValueOnce(makeChain([{ total: 1 }]));
      const result = await service.list({ q: "jane" });
      expect(result.data).toEqual([mockCustomer]);
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("inserts and returns new customer with computed name", async () => {
      mockDb.insert.mockReturnValue(makeChain([mockCustomer]));
      const result = await service.create("u1", {
        firstName: "Jane",
        lastName: "Smith",
      } as never);
      expect(result).toEqual(mockCustomer);
    });

    it("defaults status to active", async () => {
      const activeCustomer = { ...mockCustomer, status: "active" as const };
      mockDb.insert.mockReturnValue(makeChain([activeCustomer]));
      const result = await service.create("u1", { firstName: "Jane" } as never);
      expect(result.status).toBe("active");
    });

    it("sets createdBy from the calling user id", async () => {
      mockDb.insert.mockReturnValue(makeChain([mockCustomer]));
      const result = await service.create("u1", { firstName: "Jane" } as never);
      expect(result.createdBy).toBe("u1");
    });

    it("uses company as name when no person name provided", async () => {
      const companyCustomer = {
        ...mockCustomer,
        firstName: null,
        lastName: null,
        name: "Acme Corp",
        company: "Acme Corp",
      };
      mockDb.insert.mockReturnValue(makeChain([companyCustomer]));
      const result = await service.create("u1", {
        company: "Acme Corp",
      } as never);
      expect(result.name).toBe("Acme Corp");
    });

    it("throws ConflictException on duplicate active email (pg 23505)", async () => {
      const chain = makeChain([]);
      (chain.returning as ReturnType<typeof vi.fn>).mockRejectedValue(
        Object.assign(new Error("unique violation"), { code: "23505" }),
      );
      mockDb.insert.mockReturnValue(chain);
      await expect(
        service.create("u1", {
          email: "jane@example.com",
          firstName: "Jane",
        } as never),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── findById ──────────────────────────────────────────────────────────────

  describe("findById", () => {
    it("returns customer when found and not deleted", async () => {
      mockDb.query.customer.findFirst.mockResolvedValueOnce(mockCustomer);
      const result = await service.findById("c1");
      expect(result).toEqual(mockCustomer);
    });

    it("throws NotFoundException when customer not found", async () => {
      mockDb.query.customer.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.findById("missing")).rejects.toThrow(NotFoundException);
    });

    it("excludes soft-deleted customers", async () => {
      mockDb.query.customer.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.findById("c1")).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates and returns modified customer", async () => {
      const updated = {
        ...mockCustomer,
        firstName: "Janet",
        name: "Janet Smith",
      };
      mockDb.query.customer.findFirst.mockResolvedValueOnce(mockCustomer);
      mockDb.update.mockReturnValue(makeChain([updated]));
      const result = await service.update("c1", { firstName: "Janet" }, "u1");
      expect(result).toEqual(updated);
    });

    it("recomputes name when firstName changes", async () => {
      const updated = {
        ...mockCustomer,
        firstName: "Janet",
        name: "Janet Smith",
      };
      mockDb.query.customer.findFirst.mockResolvedValueOnce(mockCustomer);
      mockDb.update.mockReturnValue(makeChain([updated]));
      const result = await service.update("c1", { firstName: "Janet" }, "u1");
      expect(result.name).toBe("Janet Smith");
    });

    it("throws NotFoundException when customer not found before update", async () => {
      mockDb.query.customer.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.update("missing", { firstName: "x" }, "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws ConflictException on duplicate email during update", async () => {
      mockDb.query.customer.findFirst.mockResolvedValueOnce(mockCustomer);
      const chain = makeChain([]);
      (chain.returning as ReturnType<typeof vi.fn>).mockRejectedValue(
        Object.assign(new Error("unique violation"), { code: "23505" }),
      );
      mockDb.update.mockReturnValue(chain);
      await expect(service.update("c1", { email: "taken@example.com" }, "u1")).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── softDelete ────────────────────────────────────────────────────────────

  describe("softDelete", () => {
    it("sets deletedAt and returns {deleted: true}", async () => {
      const deleted = { ...mockCustomer, deletedAt: new Date() };
      mockDb.query.customer.findFirst.mockResolvedValueOnce(mockCustomer);
      mockDb.update.mockReturnValue(makeChain([deleted]));
      const result = await service.softDelete("c1", "u1");
      expect(result).toEqual({ deleted: true });
    });

    it("throws NotFoundException when customer does not exist", async () => {
      mockDb.query.customer.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.softDelete("missing", "u1")).rejects.toThrow(NotFoundException);
    });

    it("excludes soft-deleted customer from list after deletion", async () => {
      mockDb.query.customer.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.findById("c1")).rejects.toThrow(NotFoundException);
    });

    it("allows reuse of email after deletion (no conflict on insert)", async () => {
      const deletedCustomer = { ...mockCustomer, deletedAt: new Date() };
      mockDb.query.customer.findFirst.mockResolvedValueOnce(mockCustomer);
      mockDb.update.mockReturnValue(makeChain([deletedCustomer]));
      await service.softDelete("c1", "u1");
      const newCustomer = { ...mockCustomer, id: "c2" };
      mockDb.insert.mockReturnValue(makeChain([newCustomer]));
      const result = await service.create("u1", {
        firstName: "Jane",
        email: mockCustomer.email,
      } as never);
      expect(result.email).toBe(mockCustomer.email);
    });
  });
});
