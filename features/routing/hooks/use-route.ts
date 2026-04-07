"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { RouteResult, RoutingProfile } from "../types";

export function useRoute() {
  const mutation = useMutation({
    mutationFn: async ({
      start,
      end,
      profile,
    }: {
      start: [number, number];
      end: [number, number];
      profile: RoutingProfile;
    }) => {
      const params = new URLSearchParams({
        start: start.join(","),
        end: end.join(","),
        profile,
      });
      return apiFetch<RouteResult>(`/api/route?${params}`);
    },
  });

  function calculateRoute(
    start: [number, number],
    end: [number, number],
    profile: RoutingProfile = "car",
  ) {
    return mutation.mutateAsync({ start, end, profile });
  }

  function clearRoute() {
    mutation.reset();
  }

  return {
    route: mutation.data ?? null,
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
    calculateRoute,
    clearRoute,
  };
}
