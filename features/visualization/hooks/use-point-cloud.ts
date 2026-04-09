"use client";

import { useState } from "react";
import type { Layer } from "@deck.gl/core";
import { PointCloudLayer } from "@deck.gl/layers";

interface PointCloudData {
  positions: Float32Array;
  colors: Uint8Array;
  count: number;
  bounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  };
}

export function usePointCloud() {
  const [data, setData] = useState<PointCloudData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointSize, setPointSize] = useState(2);

  const loadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const { parse } = await import("@loaders.gl/core");
      const { LASLoader } = await import("@loaders.gl/las");
      const buffer = await file.arrayBuffer();
      const result = await parse(buffer, LASLoader);

      const header = result.header ?? {};
      const positions = result.attributes?.POSITION?.value;
      const colors = result.attributes?.COLOR_0?.value;

      if (!positions) throw new Error("No position data found in file");

      const count = positions.length / 3;
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      for (let i = 0; i < count; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }

      const fallbackColors = new Uint8Array(count * 4);
      for (let i = 0; i < count; i++) {
        const t = (positions[i * 3 + 2] - minZ) / (maxZ - minZ || 1);
        fallbackColors[i * 4] = Math.round(30 + t * 200);
        fallbackColors[i * 4 + 1] = Math.round(120 + t * 100);
        fallbackColors[i * 4 + 2] = Math.round(200 - t * 100);
        fallbackColors[i * 4 + 3] = 255;
      }

      setData({
        positions: positions instanceof Float32Array ? positions : new Float32Array(positions),
        colors: colors instanceof Uint8Array ? colors : fallbackColors,
        count,
        bounds: { minX, maxX, minY, maxY, minZ, maxZ },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load point cloud");
    } finally {
      setLoading(false);
    }
  };

  const layer: Layer | null = (() => {
    if (!data) return null;

    const pointData = Array.from({ length: data.count }, (_, i) => ({
      position: [
        data.positions[i * 3],
        data.positions[i * 3 + 1],
        data.positions[i * 3 + 2],
      ] as [number, number, number],
      color: [
        data.colors[i * 4],
        data.colors[i * 4 + 1],
        data.colors[i * 4 + 2],
        data.colors[i * 4 + 3] ?? 255,
      ] as [number, number, number, number],
    }));

    return new PointCloudLayer({
      id: "lidar-point-cloud",
      data: pointData,
      getPosition: (d: { position: [number, number, number] }) => d.position,
      getColor: (d: { color: [number, number, number, number] }) => d.color,
      pointSize,
      coordinateSystem: 2,
      pickable: true,
    });
  })();

  const clear = () => {
    setData(null);
    setError(null);
  };

  return {
    data,
    loading,
    error,
    pointSize,
    setPointSize,
    loadFile,
    clear,
    layer,
  };
}
