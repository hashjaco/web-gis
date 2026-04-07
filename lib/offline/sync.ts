"use client";

import { type CachedFeature, offlineDb } from "./db";

export async function cacheFeatures(
  features: {
    id: string;
    geometry: unknown;
    properties: Record<string, unknown>;
    layer: string;
  }[],
) {
  const records: CachedFeature[] = features.map((f) => ({
    id: f.id,
    geometry: f.geometry,
    properties: f.properties,
    layer: f.layer,
    syncStatus: "synced" as const,
    updatedAt: Date.now(),
  }));
  await offlineDb.features.bulkPut(records);
}

export async function getOfflineFeatures(layer?: string) {
  if (layer) {
    return offlineDb.features.where("layer").equals(layer).toArray();
  }
  return offlineDb.features.toArray();
}

export async function queueOfflineCreate(
  feature: Omit<CachedFeature, "syncStatus" | "updatedAt">,
) {
  await offlineDb.features.put({
    ...feature,
    syncStatus: "pending_create",
    updatedAt: Date.now(),
  });
}

export async function queueOfflineUpdate(
  id: string,
  data: Partial<CachedFeature>,
) {
  const existing = await offlineDb.features.get(id);
  if (existing) {
    await offlineDb.features.update(id, {
      ...data,
      syncStatus:
        existing.syncStatus === "pending_create"
          ? "pending_create"
          : "pending_update",
      updatedAt: Date.now(),
    });
  }
}

export async function queueOfflineDelete(id: string) {
  const existing = await offlineDb.features.get(id);
  if (existing) {
    if (existing.syncStatus === "pending_create") {
      await offlineDb.features.delete(id);
    } else {
      await offlineDb.features.update(id, {
        syncStatus: "pending_delete",
        updatedAt: Date.now(),
      });
    }
  }
}

export async function getPendingChanges() {
  return offlineDb.features
    .where("syncStatus")
    .anyOf(["pending_create", "pending_update", "pending_delete"])
    .toArray();
}

export async function syncToServer() {
  const pending = await getPendingChanges();
  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const item of pending) {
    try {
      switch (item.syncStatus) {
        case "pending_create": {
          const res = await fetch("/api/features", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              geometry: item.geometry,
              properties: item.properties,
              layer: item.layer,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            await offlineDb.features.delete(item.id);
            await offlineDb.features.put({
              ...item,
              id: created.id,
              syncStatus: "synced",
              updatedAt: Date.now(),
            });
            results.push({ id: item.id, success: true });
          } else {
            results.push({
              id: item.id,
              success: false,
              error: `HTTP ${res.status}`,
            });
          }
          break;
        }
        case "pending_update": {
          const res = await fetch(`/api/features/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              geometry: item.geometry,
              properties: item.properties,
            }),
          });
          if (res.ok) {
            await offlineDb.features.update(item.id, {
              syncStatus: "synced",
              updatedAt: Date.now(),
            });
            results.push({ id: item.id, success: true });
          } else {
            results.push({
              id: item.id,
              success: false,
              error: `HTTP ${res.status}`,
            });
          }
          break;
        }
        case "pending_delete": {
          const res = await fetch(`/api/features/${item.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            await offlineDb.features.delete(item.id);
            results.push({ id: item.id, success: true });
          } else {
            results.push({
              id: item.id,
              success: false,
              error: `HTTP ${res.status}`,
            });
          }
          break;
        }
      }
    } catch (err) {
      results.push({
        id: item.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}
