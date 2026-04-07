"use client";

import { useState, useCallback, useRef } from "react";

export interface SpectralResult {
  canvas: HTMLCanvasElement;
  min: number;
  max: number;
  mean: number;
  width: number;
  height: number;
}

export type BandIndex = "ndvi" | "ndwi" | "ndbi" | "custom";

const BAND_FORMULAS: Record<string, string> = {
  ndvi: "(B8 - B4) / (B8 + B4)",
  ndwi: "(B3 - B8) / (B3 + B8)",
  ndbi: "(B11 - B8) / (B11 + B8)",
};

export function useSpectralAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpectralResult | null>(null);

  const computeIndex = useCallback(
    async (
      cogUrl: string,
      index: BandIndex,
      customFormula?: string,
      bbox?: [number, number, number, number],
    ) => {
      setLoading(true);
      setError(null);
      try {
        const { fromUrl } = await import("geotiff");
        const tiff = await fromUrl(cogUrl);
        const image = await tiff.getImage();

        const width = Math.min(image.getWidth(), 512);
        const height = Math.min(image.getHeight(), 512);

        const rasters = await image.readRasters({
          window: [0, 0, width, height],
        });

        const bandCount = rasters.length;
        if (bandCount < 4) {
          throw new Error(`Need at least 4 bands, got ${bandCount}`);
        }

        const band3 = rasters[2] as Float32Array | Uint16Array;
        const band4 = rasters[3] as Float32Array | Uint16Array;
        const band8 = bandCount >= 8
          ? (rasters[7] as Float32Array | Uint16Array)
          : (rasters[3] as Float32Array | Uint16Array);

        const pixels = width * height;
        const values = new Float32Array(pixels);
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;

        for (let i = 0; i < pixels; i++) {
          let val: number;
          const formula = index === "custom" ? customFormula : BAND_FORMULAS[index];
          if (!formula) throw new Error("No formula specified");

          const b3 = Number(band3[i]);
          const b4 = Number(band4[i]);
          const b8 = Number(band8[i]);
          const denom =
            index === "ndvi" ? b8 + b4 :
            index === "ndwi" ? b3 + b8 :
            b8 + b4;

          if (denom === 0) {
            val = 0;
          } else {
            val =
              index === "ndvi" ? (b8 - b4) / denom :
              index === "ndwi" ? (b3 - b8) / denom :
              (b8 - b4) / denom;
          }

          values[i] = val;
          if (val < min) min = val;
          if (val > max) max = val;
          sum += val;
        }

        const mean = sum / pixels;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const imgData = ctx.createImageData(width, height);

        for (let i = 0; i < pixels; i++) {
          const normalized = (values[i] - min) / (max - min || 1);
          const [r, g, b] = ndviColormap(normalized);
          imgData.data[i * 4] = r;
          imgData.data[i * 4 + 1] = g;
          imgData.data[i * 4 + 2] = b;
          imgData.data[i * 4 + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);
        setResult({ canvas, min, max, mean, width, height });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Spectral analysis failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const inspectPixel = useCallback(
    async (cogUrl: string, x: number, y: number) => {
      try {
        const { fromUrl } = await import("geotiff");
        const tiff = await fromUrl(cogUrl);
        const image = await tiff.getImage();
        const rasters = await image.readRasters({
          window: [x, y, x + 1, y + 1],
        });
        return Array.from({ length: rasters.length }, (_, i) =>
          Number((rasters[i] as Float32Array | Uint16Array)[0]),
        );
      } catch {
        return null;
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, computeIndex, inspectPixel, clear };
}

function ndviColormap(t: number): [number, number, number] {
  if (t < 0.2) return [165, 0, 38];
  if (t < 0.3) return [215, 48, 39];
  if (t < 0.4) return [244, 109, 67];
  if (t < 0.5) return [253, 174, 97];
  if (t < 0.6) return [254, 224, 139];
  if (t < 0.7) return [217, 239, 139];
  if (t < 0.8) return [166, 217, 106];
  if (t < 0.9) return [102, 189, 99];
  return [26, 152, 80];
}
