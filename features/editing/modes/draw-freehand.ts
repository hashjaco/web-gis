import { useEditingStore } from "../store";

// biome-ignore lint: MapboxDraw mode context requires any
const DrawFreehand: any = {
  onSetup() {
    const line = this.newFeature({
      type: "Feature",
      properties: { _isFreehand: true },
      geometry: { type: "LineString", coordinates: [] },
    });
    this.addFeature(line);
    this.setActionableState({ trash: true, combineFeatures: false, uncombineFeatures: false });
    return { line, drawing: false, completed: false, coords: [] as [number, number][] };
  },

  onMouseDown(state: any, e: any) {
    state.drawing = true;
    state.coords = [[e.lngLat.lng, e.lngLat.lat]];
    state.line.setCoordinates(state.coords);
    this.map.dragPan.disable();
    this.updateUIClasses({ mouse: "add" });
  },

  onDrag(state: any, e: any) {
    if (!state.drawing) return;
    state.coords.push([e.lngLat.lng, e.lngLat.lat]);
    state.line.setCoordinates(state.coords);
  },

  onMouseUp(state: any) {
    if (!state.drawing) return;
    state.drawing = false;
    this.map.dragPan.enable();
    if (state.coords.length < 2) {
      this.deleteFeature(String(state.line.id), { silent: true });
      this.changeMode("simple_select");
      return;
    }
    state.completed = true;
    this.map.fire("draw.create", { features: [state.line.toGeoJSON()] });
    this.changeMode("simple_select");
  },

  onStop(state: any) {
    this.map.dragPan.enable();
    if (!state.completed) {
      try { this.deleteFeature(String(state.line.id), { silent: true }); } catch {}
    }
    const s = useEditingStore.getState();
    if (s.drawMode === "draw_freehand") s.setDrawMode(null);
  },

  onKeyUp(state: any, e: any) {
    if (e.key === "Escape") {
      this.deleteFeature(String(state.line.id), { silent: true });
      this.changeMode("simple_select");
    }
  },

  onTrash(state: any) {
    this.deleteFeature(String(state.line.id), { silent: true });
    this.changeMode("simple_select");
  },

  toDisplayFeatures(_state: any, geojson: any, display: any) {
    display(geojson);
  },
};

export default DrawFreehand;
