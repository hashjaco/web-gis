"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useExport } from "../hooks/use-export";
import type { PrintOptions } from "../types";

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PrintDialog({ open, onClose }: PrintDialogProps) {
  const [options, setOptions] = useState<PrintOptions>({
    title: "Map Print",
    paperSize: "a4",
    orientation: "landscape",
    includeLegend: true,
    dpi: 150,
  });
  const { exportPng } = useExport();

  if (!open) return null;

  const handlePrint = () => {
    exportPng();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-lg border bg-background p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Print Map</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="print-title"
              className="mb-0.5 block text-xs font-medium text-muted-foreground"
            >
              Title
            </label>
            <input
              id="print-title"
              type="text"
              value={options.title}
              onChange={(e) =>
                setOptions({ ...options, title: e.target.value })
              }
              className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="paper-size"
                className="mb-0.5 block text-xs font-medium text-muted-foreground"
              >
                Paper Size
              </label>
              <select
                id="paper-size"
                value={options.paperSize}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    paperSize: e.target.value as PrintOptions["paperSize"],
                  })
                }
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="orientation"
                className="mb-0.5 block text-xs font-medium text-muted-foreground"
              >
                Orientation
              </label>
              <select
                id="orientation"
                value={options.orientation}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    orientation: e.target.value as PrintOptions["orientation"],
                  })
                }
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-legend"
              checked={options.includeLegend}
              onChange={(e) =>
                setOptions({ ...options, includeLegend: e.target.checked })
              }
            />
            <label
              htmlFor="include-legend"
              className="text-xs text-muted-foreground"
            >
              Include legend
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
