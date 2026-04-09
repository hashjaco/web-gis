"use client";

import { useState } from "react";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { MapPin, MessageCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentThread } from "./comment-thread";
import type { SpatialComment } from "@/lib/collaboration/liveblocks";

interface SpatialCommentsProps {
  isAddingComment: boolean;
  onToggleAddComment: () => void;
  pendingLngLat: [number, number] | null;
  onClearPending: () => void;
}

export function SpatialComments({
  isAddingComment,
  onToggleAddComment,
  pendingLngLat,
  onClearPending,
}: SpatialCommentsProps) {
  const comments = useStorage((root) => root.comments);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );

  const addComment = useMutation(
    ({ storage }, comment: SpatialComment) => {
      storage.get("comments").push(new LiveObject(comment));
    },
    [],
  );

  const resolveComment = useMutation(
    ({ storage }, commentId: string) => {
      const list = storage.get("comments");
      for (let i = 0; i < list.length; i++) {
        const item = list.get(i);
        if (item?.get("id") === commentId) {
          item.set("resolved", !item.get("resolved"));
          break;
        }
      }
    },
    [],
  );

  const deleteComment = useMutation(
    ({ storage }, commentId: string) => {
      const list = storage.get("comments");
      for (let i = 0; i < list.length; i++) {
        if (list.get(i)?.get("id") === commentId) {
          list.delete(i);
          break;
        }
      }
    },
    [],
  );

  const selectedComment =
    selectedCommentId !== null
      ? comments?.find((c) => c.id === selectedCommentId)
      : null;

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <MessageCircle className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Comments</h2>
        <button
          type="button"
          onClick={onToggleAddComment}
          className={cn(
            "ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            isAddingComment
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground hover:bg-accent/80",
          )}
        >
          <Plus className="h-3 w-3" />
          {isAddingComment ? "Click map to place..." : "Add Comment"}
        </button>
      </div>

      {pendingLngLat && (
        <CommentThread
          mode="create"
          lng={pendingLngLat[0]}
          lat={pendingLngLat[1]}
          onSubmit={(body, authorId, authorName) => {
            addComment({
              id: crypto.randomUUID(),
              lng: pendingLngLat[0],
              lat: pendingLngLat[1],
              body,
              authorId,
              authorName,
              resolved: false,
              createdAt: Date.now(),
            });
            onClearPending();
          }}
          onCancel={onClearPending}
        />
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <button
              key={comment.id}
              type="button"
              onClick={() =>
                setSelectedCommentId(
                  selectedCommentId === comment.id ? null : comment.id,
                )
              }
              className={cn(
                "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                comment.resolved && "opacity-50",
                selectedCommentId === comment.id && "bg-accent",
              )}
            >
              <MapPin
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  comment.resolved
                    ? "text-muted-foreground"
                    : "text-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{comment.authorName}</p>
                <p className="truncate text-muted-foreground">{comment.body}</p>
              </div>
            </button>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No comments yet. Click &quot;Add Comment&quot; to pin one on the map.
          </p>
        )}
      </div>

      {selectedComment && (
        <div className="border-t p-3">
          <CommentThread
            mode="view"
            comment={selectedComment}
            onResolve={() => resolveComment(selectedComment.id)}
            onDelete={() => {
              deleteComment(selectedComment.id);
              setSelectedCommentId(null);
            }}
            onClose={() => setSelectedCommentId(null)}
          />
        </div>
      )}
    </>
  );
}
