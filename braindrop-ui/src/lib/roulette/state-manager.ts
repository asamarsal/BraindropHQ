/**
 * PHASE 4: STATE MANAGEMENT
 * 
 * Manages the progression of the game using the Hash Chain.
 * Handles:
 * - Deterministic Removal (removing winner)
 * - Chain progression (Seed(n) -> Seed(n+1))
 */

import { HashChain } from '../crypto/hash-chain';
import { SeedGenerator } from '../crypto/seed-generator';
import { WinnerSelection } from './winner-selection';
import { type GameState, type RouletteEntry, type SpinResult } from './types';

export class RouletteGame {
    private state: GameState;

    constructor(initialEntries: RouletteEntry[]) {
        // Initialize with a secure random seed
        const initialSeed = SeedGenerator.generateSeed();

        this.state = {
            entries: [...initialEntries],
            currentSeed: initialSeed,
            history: [],
            isSpinning: false
        };
    }

    /**
     * Executes a spin
     * 1. Derives NEW seed from current seed (Hash Chain)
     * 2. Selects winner using new seed
     * 3. Updates state (history, entries)
     */
    spin(): { result: SpinResult | null, newState: GameState } {
        if (this.state.entries.length === 0) {
            return { result: null, newState: this.state };
        }

        // 1. Hash Chain: Generate NEXT seed
        // We use the NEXT seed for the result to ensure forward security? 
        // Or current? Usually Seed(n) determines Result(n).
        // Let's use Current Seed -> Result. Then Next Seed becomes Current.
        // Wait, standard hash chain usually reveals the pre-image.
        // Here we are moving FORWARD: Seed 0 -> Seed 1 -> Seed 2.
        // This is a "Forward Hash Chain".
        const seedForThisSpin = this.state.currentSeed;
        const nextSeed = HashChain.next(seedForThisSpin);

        // 2. Winner Selection
        const winnerIndex = WinnerSelection.selectWinnerIndex(seedForThisSpin, this.state.entries.length);
        const winner = this.state.entries[winnerIndex];

        // 3. Create Result
        const result: SpinResult = {
            roundId: this.state.history.length + 1,
            seed: seedForThisSpin, // The seed that produced this result
            winnerIndex,
            winnerId: winner.id,
            timestamp: Date.now()
        };

        // 4. Update State
        // Add to history
        const newHistory = [...this.state.history, result];

        // Remove winner if needed (logic can be configured, default here is NO removal for core spin, 
        // removal is handled by UI/Controller calling this)
        // Let's keep this pure.

        this.state = {
            ...this.state,
            currentSeed: nextSeed, // Advance chain
            history: newHistory
        };

        return { result, newState: this.state };
    }

    /**
     * Elimination Logic (Phase 4 specifically)
     * Call this AFTER the spin animation completes if "Eliminate Winner" is ON
     */
    eliminateEntry(id: string): GameState {
        const newEntries = this.state.entries.filter(e => e.id !== id);
        this.state = {
            ...this.state,
            entries: newEntries
        };
        return this.state;
    }

    getState(): GameState {
        return this.state;
    }

    reset(entries: RouletteEntry[]) {
        const initialSeed = SeedGenerator.generateSeed();
        this.state = {
            entries: [...entries],
            currentSeed: initialSeed,
            history: [],
            isSpinning: false
        };
    }
}
