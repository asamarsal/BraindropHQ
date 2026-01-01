"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Plus,
  Link2,
  Clock3,
  Image as ImageIcon,
  GripVertical,
  CheckCircle2,
  X,
  Trash2,
} from "lucide-react";

/** -------------------- Types -------------------- */
export type QuizPageItem = {
  id: string;
  title: string;
  durationSec?: number; // ex: 20
  hasMedia?: boolean;
  thumbUrl?: string;
  isValid?: boolean; // contoh validasi: semua jawaban terisi
};

type Props = {
  items?: QuizPageItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onAdd?: () => void;
  onCreate?: () => void;
  onTitleChange?: (value: string) => void;

  setQuestions?: React.Dispatch<React.SetStateAction<QuizPageItem[]>>;
};

/** -------------------- Component -------------------- */
export function ViewhalamanquizCard({
  items = [],
  activeId,
  onSelect,
  onAdd,
  onCreate,
  onTitleChange,
  setQuestions,
}: Props) {

  const genId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `q${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const questions = items;

  const handleAddQuestion = () => {
    if (!setQuestions) return;
    setQuestions((prev) => {
      const newQuestion: QuizPageItem = {
        id: genId(),
        title: `Pertanyaan ${prev.length + 1}`,
        durationSec: 20,
        hasMedia: false,
        thumbUrl: "",
        isValid: false,
      };
      return [...prev, newQuestion];
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination || !setQuestions) return;
    setQuestions((prev) => {
      const items = Array.from(prev);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      // renumber titles to match new order
      return items.map((q, i) => ({ ...q, title: `Pertanyaan ${i + 1}` }));
    });
  };

  const handleRemoveQuestion = (id: string) => {
    if (!setQuestions) return;
    setQuestions((prev) => {
      if (prev.length <= 1) return prev; // minimal 1 pertanyaan
      const next = prev.filter((q) => q.id !== id);
      // renumber titles after removal
      return next.map((q, i) => ({ ...q, title: `Pertanyaan ${i + 1}` }));
    });
  };

  return (
    <aside className="h-full w-[260px] shrink-0 border-r bg-white/50 dark:bg-neutral-900/80 backdrop-blur p-3 flex flex-col overflow-x-hidden">
      <div className="space-y-2">
        <div className="text-xs font-medium text-black">Quiz</div>
      </div>

      {/* Daftar halaman/pertanyaan dengan drag and drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div
              className="space-y-2 mt-4 flex-1 overflow-auto overflow-x-hidden"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {questions.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="w-full"
                    >
                      <QuizListItem
                        index={idx + 1}
                        data={item}
                        active={activeId ? activeId === item.id : idx === 0}
                        onClick={() => onSelect?.(item.id)}
                        onRemove={() => handleRemoveQuestion(item.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Tombol aksi di bawah */}
      <div className="pt-2 space-y-2">
        <Button
          onClick={handleAddQuestion}
          className="w-full justify-start gap-2 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Add new page
        </Button>
      </div>
    </aside>
  );
}

/** -------------------- Item -------------------- */
function QuizListItem({
  index,
  data,
  active,
  onClick,
  onRemove,
}: {
  index: number;
  data: QuizPageItem;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const { title, durationSec = 20, hasMedia, thumbUrl, isValid } = data;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative w-full cursor-pointer rounded-xl border-2 transition-all overflow-hidden",
        active
          ? "border-violet-500 shadow-md"
          : "border-neutral-200 dark:border-neutral-800 hover:shadow-sm"
      )}>

      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div className="text-neutral-400">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Badge nomor */}
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-white text-xs font-semibold">
            {index}
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{title}</div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {durationSec}s
              </span>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {hasMedia ? "Media" : "No media"}
              </span>
            </div>
          </div>

          {/* Valid badge */}
          {isValid && (
            <div className="text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}

          {/* Tombol hapus: rectangle di sebelah kanan, bg-red dengan icon trash */}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="inline-flex items-center gap-2 py-2 px-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

        </div>
      </CardContent>
    </Card>
  );
}
