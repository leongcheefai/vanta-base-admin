import { Test, type TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

vi.mock("@vanta-base-admin/db", () => ({
  db: {},
  schema: { user: {}, session: {}, subscription: {}, roles: {} },
}));

vi.mock("@vanta-base-admin/auth", () => ({
  auth: { api: { adminCreateUser: vi.fn() } },
}));

const adminUser = { id: "u1", role: "admin" } as any;

const mockUser = {
  id: "u3",
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  roleId: "role_user",
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
            assignRole: vi.fn().mockResolvedValue(mockUser),
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

  it("list returns users from service", async () => {
    const result = await controller.list({});
    expect(result).toEqual(mockListResult);
    expect(service.list).toHaveBeenCalled();
  });

  it("findById returns user detail from service", async () => {
    const result = await controller.findById("u3");
    expect(result).toEqual(mockDetail);
    expect(service.findById).toHaveBeenCalledWith("u3");
  });

  it("create delegates to service with admin headers", async () => {
    const mockReq = { headers: { cookie: "session=abc" } } as any;
    const result = await controller.create(mockReq, {
      name: "Bob",
      email: "bob@example.com",
      password: "password1",
    });
    expect(result).toEqual(mockUser);
    expect(service.create).toHaveBeenCalled();
  });

  it("edit delegates to service", async () => {
    await controller.edit("u3", { name: "Alice 2" });
    expect(service.edit).toHaveBeenCalledWith("u3", { name: "Alice 2" });
  });

  it("assignRole delegates to service", async () => {
    await controller.assignRole("u3", { roleId: "role_admin" });
    expect(service.assignRole).toHaveBeenCalledWith("u3", "role_admin");
  });

  it("ban delegates to service", async () => {
    await controller.ban("u3", { banReason: "spam" });
    expect(service.ban).toHaveBeenCalledWith("u3", { banReason: "spam" });
  });

  it("unban delegates to service", async () => {
    await controller.unban("u3");
    expect(service.unban).toHaveBeenCalledWith("u3");
  });

  it("softDelete delegates to service with acting user id", async () => {
    await controller.softDelete(adminUser, "u3");
    expect(service.softDelete).toHaveBeenCalledWith("u3", "u1");
  });

  it("restore delegates to service", async () => {
    await controller.restore("u3");
    expect(service.restore).toHaveBeenCalledWith("u3");
  });

  it("revokeSessions delegates to service", async () => {
    const result = await controller.revokeSessions("u3");
    expect(result).toEqual({ revoked: 2 });
    expect(service.revokeSessions).toHaveBeenCalledWith("u3");
  });
});
