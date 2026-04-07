"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import * as turf from "@turf/turf";
import type { FeatureCollection, Point } from "geojson";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300",
];

interface AnalyticsDashboardProps {
  data: FeatureCollection;
  title?: string;
}

export function AnalyticsDashboard({ data, title }: AnalyticsDashboardProps) {
  const stats = useMemo(() => computeStats(data), [data]);

  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Features" value={stats.featureCount.toString()} />
        <StatCard label="Types" value={Object.keys(stats.geometryTypes).length.toString()} />
        {stats.totalArea > 0 && (
          <StatCard
            label="Total Area"
            value={
              stats.totalArea > 1_000_000
                ? `${(stats.totalArea / 1_000_000).toFixed(1)} km²`
                : `${stats.totalArea.toFixed(0)} m²`
            }
          />
        )}
        {stats.totalLength > 0 && (
          <StatCard label="Total Length" value={`${stats.totalLength.toFixed(1)} km`} />
        )}
      </div>

      {Object.keys(stats.geometryTypes).length > 1 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Geometry Distribution</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={Object.entries(stats.geometryTypes).map(([name, value]) => ({
                  name,
                  value,
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={50}
                label={({ name, value }) => `${name}: ${value}`}
                fontSize={10}
              >
                {Object.keys(stats.geometryTypes).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.attributeHistogram.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Attribute: {stats.histogramKey}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stats.attributeHistogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.scatterData.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Point Distribution</p>
          <ResponsiveContainer width="100%" height={140}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Lng" tick={{ fontSize: 9 }} />
              <YAxis dataKey="y" name="Lat" tick={{ fontSize: 9 }} />
              <Tooltip />
              <Scatter data={stats.scatterData} fill="#00C49F" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-card px-2 py-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function computeStats(fc: FeatureCollection) {
  const geometryTypes: Record<string, number> = {};
  let totalArea = 0;
  let totalLength = 0;
  const scatterData: { x: number; y: number }[] = [];

  for (const f of fc.features) {
    const type = f.geometry?.type ?? "Unknown";
    geometryTypes[type] = (geometryTypes[type] ?? 0) + 1;
    if (type === "Polygon" || type === "MultiPolygon") totalArea += turf.area(f);
    if (type === "LineString" || type === "MultiLineString") totalLength += turf.length(f);
    if (type === "Point") {
      const [x, y] = (f.geometry as Point).coordinates;
      scatterData.push({ x: +x.toFixed(4), y: +y.toFixed(4) });
    }
  }

  let histogramKey = "";
  let attributeHistogram: { name: string; count: number }[] = [];

  const sampleProps = fc.features[0]?.properties ?? {};
  const stringKey = Object.keys(sampleProps).find(
    (k) => typeof sampleProps[k] === "string" && !k.startsWith("_"),
  );
  if (stringKey) {
    histogramKey = stringKey;
    const counts: Record<string, number> = {};
    for (const f of fc.features) {
      const val = String(f.properties?.[stringKey] ?? "");
      if (val) counts[val] = (counts[val] ?? 0) + 1;
    }
    attributeHistogram = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  return {
    featureCount: fc.features.length,
    geometryTypes,
    totalArea,
    totalLength,
    scatterData: scatterData.slice(0, 500),
    histogramKey,
    attributeHistogram,
  };
}
