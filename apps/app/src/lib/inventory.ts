import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "./env";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  sku: string;
  quantity: number;
  price: string;
  reorderPoint: number | null;
  description: string | null;
  imageUrl: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = "restock" | "sale" | "adjustment" | "return" | "damage" | "loss";

export interface StockMovement {
  id: string;
  productId: string;
  userId: string;
  type: MovementType;
  delta: number;
  notes: string | null;
  reference: string | null;
  createdAt: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
}

export interface CreateCategoryInput {
  name: string;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  price: number;
  description?: string;
  reorderPoint?: number;
  categoryId?: string;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  price?: number;
  description?: string;
  reorderPoint?: number;
  categoryId?: string | null;
  imageUrl?: string | null;
}

export interface CreateMovementInput {
  type: MovementType;
  delta: number;
  notes?: string;
  reference?: string;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/categories`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json() as Promise<Category[]>;
}

async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to create category");
  }
  return res.json() as Promise<Category>;
}

async function updateCategory(id: string, input: CreateCategoryInput): Promise<Category> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to update category");
  }
  return res.json() as Promise<Category>;
}

async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to delete category");
  }
}

async function fetchProducts(params: ListProductsParams): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.lowStock) query.set("lowStock", "true");

  const res = await fetch(`${env.VITE_API_URL}/inventory/products?${query.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json() as Promise<ProductListResponse>;
}

async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/products/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json() as Promise<Product>;
}

async function createProduct(input: CreateProductInput): Promise<Product> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to create product");
  }
  return res.json() as Promise<Product>;
}

async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to update product");
  }
  return res.json() as Promise<Product>;
}

async function deleteProduct(id: string): Promise<Product> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json() as Promise<Product>;
}

async function fetchMovements(productId: string): Promise<StockMovement[]> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/products/${productId}/movements`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch movements");
  return res.json() as Promise<StockMovement[]>;
}

async function createMovement(
  productId: string,
  input: CreateMovementInput,
): Promise<StockMovement> {
  const res = await fetch(`${env.VITE_API_URL}/inventory/products/${productId}/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to record movement");
  }
  return res.json() as Promise<StockMovement>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({ queryKey: ["inventory", "categories"], queryFn: fetchCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory", "categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateCategoryInput }) =>
      updateCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory", "categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory", "categories"] }),
  });
}

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ["inventory", "products", params],
    queryFn: () => fetchProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["inventory", "products", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory", "products"] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      updateProduct(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "products", id] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory", "products"] }),
  });
}

export function useMovements(productId: string) {
  return useQuery({
    queryKey: ["inventory", "movements", productId],
    queryFn: () => fetchMovements(productId),
    enabled: !!productId,
  });
}

export function useCreateMovement(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMovementInput) => createMovement(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "movements", productId] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "products", productId] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
    },
  });
}
