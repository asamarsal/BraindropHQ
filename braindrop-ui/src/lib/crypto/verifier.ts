/**
 * PHASE 5: DETERMINISTIC REPLAY VERIFICATION
 * 
 * Allows auditing the entire game history by replaying the hash chain.
 * Users can verify that:
 * 1. The chain of seeds is valid (Hash(n) -> Hash(n+1))
 * 2. The winner selected for each seed was correct according to the rule
 */

import { HashChain } from './hash-chain';

export class Verifier {
    /**
     * Verifies that a sequence of seeds forms a valid hash chain
     * @param seeds Array of seeds in order of occurrence
     * @returns boolean - true if chain is valid
     */
    static verifyChain(seeds: string[]): boolean {
        if (seeds.length < 2) return true;

        for (let i = 0; i < seeds.length - 1; i++) {
            const current = seeds[i];
            const next = seeds[i + 1];
            const calculatedNext = HashChain.next(current);

            if (calculatedNext !== next) {
                console.error(`Chain verification failed at index ${i}`);
                console.error(`Expected: ${calculatedNext}, Got: ${next}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Verifies that a specific outcome was fair based on the seed
     * @param seed The seed used for the spin
     * @param totalParticipants Number of participants
     * @param claimedWinnerIndex The index of the winner that occurred
     * @returns boolean
     */
    static verifyOutcome(seed: string, totalParticipants: number, claimedWinnerIndex: number): boolean {
        // Must match the logic in Phase 3 (Modulo Selection)
        // We import the logic here to ensure consistency, 
        // OR re-implement it to ensure independence. 
        // For verification tools, independent implementation is often better.

        // Convert hex seed to BigInt for uniform distribution checks
        const seedBigInt = BigInt(seed.startsWith('0x') ? seed : `0x${seed}`);
        const calculatedIndex = Number(seedBigInt % BigInt(totalParticipants));

        return calculatedIndex === claimedWinnerIndex;
    }
}
