"use client";

import { useOthers } from "@liveblocks/react/suspense";
import { X } from "lucide-react";

interface FollowModeBannerProps {
  followingConnectionId: number | null;
  onStop: () => void;
}

export function FollowModeBanner({
  followingConnectionId,
  onStop,
}: FollowModeBannerProps) {
  const others = useOthers();

  if (followingConnectionId === null) return null;

  const target = others.find(
    (u) => u.connectionId === followingConnectionId,
  );
  if (!target) return null;

  const color = target.info?.color ?? "#64B5F6";

  return (
    <div
      className="absolute inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white shadow-lg"
      style={{ backgroundColor: color }}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      Following {target.info?.name ?? "Anonymous"}
      <button
        type="button"
        onClick={onStop}
        className="ml-1 rounded-full p-0.5 transition-colors hover:bg-white/20"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
