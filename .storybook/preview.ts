import type { Preview } from "@storybook/nextjs-vite";
import React from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        TooltipProvider,
        { delayDuration: 300 },
        React.createElement(Story),
      ),
  ],
};

export default preview;
