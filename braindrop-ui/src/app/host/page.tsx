'use client';

import { useState, useRef } from "react";
import Topbar from "@/components/custom/topbar";
import { InputquizCard, InputquizCardHandle } from "@/components/custom/inputquizcard"
import { QuizPageItem, ViewhalamanquizCard } from "@/components/custom/viewhalamanquizcard"
import { Button } from "@/components/ui/button";

const generateId = () => `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function HostPage() {
  const inputCardRef = useRef<InputquizCardHandle>(null);

  const [questions, setQuestions] = useState<QuizPageItem[]>([
    {
      id: generateId(),
      title: "Pertanyaan 1",
      durationSec: 20,
      hasMedia: false,
      thumbUrl: "",
      isValid: false
    }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);
  const [selectedBg, setSelectedBg] = useState<number | string | null>(null);

  function updateQuestion(id: string, patch: Partial<QuizPageItem>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  // Helper untuk mendapatkan URL background
  const getBgStyle = () => {
    if (typeof selectedBg === 'number') {
      return { backgroundImage: `url(/background/bg${selectedBg}.png)` };
    }
    if (typeof selectedBg === 'string') {
      return { backgroundImage: `url(${selectedBg})` };
    }
    return {};
  };

  return (
    <div className="min-h-screen pt-14 relative overflow-hidden">
      {/* Background layer */}
      {selectedBg ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={getBgStyle()}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-blue-600/50" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600" />
      )}
      <Topbar />

      {/* Sidebar - Fixed Position, starts exactly below header (top-14) */}
      <div className="fixed top-14 left-0 bottom-0 z-40">
        <ViewhalamanquizCard
          items={questions}
          activeId={selectedId ?? undefined}
          onSelect={(id) => setSelectedId(id)}
          onAdd={() => {
            const newQ: QuizPageItem = { id: `q${questions.length + 1}`, title: `Pertanyaan ${questions.length + 1}`, durationSec: 20, hasMedia: false, thumbUrl: "", isValid: false };
            setQuestions([...questions, newQ]);
            setSelectedId(newQ.id);
          }}
          onCreate={() => { }}
          onTitleChange={(v) => {
            if (!selectedId) return;
            updateQuestion(selectedId, { title: v });
          }}
          setQuestions={setQuestions}
        />
      </div>

      {/* Main Content */}
      <div className="ml-[260px] p-6 relative z-10 flex items-start gap-12">
        <div className="w-full flex-1">
          <InputquizCard
            ref={inputCardRef}
            selectedQuestion={questions.find(q => q.id === selectedId) ?? null}
            onUpdateQuestion={(patch) => { if (selectedId) updateQuestion(selectedId, patch); }}
            selectedBg={selectedBg}
            onSelectBg={setSelectedBg}
          />
        </div>

        <div className="mt-0">
          <Button
            className="w-[140px] h-[20px] p-6"
            onClick={() => inputCardRef.current?.save()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
