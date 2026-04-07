export interface VideoOverlay {
  id: string;
  url: string;
  name: string;
  bounds: [number, number, number, number]; // [west, south, east, north]
  opacity: number;
  isVisible: boolean;
}

export interface FrameAnnotation {
  id: string;
  label: string;
  bbox: [number, number, number, number]; // [x, y, width, height] in pixel coords
  color: string;
  timestamp: number;
}

export interface Detection {
  id: string;
  className: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  timestamp: Date;
  location: [number, number] | null; // [lng, lat] if geo-registered
}
