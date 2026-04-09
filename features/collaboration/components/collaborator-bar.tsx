"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CollaboratorBarProps {
  onFollowUser?: (connectionId: number | null) => void;
  followingConnectionId?: number | null;
}

export function CollaboratorBar({
  onFollowUser,
  followingConnectionId,
}: CollaboratorBarProps) {
  const self = useSelf();
  const others = useOthers();

  if (others.length === 0) return null;

  return (
    <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 shadow-md backdrop-blur-sm border">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative h-7 w-7 shrink-0 rounded-full border-2 bg-muted"
            style={{ borderColor: self?.info?.color ?? "#888" }}
          >
            {self?.info?.avatar ? (
              <img
                src={self.info.avatar}
                alt={self.info.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-muted-foreground">
                {self?.info?.name?.[0] ?? "?"}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{self?.info?.name} (you)</TooltipContent>
      </Tooltip>

      <div className="mx-1 h-4 w-px bg-border" />

      {others.map((user) => {
        const isFollowing = followingConnectionId === user.connectionId;
        return (
          <Tooltip key={user.connectionId}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() =>
                  onFollowUser?.(isFollowing ? null : user.connectionId)
                }
                className={cn(
                  "relative h-7 w-7 shrink-0 rounded-full border-2 transition-transform hover:scale-110",
                  isFollowing && "ring-2 ring-primary ring-offset-1",
                )}
                style={{ borderColor: user.info?.color ?? "#888" }}
              >
                {user.info?.avatar ? (
                  <img
                    src={user.info.avatar}
                    alt={user.info.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase text-muted-foreground">
                    {user.info?.name?.[0] ?? "?"}
                  </span>
                )}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
                  style={{ backgroundColor: user.info?.color ?? "#4ade80" }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {user.info?.name ?? "Anonymous"}
              {isFollowing ? " (following)" : " — click to follow"}
            </TooltipContent>
          </Tooltip>
        );
      })}

      <span className="ml-1 text-[10px] text-muted-foreground">
        {others.length + 1}
      </span>
    </div>
  );
}
