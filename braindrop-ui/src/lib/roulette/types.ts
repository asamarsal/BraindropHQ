/**
 * Shared types for Roulette Game
 */

export interface RouletteEntry {
    id: string;
    text: string;
    weight?: number; // For future weighted probability
    color?: string;  // Custom segment color
}

export interface GameConfig {
    initialSeed?: string;
    fairnessMode: 'secure' | 'demo'; // 'secure' uses hash chain
    eliminateWinner: boolean;
}

export interface GameState {
    entries: RouletteEntry[];
    currentSeed: string; // The seed for the NEXT spin
    history: SpinResult[];
    isSpinning: boolean;
}

export interface SpinResult {
    roundId: number;
    seed: string;
    winnerIndex: number;
    winnerId: string;
    timestamp: number;
}
