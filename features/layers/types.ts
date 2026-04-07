export interface LayerConfig {
  id: string;
  name: string;
  description?: string;
  sourceType: string;
  style?: Record<string, unknown>;
  order: number;
  isVisible: boolean;
  opacity: number;
}
