/**
 * PHASE 1: COMMIT-REVEAL SCHEME
 * 
 * Guarante Fairness using Hash Commitments.
 * 
 * commit = keccak256(seed)
 * 
 * Flow:
 * 1. Server/Provider generates seed (secret)
 * 2. Server publishes commit (hash of seed)
 * 3. Players place bets / spin initiated
 * 4. Server reveals seed
 * 5. Anyone can verify keccak256(revealed_seed) === commit
 */

import { keccak256, type Hex } from 'viem';

export class CommitReveal {
    /**
     * Creates a deterministic commitment from a seed
     * @param seed Hex string seed
     * @returns Hash commitment (keccak256)
     */
    static createCommitment(seed: string): string {
        // Ensure seed has 0x prefix for viem
        const formattedSeed: Hex = seed.startsWith('0x') ? seed as Hex : `0x${seed}`;
        return keccak256(formattedSeed);
    }

    /**
     * Verifies if a revealed seed matches the commitment
     * @param seed The revealed seed
     * @param commitment The original commitment hash
     * @returns boolean
     */
    static verify(seed: string, commitment: string): boolean {
        const calculatedCommitment = this.createCommitment(seed);
        return calculatedCommitment === commitment;
    }
}
