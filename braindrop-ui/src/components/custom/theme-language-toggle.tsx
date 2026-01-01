"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Settings } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/providers/language-provider"

export function ThemeLanguageToggle() {
    const { setTheme, theme } = useTheme()
    const { language, setLanguage, t } = useLanguage()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-[36px] w-[36px] rounded-full hover:bg-black/5 dark:hover:bg-neutral-800 text-slate-900 dark:text-white transition-colors">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Toggle theme and language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('Themes')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme("light")} className="justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                        <Sun className="h-4 w-4" /> {t('Light')}
                    </span>
                    {theme === 'light' && <span className="text-xs text-blue-500">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                        <Moon className="h-4 w-4" /> {t('Dark')}
                    </span>
                    {theme === 'dark' && <span className="text-xs text-blue-500">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" /> {t('System')}
                    </span>
                    {theme === 'system' && <span className="text-xs text-blue-500">✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>{t('Language')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setLanguage("id")} className="justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                        🇮🇩 Indonesia
                    </span>
                    {language === 'id' && <span className="text-xs text-blue-500">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className="justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                        🇺🇸 English
                    </span>
                    {language === 'en' && <span className="text-xs text-blue-500">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
