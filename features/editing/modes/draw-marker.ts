// MapboxDraw custom mode — places a Point with _isMarker: true
// biome-ignore lint: MapboxDraw mode context requires any
const DrawMarker: any = {
  onSetup() {
    this.setActionableState({ trash: true, combineFeatures: false, uncombineFeatures: false });
    return {};
  },

  onClick(_state: any, e: any) {
    const point = this.newFeature({
      type: "Feature",
      properties: { _isMarker: true },
      geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] },
    });
    this.addFeature(point);
    this.map.fire("draw.create", { features: [point.toGeoJSON()] });
    this.changeMode("simple_select");
  },

  onKeyUp(_state: any, e: any) {
    if (e.key === "Escape") {
      this.changeMode("simple_select");
    }
  },

  onTrash() {
    this.changeMode("simple_select");
  },

  toDisplayFeatures(_state: any, geojson: any, display: any) {
    display(geojson);
  },
};

export default DrawMarker;
