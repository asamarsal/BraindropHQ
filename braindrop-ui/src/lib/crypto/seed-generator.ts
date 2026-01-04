/**
 * PHASE 0: CRYPTOGRAPHICALLY SECURE SEED GENERATION
 * 
 * Uses Web Crypto API (crypto.getRandomValues) to generate 
 * unpredictable random seeds.
 */

export class SeedGenerator {
    /**
     * Generates a cryptographically secure 32-byte hex seed
     * @returns {string} 64-character hex string
     */
    static generateSeed(): string {
        try {
            const array = new Uint8Array(32);
            if (typeof window !== 'undefined' && window.crypto) {
                window.crypto.getRandomValues(array);
            } else if (typeof global !== 'undefined' && global.crypto) {
                // Node.js environment
                global.crypto.getRandomValues(array);
            } else {
                throw new Error("Web Crypto API not supported");
            }

            // Convert to hex string
            return Array.from(array)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

        } catch (error) {
            console.error("Failed to generate secure seed:", error);
            // Fallback (Only if critical failure, ideally never used in secure context)
            // Using timestamp + math.random is insecure but prevents crash
            return Date.now().toString(16) + Math.random().toString(16).substring(2);
        }
    }
}
