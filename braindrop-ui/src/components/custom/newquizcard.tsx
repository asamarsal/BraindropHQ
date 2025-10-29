"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FileText,
  Wand2,
  Plus,
  FileInput,
  LayoutTemplate,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";

type OptionKey = "pdf" | "builder" | "blank" | "import" | "template";

export function NewquizCard() {
  const [selected, setSelected] = useState<OptionKey>("pdf");

  const onChoose = (key: OptionKey) => {
    setSelected(key);
    // TODO: route / open modal / etc
    // e.g. router.push(`/new-quiz/${key}`)
  };

  return (
    <Card className="w-full max-w-4xl border-0 shadow-xl bg-white/90 dark:bg-neutral-900/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Create new quiz...</CardTitle>
        <CardDescription>Choose how to start</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Top: 3 large cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <OptionCard
            label="PDF to kuis"
            desc="Make or export question from your PDF"
            icon={FileText}
            ai
            badge="New!"
            starred
            active={selected === "pdf"}
            onClick={() => onChoose("pdf")}
          />

          <OptionCard
            label="Quiz Maker"
            desc="Make quiz from topic/URL/Wikipedia"
            icon={Wand2}
            ai
            active={selected === "builder"}
            onClick={() => onChoose("builder")}
          />

          <OptionCard
            label="Blank Canvas"
            desc="Start from scratch"
            icon={Plus}
            active={selected === "blank"}
            onClick={() => onChoose("blank")}
          />
        </div>

        {/* Bottom: 2 smaller cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <OptionCard
            label="Import .xlsx atau .csv"
            desc="Sinkronkan atau unggah slide Anda"
            icon={FileInput}
            compact
            starred
            active={selected === "import"}
            onClick={() => onChoose("import")}
          />
          <OptionCard
            label="Import your powerpoint"
            desc="Syncronize or upload your powerpoint slide"
            icon={FileInput}
            compact
            active={selected === "template"}
            onClick={() => onChoose("template")}
          />
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Button className="cursor-pointer bg-green-400 hover:bg-green-500 min-w-[110px]">Select</Button>
      </CardFooter>
    </Card>
  );
}

/* --- Subcomponent ------------------------------------------------------- */

type OptionCardProps = {
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  ai?: boolean;
  badge?: string;
  starred?: boolean;
  compact?: boolean;
  active?: boolean;
};

function OptionCard({
  label,
  desc,
  icon: Icon,
  onClick,
  ai,
  badge,
  starred,
  compact,
  active,
}: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group w-full text-left rounded-xl border bg-white dark:bg-neutral-900",
        "hover:shadow-lg transition-all",
        active
          ? "ring-2 ring-violet-500 border-transparent"
          : "border-neutral-200 dark:border-neutral-800"
      )}
    >
      {/* Star (pin) */}
      {starred && (
        <span className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-emerald-500 text-white p-1 shadow">
          <Star className="h-3.5 w-3.5" />
        </span>
      )}

      {/* New badge */}
      {badge && (
        <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-medium text-white shadow">
          {badge}
        </span>
      )}

      <div
        className={cn(
          "flex h-full flex-col justify-between rounded-xl",
          compact ? "p-4" : "p-5"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600/10 text-violet-700 dark:text-violet-400">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight">
              {label}
            </div>
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400">
              {desc}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className={cn("mt-4 flex items-center justify-between")}>
          {ai ? (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1 rounded-full px-3 py-1 text-[12px]"
              onClick={onClick}
            >
              <Sparkles className="h-3.5 w-3.5" />
              With AI
            </Button>
          ) : (
            <span />
          )}

          <span className="text-[12px] text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
            Click to choose
          </span>
        </div>
      </div>
    </button>
  );
}
