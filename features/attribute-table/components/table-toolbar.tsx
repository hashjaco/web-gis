"use client";

import { Download, RefreshCw, Trash2, CheckSquare } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useLayerStore } from "@/features/layers/store";
import type { TableFeature } from "../types";

interface TableToolbarProps {
  data: TableFeature[];
  columns: string[];
  selectedIds?: string[];
  onRefresh: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onExportCsv?: () => void;
}

export function TableToolbar({
  data,
  columns,
  selectedIds = [],
  onRefresh,
  onSelectAll,
  onClearSelection,
  onExportCsv,
}: TableToolbarProps) {
  const queryClient = useQueryClient();

  const batchDelete = useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch("/api/features/batch", { method: "DELETE", body: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      onClearSelection?.();
      useLayerStore.getState().bumpSourceRevision();
    },
  });

  const exportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const header = ["id", ...columns].join(",");
    const rows = data.map((row) =>
      [
        row.id,
        ...columns.map((col) => JSON.stringify(row.properties[col] ?? "")),
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "features.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <span className="flex-1 text-xs text-muted-foreground">
        {data.length} feature{data.length !== 1 ? "s" : ""}
        {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
      </span>

      {selectedIds.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete ${selectedIds.length} features?`)) {
              batchDelete.mutate(selectedIds);
            }
          }}
          disabled={batchDelete.isPending}
          className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
          title="Delete selected"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={selectedIds.length > 0 ? onClearSelection : onSelectAll}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title={selectedIds.length > 0 ? "Clear selection" : "Select all"}
      >
        <CheckSquare className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRefresh}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="Refresh"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="Export CSV"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
