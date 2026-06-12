import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "./env";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  deletedAt: string | null;
}

export interface AdminSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AdminSubscription {
  status: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface UserDetail {
  user: AdminUser;
  subscription: AdminSubscription | null;
  sessions: AdminSession[];
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
}

export interface ListUsersParams {
  limit?: number;
  offset?: number;
  search?: string;
  role?: "admin" | "user";
  banned?: boolean;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "name" | "email";
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "user";
}

export interface EditUserInput {
  name?: string;
  role?: "admin" | "user";
}

async function fetchUsers(params: ListUsersParams): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.banned !== undefined) query.set("banned", String(params.banned));
  if (params.includeDeleted) query.set("includeDeleted", "true");
  if (params.sortBy) query.set("sortBy", params.sortBy);

  const res = await fetch(
    `${env.VITE_API_URL}/users?${query.toString()}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<UserListResponse>;
}

async function fetchUser(id: string): Promise<UserDetail> {
  const res = await fetch(`${env.VITE_API_URL}/users/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json() as Promise<UserDetail>;
}

async function createUser(input: CreateUserInput): Promise<AdminUser> {
  const res = await fetch(`${env.VITE_API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Failed to create user");
  }
  return res.json() as Promise<AdminUser>;
}

async function editUser(id: string, input: EditUserInput): Promise<AdminUser> {
  const res = await fetch(`${env.VITE_API_URL}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json() as Promise<AdminUser>;
}

async function banUser(id: string, banReason: string): Promise<AdminUser> {
  const res = await fetch(`${env.VITE_API_URL}/users/${id}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ banReason }),
  });
  if (!res.ok) throw new Error("Failed to ban user");
  return res.json() as Promise<AdminUser>;
}

async function unbanUser(id: string): Promise<AdminUser> {
  const res = await fetch(`${env.VITE_API_URL}/users/${id}/unban`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to unban user");
  return res.json() as Promise<AdminUser>;
}

async function deleteUser(id: string): Promise<AdminUser> {
  const res = await fetch(`${env.VITE_API_URL}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json() as Promise<AdminUser>;
}

async function restoreUser(id: string): Promise<AdminUser> {
  const res = await fetch(`${env.VITE_API_URL}/users/${id}/restore`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to restore user");
  return res.json() as Promise<AdminUser>;
}

async function revokeUserSessions(id: string): Promise<{ revoked: number }> {
  const res = await fetch(`${env.VITE_API_URL}/users/${id}/revoke-sessions`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to revoke sessions");
  return res.json() as Promise<{ revoked: number }>;
}

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useEditUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditUserInput }) =>
      editUser(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, banReason }: { id: string; banReason: string }) =>
      banUser(id, banReason),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unbanUser(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useRevokeUserSessions(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => revokeUserSessions(userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] }),
  });
}
