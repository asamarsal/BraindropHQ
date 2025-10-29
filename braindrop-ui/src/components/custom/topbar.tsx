'use client';

import { Volume2, VolumeOff, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { LoginCard } from "@/components/custom/logincard";

export default function Topbar() {
  const [muted, setMuted] = useState<boolean>(false);
  const [loginClicked, setLoginClicked] = useState(false);
  const [showLoginCard, setShowLoginCard] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("bdhq-muted");
    if (saved !== null) setMuted(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("bdhq-muted", String(muted));
  }, [muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = muted;
    if (muted) {
      audio.pause();
      return;
    }

    const playOnInteraction = async () => {
      try {
        await audio.play();
      } finally {
        window.removeEventListener("pointerdown", playOnInteraction);
        window.removeEventListener("keydown", playOnInteraction);
      }
    };

    const unlockPlayback = async () => {
      try {
        await audio.play();
      } catch {
        
        window.addEventListener("pointerdown", playOnInteraction, { once: true });
        window.addEventListener("keydown", playOnInteraction, { once: true });
      }
    };

    unlockPlayback();

    return () => {
      window.removeEventListener("pointerdown", playOnInteraction);
      window.removeEventListener("keydown", playOnInteraction);
    };
  }, [muted]);

  useEffect(() => {
    if (!loginClicked) return;
    setShowLoginCard(true);
    setLoginClicked(false);
  }, [loginClicked]);

  useEffect(() => {
    if (!showLoginCard) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showLoginCard]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);
  const closeLoginCard = useCallback(() => setShowLoginCard(false), []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-black/60 backdrop-blur-md border-b border-black shadow-sm">
        <audio
          ref={audioRef}
          src="/music/background-music.mp3"
          autoPlay
          loop
          playsInline
          className="hidden"
        />
        <div className="w-full py-2 flex justify-between">
          <Link href="/" className="pl-2">
            <img src="/icon/braindrophq3.png" alt="BrainDrop HQ Logo" className="h-8 w-auto pt-2" />
          </Link>
          <div className="flex gap-2 items-end pr-4">
            <div>
              <button
                type="button"
                onClick={() => setLoginClicked(true)}
                className="px-6 py-2 rounded-lg border border-black/20 text-black dark:border-white/40 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Login
              </button>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              {muted ? (
                <VolumeOff className="text-black dark:text-white" size={24} />
              ) : (
                <Volume2 className="text-black dark:text-white" size={24} />
              )}
            </button>
          </div>
        </div>
      </header>
      {showLoginCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative">
            <button
              type="button"
              aria-label="Close login"
              onClick={closeLoginCard}
              className="absolute -top-3 -right-3 rounded-full bg-white p-1 shadow-md hover:bg-gray-100 transition"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
            <LoginCard />
          </div>
        </div>
      )}
    </>
  );
}
