export type KpiMetric = {
	value: number;
	deltaPct: number;
};

export type MetricsOverview = {
	kpis: {
		activeUsers: KpiMetric;
	};
	activeUsers: { day: string; dau: number; wau: number; mau: number }[];
	topCountries: { country: string; users: number }[];
};
