"use client";

import { useState, useRef } from "react";
import { getModelById, type ModelConfig } from "../models";

export interface ClassificationResult {
  label: string;
  confidence: number;
}

const IMAGENET_LABELS_URL =
  "https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt";

async function loadLabels(): Promise<string[]> {
  try {
    const res = await fetch(IMAGENET_LABELS_URL);
    const text = await res.text();
    return text.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

async function loadTfjsModel(config: ModelConfig) {
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();
  const model = await tf.loadLayersModel(config.url);
  return { type: "tfjs" as const, tf, model };
}

async function loadOnnxModel(config: ModelConfig) {
  const ort = await import("onnxruntime-web");
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";
  const session = await ort.InferenceSession.create(config.url, {
    executionProviders: ["wasm"],
  });
  return { type: "onnx" as const, ort, session };
}

function preprocessImage(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  size: number,
): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageElement, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const { data } = imageData;
  const float32 = new Float32Array(3 * size * size);

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let i = 0; i < size * size; i++) {
    float32[i] = (data[i * 4] / 255 - mean[0]) / std[0]; // R
    float32[size * size + i] = (data[i * 4 + 1] / 255 - mean[1]) / std[1]; // G
    float32[2 * size * size + i] = (data[i * 4 + 2] / 255 - mean[2]) / std[2]; // B
  }
  return float32;
}

export function useImageClassifier() {
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const modelRef = useRef<any>(null);
  const labelsRef = useRef<string[]>([]);
  const configRef = useRef<ModelConfig | null>(null);

  const loadModel = async (modelId: string) => {
    setLoading(true);
    setError(null);
    setModelReady(false);
    setResults([]);

    const config = getModelById(modelId);
    if (!config) {
      setError(`Unknown model: ${modelId}`);
      setLoading(false);
      return;
    }
    configRef.current = config;

    try {
      labelsRef.current = await loadLabels();

      if (config.runtime === "tfjs") {
        modelRef.current = await loadTfjsModel(config);
      } else {
        modelRef.current = await loadOnnxModel(config);
      }

      setActiveModelId(modelId);
      setModelReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load model");
    } finally {
      setLoading(false);
    }
  };

  const classifyImage = async (imageElement: HTMLImageElement | HTMLCanvasElement) => {
      if (!modelRef.current || !configRef.current) {
        setError("Model not loaded yet");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const config = configRef.current;
        const loaded = modelRef.current;
        let probabilities: Float32Array;

        if (loaded.type === "tfjs") {
          const { tf, model } = loaded;
          const tensor = tf.browser
            .fromPixels(imageElement)
            .resizeBilinear([config.inputSize, config.inputSize])
            .expandDims(0)
            .div(255.0);
          const predictions = model.predict(tensor) as any;
          probabilities = await predictions.data();
          tensor.dispose();
          predictions.dispose();
        } else {
          const { ort, session } = loaded;
          const inputData = preprocessImage(imageElement, config.inputSize);
          const inputTensor = new ort.Tensor("float32", inputData, [
            1,
            3,
            config.inputSize,
            config.inputSize,
          ]);
          const inputName = session.inputNames[0];
          const feeds: Record<string, any> = {};
          feeds[inputName] = inputTensor;
          const output = await session.run(feeds);
          const outputName = session.outputNames[0];
          probabilities = output[outputName].data as Float32Array;
        }

        const labels = labelsRef.current;
        const topK = Array.from(probabilities)
          .map((confidence: number, i: number) => ({
            label: labels[i] ?? `Class ${i}`,
            confidence,
          }))
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5);

        setResults(topK);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Classification failed");
      } finally {
        setLoading(false);
      }
  };

  return {
    loading,
    modelReady,
    results,
    error,
    activeModelId,
    loadModel,
    classifyImage,
  };
}
