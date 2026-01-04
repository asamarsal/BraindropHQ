"use client";

import { Volume2, VolumeOff, X, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { LoginCard } from "@/components/custom/logincard";
import { ThemeLanguageToggle } from "@/components/custom/theme-language-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Topbar() {
  const [muted, setMuted] = useState<boolean>(false);
  const [loginClicked, setLoginClicked] = useState(false);
  const [showLoginCard, setShowLoginCard] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col transition-all">
        {/* Main Bar */}
        <div className="h-14 w-full bg-white/60 dark:bg-black/50 backdrop-blur-md border-b border-white/20 shadow-sm flex items-center justify-between px-4 relative z-50">
          <audio
            ref={audioRef}
            src="/music/background-music.mp3"
            autoPlay
            loop
            playsInline
            className="hidden"
          />
          <Link href="/" className="flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/icon/braindrophq3.png" alt="BrainDrop HQ Logo" className="h-8 w-auto pt-2 dark:invert transition-all" />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors outline-none cursor-pointer">
                Quiz
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <DropdownMenuItem asChild>
                  <Link href="/create" className="w-full cursor-pointer">
                    Interactive Quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/roulette" className="w-full cursor-pointer">
                    Roulette
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeLanguageToggle />

            <button
              type="button"
              onClick={() => setLoginClicked(true)}
              className="px-6 py-2 rounded-lg border border-black/20 text-black dark:border-white/40 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
            >
              Login
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              {muted ? (
                <VolumeOff className="text-black dark:text-white" size={20} />
              ) : (
                <Volume2 className="text-black dark:text-white" size={20} />
              )}
            </button>
          </div>

          {/* MOBILE TOGGLE + ICONS */}
          <div className="flex md:hidden gap-2 items-center">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              {muted ? (
                <VolumeOff className="text-black dark:text-white" size={20} />
              ) : (
                <Volume2 className="text-black dark:text-white" size={20} />
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition text-black dark:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN MENU */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 w-full bg-white/60 dark:bg-black/50 backdrop-blur-md border-b border-white/20 shadow-lg z-40 animate-in slide-in-from-top-1">
            <div className="flex flex-col p-4 space-y-3">
              <Link
                href="/create"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium text-black dark:text-white transition"
              >
                Interactive Quiz
              </Link>
              <Link
                href="/roulette"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium text-black dark:text-white transition"
              >
                Roulette
              </Link>

              <div className="h-px bg-black/10 dark:bg-white/10 my-1" />

              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm font-medium text-black dark:text-white">Appearance</span>
                <ThemeLanguageToggle />
              </div>

              <button
                onClick={() => {
                  setLoginClicked(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-center px-4 py-3 bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold rounded-lg mt-2 active:scale-95 transition"
              >
                Login
              </button>
            </div>
          </div>
        )}
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
