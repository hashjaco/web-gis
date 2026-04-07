"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";
import type { LayerConfig } from "../types";

interface AddLayerFormProps {
  onSubmit: (layer: Partial<LayerConfig>) => Promise<unknown>;
  onCancel: () => void;
}

export function AddLayerForm({ onSubmit, onCancel }: AddLayerFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("vector");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        sourceType,
      });
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create layer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-b p-3">
      <div>
        <label
          htmlFor="layer-name"
          className="mb-0.5 block text-xs font-medium text-muted-foreground"
        >
          Name
        </label>
        <input
          id="layer-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Layer"
          autoFocus
          className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="layer-desc"
          className="mb-0.5 block text-xs font-medium text-muted-foreground"
        >
          Description (optional)
        </label>
        <input
          id="layer-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short description"
          className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="layer-source"
          className="mb-0.5 block text-xs font-medium text-muted-foreground"
        >
          Source type
        </label>
        <select
          id="layer-source"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          className="w-full rounded border bg-background px-2 py-1.5 text-sm"
        >
          <option value="vector">Vector</option>
          <option value="raster">Raster</option>
          <option value="geojson">GeoJSON</option>
        </select>
      </div>

      {error && (
        <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
          Add Layer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-secondary p-1.5 text-secondary-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
