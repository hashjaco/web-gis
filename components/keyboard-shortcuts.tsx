"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Panels",
    shortcuts: [
      { keys: ["L"], description: "Toggle Layers panel" },
      { keys: ["E"], description: "Toggle Edit panel" },
      { keys: ["I"], description: "Toggle Import panel" },
      { keys: ["R"], description: "Toggle Routing panel" },
      { keys: ["X"], description: "Toggle Export panel" },
    ],
  },
  {
    title: "Project",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save project" },
      { keys: ["H"], description: "Go to Home" },
    ],
  },
];

interface KeyboardShortcutsProps {
  onPanelChange: (panel: string | null) => void;
  onHomeClick: () => void;
  onSave: () => void;
}

export function KeyboardShortcuts({
  onPanelChange,
  onHomeClick,
  onSave,
}: KeyboardShortcutsProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if (isTyping) return;

      if (e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const panelMap: Record<string, string> = {
        l: "layers",
        e: "editing",
        i: "import",
        r: "routing",
        x: "export",
      };

      const panel = panelMap[e.key.toLowerCase()];
      if (panel) {
        e.preventDefault();
        onPanelChange(panel);
        return;
      }

      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        onHomeClick();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onPanelChange, onHomeClick, onSave]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-xl border bg-popover shadow-2xl">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-5">
            <div className="space-y-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.title}
                  </h3>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.description}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                      >
                        <span>{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key) => (
                            <kbd
                              key={key}
                              className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                            >
                              {key === "Ctrl"
                                ? navigator.platform?.includes("Mac")
                                  ? "\u2318"
                                  : "Ctrl"
                                : key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
