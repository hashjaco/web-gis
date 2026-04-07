export type ModelRuntime = "tfjs" | "onnx";

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  runtime: ModelRuntime;
  inputSize: number;
  url: string;
  accuracy: "standard" | "high" | "highest";
  sizeLabel: string;
}

export const MODEL_REGISTRY: ModelConfig[] = [
  {
    id: "mobilenet-v1",
    name: "MobileNet v1",
    description: "Fast, lightweight general image classification",
    runtime: "tfjs",
    inputSize: 224,
    url: "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json",
    accuracy: "standard",
    sizeLabel: "~1 MB",
  },
  {
    id: "mobilenet-v2",
    name: "MobileNet v2",
    description: "Improved accuracy with inverted residual blocks",
    runtime: "tfjs",
    inputSize: 224,
    url: "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json",
    accuracy: "high",
    sizeLabel: "~14 MB",
  },
  {
    id: "efficientnet-lite",
    name: "EfficientNet-Lite0",
    description: "Best accuracy/performance balance via compound scaling",
    runtime: "onnx",
    inputSize: 224,
    url: "https://huggingface.co/alchzh/efficientnet-lite0-onnx/resolve/main/efficientnet-lite0.onnx",
    accuracy: "high",
    sizeLabel: "~18 MB",
  },
  {
    id: "resnet50",
    name: "ResNet-50",
    description: "Deep residual network for highest accuracy",
    runtime: "onnx",
    inputSize: 224,
    url: "https://huggingface.co/nickmuchi/resnet-50-onnx/resolve/main/model.onnx",
    accuracy: "highest",
    sizeLabel: "~98 MB",
  },
];

export function getModelById(id: string): ModelConfig | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}
