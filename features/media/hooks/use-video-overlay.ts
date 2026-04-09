"use client";

import { useRef } from "react";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { useMediaStore } from "../store";

export function useVideoOverlay() {
  const map = useMapInstance();
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const addOverlay = useMediaStore((s) => s.addOverlay);
  const removeOverlay = useMediaStore((s) => s.removeOverlay);

  const addVideoSource = (id: string, url: string, bounds: [number, number, number, number]) => {
      if (!map) return;

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = url;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      videoRefs.current.set(id, video);

      video.addEventListener("loadeddata", () => {
        if (!map.getSource(`video-${id}`)) {
          map.addSource(`video-${id}`, {
            type: "video",
            urls: [url],
            coordinates: [
              [bounds[0], bounds[3]], // top-left
              [bounds[2], bounds[3]], // top-right
              [bounds[2], bounds[1]], // bottom-right
              [bounds[0], bounds[1]], // bottom-left
            ],
          } as any);

          map.addLayer({
            id: `video-layer-${id}`,
            type: "raster",
            source: `video-${id}`,
            paint: { "raster-opacity": 0.85 },
          });
        }
      });

      video.play().catch(() => {});

      addOverlay({
        id,
        url,
        name: url.split("/").pop() ?? "Video",
        bounds,
        opacity: 85,
        isVisible: true,
      });
  };

  const removeVideoSource = (id: string) => {
      if (!map) return;
      try {
        if (map.getLayer(`video-layer-${id}`)) map.removeLayer(`video-layer-${id}`);
        if (map.getSource(`video-${id}`)) map.removeSource(`video-${id}`);
      } catch { /* cleanup */ }

      const video = videoRefs.current.get(id);
      if (video) {
        video.pause();
        video.src = "";
        videoRefs.current.delete(id);
      }

      removeOverlay(id);
  };

  const captureFrame = (overlayId: string): HTMLCanvasElement | null => {
      const video = videoRefs.current.get(overlayId);
      if (!video || video.readyState < 2) return null;

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0);
      return canvas;
  };

  const setOpacity = (id: string, opacity: number) => {
      if (!map) return;
      const layerId = `video-layer-${id}`;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "raster-opacity", opacity / 100);
      }
  };

  return { addVideoSource, removeVideoSource, captureFrame, setOpacity };
}
