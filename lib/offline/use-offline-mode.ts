"use client";

import { useState, useCallback, useEffect } from "react";
import { syncToServer, getPendingChanges } from "./sync";

export function useOfflineMode() {
  const [isOffline, setIsOffline] = useState(false);
  const [forcedOffline, setForcedOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  useEffect(() => {
    const updateOnline = () => setIsOffline(!navigator.onLine || forcedOffline);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    updateOnline();
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [forcedOffline]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const pending = await getPendingChanges();
      setPendingCount(pending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleForcedOffline = useCallback(() => {
    setForcedOffline((prev) => !prev);
  }, []);

  const syncNow = useCallback(async () => {
    if (forcedOffline) return;
    setSyncing(true);
    setSyncErrors([]);
    try {
      const results = await syncToServer();
      const errors = results
        .filter((r) => !r.success)
        .map((r) => `${r.id}: ${r.error}`);
      setSyncErrors(errors);
      setLastSyncTime(new Date());
      const pending = await getPendingChanges();
      setPendingCount(pending.length);
    } catch (err) {
      setSyncErrors([err instanceof Error ? err.message : "Sync failed"]);
    } finally {
      setSyncing(false);
    }
  }, [forcedOffline]);

  const preCacheExtent = useCallback(
    async (bbox: [number, number, number, number], zoom: number) => {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      const minZ = Math.max(0, zoom - 2);
      const maxZ = Math.min(18, zoom + 2);
      let tileCount = 0;

      const MARTIN_URL =
        process.env.NEXT_PUBLIC_MARTIN_URL || "http://localhost:3030";

      for (let z = minZ; z <= maxZ; z++) {
        const n = Math.pow(2, z);
        const xMin = Math.floor(((minLng + 180) / 360) * n);
        const xMax = Math.floor(((maxLng + 180) / 360) * n);
        const yMin = Math.floor(
          ((1 -
            Math.log(
              Math.tan((maxLat * Math.PI) / 180) +
                1 / Math.cos((maxLat * Math.PI) / 180),
            ) /
              Math.PI) /
            2) *
            n,
        );
        const yMax = Math.floor(
          ((1 -
            Math.log(
              Math.tan((minLat * Math.PI) / 180) +
                1 / Math.cos((minLat * Math.PI) / 180),
            ) /
              Math.PI) /
            2) *
            n,
        );

        for (let x = xMin; x <= xMax; x++) {
          for (let y = yMin; y <= yMax; y++) {
            tileCount++;
          }
        }
      }

      return tileCount;
    },
    [],
  );

  return {
    isOffline: isOffline || forcedOffline,
    forcedOffline,
    pendingCount,
    syncing,
    lastSyncTime,
    syncErrors,
    toggleForcedOffline,
    syncNow,
    preCacheExtent,
  };
}
