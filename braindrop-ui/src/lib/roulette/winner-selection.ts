/**
 * PHASE 3: MODULO SELECTION LOGIC
 * 
 * Maps the random seed to a specific winner index using modulo operation.
 * 
 * winnerIndex = seed % entries.length
 * 
 * This is deterministic: Same seed + Same entries = Same winner.
 */

import { type RouletteEntry } from './types';

export class WinnerSelection {
    /**
     * Determines the winner index based on the seed
     * @param seed The hex seed string
     * @param entriesLength Total number of entries
     * @returns The index of the winner (0 to entriesLength - 1)
     */
    static selectWinnerIndex(seed: string, entriesLength: number): number {
        if (entriesLength === 0) return -1;

        // Convert hex seed to BigInt to handle large numbers safely
        const seedBigInt = BigInt(seed.startsWith('0x') ? seed : `0x${seed}`);
        const entriesBigInt = BigInt(entriesLength);

        // Modulo operation
        const winnerIndex = seedBigInt % entriesBigInt;

        return Number(winnerIndex);
    }

    /**
     * Calculates the target rotation angle for the wheel animation
     * @param winnerIndex Index of the winner
     * @param totalSegments Total number of segments
     * @param minSpins Minimum number of full rotations (default 5)
     * @returns Total rotation in degrees
     */
    static calculateRotation(winnerIndex: number, totalSegments: number, minSpins: number = 5): number {
        if (totalSegments === 0) return 0;

        const segmentAngle = 360 / totalSegments;

        // Target angle to land the WINNER at the pointer (usually at 0 degrees/right or 90/top)
        // Assuming pointer is at 0 degrees (right side standard), creating a counter-clockwise spin
        // To verify visual alignment, this might need adjustment based on SVG start angle.

        // Standard calculation:
        // Angle to center of winner segment
        const targetSegmentAngle = (winnerIndex * segmentAngle) + (segmentAngle / 2);

        // We want this regular angle to end up at the pointer.
        // Total rotation = (Full Spins) + (Offset to winner)

        // Adding randomization to landing spot WITHIN the segment for realism
        // (This does not change the winner, just visual flair)
        // const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8); 

        // For deterministic animation (optional), we can derive offset from seed too
        // But visual-only randomness is usually acceptable in step 6

        const fullRotation = 360 * minSpins;

        // Important: To land on index I, we must rotate such that index I is at the pointer.
        // If wheel starts at 0, index 0 is at 0-X degrees. 
        // We typically rotate backwards (negative) or calculate needed positive rotation.

        // Simplified: 
        const result = fullRotation + (360 - targetSegmentAngle) + 90;
        return result;
    }
}
