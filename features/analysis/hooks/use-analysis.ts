"use client";

import { useMutation } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";
import { apiFetch } from "@/lib/api/client";
import type { AnalysisParams, AnalysisResult } from "../types";

export function useAnalysis() {
  const mutation = useMutation({
    mutationFn: (params: AnalysisParams) =>
      apiFetch<FeatureCollection>("/api/analysis", {
        method: "POST",
        body: params,
      }),
  });

  function runAnalysis(params: AnalysisParams) {
    return mutation.mutateAsync(params);
  }

  function clearResult() {
    mutation.reset();
  }

  return {
    result: (mutation.data as AnalysisResult) ?? null,
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
    runAnalysis,
    clearResult,
  };
}
