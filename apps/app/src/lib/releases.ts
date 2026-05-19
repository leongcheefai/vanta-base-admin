import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "./env";

export type Release = {
  id: string;
  tag: string;
  name: string;
  body: string | null;
  url: string;
  prerelease: boolean;
  publishedAt: string | null;
  syncedAt: string;
};

async function fetchReleases(): Promise<Release[]> {
  const res = await fetch(`${env.VITE_API_URL}/releases`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch releases");
  return res.json() as Promise<Release[]>;
}

async function syncReleasesRequest(): Promise<{ synced: number }> {
  const res = await fetch(`${env.VITE_API_URL}/releases/sync`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to sync releases");
  return res.json() as Promise<{ synced: number }>;
}

export function useReleases() {
  return useQuery({ queryKey: ["releases"], queryFn: fetchReleases });
}

export function useSyncReleases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncReleasesRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["releases"] }),
  });
}
