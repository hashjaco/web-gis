"use client";

import { useEffect, useRef } from "react";
import { getPendingChanges, syncToServer } from "./sync";
import { useOnlineStatus } from "./use-online-status";

async function runSync(syncingRef: React.RefObject<boolean>) {
  if (syncingRef.current || !navigator.onLine) return;
  const pending = await getPendingChanges();
  if (pending.length === 0) return;

  syncingRef.current = true;
  try {
    await syncToServer();
  } finally {
    syncingRef.current = false;
  }
}

export function useBackgroundSync() {
  const isOnline = useOnlineStatus();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (isOnline) {
      runSync(syncingRef);
    }
  }, [isOnline]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) runSync(syncingRef);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return { sync: () => runSync(syncingRef), isOnline };
}
