import { useQuery } from "@tanstack/react-query";
import { env } from "./env";

export interface AuditEntry {
  id: string;
  action: string;
  actorId: string;
  actorName: string | null;
  targetType: string;
  targetId: string;
  targetName: string | null;
  metadata: {
    before?: unknown;
    after?: unknown;
    reason?: string;
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditListResponse {
  data: AuditEntry[];
  total: number;
}

export interface ListAuditParams {
  actor?: string;
  action?: string;
  targetType?: "user" | "role" | "customer" | "inventory_product" | "inventory_category";
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

async function fetchAuditLog(params: ListAuditParams): Promise<AuditListResponse> {
  const query = new URLSearchParams();
  if (params.actor) query.set("actor", params.actor);
  if (params.action) query.set("action", params.action);
  if (params.targetType) query.set("targetType", params.targetType);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const res = await fetch(`${env.VITE_API_URL}/audit?${query.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch audit log");
  return res.json() as Promise<AuditListResponse>;
}

export function useAuditLog(params: ListAuditParams) {
  return useQuery({
    queryKey: ["admin", "audit", params],
    queryFn: () => fetchAuditLog(params),
  });
}
