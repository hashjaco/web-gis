import * as turf from "@turf/turf";
import { useEditingStore } from "../store";

// biome-ignore lint: MapboxDraw mode context requires any
const DrawCircle: any = {
  onSetup() {
    const circle = this.newFeature({
      type: "Feature",
      properties: { _isCircle: true },
      geometry: { type: "Polygon", coordinates: [[]] },
    });
    this.addFeature(circle);
    this.setActionableState({ trash: true, combineFeatures: false, uncombineFeatures: false });
    return { circle, center: null as [number, number] | null, completed: false };
  },

  onClick(state: any, e: any) {
    if (!state.center) {
      state.center = [e.lngLat.lng, e.lngLat.lat];
    } else {
      const radius = turf.distance(
        turf.point(state.center),
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: "kilometers" },
      );
      const circleGeo = turf.circle(state.center, radius, { steps: 64 });
      state.circle.setCoordinates(circleGeo.geometry.coordinates);
      state.circle.properties.center = state.center;
      state.circle.properties.radiusKm = radius;
      state.completed = true;
      this.map.fire("draw.create", { features: [state.circle.toGeoJSON()] });
      this.changeMode("simple_select");
    }
  },

  onMouseMove(state: any, e: any) {
    if (!state.center) return;
    const radius = turf.distance(
      turf.point(state.center),
      turf.point([e.lngLat.lng, e.lngLat.lat]),
      { units: "kilometers" },
    );
    const circleGeo = turf.circle(state.center, Math.max(radius, 0.001), { steps: 64 });
    state.circle.setCoordinates(circleGeo.geometry.coordinates);
  },

  onKeyUp(state: any, e: any) {
    if (e.key === "Escape") {
      this.deleteFeature(String(state.circle.id), { silent: true });
      this.changeMode("simple_select");
    }
  },

  onTrash(state: any) {
    this.deleteFeature(String(state.circle.id), { silent: true });
    this.changeMode("simple_select");
  },

  onStop(state: any) {
    if (!state.completed) {
      try { this.deleteFeature(String(state.circle.id), { silent: true }); } catch {}
    }
    const s = useEditingStore.getState();
    if (s.drawMode === "draw_circle") s.setDrawMode(null);
  },

  toDisplayFeatures(state: any, geojson: any, display: any) {
    if (geojson.properties?.id === state.circle.id) {
      if (geojson.geometry?.coordinates?.[0]?.length > 1) {
        display(geojson);
      }
    } else {
      display(geojson);
    }
    if (state.center) {
      display({
        type: "Feature",
        properties: { meta: "vertex", active: "true" },
        geometry: { type: "Point", coordinates: state.center },
      });
    }
  },
};

export default DrawCircle;
