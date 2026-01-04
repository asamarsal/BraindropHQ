"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Image as ImageIcon,
  Trash2,
  Check,
  UploadCloud,
  Sparkles,
  ImagePlus,
  CheckCircle2,
  Plus,
  Triangle,
  Diamond,
  Circle,
  Square,
  Star,
  Moon,
  Sigma
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/language-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QuizPageItem, Answer, Shape } from "@/components/custom/viewhalamanquizcard";

const defaultAnswers: Answer[] = [
  { id: "a1", text: "", color: "red", shape: "triangle" },
  { id: "a2", text: "", color: "blue", shape: "diamond" },
  { id: "a3", text: "", color: "yellow", shape: "circle", optional: true },
  { id: "a4", text: "", color: "green", shape: "square", optional: true },
];

const ShapeIcon = ({ shape }: { shape: Shape }) => {
  const map = {
    triangle: Triangle,
    diamond: Diamond,
    circle: Circle,
    square: Square,
    star: Star,
    moon: Moon,
    sigma: Sigma
  };
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
  const { t } = useLanguage();
  const [question, setQuestion] = useState("");
  const [timerquiz, setTimerquiz] = useState("");
  const [answers, setAnswers] = useState<Answer[]>(defaultAnswers);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const mediaRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Set initial state when selectedQuestion changes (Restore Data)
  useEffect(() => {
    if (selectedQuestion) {
      setQuestion(selectedQuestion.title || "");
      setTimerquiz(String(selectedQuestion.durationSec ?? ""));

      // Restore answers
      if (selectedQuestion.answers && selectedQuestion.answers.length > 0) {
        setAnswers(selectedQuestion.answers);
      } else {
        setAnswers(defaultAnswers);
      }

      // Restore Media
      setPreviewUrl(selectedQuestion.questionMedia ?? null);

      // Restore Background: Trigger parent callback to update its display state if needed
      if (selectedQuestion.backgroundId !== undefined && onSelectBg) {
        onSelectBg(selectedQuestion.backgroundId);
      } else if (onSelectBg) {
        // careful not to infinite loop if parent updates prop -> effect -> parent
        // But here we set it once on ID change.
        onSelectBg(null);
      }

    } else {
      setQuestion("");
      setTimerquiz("");
      setAnswers(defaultAnswers);
      setPreviewUrl(null);
      if (onSelectBg) onSelectBg(null);
    }
  }, [selectedQuestion?.id]);

  useImperativeHandle(ref, () => ({
    save: () => {
      if (selectedQuestion && onUpdateQuestion) {
        onUpdateQuestion({
          title: question,
          durationSec: Number(timerquiz) || 20,
          answers: answers,
          questionMedia: previewUrl,
          backgroundId: selectedBg
        });
      }
    }
  }));

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
    if (answers.length >= 6) {
      toast.warning(t("Maksimal 6 pilihan jawaban"));
      return;
    }
    const idx = answers.length; // Use current length (0-based index logically for array, but palette is 0-indexed)
    // Actually answers length starts at 4. so idx 4 is the 5th item.

    // Define 6 unique colors and shapes
    const fullPalette: Answer["color"][] = ["red", "blue", "yellow", "green", "purple", "orange"];
    const fullShapes: Shape[] = ["triangle", "diamond", "circle", "square", "star", "sigma"];

    const newColor = fullPalette[idx % 6];
    const newShape = fullShapes[idx % 6];

    setAnswers((prev) => [
      ...prev,
      {
        id: `a${idx + 1}`,
        text: "",
        color: newColor,
        shape: newShape,
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
    purple: "bg-purple-600",
    orange: "bg-orange-500"
  };

  /* -------------------------------------------------------------------------- */
  /*                             AI Logic                                       */
  /* -------------------------------------------------------------------------- */
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const generateQuiz = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          count: answers.length
        })
      });
      const data = await res.json();

      if (data.error) {
        alert("AI Error: " + data.error);
        return;
      }

      // Populate fields
      setQuestion(data.title); // Update title via local state (will sync via effect/save later depending on flow, but current structure updates parent on save or prop change)
      // Note: InputquizCard uses local 'question' state. To propagate up, we call onUpdateQuestion.
      onUpdateQuestion?.({ title: data.title });
      setQuestion(data.title);

      const validAnswers = data.answers.filter((ans: { text: string }) => ans.text && ans.text.trim().length > 0);
      const newAnswers = validAnswers.map((ans: { text: string }, index: number) => ({
        id: `a${index + 1}`, // Ensure unique IDs
        text: ans.text,
        color: defaultAnswers[index % defaultAnswers.length].color, // Assign colors cyclically
        shape: defaultAnswers[index % defaultAnswers.length].shape, // Assign shapes cyclically
        optional: index >= 2, // Make answers optional after the first two
        media: null,
      }));
      setAnswers(newAnswers);
      const correctAns = newAnswers.find((ans: { text: string }) => data.answers.find((dAns: { text: string; isCorrect: boolean }) => dAns.text === ans.text && dAns.isCorrect));
      if (correctAns) {
        setCorrectId(correctAns.id);
      } else {
        setCorrectId(null);
      }

      onUpdateQuestion?.({ title: data.title }); // Update parent again if needed for robust sync
      // Actually 'answers' logic is complex in this component, let's see checkValidity

      setAiDialogOpen(false);
      setAiTopic("");

    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz");
    } finally {
      setAiLoading(false);
    }
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


  /* -------------------------------------------------------------------------- */
  /*                             Render                                         */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-20">

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("Pertanyaan")}
          </Label>
          {/* AI Dialog Trigger */}
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 transition-opacity">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium">Generate AI</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generate Quiz with AI</DialogTitle>
                <DialogDescription>
                  Enter a topic and let AI create a question for you.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="topic" className="text-right">
                    Topic
                  </Label>
                  <Input
                    id="topic"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Sejarah Indonesia"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={generateQuiz} disabled={aiLoading}>
                  {aiLoading ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("Write your own question...")}
          className="h-12 text-lg rounded-xl bg-white/60 dark:bg-black/50 backdrop-blur-md border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
        />
      </div>

      {/* Row: Background Selection + Timer */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end">

        {/* Backgrounds + Timer Group */}
        <div className="flex flex-wrap gap-2 items-end w-full">
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

          {/* Add Image Button */}
          <div
            className="cursor-pointer text-sm font-medium text-white/90 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition h-[40px]"
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
            <span>{t("Add image")}</span>
          </div>

          {/* Divider & Timer moved here to be "sejajar"/aligned with images */}
          <div className="w-[1px] h-6 bg-white/20 mx-2 hidden md:block" />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={timerquiz}
              onChange={(e) => handleTimerChange(e.target.value)}
              placeholder="30"
              className="w-20 h-10 rounded-lg bg-white/60 dark:bg-black/50 backdrop-blur-md border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 text-center"
            />
            <h1 className="text-slate-900 dark:text-white font-medium whitespace-nowrap text-sm">{t("Detik")}</h1>
          </div>
        </div>

      </div>
      {/* Kartu upload media pertanyaan */}
      <Card className="border border-white/20 shadow-md bg-white/60 dark:bg-black/50 backdrop-blur-md">
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
                    {t("Change Media")}
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
                  {t("Find or attach your media")}
                </div>
                <div className="text-xs text-neutral-500">
                  <span className="underline">{t("Import file")}</span> {t("or drag your file to here to upload")}
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
                  <Plus className="mr-1 h-4 w-4" /> {t("Choose File")}
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
          {t("Add more answer")}
        </Button>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          className="w-[140px] h-[45px]"
          onClick={() => {
            if (selectedQuestion && onUpdateQuestion) {
              onUpdateQuestion({
                title: question,
                durationSec: Number(timerquiz) || 20,
                answers: answers,
                questionMedia: previewUrl,
                backgroundId: selectedBg
              });
              toast.success(`${question || "Halaman"} disimpan`);
            }
          }}
        >
          {t("Simpan")}
        </Button>
      </div>
    </div>
  );
});

InputquizCard.displayName = "InputquizCard";

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
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const optionalLabel = answer.optional ? " (optional)" : "";

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl border border-white/20 bg-white/60 dark:bg-black/50 backdrop-blur-md px-3 py-3 shadow-sm transition-all",
        "focus-within:ring-2 focus-within:ring-violet-500 hover:bg-white/70 dark:hover:bg-black/60"
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
          placeholder={`${t("Add answer")} ${getIndexSuffix(answer.id)}${optionalLabel}`}
          className="rounded-lg bg-white/40 dark:bg-white/5 border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
