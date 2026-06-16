import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router";
import { useSession } from "../lib/auth";
import { env } from "../lib/env";

interface PermissionsResponse {
  role: string | null;
  permissions: string[];
  isAdmin: boolean;
}

const ADMIN_PERMISSIONS = [
  "users:read",
  "users:create",
  "users:edit",
  "users:delete",
  "users:ban",
  "users:sessions",
  "roles:read",
  "roles:write",
  "roles:assign",
  "audit:read",
];

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: permData, isPending: permPending } = useQuery<PermissionsResponse>({
    queryKey: ["me", "permissions"],
    queryFn: async () => {
      const res = await fetch(`${env.VITE_API_URL}/me/permissions`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json() as Promise<PermissionsResponse>;
    },
    enabled: !!session,
  });
  const { pathname, search } = useLocation();

  if (sessionPending || (session && permPending)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname + search)}`} replace />;
  }

  const isAdmin = permData?.isAdmin ?? false;
  const permissions = permData?.permissions ?? [];

  const hasAnyAdminPermission = isAdmin || ADMIN_PERMISSIONS.some((p) => permissions.includes(p));

  if (!hasAnyAdminPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
