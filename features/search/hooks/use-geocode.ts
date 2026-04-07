"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { GeocodeResult } from "../types";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useGeocode() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: results = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.geocode.search(debouncedQuery),
    queryFn: () =>
      apiFetch<GeocodeResult[]>(
        `/api/geocode?q=${encodeURIComponent(debouncedQuery)}`,
      ),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60_000,
  });

  return { query, setQuery, results, loading };
}
