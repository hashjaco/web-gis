export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface BasemapStyle {
  id: string;
  name: string;
  url: string;
}
