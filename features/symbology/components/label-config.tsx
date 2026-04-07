"use client";

import type { LabelConfig as LabelConfigType } from "../types";

interface LabelConfigProps {
  config: LabelConfigType;
  fields: string[];
  onChange: (config: LabelConfigType) => void;
}

export function LabelConfig({ config, fields, onChange }: LabelConfigProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Labels
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`rounded-full px-2 py-0.5 text-xs ${config.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {config.enabled ? "On" : "Off"}
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-2">
          <div>
            <label
              htmlFor="label-field"
              className="mb-0.5 block text-xs text-muted-foreground"
            >
              Field
            </label>
            <select
              id="label-field"
              value={config.field}
              onChange={(e) => onChange({ ...config, field: e.target.value })}
              className="w-full rounded border bg-background px-2 py-1 text-xs"
            >
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label
                htmlFor="label-size"
                className="mb-0.5 block text-xs text-muted-foreground"
              >
                Size
              </label>
              <input
                id="label-size"
                type="number"
                min={8}
                max={32}
                value={config.fontSize}
                onChange={(e) =>
                  onChange({ ...config, fontSize: Number(e.target.value) })
                }
                className="w-full rounded border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="label-color"
                className="mb-0.5 block text-xs text-muted-foreground"
              >
                Color
              </label>
              <input
                id="label-color"
                type="color"
                value={config.color}
                onChange={(e) => onChange({ ...config, color: e.target.value })}
                className="h-7 w-full cursor-pointer rounded border"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
