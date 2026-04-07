"use client";

import type { AnalysisResult } from "../types";

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="space-y-2 rounded border bg-card p-3">
      <h3 className="text-sm font-semibold">Analysis Results</h3>
      <p className="text-xs text-muted-foreground">
        {result.features.length} feature
        {result.features.length !== 1 ? "s" : ""} returned
      </p>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {result.features.map((feature, idx) => (
          <div
            key={`${feature.id ?? "f"}-${idx}`}
            className="rounded bg-muted/50 px-2 py-1 text-xs"
          >
            <span className="font-medium">
              {feature.geometry?.type ?? "Unknown"}
            </span>
            {feature.properties &&
              Object.keys(feature.properties).length > 0 && (
                <span className="ml-2 text-muted-foreground">
                  {Object.entries(feature.properties)
                    .filter(([k]) => !k.startsWith("_"))
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </span>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
