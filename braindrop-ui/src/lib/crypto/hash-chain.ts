/**
 * PHASE 2: CRYPTOGRAPHIC HASH CHAIN
 * 
 * Generates a chain of random values where each value is 
 * derived from the hash of the previous one.
 * 
 * seed(n+1) = keccak256(seed(n))
 * 
 * This ensures:
 * 1. Unpredictability (forward security)
 * 2. Determinism (verifiability)
 * 3. Non-skippable sequence
 */

import { keccak256, type Hex } from 'viem';

export class HashChain {
    /**
     * Generates the next seed in the chain
     * @param currentSeed The current hex seed
     * @returns The next hex seed (keccak256 hash)
     */
    static next(currentSeed: string): string {
        const formattedSeed: Hex = currentSeed.startsWith('0x') ? currentSeed as Hex : `0x${currentSeed}`;
        return keccak256(formattedSeed);
    }

    /**
     * Generates a chain of N seeds starting from an initial seed
     * @param initialSeed The starting seed
     * @param count Number of seeds to generate
     * @returns Array of seeds
     */
    static generateChain(initialSeed: string, count: number): string[] {
        const chain: string[] = [initialSeed];
        let current = initialSeed;

        for (let i = 0; i < count - 1; i++) {
            current = this.next(current);
            chain.push(current);
        }

        return chain;
    }
}
