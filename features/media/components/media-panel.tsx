"use client";

import {
  Camera,
  Download,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Play,
  ScanSearch,
  Trash2,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMapStore } from "@/features/map/store";
import { useMediaStore } from "../store";
import { useVideoOverlay } from "../hooks/use-video-overlay";
import { useObjectDetection } from "../hooks/use-object-detection";
import type { Detection } from "../types";

function SectionHeader({
  title,
  tooltip,
}: {
  title: string;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 cursor-help text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-56">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function VideoOverlaySection() {
  const [url, setUrl] = useState("");
  const viewState = useMapStore((s) => s.viewState);
  const overlays = useMediaStore((s) => s.overlays);
  const updateOverlay = useMediaStore((s) => s.updateOverlay);
  const { addVideoSource, removeVideoSource, setOpacity } = useVideoOverlay();

  const handleAdd = () => {
    if (!url.trim()) return;
    const id = `vid-${Date.now()}`;
    const span = 0.01;
    const bounds: [number, number, number, number] = [
      viewState.longitude - span,
      viewState.latitude - span,
      viewState.longitude + span,
      viewState.latitude + span,
    ];
    addVideoSource(id, url.trim(), bounds);
    setUrl("");
  };

  return (
    <div className="space-y-2">
      <SectionHeader
        title="Live Video Overlay"
        tooltip="Overlay a video stream (HLS/MP4/MJPEG) on the map at the current viewport center"
      />
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Video URL (HLS/MP4)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded border bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!url.trim()}
          className="shrink-0 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
        >
          <Play className="h-3 w-3" />
        </button>
      </div>

      {overlays.length > 0 && (
        <div className="space-y-1.5">
          {overlays.map((overlay) => (
            <div key={overlay.id} className="rounded border p-2">
              <div className="flex items-center justify-between gap-1">
                <p className="min-w-0 flex-1 truncate text-xs font-medium">
                  {overlay.name}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    updateOverlay(overlay.id, { isVisible: !overlay.isVisible });
                  }}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  {overlay.isVisible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeVideoSource(overlay.id)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={overlay.opacity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateOverlay(overlay.id, { opacity: val });
                  setOpacity(overlay.id, val);
                }}
                className="mt-1 w-full"
              />
              <p className="text-right text-[10px] text-muted-foreground">
                {overlay.opacity}%
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FrameAnnotationSection() {
  const annotations = useMediaStore((s) => s.annotations);
  const addAnnotation = useMediaStore((s) => s.addAnnotation);
  const removeAnnotation = useMediaStore((s) => s.removeAnnotation);
  const clearAnnotations = useMediaStore((s) => s.clearAnnotations);
  const [label, setLabel] = useState("");

  const handleAdd = () => {
    if (!label.trim()) return;
    addAnnotation({
      id: `ann-${Date.now()}`,
      label: label.trim(),
      bbox: [0, 0, 100, 100],
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      timestamp: Date.now(),
    });
    setLabel("");
  };

  return (
    <div className="space-y-2">
      <SectionHeader
        title="Frame Annotation"
        tooltip="Pause video, capture a frame, then annotate objects with bounding box labels"
      />
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Annotation label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 rounded border bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!label.trim()}
          className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {annotations.length > 0 && (
        <div className="space-y-1">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: ann.color }}
                />
                <span>{ann.label}</span>
              </div>
              <button
                type="button"
                onClick={() => removeAnnotation(ann.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={clearAnnotations}
            className="w-full rounded bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

function ObjectDetectionSection() {
  const modelLoaded = useMediaStore((s) => s.modelLoaded);
  const modelLoading = useMediaStore((s) => s.modelLoading);
  const overlays = useMediaStore((s) => s.overlays);
  const { loadModel, detect } = useObjectDetection();
  const { captureFrame } = useVideoOverlay();
  const [detecting, setDetecting] = useState(false);
  const [lastResults, setLastResults] = useState<Detection[]>([]);
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);

  const handleDetect = async () => {
    if (overlays.length === 0) return;
    const overlay = overlays[0];
    const frame = captureFrame(overlay.id);
    if (!frame) return;

    setDetecting(true);
    try {
      const center: [number, number] = [
        (overlay.bounds[0] + overlay.bounds[2]) / 2,
        (overlay.bounds[1] + overlay.bounds[3]) / 2,
      ];
      const results = await detect(frame, center);
      setLastResults(results);

      const preview = canvasPreviewRef.current;
      if (preview) {
        preview.width = frame.width;
        preview.height = frame.height;
        const ctx = preview.getContext("2d");
        if (ctx) {
          ctx.drawImage(frame, 0, 0);
          for (const det of results) {
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.strokeRect(...det.bbox);
            ctx.fillStyle = "#00ff00";
            ctx.font = "12px sans-serif";
            ctx.fillText(
              `${det.className} ${(det.confidence * 100).toFixed(0)}%`,
              det.bbox[0],
              det.bbox[1] - 4,
            );
          }
        }
      }
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-2">
      <SectionHeader
        title="Object Detection"
        tooltip="Run YOLO object detection on captured video frames. Detects 80 COCO classes including people, vehicles, and animals."
      />
      {!modelLoaded ? (
        <button
          type="button"
          onClick={loadModel}
          disabled={modelLoading}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50"
        >
          {modelLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ScanSearch className="h-3 w-3" />
          )}
          {modelLoading ? "Loading YOLO..." : "Load Detection Model"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
            YOLO model ready
          </p>
          <button
            type="button"
            onClick={handleDetect}
            disabled={detecting || overlays.length === 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
          >
            {detecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Camera className="h-3 w-3" />
            )}
            {detecting ? "Detecting..." : "Capture & Detect"}
          </button>
        </div>
      )}

      <canvas
        ref={canvasPreviewRef}
        className={cn("w-full rounded border", lastResults.length === 0 && "hidden")}
        style={{ maxHeight: 150 }}
      />

      {lastResults.length > 0 && (
        <div className="space-y-0.5 text-xs">
          <p className="font-medium text-muted-foreground">
            {lastResults.length} detection{lastResults.length !== 1 && "s"}
          </p>
          {lastResults.slice(0, 10).map((det) => (
            <div key={det.id} className="flex justify-between rounded bg-muted/50 px-2 py-0.5">
              <span>{det.className}</span>
              <span className="font-mono">{(det.confidence * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetectionLogSection() {
  const detections = useMediaStore((s) => s.detections);
  const clearDetections = useMediaStore((s) => s.clearDetections);

  const exportCsv = () => {
    const header = "timestamp,class,confidence,bbox_x,bbox_y,bbox_w,bbox_h,longitude,latitude\n";
    const rows = detections
      .map((d) => {
        const ts = d.timestamp instanceof Date ? d.timestamp.toISOString() : new Date(d.timestamp).toISOString();
        return `${ts},${d.className},${d.confidence.toFixed(4)},${d.bbox.join(",")},${d.location ? d.location.join(",") : ","}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `detections-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-2">
      <SectionHeader
        title="Detection Log"
        tooltip="View a log of all detections with timestamps and locations. Export as CSV for further analysis."
      />
      {detections.length === 0 ? (
        <p className="text-xs text-muted-foreground">No detections recorded yet.</p>
      ) : (
        <>
          <div className="max-h-32 space-y-0.5 overflow-y-auto">
            {detections
              .slice(-20)
              .reverse()
              .map((det) => (
                <div
                  key={det.id}
                  className="flex items-center justify-between rounded bg-muted/50 px-2 py-0.5 text-[10px]"
                >
                  <span className="font-medium">{det.className}</span>
                  <span className="font-mono text-muted-foreground">
                    {(det.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground">
                    {det.timestamp instanceof Date
                      ? det.timestamp.toLocaleTimeString()
                      : new Date(det.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={exportCsv}
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={clearDetections}
              className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function MediaPanel() {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Video className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Media</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="ml-auto h-3.5 w-3.5 cursor-help text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            Overlay live video on the map, annotate frames, and run real-time object detection
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <VideoOverlaySection />
        <div className="border-t" />
        <FrameAnnotationSection />
        <div className="border-t" />
        <ObjectDetectionSection />
        <div className="border-t" />
        <DetectionLogSection />
      </div>
    </div>
  );
}
