import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { FeatureCollection } from "geojson";
import { ImportPreviewMap } from "./import-preview-map";

const meta = {
  title: "Import/ImportPreviewMap",
  component: ImportPreviewMap,
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImportPreviewMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const EPSG_3857_POLYGONS: FeatureCollection & { crs: unknown } = {
  type: "FeatureCollection",
  crs: { type: "name", properties: { name: "EPSG:3857" } },
  features: [
    {
      type: "Feature",
      properties: { name: "Fresno Area", county: "FRESNO" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-13296595.13, 4383674.4, 0],
            [-13296595.67, 4383674.44, 0],
            [-13296594.48, 4383807.63, 0],
            [-13296485.61, 4383808.08, 0],
            [-13296485.26, 4383807.68, 0],
            [-13296487.2, 4383671.1, 0],
            [-13296487.78, 4383670.75, 0],
            [-13296595.13, 4383674.4, 0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Bay Area", county: "SAN FRANCISCO" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-13630000, 4545000, 0],
            [-13625000, 4545000, 0],
            [-13625000, 4550000, 0],
            [-13630000, 4550000, 0],
            [-13630000, 4545000, 0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "LA Area", county: "LOS ANGELES" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-13165000, 4035000, 0],
            [-13160000, 4035000, 0],
            [-13160000, 4040000, 0],
            [-13165000, 4040000, 0],
            [-13165000, 4035000, 0],
          ],
        ],
      },
    },
  ],
};

const WGS84_POINTS: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "San Francisco" },
      geometry: { type: "Point", coordinates: [-122.4194, 37.7749] },
    },
    {
      type: "Feature",
      properties: { name: "Los Angeles" },
      geometry: { type: "Point", coordinates: [-118.2437, 34.0522] },
    },
    {
      type: "Feature",
      properties: { name: "Sacramento" },
      geometry: { type: "Point", coordinates: [-121.4944, 38.5816] },
    },
    {
      type: "Feature",
      properties: { name: "San Diego" },
      geometry: { type: "Point", coordinates: [-117.1611, 32.7157] },
    },
  ],
};

const EMPTY_FC: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export const EPSG3857Polygons: Story = {
  name: "EPSG:3857 Polygons",
  args: { data: EPSG_3857_POLYGONS },
};

export const WGS84Points: Story = {
  name: "WGS-84 Points",
  args: { data: WGS84_POINTS },
};

export const Empty: Story = {
  name: "Empty FeatureCollection",
  args: { data: EMPTY_FC },
};
