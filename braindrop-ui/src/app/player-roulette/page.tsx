"use client";

import { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogIn, CheckCircle2, Wifi, WifiOff, Users } from 'lucide-react';
import Topbar from "@/components/custom/topbar";

// Connect to backend
const socket = io("http://localhost:3001", { autoConnect: false });

export default function PlayerRoulettePage() {
    const [step, setStep] = useState<'LOGIN' | 'LOBBY'>('LOGIN');
    const [name, setName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Recovery Logic
    useEffect(() => {
        socket.connect();

        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));

        // Check LocalStorage
        const savedCode = localStorage.getItem("player_room_code");
        const savedName = localStorage.getItem("player_name");

        if (savedCode && savedName) {
            setRoomCode(savedCode);
            setName(savedName);
            joinRoom(savedCode, savedName, true);
        }

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.disconnect();
        };
    }, []);

    const joinRoom = (code: string, playerName: string, isAuto = false) => {
        setIsLoading(true);
        socket.emit("join_room", { roomCode: code, playerName }, (response: { success: boolean; roomCode: string; message?: string }) => {
            setIsLoading(false);
            if (response.success) {
                // Save session
                localStorage.setItem("player_room_code", response.roomCode);
                localStorage.setItem("player_name", playerName);

                // Update UI
                setRoomCode(response.roomCode); // Ensure formatted code (uppercase)
                setStep('LOBBY');
                if (!isAuto) toast.success("Joined room successfully!");
            } else {
                if (!isAuto) {
                    toast.error(response.message || "Invalid Room Code or connection failed");
                } else {
                    // If auto-reconnect fails, clear storage and prompt re-login
                    localStorage.removeItem("player_room_code");
                    localStorage.removeItem("player_name");
                    setStep('LOGIN');
                    toast.error("Session expired. Please join again.");
                }
            }
        });
    };

    const handleSubmit = () => {
        if (!name.trim() || !roomCode.trim()) {
            toast.error("Please fill in all fields");
            return;
        }
        joinRoom(roomCode, name);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
            <Topbar />

            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl p-6 relative overflow-hidden">

                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                            {isConnected ? "Server OK" : "Connecting..."}
                        </span>
                        {isConnected ? (
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                    </div>

                    <div className="mb-8 text-center pt-4">
                        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                            PLAYER ACCESS
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Join the live roulette session
                        </p>
                    </div>

                    {step === 'LOGIN' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs uppercase tracking-widest">Room Code</Label>
                                <Input
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. 7X9A2B"
                                    className="bg-slate-950 border-slate-700 text-center font-mono text-lg tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
                                    maxLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs uppercase tracking-widest">Your Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="bg-slate-950 border-slate-700"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                />
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={isLoading || !isConnected}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <LogIn className="w-4 h-4 mr-2" />
                                )}
                                {isLoading ? "Joining..." : "Join Room"}
                            </Button>
                        </div>
                    )}

                    {step === 'LOBBY' && (
                        <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/50">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-white">You&apos;re In!</h2>
                                <p className="text-slate-400">Waiting for host to spin...</p>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-left space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Room</span>
                                    <span className="font-mono text-blue-400 font-bold">{roomCode}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Player</span>
                                    <span className="text-white font-semibold">{name}</span>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                className="text-slate-500 hover:text-red-400 text-xs"
                                onClick={() => {
                                    localStorage.removeItem("player_room_code");
                                    localStorage.removeItem("player_name");
                                    setStep('LOGIN');
                                    setRoomCode("");
                                }}
                            >
                                Leave Room
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
