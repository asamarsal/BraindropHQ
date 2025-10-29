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
  quizTitle?: string;
};

/** -------------------- Component -------------------- */
export function ViewhalamanquizCard({
  items,
  activeId,
  onSelect,
  onAdd,
  onCreate,
  quizTitle,
  onTitleChange,
}: Props) {
  const [questions, setQuestions] = useState<QuizPageItem[]>([
    {
      id: "q1",
      title: "Pertanyaan 1",
      durationSec: 20,
      hasMedia: false,
      thumbUrl: "",
      isValid: false,
    }
  ]);

  const handleAddQuestion = () => {
    const newQuestion: QuizPageItem = {
      id: `q${questions.length + 1}`,
      title: `Pertanyaan ${questions.length + 1}`,
      durationSec: 20,
      hasMedia: false,
      thumbUrl: "",
      isValid: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(prev => {
      if (prev.length <= 1) return prev; // minimal 1 pertanyaan
      return prev.filter(q => q.id !== id);
    });
  };

  return (
    <aside className="h-[calc(100vh-3.5rem)] w-[260px] shrink-0 border-r bg-white/50 dark:bg-neutral-900/80 backdrop-blur p-3 flex flex-col">
      <div className="space-y-2">
        <div className="text-xs font-medium text-black">Quiz</div>
        <Input
          value={quizTitle ?? "Quiz Title"}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="h-9 rounded-lg text-sm"
        />
      </div>

      {/* Daftar halaman/pertanyaan dengan drag and drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div 
              className="space-y-2 mt-4 flex-1 overflow-auto"
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
        "relative cursor-pointer border-2 transition-all rounded-xl overflow-visible",
        active
          ? "border-violet-500 shadow-md"
          : "border-neutral-200 dark:border-neutral-800 hover:shadow-sm"
      )}
    >

      {/* Tombol X (hapus card) */}
      {onRemove && (
        <button
          type="button"
          title="Hapus"
          onClick={(e) => {
            e.stopPropagation(); // jangan trigger onClick card
            onRemove();
          }}
          className="absolute -top-2 -right-2 z-10 grid h-6 w-6 place-items-center
                     rounded-full border bg-white text-neutral-600 shadow-sm
                     hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

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

          {/* Thumbnail kecil */}
          <div className="h-10 w-10 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4 text-neutral-400" />
            )}
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
        </div>
      </CardContent>
    </Card>
  );
}
