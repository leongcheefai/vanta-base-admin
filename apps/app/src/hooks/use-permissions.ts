import { useQuery } from "@tanstack/react-query";
import { env } from "../lib/env";

interface PermissionsResponse {
  role: string | null;
  permissions: string[];
  isAdmin: boolean;
}

async function fetchPermissions(): Promise<PermissionsResponse> {
  const res = await fetch(`${env.VITE_API_URL}/me/permissions`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch permissions");
  return res.json() as Promise<PermissionsResponse>;
}

export function usePermissions() {
  const { data } = useQuery({
    queryKey: ["me", "permissions"],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000,
  });

  function hasPermission(permission: string): boolean {
    if (!data) return false;
    if (data.isAdmin) return true;
    return data.permissions.includes(permission);
  }

  return {
    hasPermission,
    role: data?.role ?? null,
    isAdmin: data?.isAdmin ?? false,
    permissions: data?.permissions ?? [],
  };
}
