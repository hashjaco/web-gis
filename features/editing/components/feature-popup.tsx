"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { GeoFeature } from "../types";

interface FeaturePopupProps {
  feature: GeoFeature;
  onClose: () => void;
  onEdit: (feature: GeoFeature) => void;
}

export function FeaturePopup({ feature, onClose, onEdit }: FeaturePopupProps) {
  const entries = Object.entries(feature.properties).filter(
    ([key]) => !key.startsWith("_"),
  );

  const imageUrl = feature.properties.image_url as string | undefined;

  return (
    <div className="w-72 rounded-lg border bg-background p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Feature Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt="Feature image"
            className="mb-2 max-h-32 w-full rounded border object-contain"
          />
          <ImageSizeControls feature={feature} />
        </>
      )}

      <div className="space-y-1">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No attributes</p>
        ) : (
          entries
            .filter(([key]) => !key.startsWith("image_"))
            .map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">{key}</span>
                <span className="max-w-[60%] truncate">
                  {String(value ?? "")}
                </span>
              </div>
            ))
        )}
      </div>

      <button
        type="button"
        onClick={() => onEdit(feature)}
        className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Edit Attributes
      </button>
    </div>
  );
}

function ImageSizeControls({ feature }: { feature: GeoFeature }) {
  const queryClient = useQueryClient();
  const [width, setWidth] = useState(
    Number(feature.properties.image_width ?? 200),
  );
  const [height, setHeight] = useState(
    Number(feature.properties.image_height ?? 150),
  );
  const [saving, setSaving] = useState(false);

  const featureId =
    feature.id ?? (feature.properties._id as string | undefined) ?? "";

  const handleSave = async () => {
    if (!featureId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/features/${featureId}`, {
        method: "PUT",
        body: {
          properties: {
            ...feature.properties,
            image_width: width,
            image_height: height,
          },
        },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-2 flex items-center gap-2 text-xs">
      <label className="text-muted-foreground">
        W
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          min={20}
          max={2000}
          className="ml-1 w-14 rounded border bg-background px-1 py-0.5 text-xs"
        />
      </label>
      <label className="text-muted-foreground">
        H
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          min={20}
          max={2000}
          className="ml-1 w-14 rounded border bg-background px-1 py-0.5 text-xs"
        />
      </label>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-primary px-2 py-0.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "..." : "Save"}
      </button>
    </div>
  );
}
