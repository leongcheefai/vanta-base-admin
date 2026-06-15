import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "./env";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: CustomerStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: CustomerStatus;
  sort?: "createdAt" | "name";
  dir?: "asc" | "desc";
}

export interface CreateCustomerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status?: CustomerStatus;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status?: CustomerStatus;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function fetchCustomers(params: ListCustomersParams): Promise<CustomerListResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.sort) query.set("sort", params.sort);
  if (params.dir) query.set("dir", params.dir);

  const res = await fetch(`${env.VITE_API_URL}/customers?${query.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json() as Promise<CustomerListResponse>;
}

async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`${env.VITE_API_URL}/customers/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch customer");
  return res.json() as Promise<Customer>;
}

async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const res = await fetch(`${env.VITE_API_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to create customer");
  }
  return res.json() as Promise<Customer>;
}

async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const res = await fetch(`${env.VITE_API_URL}/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to update customer");
  }
  return res.json() as Promise<Customer>;
}

async function deleteCustomer(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${env.VITE_API_URL}/customers/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to delete customer");
  }
  return res.json() as Promise<{ deleted: boolean }>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCustomers(params: ListCustomersParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => fetchCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      updateCustomer(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
