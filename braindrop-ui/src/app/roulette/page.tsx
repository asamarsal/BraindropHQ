"use client";

import { useState, useRef, useEffect } from 'react';
import { io } from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Topbar from "@/components/custom/topbar";
import { RouletteWheel } from "@/components/custom/roulette-wheel";
import { RouletteGame } from "@/lib/roulette/state-manager";
import { type RouletteEntry } from "@/lib/roulette/types";
import { WinnerSelection } from '@/lib/roulette/winner-selection';
import { CommitReveal } from '@/lib/crypto/commit-reveal';
import { Trash2, Shuffle, Plus, ArrowDownAZ, ArrowUpAZ, ShieldCheck, Trophy, X } from 'lucide-react';
import { toast } from "sonner";
import QRCode from "react-qr-code";

const DEFAULT_ENTRIES: RouletteEntry[] = [
    { id: '1', text: 'Ali' },
    { id: '2', text: 'Beatriz' },
    { id: '3', text: 'Charles' },
    { id: '4', text: 'Diya' },
    { id: '5', text: 'Eric' },
    { id: '6', text: 'Fatima' },
    { id: '7', text: 'Gabriel' },
    { id: '8', text: 'Hanna' },
];

const socket = io("http://localhost:3001", { autoConnect: false });

export default function RoulettePage() {
    const gameRef = useRef<RouletteGame | null>(null);
    const [mode, setMode] = useState<'MANUAL' | 'LIVE'>('MANUAL');

    // Split State
    const [manualEntries, setManualEntries] = useState<RouletteEntry[]>(DEFAULT_ENTRIES);
    const [liveEntries, setLiveEntries] = useState<RouletteEntry[]>([]);

    // Derived state for display
    const currentEntries = mode === 'MANUAL' ? manualEntries : liveEntries;

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [newEntryText, setNewEntryText] = useState("");
    const [lastWinner, setLastWinner] = useState<RouletteEntry | null>(null);
    const [currentSeedHash, setCurrentSeedHash] = useState<string>("");
    const [roomCode, setRoomCode] = useState<string | null>(null);

    // Initialize game & socket
    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = new RouletteGame(DEFAULT_ENTRIES);
            updatePublicState();
        }

        // Socket Connection
        socket.connect();

        // Host Logic - Always active in background to keep Live list updated
        const savedCode = localStorage.getItem("host_room_code");
        if (savedCode) {
            socket.emit("reconnect_host", savedCode, (response: any) => {
                if (response.success) {
                    setRoomCode(savedCode);
                    if (response.entries) setLiveEntries(response.entries);
                } else {
                    localStorage.removeItem("host_room_code");
                    createRoom();
                }
            });
        } else {
            createRoom();
        }

        function createRoom() {
            socket.emit("create_room", (response: any) => {
                if (response.success) {
                    setRoomCode(response.roomCode);
                    localStorage.setItem("host_room_code", response.roomCode);
                    // Init live entries empty for new room
                    socket.emit("update_entries_host", {
                        roomCode: response.roomCode,
                        entries: []
                    });
                }
            });
        }

        // Listeners - Update Live List
        socket.on("update_entries", (updatedEntries: RouletteEntry[]) => {
            setLiveEntries(updatedEntries);
            // If we are in LIVE mode, we should also sync the game engine
            if (mode === 'LIVE' && gameRef.current) {
                gameRef.current.reset(updatedEntries);
                updatePublicState();
            }
        });

        return () => {
            socket.off("update_entries");
            socket.disconnect();
        };
    }, []);

    // Effect: Sync Game Engine when Mode Changes
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.reset(currentEntries);
            updatePublicState();
        }
    }, [mode, manualEntries, liveEntries]);


    // Helper to sync non-react state from Game Logic to UI
    const updatePublicState = () => {
        if (!gameRef.current) return;
        const state = gameRef.current.getState();
        const commit = CommitReveal.createCommitment(state.currentSeed);
        setCurrentSeedHash(commit);
    };

    const handleAddEntry = () => {
        if (!newEntryText.trim()) return;
        const newEntry: RouletteEntry = {
            id: Date.now().toString(),
            text: newEntryText.trim()
        };

        if (mode === 'MANUAL') {
            setManualEntries(prev => [...prev, newEntry]);
        } else {
            // Optional: Allow Admin to add to Live list manually too
            const updated = [...liveEntries, newEntry];
            setLiveEntries(updated);
            if (roomCode) socket.emit("update_entries_host", { roomCode, entries: updated });
        }
        setNewEntryText("");
    };

    const handleRemoveEntry = (id: string) => {
        if (mode === 'MANUAL') {
            setManualEntries(prev => prev.filter(e => e.id !== id));
        } else {
            const updated = liveEntries.filter(e => e.id !== id);
            setLiveEntries(updated);
            if (roomCode) socket.emit("remove_player", { roomCode, playerId: id });
        }
    };

    const handleShuffle = () => {
        const shuffled = [...currentEntries].sort(() => Math.random() - 0.5);
        if (mode === 'MANUAL') {
            setManualEntries(shuffled);
        } else {
            setLiveEntries(shuffled);
            if (roomCode) socket.emit("update_entries_host", { roomCode, entries: shuffled });
        }
    };

    const handleSpin = () => {
        if (isSpinning || !gameRef.current || currentEntries.length < 2) {
            if (currentEntries.length < 2) toast.error("Need at least 2 entries to spin!");
            return;
        }

        setIsSpinning(true);
        setLastWinner(null);

        const { result } = gameRef.current.spin();

        if (result) {
            const rawTargetAngle = WinnerSelection.calculateRotation(result.winnerIndex, currentEntries.length, 0);
            const currentTotal = rotation;
            const currentMod = currentTotal % 360;
            const targetMod = rawTargetAngle % 360;

            let diff = targetMod - currentMod;
            if (diff <= 0) diff += 360;

            const minSpins = 5;
            const finalRotation = currentTotal + diff + (360 * minSpins);

            setRotation(finalRotation);
        }
    };

    const onSpinComplete = () => {
        setIsSpinning(false);
        updatePublicState();

        const history = gameRef.current?.getState().history;
        if (history && history.length > 0) {
            const lastResult = history[history.length - 1];
            // Ensure we pick from the correct list used during spin
            const w = currentEntries[lastResult.winnerIndex];
            setLastWinner(w);
            toast.success(`Winner: ${w?.text}!`);
        }
    };

    return (
        <div className="h-screen bg-slate-950 text-white font-sans flex flex-col overflow-hidden">
            <Topbar />

            <div className="flex-1 flex flex-col md:flex-row pt-14 h-full overflow-hidden relative">
                {/* Left Sidebar - Entries */}
                <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-xl h-full">

                    {/* MODE TABS */}
                    <div className="p-2 grid grid-cols-2 gap-1 bg-slate-950/50 border-b border-slate-800">
                        <button
                            onClick={() => setMode('MANUAL')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${mode === 'MANUAL'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }`}
                        >
                            Manual Input
                        </button>
                        <button
                            onClick={() => setMode('LIVE')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 ${mode === 'LIVE'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Room
                        </button>
                    </div>

                    {/* Room Code Display (Only in Live Mode) */}
                    {mode === 'LIVE' && (
                        <div className="p-4 bg-red-900/10 border-b border-red-900/30 animate-in slide-in-from-top-2 flex items-center justify-between gap-2">
                            <div className="text-center flex-1">
                                <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1">Live Room</div>
                                <div className="text-2xl font-black text-white tracking-widest font-mono select-all">
                                    {roomCode || "..."}
                                </div>
                                <div className="text-[9px] text-slate-400 mt-1">
                                    /player-roulette
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="bg-white p-2 rounded shadow-lg shrink-0">
                                <QRCode
                                    value="http://localhost:3000/player-roulette"
                                    size={64}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>
                    )}

                    <div className="p-4 border-b border-slate-800">
                        {/* Input Field - Always Visible actually, allows Admin to inject names in Live mode too if they want */}
                        <div className="flex items-center gap-2 mb-4">
                            <Input
                                placeholder={mode === 'MANUAL' ? "Add name manually..." : "Add player (Admin override)..."}
                                value={newEntryText}
                                onChange={(e) => setNewEntryText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
                                className="bg-slate-950 border-slate-700"
                            />
                            <Button size="icon" onClick={handleAddEntry} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleShuffle} className="flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300">
                                <Shuffle className="w-3 h-3 mr-2" /> Shuffle
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300">
                                <ArrowDownAZ className="w-3 h-3 mr-2" /> Sort
                            </Button>
                        </div>
                    </div>

                    <div className="p-2 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center text-xs text-slate-400">
                        <span>{currentEntries.length} Entries ({mode})</span>
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-500" /> Secure</span>
                    </div>

                    <ScrollArea className="flex-1 min-h-0 p-2 w-full">
                        <div className="space-y-1">
                            {currentEntries.map((entry) => (
                                <div key={entry.id} className="group flex items-center justify-between p-2 rounded hover:bg-slate-800 transition-colors text-sm">
                                    <span className="truncate">{entry.text}</span>
                                    <button onClick={() => handleRemoveEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Content - Wheel */}
                <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-8 relative">

                    {/* Hash Commitment Display (Phase 1) */}
                    <div className="absolute top-4 right-4 max-w-md text-right hidden md:block opacity-50 hover:opacity-100 transition-opacity">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Next Spin Hash Commitment</div>
                        <div className="font-mono text-xs text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate w-64 ml-auto">
                            {currentSeedHash}
                        </div>
                    </div>

                    <div className="relative transform scale-75 md:scale-100 transition-transform">
                        <RouletteWheel
                            entries={currentEntries}
                            isSpinning={isSpinning}
                            rotation={rotation}
                            onSpinComplete={onSpinComplete}
                            onSpinClick={handleSpin}
                        />
                    </div>

                    {/* Winner Modal */}
                    {lastWinner && !isSpinning && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                            <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl scale-100 overflow-hidden animate-in zoom-in-95 duration-300">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 text-center">
                                    <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                                        <Trophy className="w-6 h-6" /> We have a winner!
                                    </h2>
                                </div>

                                {/* Body */}
                                <div className="p-8 flex flex-col items-center gap-4 text-center">
                                    <div className="text-5xl font-black text-white px-4 py-2 break-all">
                                        {lastWinner.text}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono mt-2">
                                        Verified Seed: {currentSeedHash.substring(0, 10)}... (Prev)
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 bg-slate-950/50 flex gap-3 border-t border-slate-800">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-slate-700 hover:bg-slate-800 text-slate-300"
                                        onClick={() => setLastWinner(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="w-32 bg-blue-600 hover:bg-blue-700 text-white border-none"
                                        onClick={() => {
                                            handleRemoveEntry(lastWinner.id);
                                            setLastWinner(null);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
