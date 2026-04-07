// MapboxDraw custom mode — `this` is bound by MapboxDraw at runtime
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
    return { rect, startPoint: null as [number, number] | null };
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

  onKeyUp(_state: any, e: any) {
    if (e.key === "Escape") {
      this.deleteFeature(String(_state.rect.id), { silent: true });
      this.changeMode("simple_select");
    }
  },

  onTrash(state: any) {
    this.deleteFeature(String(state.rect.id), { silent: true });
    this.changeMode("simple_select");
  },

  toDisplayFeatures(state: any, geojson: any, display: any) {
    if (geojson.geometry?.coordinates?.[0]?.length > 1) {
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
