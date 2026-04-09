"use client";

import { useImportFile } from "../hooks/use-import-file";
import { ImportPanelView } from "./import-panel-view";

export function ImportPanel() {
  const { importing, error, progress, importFile } = useImportFile();

  return (
    <ImportPanelView
      importing={importing}
      error={error}
      progress={progress}
      disabled={false}
      onImport={importFile}
    />
  );
}
