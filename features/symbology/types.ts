export type StyleMode = "simple" | "categorized" | "graduated";

export interface SimpleStyle {
  mode: "simple";
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fillOpacity: number;
}

export interface CategoryEntry {
  value: string;
  color: string;
  label: string;
}

export interface CategorizedStyle {
  mode: "categorized";
  field: string;
  categories: CategoryEntry[];
  defaultColor: string;
}

export interface GraduatedEntry {
  min: number;
  max: number;
  color: string;
  label: string;
}

export interface GraduatedStyle {
  mode: "graduated";
  field: string;
  breaks: GraduatedEntry[];
}

export type LayerStyle = SimpleStyle | CategorizedStyle | GraduatedStyle;

export interface LabelConfig {
  enabled: boolean;
  field: string;
  fontSize: number;
  color: string;
}
