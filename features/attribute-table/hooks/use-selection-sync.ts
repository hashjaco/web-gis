"use client";

import { useEditingStore } from "@/features/editing/store";

export function useSelectionSync() {
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const setSelectedFeatures = useEditingStore((s) => s.setSelectedFeatures);

  const selectedIds = new Set(selectedFeatures.map((f) => f.id));

  function isSelected(id: string) {
    return selectedIds.has(id);
  }

  function toggleRow(id: string) {
    if (selectedIds.has(id)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f.id !== id));
    } else {
      setSelectedFeatures([
        ...selectedFeatures,
        {
          id,
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: {},
          layer: "",
          createdAt: "",
          updatedAt: "",
        },
      ]);
    }
  }

  return { isSelected, toggleRow, selectedIds };
}
