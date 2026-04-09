"use client";

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/features/projects/store";
import { getPendingChanges, syncToServer } from "./sync";
import { useOnlineStatus } from "./use-online-status";

async function runSync(
  syncingRef: React.RefObject<boolean>,
  projectId?: string,
) {
  if (syncingRef.current || !navigator.onLine) return;
  const pending = await getPendingChanges();
  if (pending.length === 0) return;

  syncingRef.current = true;
  try {
    await syncToServer(projectId);
  } finally {
    syncingRef.current = false;
  }
}

export function useBackgroundSync() {
  const isOnline = useOnlineStatus();
  const syncingRef = useRef(false);
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  useEffect(() => {
    if (isOnline) {
      runSync(syncingRef, projectIdRef.current);
    }
  }, [isOnline]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) runSync(syncingRef, projectIdRef.current);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return { sync: () => runSync(syncingRef, projectIdRef.current), isOnline };
}
