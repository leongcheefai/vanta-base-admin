import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "./env";

export interface Role {
  id: string;
  slug: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: string[];
}

async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`${env.VITE_API_URL}/roles`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json() as Promise<Role[]>;
}

async function fetchRole(id: string): Promise<Role> {
  const res = await fetch(`${env.VITE_API_URL}/roles/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch role");
  return res.json() as Promise<Role>;
}

async function createRole(input: CreateRoleInput): Promise<Role> {
  const res = await fetch(`${env.VITE_API_URL}/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Failed to create role");
  }
  return res.json() as Promise<Role>;
}

async function updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
  const res = await fetch(`${env.VITE_API_URL}/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Failed to update role");
  }
  return res.json() as Promise<Role>;
}

async function deleteRole(id: string): Promise<void> {
  const res = await fetch(`${env.VITE_API_URL}/roles/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Failed to delete role");
  }
}

export function useRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: fetchRoles,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ["admin", "roles", id],
    queryFn: () => fetchRole(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      updateRole(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}
