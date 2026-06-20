import { Test, type TestingModule } from "@nestjs/testing";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";

vi.mock("@vanta-base-admin/db", () => ({
  db: { insert: vi.fn() },
  schema: {},
}));

vi.mock("../../lib/github", () => ({
  createFeedbackIssue: vi.fn(),
}));

const mockUser = { id: "u1", email: "a@b.com" } as any;
const mockResult = { id: "f1", issueUrl: undefined };

describe("FeedbackController", () => {
  let controller: FeedbackController;
  let service: FeedbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: { create: vi.fn().mockResolvedValue(mockResult) },
        },
      ],
    }).compile();
    controller = module.get(FeedbackController);
    service = module.get(FeedbackService);
  });

  it("calls service.create and returns result", async () => {
    const dto = { type: "bug" as const, message: "something broke" };
    const result = await controller.create(mockUser, dto);
    expect(service.create).toHaveBeenCalledWith("u1", "a@b.com", dto);
    expect(result).toEqual(mockResult);
  });
});
