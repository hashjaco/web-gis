"use client";

import { useState } from "react";
import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Eye, Layers, MousePointer2, Pencil, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpatialComments } from "./spatial-comments";

interface CollaborationPanelProps {
  onMapClickForComment?: (lngLat: [number, number]) => void;
}

function UserStatusBadge({ status }: { status: string }) {
  const icon =
    status === "editing" ? (
      <Pencil className="h-2.5 w-2.5" />
    ) : status === "layer" ? (
      <Layers className="h-2.5 w-2.5" />
    ) : (
      <Eye className="h-2.5 w-2.5" />
    );

  return (
    <span className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {icon}
      {status}
    </span>
  );
}

function getUserStatus(presence: {
  selectedFeatureIds: string[];
  activeLayerId: string | null;
}): string {
  if (presence.selectedFeatureIds.length > 0) return "editing";
  if (presence.activeLayerId) return "layer";
  return "viewing";
}

export function CollaborationPanel(_props: CollaborationPanelProps) {
  const self = useSelf();
  const others = useOthers();
  const [tab, setTab] = useState<"users" | "comments">("users");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [pendingLngLat, setPendingLngLat] = useState<[number, number] | null>(
    null,
  );

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Users className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Collaboration</h2>
        <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {others.length + 1} online
        </span>
      </div>

      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium transition-colors",
            tab === "users"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MousePointer2 className="mx-auto mb-0.5 h-3.5 w-3.5" />
          Users
        </button>
        <button
          type="button"
          onClick={() => setTab("comments")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium transition-colors",
            tab === "comments"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="mx-auto mb-0.5 h-3.5 w-3.5" />
          Comments
        </button>
      </div>

      {tab === "users" ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {self && (
            <div className="flex items-center gap-2 rounded-md px-3 py-2">
              <div
                className="h-7 w-7 shrink-0 rounded-full border-2"
                style={{ borderColor: self.info?.color ?? "#888" }}
              >
                {self.info?.avatar ? (
                  <img
                    src={self.info.avatar}
                    alt={self.info.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase">
                    {self.info?.name?.[0] ?? "?"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium">
                  {self.info?.name} (you)
                </p>
              </div>
              <UserStatusBadge
                status={getUserStatus(self.presence)}
              />
            </div>
          )}

          {others.map((user) => (
            <div
              key={user.connectionId}
              className="flex items-center gap-2 rounded-md px-3 py-2"
            >
              <div className="relative">
                <div
                  className="h-7 w-7 shrink-0 rounded-full border-2"
                  style={{ borderColor: user.info?.color ?? "#888" }}
                >
                  {user.info?.avatar ? (
                    <img
                      src={user.info.avatar}
                      alt={user.info.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase">
                      {user.info?.name?.[0] ?? "?"}
                    </span>
                  )}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
                  style={{
                    backgroundColor: user.info?.color ?? "#4ade80",
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium">
                  {user.info?.name ?? "Anonymous"}
                </p>
              </div>
              <UserStatusBadge
                status={getUserStatus(user.presence)}
              />
            </div>
          ))}
        </div>
      ) : (
        <SpatialComments
          isAddingComment={isAddingComment}
          onToggleAddComment={() => setIsAddingComment(!isAddingComment)}
          pendingLngLat={pendingLngLat}
          onClearPending={() => {
            setPendingLngLat(null);
            setIsAddingComment(false);
          }}
        />
      )}
    </div>
  );
}
