// Contract addresses for BrainDrop Roulette GameFi
// Update these after deploying to Mantle Sepolia

// Mantle Sepolia Testnet (Chain ID: 5003)
export const MANTLE_SEPOLIA_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";

// Mantle Mainnet (Chain ID: 5000)
export const MANTLE_MAINNET_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";

// Get factory address based on chain ID
export function getFactoryAddress(chainId: number): string {
    switch (chainId) {
        case 5003: // Mantle Sepolia
            return MANTLE_SEPOLIA_FACTORY_ADDRESS;
        case 5000: // Mantle Mainnet
            return MANTLE_MAINNET_FACTORY_ADDRESS;
        default:
            return MANTLE_SEPOLIA_FACTORY_ADDRESS;
    }
}

// Network configurations
export const MANTLE_NETWORKS = {
    mainnet: {
        chainId: 5000,
        name: "Mantle",
        rpcUrl: "https://rpc.mantle.xyz",
        blockExplorer: "https://mantlescan.xyz",
        nativeCurrency: {
            name: "MNT",
            symbol: "MNT",
            decimals: 18
        }
    },
    sepolia: {
        chainId: 5003,
        name: "Mantle Sepolia",
        rpcUrl: "https://rpc.sepolia.mantle.xyz",
        blockExplorer: "https://sepolia.mantlescan.xyz",
        nativeCurrency: {
            name: "MNT",
            symbol: "MNT",
            decimals: 18
        }
    }
} as const;

// Default network for development
export const DEFAULT_NETWORK = MANTLE_NETWORKS.sepolia;
