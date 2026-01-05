"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

type AudioContextType = {
    muted: boolean;
    toggleMute: () => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [muted, setMuted] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load saved preference
    useEffect(() => {
        const saved = localStorage.getItem("bdhq-muted");
        if (saved !== null) setMuted(saved === "true");
    }, []);

    // Save preference
    useEffect(() => {
        localStorage.setItem("bdhq-muted", String(muted));
    }, [muted]);

    // Handle Playback
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
                // Autoplay blocked, wait for interaction
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

    const toggleMute = useCallback(() => setMuted((prev) => !prev), []);

    return (
        <AudioContext.Provider value={{ muted, toggleMute }}>
            <audio
                ref={audioRef}
                src="/music/background-music.mp3"
                autoPlay
                loop
                playsInline
                className="hidden"
            />
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
}
