import { useEditingStore } from "../store";

// biome-ignore lint: MapboxDraw mode context requires any
const DrawRectangle: any = {
  onSetup() {
    const rect = this.newFeature({
      type: "Feature",
      properties: { _isRectangle: true },
      geometry: { type: "Polygon", coordinates: [[]] },
    });
    this.addFeature(rect);
    this.setActionableState({ trash: true, combineFeatures: false, uncombineFeatures: false });
    return { rect, startPoint: null as [number, number] | null, completed: false };
  },

  onClick(state: any, e: any) {
    if (!state.startPoint) {
      state.startPoint = [e.lngLat.lng, e.lngLat.lat];
    } else {
      const [x1, y1] = state.startPoint;
      const [x2, y2] = [e.lngLat.lng, e.lngLat.lat];
      state.rect.setCoordinates([
        [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
          [x1, y1],
        ],
      ]);
      state.completed = true;
      this.map.fire("draw.create", { features: [state.rect.toGeoJSON()] });
      this.changeMode("simple_select");
    }
  },

  onMouseMove(state: any, e: any) {
    if (!state.startPoint) return;
    const [x1, y1] = state.startPoint;
    const [x2, y2] = [e.lngLat.lng, e.lngLat.lat];
    state.rect.setCoordinates([
      [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
        [x1, y1],
      ],
    ]);
  },

  onKeyUp(state: any, e: any) {
    if (e.key === "Escape") {
      this.deleteFeature(String(state.rect.id), { silent: true });
      this.changeMode("simple_select");
    }
  },

  onTrash(state: any) {
    this.deleteFeature(String(state.rect.id), { silent: true });
    this.changeMode("simple_select");
  },

  onStop(state: any) {
    if (!state.completed) {
      try { this.deleteFeature(String(state.rect.id), { silent: true }); } catch {}
    }
    const s = useEditingStore.getState();
    if (s.drawMode === "draw_rectangle") s.setDrawMode(null);
  },

  toDisplayFeatures(state: any, geojson: any, display: any) {
    if (geojson.properties?.id === state.rect.id) {
      if (geojson.geometry?.coordinates?.[0]?.length > 1) {
        display(geojson);
      }
    } else {
      display(geojson);
    }
    if (state.startPoint) {
      display({
        type: "Feature",
        properties: { meta: "vertex", active: "true" },
        geometry: { type: "Point", coordinates: state.startPoint },
      });
    }
  },
};

export default DrawRectangle;
