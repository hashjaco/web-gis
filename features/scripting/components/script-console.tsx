"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Trash2, Terminal } from "lucide-react";
import * as turf from "@turf/turf";
import { apiFetch } from "@/lib/api/client";
import { useProjectStore } from "@/features/projects/store";

const DEFAULT_SCRIPT = `// ShimGIS Scripting Console
// Available APIs:
//   gis.fetchFeatures(layer) - load features from a layer
//   gis.buffer(geojson, distance, units) - buffer features
//   gis.area(feature) - calculate area in m²
//   gis.length(feature) - calculate length in km
//   gis.centroid(feature) - get centroid point
//   gis.union(features) - union polygon features
//   gis.log(value) - print to output

const features = await gis.fetchFeatures("my-layer");
gis.log("Feature count: " + features.features.length);

for (const f of features.features) {
  if (f.geometry.type === "Polygon") {
    const a = gis.area(f);
    gis.log(f.properties?.name + ": " + a.toFixed(0) + " m²");
  }
}
`;

function buildGisApi(projectId?: string) {
  return {
    fetchFeatures: (layer: string) => {
      if (!projectId) return Promise.reject(new Error("No active project"));
      const qp = new URLSearchParams({ layer });
      qp.set("projectId", projectId);
      return apiFetch(`/api/features?${qp}`);
    },
    buffer: (geojson: any, distance: number, units = "kilometers") =>
      turf.buffer(geojson, distance, { units: units as any }),
    area: (feature: any) => turf.area(feature),
    length: (feature: any) => turf.length(feature),
    centroid: (feature: any) => turf.centroid(feature),
    union: (features: any[]) => {
      if (features.length === 0) return null;
      let result = features[0];
      for (let i = 1; i < features.length; i++) {
        const merged = turf.union(turf.featureCollection([result, features[i]]));
        if (!merged) return null;
        result = merged;
      }
      return result;
    },
    bbox: (geojson: any) => turf.bbox(geojson),
    dissolve: (fc: any, prop?: string) =>
      turf.dissolve(fc, { propertyName: prop }),
    simplify: (geojson: any, tolerance: number) =>
      turf.simplify(geojson, { tolerance }),
    log: null as ((msg: string) => void) | null,
  };
}

export function ScriptConsole({ onClose }: { onClose?: () => void }) {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projectId = useProjectStore((s) => s.activeProject?.id);

  const runScript = async () => {
    setRunning(true);
    setError(null);
    const logs: string[] = [];

    const gis = {
      ...buildGisApi(projectId),
      log: (msg: unknown) => logs.push(String(msg)),
    };

    try {
      const asyncFn = new Function(
        "gis",
        `return (async () => { ${script} })()`,
      );
      await asyncFn(gis);
      setOutput(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Script execution failed");
      setOutput(logs);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Terminal className="h-4 w-4" />
        <h2 className="flex-1 text-sm font-semibold">Script Console</h2>
        <button
          type="button"
          onClick={runScript}
          disabled={running}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          <Play className="h-3 w-3" />
          {running ? "Running..." : "Run"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOutput([]);
            setError(null);
          }}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          title="Clear output"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            Close
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={script}
            onChange={(v) => setScript(v ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        </div>

        <div className="flex w-80 flex-col">
          <div className="border-b px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Output</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-black/90 p-3 font-mono text-xs">
            {output.map((line, i) => (
              <div key={i} className="text-green-400">
                {line}
              </div>
            ))}
            {error && <div className="text-red-400">{error}</div>}
            {output.length === 0 && !error && (
              <div className="text-gray-500">Run a script to see output here</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
