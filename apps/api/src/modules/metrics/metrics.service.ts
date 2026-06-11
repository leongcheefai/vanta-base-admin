import { Injectable } from "@nestjs/common";
import { generateMockMetrics } from "./metrics.mock";
import type { MetricsOverview } from "./metrics.schema";

@Injectable()
export class MetricsService {
	getOverview(): MetricsOverview {
		return generateMockMetrics();
	}
}
