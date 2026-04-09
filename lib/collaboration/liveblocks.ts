import type { LiveList, LiveObject } from "@liveblocks/client";

export type Presence = {
  cursor: { lng: number; lat: number } | null;
  viewport: { lng: number; lat: number; zoom: number } | null;
  activeLayerId: string | null;
  selectedFeatureIds: string[];
  color: string;
};

export type RoomEvent =
  | {
      type: "feature-changed";
      action: "create" | "update" | "delete";
      layerId: string;
    }
  | {
      type: "layer-changed";
      action: "create" | "update" | "delete" | "reorder";
    };

export type SpatialComment = {
  id: string;
  lng: number;
  lat: number;
  body: string;
  authorId: string;
  authorName: string;
  resolved: boolean;
  createdAt: number;
};

export type Storage = {
  comments: LiveList<LiveObject<SpatialComment>>;
};

export type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar: string;
    color: string;
  };
};

export type ThreadMetadata = {
  lng: number;
  lat: number;
  resolved: boolean;
};

declare global {
  interface Liveblocks {
    Presence: Presence;
    Storage: Storage;
    UserMeta: UserMeta;
    RoomEvent: RoomEvent;
    ThreadMetadata: ThreadMetadata;
  }
}
