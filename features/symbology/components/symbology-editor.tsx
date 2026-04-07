"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useStyleApply } from "../hooks/use-style-apply";
import type {
  LabelConfig as LabelConfigType,
  LayerStyle,
  StyleMode,
} from "../types";
import { DEFAULT_STYLE } from "../utils";
import { ColorRampPicker } from "./color-ramp-picker";
import { LabelConfig } from "./label-config";

interface SymbologyEditorProps {
  layerId: string;
  layerName: string;
  initialStyle?: LayerStyle;
  fields: string[];
  onClose: () => void;
  onSave: (style: LayerStyle) => void;
}

export function SymbologyEditor({
  layerId,
  layerName,
  initialStyle,
  fields,
  onClose,
  onSave,
}: SymbologyEditorProps) {
  const [style, setStyle] = useState<LayerStyle>(initialStyle ?? DEFAULT_STYLE);
  const [mode, setMode] = useState<StyleMode>(style.mode);
  const [rampIndex, setRampIndex] = useState(0);
  const [labelConfig, setLabelConfig] = useState<LabelConfigType>({
    enabled: false,
    field: fields[0] ?? "",
    fontSize: 12,
    color: "#333333",
  });

  const { applyStyle, applyLabels } = useStyleApply();

  const handleModeChange = (newMode: StyleMode) => {
    setMode(newMode);
    if (newMode === "simple") {
      setStyle(DEFAULT_STYLE);
    } else if (newMode === "categorized") {
      setStyle({
        mode: "categorized",
        field: fields[0] ?? "",
        categories: [],
        defaultColor: "#cccccc",
      });
    } else {
      setStyle({
        mode: "graduated",
        field: fields[0] ?? "",
        breaks: [],
      });
    }
  };

  const handleApply = () => {
    applyStyle(layerId, style);
    applyLabels(layerId, labelConfig);
  };

  const handleSave = () => {
    handleApply();
    onSave(style);
  };

  return (
    <div className="flex h-full w-72 flex-col border-r bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Style: {layerName}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div>
          <label
            htmlFor="style-mode"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Mode
          </label>
          <select
            id="style-mode"
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as StyleMode)}
            className="w-full rounded border bg-background px-2 py-1 text-sm"
          >
            <option value="simple">Simple</option>
            <option value="categorized">Categorized</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>

        {style.mode === "simple" && (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="fill-color"
                className="mb-0.5 block text-xs text-muted-foreground"
              >
                Fill Color
              </label>
              <input
                id="fill-color"
                type="color"
                value={style.fillColor}
                onChange={(e) =>
                  setStyle({ ...style, fillColor: e.target.value })
                }
                className="h-8 w-full cursor-pointer rounded border"
              />
            </div>
            <div>
              <label
                htmlFor="stroke-color"
                className="mb-0.5 block text-xs text-muted-foreground"
              >
                Stroke Color
              </label>
              <input
                id="stroke-color"
                type="color"
                value={style.strokeColor}
                onChange={(e) =>
                  setStyle({ ...style, strokeColor: e.target.value })
                }
                className="h-8 w-full cursor-pointer rounded border"
              />
            </div>
            <div>
              <label
                htmlFor="stroke-width"
                className="mb-0.5 block text-xs text-muted-foreground"
              >
                Stroke Width
              </label>
              <input
                id="stroke-width"
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={style.strokeWidth}
                onChange={(e) =>
                  setStyle({ ...style, strokeWidth: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="fill-opacity"
                className="mb-0.5 block text-xs text-muted-foreground"
              >
                Opacity: {Math.round(style.fillOpacity * 100)}%
              </label>
              <input
                id="fill-opacity"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={style.fillOpacity}
                onChange={(e) =>
                  setStyle({ ...style, fillOpacity: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        )}

        {(style.mode === "categorized" || style.mode === "graduated") && (
          <div>
            <label
              htmlFor="class-field"
              className="mb-0.5 block text-xs text-muted-foreground"
            >
              Field
            </label>
            <select
              id="class-field"
              value={style.field}
              onChange={(e) => setStyle({ ...style, field: e.target.value })}
              className="w-full rounded border bg-background px-2 py-1 text-sm"
            >
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        )}

        {style.mode === "graduated" && (
          <ColorRampPicker selectedIndex={rampIndex} onSelect={setRampIndex} />
        )}

        <LabelConfig
          config={labelConfig}
          fields={fields}
          onChange={setLabelConfig}
        />
      </div>

      <div className="flex gap-2 border-t p-3">
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Save
        </button>
      </div>
    </div>
  );
}
