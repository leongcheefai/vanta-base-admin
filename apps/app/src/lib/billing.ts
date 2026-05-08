import { useQuery } from "@tanstack/react-query";
import { env } from "./env";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
}

export interface BillingConfig {
  proMonthlyPriceId: string | null;
  proYearlyPriceId: string | null;
}

export interface Invoice {
  id: string;
  number: string | null;
  amountPaid: number;
  currency: string;
  status: string | null;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

export async function fetchSubscription(): Promise<SubscriptionResponse> {
  const res = await fetch(`${env.VITE_API_URL}/billing/subscription`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch subscription");
  return res.json();
}

export function useSubscription() {
  const query = useQuery({ queryKey: ["subscription"], queryFn: fetchSubscription });
  const subscription = query.data?.subscription ?? null;
  const isPro = !!subscription && ["active", "trialing"].includes(subscription.status);
  return { ...query, subscription, isPro };
}

export async function fetchBillingConfig(): Promise<BillingConfig> {
  const res = await fetch(`${env.VITE_API_URL}/billing/config`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch billing config");
  return res.json();
}

export function useBillingConfig() {
  return useQuery({ queryKey: ["billing", "config"], queryFn: fetchBillingConfig });
}

export async function fetchInvoices(): Promise<InvoicesResponse> {
  const res = await fetch(`${env.VITE_API_URL}/billing/invoices`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export function useInvoices() {
  return useQuery({ queryKey: ["billing", "invoices"], queryFn: fetchInvoices });
}

export function planLabel(
  stripePriceId: string | null | undefined,
  config: BillingConfig | undefined,
): string {
  if (!stripePriceId) return "Free";
  if (config?.proMonthlyPriceId && stripePriceId === config.proMonthlyPriceId)
    return "Pro (Monthly)";
  if (config?.proYearlyPriceId && stripePriceId === config.proYearlyPriceId) return "Pro (Yearly)";
  return "Pro";
}
