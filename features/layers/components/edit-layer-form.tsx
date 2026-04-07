"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import type { LayerConfig } from "../types";

interface EditLayerFormProps {
  layer: LayerConfig;
  onSave: (id: string, data: Partial<LayerConfig>) => Promise<unknown>;
  onCancel: () => void;
}

export function EditLayerForm({ layer, onSave, onCancel }: EditLayerFormProps) {
  const style = (layer.style ?? {}) as Record<string, unknown>;
  const paint = (style.paint ?? {}) as Record<string, unknown>;
  const currentColor = (paint["fill-color"] as string) ?? "#088";

  const [name, setName] = useState(layer.name);
  const [color, setColor] = useState(currentColor);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave(layer.id, {
        name: name.trim(),
        style: {
          ...style,
          paint: { ...paint, "fill-color": color },
        },
      });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border bg-card p-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="flex-1 rounded border bg-background px-2 py-1 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          title="Save"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
