"use client";

import { Download, FileImage, FileJson, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { useExport } from "../hooks/use-export";

interface ExportMenuProps {
  layer?: string;
}

export function ExportMenu({ layer }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const { exportPng, exportGeoJson, exportCsv } = useExport();

  const items = [
    { label: "Export as PNG", icon: FileImage, action: exportPng },
    {
      label: "Export GeoJSON",
      icon: FileJson,
      action: () => exportGeoJson(layer),
    },
    {
      label: "Export CSV",
      icon: FileSpreadsheet,
      action: () => exportCsv(layer),
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-44 rounded-md border bg-background shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            >
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
