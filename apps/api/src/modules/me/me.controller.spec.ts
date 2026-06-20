import { Test, type TestingModule } from "@nestjs/testing";
import { MeController } from "./me.controller";

vi.mock("@vanta-base-admin/db", () => ({
	db: { query: { account: { findFirst: vi.fn() } } },
}));

import { db } from "@vanta-base-admin/db";

const mockUser = { id: "u1", email: "a@b.com", name: "Alice" } as any;

describe("MeController", () => {
	let controller: MeController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MeController],
		}).compile();
		controller = module.get(MeController);
	});

	it("getMe returns the user", () => {
		expect(controller.getMe(mockUser)).toEqual({ user: mockUser });
	});

	it("hasPassword returns false when no credential account", async () => {
		vi.mocked(db.query.account.findFirst).mockResolvedValue(undefined);
		const result = await controller.hasPassword(mockUser);
		expect(result).toEqual({ hasPassword: false });
	});

	it("hasPassword returns true when credential account exists", async () => {
		vi.mocked(db.query.account.findFirst).mockResolvedValue({
			id: "acc1",
		} as any);
		const result = await controller.hasPassword(mockUser);
		expect(result).toEqual({ hasPassword: true });
	});
});
