import { generateMockMetrics } from "./metrics.mock";
import type { MetricsOverview } from "./metrics.schema";

export function getMetricsOverview(): MetricsOverview {
  return generateMockMetrics();
}
