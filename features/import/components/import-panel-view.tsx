"use client";

import {
  FileUp,
  FileJson,
  FileSpreadsheet,
  Info,
  Map as MapIcon,
  Loader2,
} from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SUPPORTED_FORMATS = [
  { ext: ".geojson,.json", label: "GeoJSON", icon: FileJson },
  { ext: ".zip,.shp", label: "Shapefile", icon: MapIcon },
  { ext: ".kml", label: "KML", icon: MapIcon },
  { ext: ".gpx", label: "GPX", icon: MapIcon },
  { ext: ".csv", label: "CSV (lat/lng)", icon: FileSpreadsheet },
  { ext: ".fgb", label: "FlatGeobuf", icon: MapIcon },
];

interface ImportPanelViewProps {
  importing: boolean;
  error: string | null;
  progress: number;
  onImport: (file: File, layerName: string) => void;
}

export function ImportPanelView({
  importing,
  error,
  progress,
  onImport,
}: ImportPanelViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [targetLayer, setTargetLayer] = useState("");

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      onImport(file, targetLayer || file.name.replace(/\.[^.]+$/, ""));
      if (fileRef.current) fileRef.current.value = "";
    },
    [onImport, targetLayer],
  );

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <FileUp className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Import Data</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="ml-auto h-3.5 w-3.5 cursor-help text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            Import geospatial data files. A new layer is automatically created
            and features are rendered on the map.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <label
            htmlFor="import-layer"
            className="mb-0.5 block text-xs font-medium text-muted-foreground"
          >
            Target Layer Name
          </label>
          <input
            id="import-layer"
            type="text"
            value={targetLayer}
            onChange={(e) => setTargetLayer(e.target.value)}
            placeholder="Auto from filename"
            className="w-full rounded border bg-background px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Supported Formats
          </p>
          <div className="space-y-1">
            {SUPPORTED_FORMATS.map((fmt) => (
              <div
                key={fmt.ext}
                className="flex items-center gap-2 rounded bg-muted/50 px-2 py-1.5 text-xs"
              >
                <fmt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {fmt.label}
              </div>
            ))}
          </div>
        </div>

        {importing && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Importing... {progress > 0 && `${progress}%`}
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="border-t p-3">
        <input
          ref={fileRef}
          type="file"
          accept={SUPPORTED_FORMATS.map((f) => f.ext).join(",")}
          onChange={handleFileChange}
          className="hidden"
          id="import-file-input"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              <FileUp className="h-3 w-3" />
              Choose File
            </button>
          </TooltipTrigger>
          <TooltipContent>Select a file to import</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
