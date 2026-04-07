"use client";

import { useEffect, useMemo, useState } from "react";
import type { CustomFilterProps } from "ag-grid-react";
import { useGridFilter } from "ag-grid-react";

type SetFilterModel = string[];

export function SetFilter({
  model,
  onModelChange,
  api,
  column,
}: CustomFilterProps<Record<string, unknown>, unknown, SetFilterModel>) {
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);

  useGridFilter({
    doesFilterPass: (params) => {
      if (!model || model.length === 0) return false;
      const colId = column.getColId();
      const v = String(params.data?.[colId] ?? "");
      return model.includes(v);
    },
  });

  useEffect(() => {
    const colId = column.getColId();
    const values = new Set<string>();
    api.forEachNode((node) => {
      const v = node.data?.[colId];
      if (v != null && v !== "") values.add(String(v));
    });
    setUniqueValues(Array.from(values).sort((a, b) => a.localeCompare(b)));
  }, [api, column]);

  const selected = useMemo(
    () => new Set(model ?? uniqueValues),
    [model, uniqueValues],
  );

  const allSelected = model === null || selected.size === uniqueValues.length;

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    if (next.size === 0 || next.size === uniqueValues.length) {
      onModelChange(null);
    } else {
      onModelChange(Array.from(next));
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onModelChange([]);
    } else {
      onModelChange(null);
    }
  };

  return (
    <div className="max-h-48 w-48 overflow-y-auto p-2 text-xs">
      <label className="flex cursor-pointer items-center gap-1.5 border-b pb-1.5 mb-1.5">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
        />
        <span className="font-medium">(Select All)</span>
      </label>
      {uniqueValues.map((value) => (
        <label key={value} className="flex cursor-pointer items-center gap-1.5 py-0.5">
          <input
            type="checkbox"
            checked={selected.has(value)}
            onChange={() => toggle(value)}
          />
          <span>{value}</span>
        </label>
      ))}
    </div>
  );
}
