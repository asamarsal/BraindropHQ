'use client';

import { useState, useRef } from "react";
import Topbar from "@/components/custom/topbar";
import { InputquizCard, InputquizCardHandle } from "@/components/custom/inputquizcard"
import { QuizPageItem, ViewhalamanquizCard } from "@/components/custom/viewhalamanquizcard"
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/language-provider";
import { Menu, X } from "lucide-react";

const generateId = () => `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function HostPage() {
  const { t } = useLanguage();
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Desktop Sidebar - Hidden on mobile, fixed on desktop */}
      <div className="hidden md:block fixed top-14 left-0 bottom-0 z-40">
        <ViewhalamanquizCard
          items={questions}
          activeId={selectedId ?? undefined}
          onSelect={(id) => setSelectedId(id)}
          onAdd={() => {
            const newQ: QuizPageItem = {
              id: `q${questions.length + 1}`,
              title: `${t("Pertanyaan")} ${questions.length + 1}`,
              durationSec: 20,
              hasMedia: false,
              thumbUrl: "",
              isValid: false
            };
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

      {/* Mobile Sidebar Overlay (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="absolute left-0 top-14 bottom-0 w-[260px] flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full relative">
              <ViewhalamanquizCard
                items={questions}
                activeId={selectedId ?? undefined}
                onSelect={(id) => {
                  setSelectedId(id);
                  setIsMobileMenuOpen(false); // Close sidebar on selection
                }}
                onAdd={() => {
                  const newQ: QuizPageItem = {
                    id: `q${questions.length + 1}`,
                    title: `${t("Pertanyaan")} ${questions.length + 1}`,
                    durationSec: 20,
                    hasMedia: false,
                    thumbUrl: "",
                    isValid: false
                  };
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
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="ml-0 md:ml-[260px] p-4 md:p-6 relative z-10 flex flex-col items-start gap-6 md:gap-12">

        {/* Mobile Menu Button */}
        <div className="md:hidden w-full flex justify-start">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <div className="w-full flex-1">
          <InputquizCard
            ref={inputCardRef}
            selectedQuestion={questions.find(q => q.id === selectedId) ?? null}
            onUpdateQuestion={(patch) => { if (selectedId) updateQuestion(selectedId, patch); }}
            selectedBg={selectedBg}
            onSelectBg={setSelectedBg}
          />
        </div>
      </div>
    </div>
  );
}
