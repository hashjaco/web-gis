import Dexie, { type EntityTable } from "dexie";

interface CachedFeature {
  id: string;
  geometry: unknown;
  properties: Record<string, unknown>;
  layer: string;
  syncStatus: "synced" | "pending_create" | "pending_update" | "pending_delete";
  updatedAt: number;
}

interface CachedTile {
  url: string;
  data: ArrayBuffer;
  cachedAt: number;
}

const offlineDb = new Dexie("gis-web-offline") as Dexie & {
  features: EntityTable<CachedFeature, "id">;
  tiles: EntityTable<CachedTile, "url">;
};

offlineDb.version(1).stores({
  features: "id, layer, syncStatus, updatedAt",
  tiles: "url, cachedAt",
});

export { offlineDb, type CachedFeature, type CachedTile };
