"use client";

import { useRef, useState } from "react";
import { Popup } from "react-map-gl/maplibre";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import {
  addGuestFeature,
  type GuestFeatureRecord,
} from "@/lib/guest/guest-db";
import { useEditingStore, type DrawStyle } from "../store";
import { useLayerStore } from "@/features/layers/store";
import { useProjectStore } from "@/features/projects/store";

function styleProps(ds: DrawStyle) {
  return {
    stroke_color: ds.strokeColor,
    stroke_width: ds.strokeWidth,
    fill_color: ds.fillColor,
    fill_opacity: ds.fillOpacity / 100,
  };
}

export function AnnotationPlacer() {
  const annotationMode = useEditingStore((s) => s.annotationMode);
  const annotationLngLat = useEditingStore((s) => s.annotationLngLat);
  const setAnnotationLngLat = useEditingStore((s) => s.setAnnotationLngLat);
  const setAnnotationMode = useEditingStore((s) => s.setAnnotationMode);

  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const { isGuest } = useUserPlan();
  const useLocal = isGuest || !projectId;
  const queryClient = useQueryClient();

  if (!annotationMode || !annotationLngLat) return null;

  const targetLayer = activeLayerId ?? "default";

  const handleDone = () => {
    if (useLocal) {
      queryClient.invalidateQueries({ queryKey: ["guest-features"] });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
    useLayerStore.getState().bumpSourceRevision();
    setAnnotationLngLat(null);
    setAnnotationMode(null);
  };

  const handleCancel = () => {
    setAnnotationLngLat(null);
  };

  return (
    <Popup
      longitude={annotationLngLat[0]}
      latitude={annotationLngLat[1]}
      anchor="bottom"
      closeOnClick={false}
      onClose={handleCancel}
      className="annotation-popup"
      maxWidth="320px"
    >
      {annotationMode === "text" ? (
        <TextAnnotationForm
          lngLat={annotationLngLat}
          layer={targetLayer}
          projectId={projectId}
          useLocal={useLocal}
          onDone={handleDone}
          onCancel={handleCancel}
        />
      ) : (
        <ImageAnnotationForm
          lngLat={annotationLngLat}
          layer={targetLayer}
          projectId={projectId}
          useLocal={useLocal}
          onDone={handleDone}
          onCancel={handleCancel}
        />
      )}
    </Popup>
  );
}

function TextAnnotationForm({
  lngLat,
  layer,
  projectId,
  useLocal,
  onDone,
  onCancel,
}: {
  lngLat: [number, number];
  layer: string;
  projectId?: string;
  useLocal: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const drawStyle = useEditingStore((s) => s.drawStyle);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      const properties = { label: text.trim(), ...styleProps(drawStyle) };
      const geometry: GeoJSON.Geometry = { type: "Point", coordinates: lngLat };

      if (useLocal) {
        const now = new Date().toISOString();
        const record: GuestFeatureRecord = {
          id: crypto.randomUUID(),
          geometry,
          properties,
          layer,
          createdAt: now,
          updatedAt: now,
        };
        await addGuestFeature(record);
      } else {
        await apiFetch("/api/features", {
          method: "POST",
          body: { geometry, properties, layer, projectId },
        });
      }
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-1">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text label..."
        autoFocus
        disabled={saving}
        className="rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Place"}
        </button>
      </div>
    </form>
  );
}

function ImageAnnotationForm({
  lngLat,
  layer,
  projectId,
  useLocal,
  onDone,
  onCancel,
}: {
  lngLat: [number, number];
  layer: string;
  projectId?: string;
  useLocal: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const drawStyle = useEditingStore((s) => s.drawStyle);
  const [saving, setSaving] = useState(false);
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(150);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);

    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      setWidth(200);
      setHeight(Math.round(200 / aspect));
    };
    img.src = URL.createObjectURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setSaving(true);
    try {
      let imageUrl: string;

      if (useLocal) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const data = await uploadRes.json();
        imageUrl = data.url;
      }

      const properties = {
        image_url: imageUrl,
        image_width: width,
        image_height: height,
        ...styleProps(drawStyle),
      };
      const geometry: GeoJSON.Geometry = { type: "Point", coordinates: lngLat };

      if (useLocal) {
        const now = new Date().toISOString();
        const record: GuestFeatureRecord = {
          id: crypto.randomUUID(),
          geometry,
          properties,
          layer,
          createdAt: now,
          updatedAt: now,
        };
        await addGuestFeature(record);
      } else {
        await apiFetch("/api/features", {
          method: "POST",
          body: { geometry, properties, layer, projectId },
        });
      }
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-1">
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          className="max-h-32 rounded border object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-24 items-center justify-center rounded border-2 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          Click to select image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {file && (
        <div className="flex items-center gap-2 text-xs">
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
        </div>
      )}

      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !file}
          className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Place"}
        </button>
      </div>
    </form>
  );
}
