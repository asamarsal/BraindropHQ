'use client';

import { useState } from "react";
import Topbar from "@/components/custom/topbar";
import { NewquizCard } from "@/components/custom/newquizcard"
import { InputquizCard } from "@/components/custom/inputquizcard"
import { QuizPageItem, ViewhalamanquizCard } from "@/components/custom/viewhalamanquizcard"
import { Button } from "@/components/ui/button";

const generateId = () => `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function HostPage() {

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

  function updateQuestion(id: string, patch: Partial<QuizPageItem>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 pt-14">
      <Topbar />
      <div className="flex items-start gap-12">
        <div className="self-start sticky top-15 overflow-x-hidden">
          <ViewhalamanquizCard
            items={questions}
            activeId={selectedId ?? undefined}
            onSelect={(id) => setSelectedId(id)}
            onAdd={() => {
              const newQ: QuizPageItem = { id: `q${questions.length+1}`, title: `Pertanyaan ${questions.length+1}`, durationSec: 20, hasMedia: false, thumbUrl: "", isValid: false };
              setQuestions([...questions, newQ]);
              setSelectedId(newQ.id);
            }}
            onCreate={() => {}}
            onTitleChange={(v) => {
              if (!selectedId) return;
              updateQuestion(selectedId, { title: v });
            }}
            setQuestions={setQuestions} // optional: kalau Viewhalaman ingin mutate langsung
          />
        </div>

        <div className="mt-6">
          <div className="max-w-3xl">
            <InputquizCard
              selectedQuestion={questions.find(q => q.id === selectedId) ?? null}
              onUpdateQuestion={(patch) => { if (selectedId) updateQuestion(selectedId, patch); }}
            />
          </div>
        </div>

        <div className="mt-6">
          <Button className="w-[140px] h-[20px] p-6">Save</Button>
        </div>

      </div>
    </div>
  );
}