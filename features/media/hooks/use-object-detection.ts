"use client";

import { useRef } from "react";
import { useMediaStore } from "../store";
import type { Detection } from "../types";

const COCO_CLASSES = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
  "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
  "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
  "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
  "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
  "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
  "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
  "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
  "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
  "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
  "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
  "hair drier", "toothbrush",
];

const MODEL_INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.45;

function iou(a: number[], b: number[]): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[0] + a[2], b[0] + b[2]);
  const y2 = Math.min(a[1] + a[3], b[1] + b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = a[2] * a[3];
  const areaB = b[2] * b[3];
  return inter / (areaA + areaB - inter);
}

function nms(detections: Detection[]): Detection[] {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;
    kept.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed.has(j)) continue;
      if (iou(sorted[i].bbox as number[], sorted[j].bbox as number[]) > IOU_THRESHOLD) {
        suppressed.add(j);
      }
    }
  }
  return kept;
}

export function useObjectDetection() {
  const sessionRef = useRef<any>(null);
  const setModelLoaded = useMediaStore((s) => s.setModelLoaded);
  const setModelLoading = useMediaStore((s) => s.setModelLoading);
  const addDetection = useMediaStore((s) => s.addDetection);

  const loadModel = async () => {
    setModelLoading(true);
    try {
      const ort = await import("onnxruntime-web");
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";
      const session = await ort.InferenceSession.create(
        "https://huggingface.co/Kalray/yolov8/resolve/main/yolov8n.onnx",
        { executionProviders: ["wasm"] },
      );
      sessionRef.current = { ort, session };
      setModelLoaded(true);
    } catch (err) {
      console.error("Failed to load detection model:", err);
    } finally {
      setModelLoading(false);
    }
  };

  const detect = async (
      canvas: HTMLCanvasElement,
      location: [number, number] | null = null,
    ): Promise<Detection[]> => {
      if (!sessionRef.current) return [];
      const { ort, session } = sessionRef.current;

      const ctx = canvas.getContext("2d");
      if (!ctx) return [];

      const resized = document.createElement("canvas");
      resized.width = MODEL_INPUT_SIZE;
      resized.height = MODEL_INPUT_SIZE;
      const rCtx = resized.getContext("2d")!;
      rCtx.drawImage(canvas, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
      const imageData = rCtx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

      const input = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
      for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
        input[i] = imageData.data[i * 4] / 255;
        input[MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = imageData.data[i * 4 + 1] / 255;
        input[2 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + i] = imageData.data[i * 4 + 2] / 255;
      }

      const tensor = new ort.Tensor("float32", input, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
      const feeds: Record<string, any> = {};
      feeds[session.inputNames[0]] = tensor;
      const results = await session.run(feeds);
      const output = results[session.outputNames[0]];

      const data = output.data as Float32Array;
      const [, numDetections, numPredictions] = output.dims;
      const raw: Detection[] = [];

      const scaleX = canvas.width / MODEL_INPUT_SIZE;
      const scaleY = canvas.height / MODEL_INPUT_SIZE;

      for (let i = 0; i < (numPredictions ?? 0); i++) {
        let maxConf = 0;
        let maxClass = 0;
        for (let c = 4; c < (numDetections ?? 0); c++) {
          const conf = data[c * (numPredictions ?? 0) + i];
          if (conf > maxConf) {
            maxConf = conf;
            maxClass = c - 4;
          }
        }

        if (maxConf < CONFIDENCE_THRESHOLD) continue;

        const cx = data[0 * (numPredictions ?? 0) + i] * scaleX;
        const cy = data[1 * (numPredictions ?? 0) + i] * scaleY;
        const w = data[2 * (numPredictions ?? 0) + i] * scaleX;
        const h = data[3 * (numPredictions ?? 0) + i] * scaleY;

        raw.push({
          id: `det-${Date.now()}-${i}`,
          className: COCO_CLASSES[maxClass] ?? `class_${maxClass}`,
          confidence: maxConf,
          bbox: [cx - w / 2, cy - h / 2, w, h],
          timestamp: new Date(),
          location,
        });
      }

      const filtered = nms(raw);
      for (const det of filtered) {
        addDetection(det);
      }
      return filtered;
  };

  return { loadModel, detect };
}
