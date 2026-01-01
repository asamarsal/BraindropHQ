"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { QuizPageItem } from "@/components/custom/viewhalamanquizcard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ImagePlus,
  Plus,
  CheckCircle2,
  Circle,
  Square,
  Triangle,
  Diamond,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Shape = "triangle" | "diamond" | "circle" | "square";

type Answer = {
  id: string;
  text: string;
  color: "red" | "blue" | "yellow" | "green";
  shape: Shape;
  optional?: boolean;
  media?: File | null;
};

const defaultAnswers: Answer[] = [
  { id: "a1", text: "", color: "red", shape: "triangle" },
  { id: "a2", text: "", color: "blue", shape: "diamond" },
  { id: "a3", text: "", color: "yellow", shape: "circle", optional: true },
  { id: "a4", text: "", color: "green", shape: "square", optional: true },
];

const ShapeIcon = ({ shape }: { shape: Shape }) => {
  const map = { triangle: Triangle, diamond: Diamond, circle: Circle, square: Square };
  const Icon = map[shape];
  return <Icon className="h-4 w-4" />;
};

export type InputquizCardHandle = {
  save: () => void;
};

type InputquizCardProps = {
  selectedQuestion?: QuizPageItem | null;
  onUpdateQuestion?: (patch: Partial<QuizPageItem>) => void;
  selectedBg?: number | string | null;
  onSelectBg?: (bg: number | string | null) => void;
};

export const InputquizCard = forwardRef<InputquizCardHandle, InputquizCardProps>(({
  selectedQuestion = null,
  onUpdateQuestion,
  selectedBg = null,
  onSelectBg
}, ref) => {
  const [question, setQuestion] = useState("");
  const [timerquiz, setTimerquiz] = useState("");
  const [answers, setAnswers] = useState<Answer[]>(defaultAnswers);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const mediaRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // New handler for BG upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSelectBg?.(url);
  };

  const onDropMedia = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    console.log("Question media selected:", file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onAnswerMedia = (id: string, file?: File) => {
    setAnswers((prev) => prev.map((a) => (a.id === id ? { ...a, media: file ?? null } : a)));
  };

  const addMoreAnswer = () => {
    if (answers.length >= 6) return; // contoh batas
    const idx = answers.length + 1;
    const palette: Answer["color"][] = ["red", "blue", "yellow", "green"];
    const shapes: Shape[] = ["triangle", "diamond", "circle", "square"];
    setAnswers((prev) => [
      ...prev,
      {
        id: `a${idx}`,
        text: "",
        color: palette[idx % 4],
        shape: shapes[idx % 4],
        optional: true,
      },
    ]);
  };

  const removeAnswer = (id: string) => {
    setAnswers((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((a) => a.id !== id);
      // reset correctId jika yang dihapus adalah jawaban benar
      if (correctId && id === correctId) setCorrectId(null);
      return next;
    });
  };

  const colorClasses: Record<Answer["color"], string> = {
    red: "bg-red-500",
    blue: "bg-blue-600",
    yellow: "bg-amber-500",
    green: "bg-green-600",
  };

  useEffect(() => {
    if (selectedQuestion) {
      setTimerquiz(String(selectedQuestion.durationSec ?? ""));
    } else {
      setTimerquiz("");
    }
  }, [selectedQuestion?.id]);

  const handleTimerChange = (val: string) => {
    setTimerquiz(val);
    const n = Number(val);
    if (selectedQuestion && onUpdateQuestion) {
      onUpdateQuestion({ durationSec: Number.isFinite(n) ? n : undefined });
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Input pertanyaan */}
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Write your own question..."
        className="h-12 text-lg rounded-xl bg-white dark:bg-neutral-900/70"
      />

      <div className="flex flex-row gap-2 items-end">
        {Array.from({ length: 8 }).map((_, i) => {
          const idx = i + 1;
          const isSelected = selectedBg === idx;
          return (
            <div
              key={`bg${idx}`}
              className={cn(
                "rounded-md cursor-pointer transition-all",
                isSelected ? "p-1.5" : "w-[65px] h-[40px]"
              )}
              style={isSelected ? { backgroundColor: '#4056fb', width: '65px', height: '40px' } : {}}
              onClick={() => onSelectBg?.(idx)}
            >
              <div className="w-full h-full rounded-sm overflow-hidden">
                <img
                  src={`/background/bg${idx}.png`}
                  alt={`Background ${idx}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-2 ml-auto">
          {/* Add Image Button */}
          <div
            className="cursor-pointer text-sm font-medium text-white/90 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition"
            onClick={() => bgInputRef.current?.click()}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={bgInputRef}
              onChange={handleBgUpload}
            />
            <div className="flex items-center justify-center bg-white/20 rounded-full w-5 h-5">
              <Plus size={14} className="text-white" />
            </div>
            <span>Add image</span>
          </div>

          <div className="w-[1px] h-6 bg-white/20 mx-2" />

          <Input
            type="number"
            min={0}
            value={timerquiz}
            onChange={(e) => handleTimerChange(e.target.value)}
            placeholder="30"
            className="w-28 h-10 rounded-lg bg-white dark:bg-neutral-900/70"
          />
          <h1 className="text-white">Seconds</h1>
        </div>
      </div>


      {/* Kartu upload media pertanyaan */}
      <Card className="border-0 shadow-md bg-white dark:bg-neutral-900/70">
        <CardContent className="p-0">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onDropMedia(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center text-center gap-2 h-56 rounded-xl cursor-pointer relative",
              previewUrl ? "p-2" : ""
            )}
          >
            {previewUrl ? (
              // Preview container
              <div className="relative w-full h-full group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setPreviewUrl(null);
                    }}
                  >
                    Change Media
                  </Button>
                </div>
              </div>
            ) : (
              // Upload UI
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white dark:bg-neutral-800">
                  <UploadCloud className="h-12 w-12" />
                </div>
                <div className="text-sm font-medium">
                  Find or attach your media
                </div>
                <div className="text-xs text-neutral-500">
                  <span className="underline">Import file</span> or drag your file to here to upload
                </div>
                <input
                  ref={mediaRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={(e) => onDropMedia(e.target.files)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => mediaRef.current?.click()}
                >
                  <Plus className="mr-1 h-4 w-4" /> Choose File
                </Button>
              </>
            )}
          </label>
        </CardContent>
      </Card>

      {/* Grid jawaban */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {answers.map((a) => (
          <AnswerTile
            key={a.id}
            answer={a}
            isCorrect={correctId === a.id}
            onChangeText={(val) =>
              setAnswers((prev) => prev.map((x) => (x.id === a.id ? { ...x, text: val } : x)))
            }
            onToggleCorrect={() => setCorrectId((prev) => (prev === a.id ? null : a.id))}
            onPickMedia={(file) => onAnswerMedia(a.id, file)}
            onRemove={() => removeAnswer(a.id)}
            showRemove={(a.optional ?? false) || answers.length > 2}
            barClass={colorClasses[a.color]}
          />
        ))}
      </div>

      {/* Tambah jawaban */}
      <div className="flex justify-center">
        <Button variant="secondary" className="rounded-full" onClick={addMoreAnswer}>
          <Plus className="h-4 w-4 mr-1" />
          Add more answer
        </Button>
      </div>
    </div>
  );
});

function AnswerTile({
  answer,
  barClass,
  isCorrect,
  onChangeText,
  onToggleCorrect,
  onPickMedia,
  onRemove,
  showRemove,
}: {
  answer: Answer;
  barClass: string;
  isCorrect: boolean;
  onChangeText: (val: string) => void;
  onToggleCorrect: () => void;
  onPickMedia: (file?: File) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const optionalLabel = answer.optional ? " (optional)" : "";

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl border bg-white dark:bg-neutral-900/70 px-3 py-3 shadow-sm",
        "focus-within:ring-2 focus-within:ring-violet-500"
      )}
    >
      {showRemove && (
        <button
          type="button"
          aria-label="Remove answer"
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 grid h-6 w-6 place-items-center
                  rounded-full border border-black/50 bg-white text-neutral-600 shadow-sm
                  hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          <X className="h-3.5 w-3.5 cursor-pointer" />
        </button>
      )}

      {/* bar warna kiri + shape */}
      <div className={cn("flex items-center justify-center shrink-0 rounded-md text-white", barClass, "w-16 h-12")}>
        <ShapeIcon shape={answer.shape} />
      </div>

      {/* input jawaban */}
      <div className="flex-1">
        <Input
          value={answer.text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={`Add answer ${getIndexSuffix(answer.id)}${optionalLabel}`}
          className="rounded-lg bg-white/70 dark:bg-neutral-900/60"
        />
      </div>

      {/* tombol tambah gambar + tandai benar */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          title="Tambah media"
          onClick={() => fileRef.current?.click()}
          className="hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickMedia(e.target.files?.[0])}
        />
        <Button
          variant={isCorrect ? "default" : "outline"}
          size="icon"
          onClick={onToggleCorrect}
          className={cn(
            "transition",
            isCorrect ? "bg-emerald-500 hover:bg-emerald-600" : "hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
          )}
          title={isCorrect ? "Jawaban benar" : "Tandai sebagai benar"}
        >
          <CheckCircle2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function getIndexSuffix(id: string) {
  const n = Number(id.replace(/\D/g, "")) || 1;
  return n;
}
