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
