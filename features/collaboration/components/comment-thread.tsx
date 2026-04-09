"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, MapPin, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpatialComment } from "@/lib/collaboration/liveblocks";

interface CommentThreadCreateProps {
  mode: "create";
  lng: number;
  lat: number;
  onSubmit: (body: string, authorId: string, authorName: string) => void;
  onCancel: () => void;
}

interface CommentThreadViewProps {
  mode: "view";
  comment: SpatialComment;
  onResolve: () => void;
  onDelete: () => void;
  onClose: () => void;
}

type CommentThreadProps = CommentThreadCreateProps | CommentThreadViewProps;

export function CommentThread(props: CommentThreadProps) {
  const { user } = useUser();
  const [body, setBody] = useState("");

  if (props.mode === "create") {
    return (
      <div className="border-b p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {props.lng.toFixed(4)}, {props.lat.toFixed(4)}
        </div>
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full resize-none rounded-md border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="mt-2 flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={props.onCancel}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!body.trim()}
            onClick={() => {
              if (!body.trim() || !user) return;
              const name =
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username ?? "Anonymous";
              props.onSubmit(body.trim(), user.id, name);
              setBody("");
            }}
            className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            Post
          </button>
        </div>
      </div>
    );
  }

  const { comment, onResolve, onDelete, onClose } = props;
  const timeAgo = formatTimeAgo(comment.createdAt);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">{comment.authorName}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-0.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {comment.lng.toFixed(4)}, {comment.lat.toFixed(4)}
      </div>

      <p className="text-xs">{comment.body}</p>

      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={onResolve}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
            comment.resolved
              ? "bg-green-500/10 text-green-600"
              : "bg-accent text-accent-foreground hover:bg-accent/80",
          )}
        >
          <Check className="h-3 w-3" />
          {comment.resolved ? "Resolved" : "Resolve"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
