"use client";

import type { StatisticsResult } from "../types";

interface StatisticsDisplayProps {
  stats: StatisticsResult;
}

export function StatisticsDisplay({ stats }: StatisticsDisplayProps) {
  return (
    <div className="space-y-2 rounded border bg-card p-3">
      <h3 className="text-sm font-semibold">Layer Statistics</h3>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Features</span>
          <span className="font-medium">{stats.featureCount}</span>
        </div>
        {stats.totalArea > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Area</span>
            <span className="font-medium">
              {stats.totalArea > 1_000_000
                ? `${(stats.totalArea / 1_000_000).toFixed(2)} km²`
                : `${stats.totalArea.toFixed(0)} m²`}
            </span>
          </div>
        )}
        {stats.totalLength > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Length</span>
            <span className="font-medium">{stats.totalLength.toFixed(2)} km</span>
          </div>
        )}
        {stats.bbox && (
          <div>
            <span className="text-muted-foreground">Bounding Box</span>
            <p className="mt-0.5 font-mono text-xs">
              [{stats.bbox.map((v) => v.toFixed(4)).join(", ")}]
            </p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Geometry Types</span>
          <div className="mt-0.5 space-y-0.5">
            {Object.entries(stats.geometryTypes).map(([type, count]) => (
              <div key={type} className="flex justify-between rounded bg-muted/50 px-1.5 py-0.5">
                <span>{type}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
