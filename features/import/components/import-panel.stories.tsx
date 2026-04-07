import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ImportPanelView } from "./import-panel-view";

const meta = {
  title: "Import/ImportPanel",
  component: ImportPanelView,
  decorators: [
    (Story) => (
      <div className="h-[520px] w-72 border rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
  args: {
    onImport: fn(),
  },
} satisfies Meta<typeof ImportPanelView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    importing: false,
    error: null,
    progress: 0,
  },
};

export const Importing: Story = {
  args: {
    importing: true,
    error: null,
    progress: 45,
  },
};

export const ImportProgress75: Story = {
  name: "Import Progress 75%",
  args: {
    importing: true,
    error: null,
    progress: 75,
  },
};

export const Error: Story = {
  args: {
    importing: false,
    error: "Unsupported format: .xyz",
    progress: 0,
  },
};

export const Complete: Story = {
  args: {
    importing: false,
    error: null,
    progress: 100,
  },
};
