"use client";

import { useMutation } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";
import { apiFetch } from "@/lib/api/client";
import { useProjectStore } from "@/features/projects/store";
import type { AnalysisParams, AnalysisResult } from "../types";

export function useAnalysis() {
  const projectId = useProjectStore((s) => s.activeProject?.id);

  const mutation = useMutation({
    mutationFn: (params: AnalysisParams) =>
      apiFetch<FeatureCollection>("/api/analysis", {
        method: "POST",
        body: { ...params, projectId },
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
