import { ForbiddenException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { ReleasesController } from "./releases.controller";
import { ReleasesService } from "./releases.service";

vi.mock("@vanta-base-admin/db", () => ({
	db: { select: vi.fn(), insert: vi.fn() },
	schema: { release: {} },
}));

vi.mock("../../lib/github", () => ({
	listGithubReleases: vi.fn(),
}));

const adminUser = { id: "u1", role: "admin" } as any;
const regularUser = { id: "u2", role: "user" } as any;
const mockReleases = [{ id: "1", tag: "v1.0.0" }];

describe("ReleasesController", () => {
	let controller: ReleasesController;
	let service: ReleasesService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ReleasesController],
			providers: [
				{
					provide: ReleasesService,
					useValue: {
						list: vi.fn().mockResolvedValue(mockReleases),
						sync: vi.fn().mockResolvedValue({ synced: 1 }),
					},
				},
			],
		}).compile();
		controller = module.get(ReleasesController);
		service = module.get(ReleasesService);
	});

	it("list returns releases from service", async () => {
		expect(await controller.list()).toEqual(mockReleases);
	});

	it("sync succeeds for admin", async () => {
		expect(await controller.sync(adminUser)).toEqual({ synced: 1 });
		expect(service.sync).toHaveBeenCalled();
	});

	it("sync throws ForbiddenException for non-admin", async () => {
		await expect(controller.sync(regularUser)).rejects.toThrow(
			ForbiddenException,
		);
	});
});
