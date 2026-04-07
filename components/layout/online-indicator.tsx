"use client";

import { Cloud, CloudOff, RefreshCw, WifiOff } from "lucide-react";
import { useOfflineMode } from "@/lib/offline/use-offline-mode";

export function OnlineIndicator() {
  const {
    isOffline,
    forcedOffline,
    pendingCount,
    syncing,
    toggleForcedOffline,
    syncNow,
  } = useOfflineMode();

  return (
    <div className="flex items-center gap-1.5">
      {isOffline ? (
        <>
          <CloudOff className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs text-orange-600">
            Offline{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </span>
        </>
      ) : (
        <>
          <Cloud className="h-3.5 w-3.5 text-green-500" />
          <span className="text-xs text-green-600">
            Online{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </span>
        </>
      )}

      {pendingCount > 0 && !isOffline && (
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          title="Sync now"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
        </button>
      )}

      <button
        type="button"
        onClick={toggleForcedOffline}
        className={`rounded p-0.5 ${forcedOffline ? "text-orange-500" : "text-muted-foreground"} hover:text-foreground`}
        title={forcedOffline ? "Go online" : "Force offline mode"}
      >
        <WifiOff className="h-3 w-3" />
      </button>
    </div>
  );
}
