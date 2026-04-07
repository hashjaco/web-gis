"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useFeatures } from "../hooks/use-features";
import type { GeoFeature } from "../types";

interface AttributeFormProps {
  feature: GeoFeature;
  onClose: () => void;
  onSaved: () => void;
}

export function AttributeForm({
  feature,
  onClose,
  onSaved,
}: AttributeFormProps) {
  const [properties, setProperties] = useState<Record<string, unknown>>({
    ...feature.properties,
  });
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const { updateFeature } = useFeatures();

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = Object.fromEntries(
        Object.entries(properties).filter(([key]) => !key.startsWith("_")),
      );
      await updateFeature(feature.id, { properties: clean });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = () => {
    if (newKey.trim()) {
      setProperties((prev) => ({ ...prev, [newKey.trim()]: "" }));
      setNewKey("");
    }
  };

  const editableEntries = Object.entries(properties).filter(
    ([key]) => !key.startsWith("_"),
  );

  return (
    <div className="w-80 rounded-lg border bg-background p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edit Attributes</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {editableEntries.map(([key, value]) => (
          <div key={key}>
            <label
              htmlFor={`attr-${key}`}
              className="mb-0.5 block text-xs font-medium text-muted-foreground"
            >
              {key}
            </label>
            <input
              id={`attr-${key}`}
              type="text"
              value={String(value ?? "")}
              onChange={(e) =>
                setProperties((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className="w-full rounded-md border bg-background px-2 py-1 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="New field name"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddField()}
          className="flex-1 rounded-md border bg-background px-2 py-1 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddField}
          className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
        >
          Add
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
