"use client";

import React, { useEffect, useState, useRef } from 'react';
import { type RouletteEntry } from '@/lib/roulette/types';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface RouletteWheelProps {
    entries: RouletteEntry[];
    isSpinning: boolean;
    rotation: number; // Target rotation in degrees
    onSpinComplete: () => void;
    onSpinClick: () => void;
}

const COLORS = [
    '#EF4444', // Red 500
    '#3B82F6', // Blue 500
    '#F59E0B', // Amber 500
    '#2DD4BF', // Teal 400
    '#8B5CF6', // Violet 500
    '#A3E635', // Lime 400
    '#EC4899', // Pink 500
    '#22D3EE', // Cyan 400
    '#F97316', // Orange 500
    '#6366F1', // Indigo 500
    '#10B981', // Emerald 500
    '#E879F9', // Fuchsia 400
    '#FACC15', // Yellow 400
    '#38BDF8', // Sky 400
    '#FB7185', // Rose 400
    '#4ADE80', // Green 400
];

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
    entries,
    isSpinning,
    rotation,
    onSpinComplete,
    onSpinClick
}) => {
    const wheelRef = useRef<HTMLDivElement>(null);
    const [currentRotation, setCurrentRotation] = useState(0);
    const [arrowColor, setArrowColor] = useState<string>("white");

    // Memoize assigned colors to prevent flickering and ensure consistency
    const entriesWithColors = React.useMemo(() => {
        if (entries.length === 0) return [];

        const assigned = entries.map((entry, index) => {
            // Default sequential assignment
            let colorIndex = index % COLORS.length;

            // Logic to prevent adjacent duplicates
            // Especially for the last item wrapping around to the first
            if (index === entries.length - 1 && entries.length > 2) {
                const firstColorIndex = 0; // First item always gets index 0 typically
                const prevColorIndex = (index - 1) % COLORS.length;

                // While acts like first OR acts like previous (collision), shift
                while (
                    colorIndex === firstColorIndex ||
                    colorIndex === prevColorIndex
                ) {
                    colorIndex = (colorIndex + 1) % COLORS.length;
                }
            }

            return { ...entry, displayColor: entry.color || COLORS[colorIndex] };
        });

        return assigned;
    }, [entries]);

    // Sync rotation prop to local state for animation
    useEffect(() => {
        if (isSpinning) {
            setCurrentRotation(rotation);
        }
    }, [isSpinning, rotation]);

    // Dynamic color update during spin
    useEffect(() => {
        let animationFrameId: number;

        const updateColor = () => {
            if (!wheelRef.current || entriesWithColors.length === 0) return;

            const style = window.getComputedStyle(wheelRef.current);
            const matrix = new WebKitCSSMatrix(style.transform);
            let angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            let relativeAngle = (90 - angle) % 360;
            if (relativeAngle < 0) relativeAngle += 360;

            const segmentAngle = 360 / entriesWithColors.length;
            const index = Math.floor(relativeAngle / segmentAngle) % entriesWithColors.length;

            const color = entriesWithColors[index]?.displayColor || "white";
            setArrowColor(color);

            if (isSpinning) {
                animationFrameId = requestAnimationFrame(updateColor);
            }
        };

        if (isSpinning) {
            animationFrameId = requestAnimationFrame(updateColor);
        } else {
            const angle = rotation % 360;
            let relativeAngle = (90 - angle) % 360;
            if (relativeAngle < 0) relativeAngle += 360;
            const segmentAngle = 360 / Math.max(1, entriesWithColors.length);
            const index = Math.floor(relativeAngle / segmentAngle) % entriesWithColors.length;
            const color = entriesWithColors[index]?.displayColor || "white";
            setArrowColor(color);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isSpinning, entriesWithColors, rotation]);

    // Handle transition end to trigger completion
    const handleTransitionEnd = () => {
        if (isSpinning) {
            onSpinComplete();
        }
    };

    const totalEntries = entriesWithColors.length;
    const segmentAngle = 360 / Math.max(1, totalEntries);

    if (totalEntries === 0) {
        return (
            <div className="w-[500px] h-[500px] rounded-full border-8 border-slate-800 bg-slate-900 flex items-center justify-center shadow-2xl">
                <span className="text-slate-500 font-bold text-xl">Add names to start</span>
            </div>
        );
    }

    return (
        <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            {/* Pointer (SVG) - Absolute positioned to the right (0 degrees) */}
            <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 filter drop-shadow-lg transition-colors duration-200">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-90">
                    <path d="M30 60L10 20H50L30 60Z" fill={arrowColor} className="transition-colors duration-100" />
                    <path d="M30 55L15 20H45L30 55Z" fill="#e2e8f0" fillOpacity="0.3" />
                </svg>
            </div>

            {/* The Rotating Wheel */}
            <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-8 border-slate-800 shadow-2xl overflow-hidden relative transition-transform cubic-bezier(0.2, 0, 0.2, 1)"
                style={{
                    transform: `rotate(${currentRotation}deg)`,
                    transitionDuration: isSpinning ? '4s' : '0s', // 4 second spin
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                {/* Segments */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {entriesWithColors.map((entry, index) => {
                        // Calculate SVG Path for Segment
                        // x = r * cos(a), y = r * sin(a)
                        const startAngle = index * segmentAngle;
                        const endAngle = (index + 1) * segmentAngle;

                        // Convert to radians
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        // 50,50 is center, radius 50
                        const x1 = 50 + 50 * Math.cos(startRad);
                        const y1 = 50 + 50 * Math.sin(startRad);
                        const x2 = 50 + 50 * Math.cos(endRad);
                        const y2 = 50 + 50 * Math.sin(endRad);

                        const largeArc = segmentAngle > 180 ? 1 : 0;

                        const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;

                        // Text Position (Midpoint radius 2/3)
                        const midAngle = startAngle + (segmentAngle / 2);
                        const midRad = (midAngle * Math.PI) / 180;
                        const tx = 50 + 35 * Math.cos(midRad);
                        const ty = 50 + 35 * Math.sin(midRad);

                        return (
                            <g key={entry.id}>
                                <path
                                    d={pathData}
                                    fill={entry.displayColor}
                                    stroke="#1e293b"
                                    strokeWidth="0.5"
                                />
                                <text
                                    x={tx}
                                    y={ty}
                                    fill="white"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="4"
                                    fontWeight="bold"
                                    transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                                >
                                    {entry.text.length > 12 ? entry.text.substring(0, 10) + '..' : entry.text}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Center Spin Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-slate-200 cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={onSpinClick}>
                {isSpinning ? (
                    <span className="font-bold text-slate-900 text-xs text-center leading-tight">GOOD<br />LUCK</span>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="font-black text-slate-900 text-sm">SPIN</span>
                    </div>
                )}
            </div>
        </div>
    );
};
