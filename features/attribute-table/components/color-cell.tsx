"use client";

import type { CustomCellRendererProps } from "ag-grid-react";

export function ColorCell(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-4 rounded-sm border"
        style={{ backgroundColor: value }}
      />
      <span>{value}</span>
    </span>
  );
}
