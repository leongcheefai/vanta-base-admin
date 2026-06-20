import { Test, type TestingModule } from "@nestjs/testing";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

vi.mock("@vanta-base-admin/env", () => ({
  serverEnv: {},
}));

const mockUser = { id: "u1" } as any;
const mockResult = {
  uploadUrl: "https://s3.example.com/upload",
  publicUrl: "https://cdn.example.com/key",
  key: "avatars/u1/uuid.png",
};

describe("UploadsController", () => {
  let controller: UploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: { presignAvatar: vi.fn().mockResolvedValue(mockResult) },
        },
      ],
    }).compile();
    controller = module.get(UploadsController);
  });

  it("presignAvatar calls service and returns result", async () => {
    const dto = { contentType: "image/png" as const, size: 1024 };
    const result = await controller.presignAvatar(mockUser, dto);
    expect(result).toEqual(mockResult);
  });
});
