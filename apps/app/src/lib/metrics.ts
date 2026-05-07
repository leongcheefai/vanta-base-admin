import { useQuery } from "@tanstack/react-query";
import { env } from "./env";

// Mirror the MetricsOverview shape from apps/api/src/modules/metrics/metrics.schema.ts
// (DO NOT import from the API package — replicate the types here in the frontend)
export type KpiMetric = {
  value: number;
  deltaPct: number;
};

export type MetricsOverview = {
  kpis: {
    mrr: KpiMetric;
    signups: KpiMetric;
    activeUsers: KpiMetric;
    churnPct: KpiMetric;
  };
  revenue: { month: string; mrr: number }[];
  signups: { week: string; count: number }[];
  activeUsers: { day: string; dau: number; wau: number; mau: number }[];
  planDistribution: { plan: string; users: number }[];
  activationFunnel: { stage: string; count: number }[];
  topCountries: { country: string; users: number }[];
};

export async function fetchMetrics(): Promise<MetricsOverview> {
  const res = await fetch(`${env.VITE_API_URL}/metrics/overview`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json() as Promise<MetricsOverview>;
}

export function useMetrics() {
  return useQuery({ queryKey: ["metrics"], queryFn: fetchMetrics });
}
