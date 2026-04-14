"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  CONCEPT_CARDS,
  GUIDED_EXERCISES,
  type ConceptCard,
  type GuidedExercise,
} from "../learn-content";

function DifficultyBadge({
  level,
}: {
  level: "beginner" | "intermediate" | "advanced";
}) {
  const config = {
    beginner: { label: "Beginner", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
    intermediate: { label: "Intermediate", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    advanced: { label: "Advanced", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  };
  const c = config[level];
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        c.className,
      )}
    >
      {c.label}
    </span>
  );
}

function ConceptCardItem({ card }: { card: ConceptCard }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card transition-colors hover:border-primary/20">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold">{card.title}</h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {card.summary}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t px-3 py-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {card.explanation}
          </p>
          {card.arcgisEquivalent && (
            <p className="mt-2 rounded bg-muted/50 px-2 py-1.5 text-[10px] italic text-muted-foreground">
              <span className="font-medium not-italic">In ArcGIS:</span>{" "}
              {card.arcgisEquivalent}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseCard({
  exercise,
  onStart,
}: {
  exercise: GuidedExercise;
  onStart: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card transition-colors hover:border-primary/20">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
          <Star className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold">{exercise.title}</h4>
            <DifficultyBadge level={exercise.difficulty} />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Uses: {exercise.sampleDataset} dataset
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t px-3 py-3">
          <ol className="space-y-1.5">
            {exercise.steps.map((step, i) => (
              <li
                key={`step-${i}`}
                className="flex items-start gap-2 text-[11px] text-muted-foreground"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap gap-1">
            {exercise.concepts.map((c) => {
              const card = CONCEPT_CARDS.find((cc) => cc.id === c);
              return card ? (
                <span
                  key={c}
                  className="rounded bg-accent/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {card.title}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function LearnPanel() {
  const [tab, setTab] = useState<"concepts" | "exercises">("concepts");

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <GraduationCap className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Learn GIS</h2>
        <HelpTooltip
          title="Learning Hub"
          description="Explore core GIS concepts explained in plain language, and follow guided exercises to build practical skills. No prior experience required."
        />
      </div>

      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setTab("concepts")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            tab === "concepts"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Concepts
        </button>
        <button
          type="button"
          onClick={() => setTab("exercises")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            tab === "exercises"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Exercises
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {tab === "concepts" && (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Click any card to expand a full explanation. These concepts map to
              tools used in professional GIS software like ArcGIS.
            </p>
            {CONCEPT_CARDS.map((card) => (
              <ConceptCardItem key={card.id} card={card} />
            ))}
          </>
        )}

        {tab === "exercises" && (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Step-by-step walkthroughs using built-in sample data. Load the
              dataset first, then follow the steps.
            </p>
            {GUIDED_EXERCISES.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onStart={() => {
                  /* future: auto-load dataset and open panels */
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
