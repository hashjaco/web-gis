"use client";

import { createStore, get, set, del, keys, values, clear } from "idb-keyval";
import type { LayerConfig } from "@/features/layers/types";

const layerStore = createStore("shimgis-guest-layers", "layers");
const featureStore = createStore("shimgis-guest-features", "features");

export interface GuestFeatureRecord {
  id: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown>;
  layer: string;
  createdAt: string;
  updatedAt: string;
}

// ── Layers ──────────────────────────────────────────────────────────

export async function getGuestLayers(): Promise<LayerConfig[]> {
  const all = await values<LayerConfig>(layerStore);
  return all.sort((a, b) => a.order - b.order);
}

export async function addGuestLayer(layer: LayerConfig): Promise<void> {
  await set(layer.id, layer, layerStore);
}

export async function updateGuestLayer(
  id: string,
  patch: Partial<LayerConfig>,
): Promise<LayerConfig | null> {
  const existing = await get<LayerConfig>(id, layerStore);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await set(id, updated, layerStore);
  return updated;
}

export async function removeGuestLayer(id: string): Promise<void> {
  await del(id, layerStore);
  const featureKeys = await keys<string>(featureStore);
  const toDelete = [];
  for (const key of featureKeys) {
    const f = await get<GuestFeatureRecord>(key, featureStore);
    if (f?.layer === id) toDelete.push(key);
  }
  await Promise.all(toDelete.map((k) => del(k, featureStore)));
}

// ── Features ────────────────────────────────────────────────────────

export async function getGuestFeatures(
  layerId?: string,
): Promise<GuestFeatureRecord[]> {
  const all = await values<GuestFeatureRecord>(featureStore);
  if (!layerId) return all;
  return all.filter((f) => f.layer === layerId);
}

export async function addGuestFeature(
  feature: GuestFeatureRecord,
): Promise<void> {
  await set(feature.id, feature, featureStore);
}

export async function updateGuestFeature(
  id: string,
  patch: { geometry?: GeoJSON.Geometry; properties?: Record<string, unknown> },
): Promise<GuestFeatureRecord | null> {
  const existing = await get<GuestFeatureRecord>(id, featureStore);
  if (!existing) return null;
  const updated: GuestFeatureRecord = {
    ...existing,
    ...(patch.geometry && { geometry: patch.geometry }),
    ...(patch.properties && { properties: patch.properties }),
    updatedAt: new Date().toISOString(),
  };
  await set(id, updated, featureStore);
  return updated;
}

export async function removeGuestFeature(id: string): Promise<void> {
  await del(id, featureStore);
}

// ── Bulk ─────────────────────────────────────────────────────────────

export async function clearGuestData(): Promise<void> {
  await clear(layerStore);
  await clear(featureStore);
}
