import { Test, type TestingModule } from "@nestjs/testing";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

const mockOverview = {
  kpis: {},
  revenue: [],
  signups: [],
  activeUsers: [],
  planDistribution: [],
  activationFunnel: [],
  topCountries: [],
} as any;

describe("MetricsController", () => {
  let controller: MetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: { getOverview: vi.fn().mockReturnValue(mockOverview) },
        },
      ],
    }).compile();
    controller = module.get(MetricsController);
  });

  it("returns overview from service", () => {
    expect(controller.getOverview()).toEqual(mockOverview);
  });
});
