"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, defaultText?: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    id: {
        "Write your own question...": "Tulis pertanyaan Anda...",
        "Seconds": "Detik",
        "Add image": "Tambah gambar",
        "Add more answer": "Tambah jawaban",
        "Add answer": "Tambah jawaban",
        "Save": "Simpan",
        "Find or attach your media": "Cari atau lampirkan media Anda",
        "Import file": "Impor file",
        "Choose File": "Pilih File",
        "or drag your file to here to upload": "atau tarik file Anda ke sini untuk mengunggah",
        "Change Media": "Ganti Media",
        "Host": "Host",
        "Themes": "Tema",
        "Light": "Terang",
        "Dark": "Gelap",
        "Language": "Bahasa",
        "System": "Sistem",
        "Pertanyaan": "Pertanyaan"
    },
    en: {
        "Write your own question...": "Write your own question...",
        "Seconds": "Seconds",
        "Add image": "Add image",
        "Add more answer": "Add more answer",
        "Add answer": "Add answer",
        "Save": "Save",
        "Find or attach your media": "Find or attach your media",
        "Import file": "Import file",
        "Choose File": "Choose File",
        "or drag your file to here to upload": "or drag your file to here to upload",
        "Change Media": "Change Media",
        "Host": "Host",
        "Themes": "Themes",
        "Light": "Light",
        "Dark": "Dark",
        "Language": "Language",
        "System": "System",
        "Pertanyaan": "Question"
    }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'id' || saved === 'en')) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string, defaultText?: string) => {
        // If not mounted (server side), default to key or en
        if (!mounted) return defaultText || key;
        return translations[language][key] || defaultText || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
