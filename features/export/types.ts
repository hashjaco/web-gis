export type ExportFormat = "png" | "pdf" | "geojson" | "csv";

export interface PrintOptions {
  title: string;
  paperSize: "a4" | "a3" | "letter";
  orientation: "portrait" | "landscape";
  includeLegend: boolean;
  dpi: number;
}
