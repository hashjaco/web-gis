"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='sidebar']",
    title: "Navigation Sidebar",
    description:
      "This is your toolbox. Each icon opens a different GIS tool -- layers, import, editing, routing, and more. Start with the basics on top and explore advanced tools as you grow.",
    position: "right",
  },
  {
    target: "[data-tour='map']",
    title: "Interactive Map",
    description:
      "This is your canvas. Pan by dragging, zoom with scroll or pinch. Right-click for options. Everything you import and create appears here.",
    position: "left",
  },
  {
    target: "[data-tour='search']",
    title: "Search for Places",
    description:
      "Type any address, city, or landmark to fly there on the map. This is called geocoding in GIS terminology.",
    position: "bottom",
  },
  {
    target: "[data-tour='basemap']",
    title: "Change the Basemap",
    description:
      "Switch between street maps, satellite imagery, and other base layers. The basemap is the background your data sits on top of.",
    position: "top",
  },
  {
    target: "[data-tour='draw-toolbar']",
    title: "Drawing Tools",
    description:
      "Draw points, lines, polygons, circles, and rectangles directly on the map. Select a layer first, then pick a shape to start creating features.",
    position: "bottom",
  },
  {
    target: "[data-tour='save']",
    title: "Save & Share",
    description:
      "Save your work as a project so you can come back to it later. You can also share your maps with a link.",
    position: "bottom",
  },
];

const TOUR_KEY = "shimgis-tour-completed";

function getElementRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

interface SpotlightOverlayProps {
  rect: DOMRect;
}

function SpotlightOverlay({ rect }: SpotlightOverlayProps) {
  const padding = 6;
  const borderRadius = 8;
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;

  return (
    <svg className="pointer-events-none fixed inset-0 z-[9998] h-full w-full">
      <defs>
        <mask id="tour-spotlight">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={borderRadius}
            ry={borderRadius}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.5)"
        mask="url(#tour-spotlight)"
      />
    </svg>
  );
}

interface TooltipBoxProps {
  step: TourStep;
  rect: DOMRect;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function TooltipBox({
  step,
  rect,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TooltipBoxProps) {
  const tooltipWidth = 320;
  const gap = 16;

  let style: React.CSSProperties = {};
  const pos = step.position;

  if (pos === "right") {
    style = {
      top: rect.top + rect.height / 2,
      left: rect.right + gap,
      transform: "translateY(-50%)",
    };
  } else if (pos === "left") {
    style = {
      top: rect.top + rect.height / 2,
      left: rect.left - tooltipWidth - gap,
      transform: "translateY(-50%)",
    };
  } else if (pos === "bottom") {
    style = {
      top: rect.bottom + gap,
      left: rect.left + rect.width / 2 - tooltipWidth / 2,
    };
  } else {
    style = {
      top: rect.top - gap,
      left: rect.left + rect.width / 2 - tooltipWidth / 2,
      transform: "translateY(-100%)",
    };
  }

  const clampedLeft = Math.max(
    16,
    Math.min(
      (style.left as number) ?? 0,
      window.innerWidth - tooltipWidth - 16,
    ),
  );
  style.left = clampedLeft;

  return (
    <div
      className="animate-fade-in-up fixed z-[9999] w-80 rounded-xl border bg-popover p-4 shadow-2xl"
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{step.title}</h3>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {step.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {currentStep + 1} of {totalSteps}
        </span>
        <div className="flex gap-1.5">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <ChevronLeft className="h-3 w-3" />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
            {currentStep < totalSteps - 1 && (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={`dot-${i}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === currentStep
                ? "w-4 bg-primary"
                : "w-1.5 bg-muted-foreground/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface FeatureTourProps {
  onRequestCloseHome?: () => void;
}

export function FeatureTour({ onRequestCloseHome }: FeatureTourProps) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(TOUR_KEY);
      if (!completed) {
        const timer = setTimeout(() => {
          onRequestCloseHome?.();
          setTimeout(() => setActive(true), 300);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      /* noop */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function findNextVisibleStep(from: number, direction: 1 | -1): number | null {
    let i = from;
    while (i >= 0 && i < TOUR_STEPS.length) {
      if (getElementRect(TOUR_STEPS[i].target)) return i;
      i += direction;
    }
    return null;
  }

  useEffect(() => {
    if (!active) return;

    const resolve = () => {
      const rect = getElementRect(TOUR_STEPS[step].target);
      if (rect) {
        setTargetRect(rect);
        return;
      }
      const next = findNextVisibleStep(step + 1, 1);
      if (next !== null) {
        setStep(next);
      } else {
        finish();
      }
    };

    resolve();

    const handleResize = () => {
      const rect = getElementRect(TOUR_STEPS[step].target);
      setTargetRect(rect);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [active, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    setActive(false);
    try {
      localStorage.setItem(TOUR_KEY, "true");
    } catch {
      /* noop */
    }
  };

  const handleNext = () => {
    if (step >= TOUR_STEPS.length - 1) {
      finish();
    } else {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      const prev = findNextVisibleStep(step - 1, -1);
      if (prev !== null) setStep(prev);
    }
  };

  if (!active || !targetRect) return null;

  return (
    <>
      <SpotlightOverlay rect={targetRect} />
      <TooltipBox
        step={TOUR_STEPS[step]}
        rect={targetRect}
        currentStep={step}
        totalSteps={TOUR_STEPS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={finish}
      />
    </>
  );
}

export function useReplayTour() {
  const replay = () => {
    try {
      localStorage.removeItem(TOUR_KEY);
      window.location.reload();
    } catch {
      /* noop */
    }
  };
  return replay;
}
