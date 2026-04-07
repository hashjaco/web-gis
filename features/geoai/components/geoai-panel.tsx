"use client";

import { Brain, Info, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useImageClassifier } from "../hooks/use-image-classifier";
import { MODEL_REGISTRY } from "../models";

const ACCURACY_COLORS: Record<string, string> = {
  standard: "bg-yellow-500",
  high: "bg-blue-500",
  highest: "bg-green-500",
};

export function GeoAIPanel() {
  const classifier = useImageClassifier();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("mobilenet-v1");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      setPreview(canvas.toDataURL());
      if (classifier.modelReady) {
        await classifier.classifyImage(img);
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const selectedModel = MODEL_REGISTRY.find((m) => m.id === selectedModelId);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Brain className="h-4 w-4" />
        <h2 className="text-sm font-semibold">GeoAI</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="ml-auto h-3.5 w-3.5 cursor-help text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            Classify satellite or aerial imagery using ML models running locally in your browser
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground">Select Model</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-56">
                Choose a model based on your accuracy and performance needs. Larger models are more accurate but slower to load.
              </TooltipContent>
            </Tooltip>
          </div>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm"
          >
            {MODEL_REGISTRY.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {selectedModel && (
            <div className="rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
              <p>{selectedModel.description}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", ACCURACY_COLORS[selectedModel.accuracy])} />
                  {selectedModel.accuracy} accuracy
                </span>
                <span>&middot;</span>
                <span>{selectedModel.sizeLabel}</span>
                <span>&middot;</span>
                <span className="uppercase">{selectedModel.runtime}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Model Status</p>
          {!classifier.modelReady || classifier.activeModelId !== selectedModelId ? (
            <button
              type="button"
              onClick={() => classifier.loadModel(selectedModelId)}
              disabled={classifier.loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50"
            >
              {classifier.loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Brain className="h-3 w-3" />
              )}
              {classifier.loading ? "Loading Model..." : "Load ML Model"}
            </button>
          ) : (
            <p className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
              {selectedModel?.name ?? "Model"} ready for classification
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground">Image Classification</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-56">
                Upload an image to classify objects using the selected ImageNet model. Results show top-5 predictions.
              </TooltipContent>
            </Tooltip>
          </div>
          <label
            htmlFor="geoai-upload"
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-3 py-4 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
              !classifier.modelReady && "cursor-not-allowed opacity-50",
            )}
          >
            <Upload className="h-4 w-4" />
            Drop or click to upload image
            <input
              id="geoai-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!classifier.modelReady}
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {preview && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
            <img
              src={preview}
              alt="Classification input"
              className="w-full rounded border object-cover"
              style={{ maxHeight: 150 }}
            />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {classifier.loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running inference...
          </div>
        )}

        {classifier.error && (
          <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {classifier.error}
          </p>
        )}

        {classifier.results.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Classification Results</p>
            {classifier.results.map((r) => (
              <div key={r.label} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span>{r.label}</span>
                  <span className="font-medium">{(r.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${r.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded border p-2">
          <p className="text-xs font-medium">Available Models</p>
          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {MODEL_REGISTRY.map((model) => (
              <Tooltip key={model.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      classifier.activeModelId === model.id ? "bg-green-500" : "bg-muted-foreground/30",
                    )} />
                    {model.name}
                    <span className="ml-auto text-[10px]">{model.sizeLabel}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-48">
                  {model.description} ({model.runtime.toUpperCase()})
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
