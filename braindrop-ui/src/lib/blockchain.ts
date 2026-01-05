import {
    createPublicClient,
    createWalletClient,
    http,
    custom,
    parseEther,
    formatEther,
    encodeAbiParameters,
    keccak256,
    toHex,
    stringToBytes
} from 'viem';
import { ROULETTE_GAME_FACTORY_ABI, ROULETTE_GAME_ABI } from './contracts/roulette-abi';
import { getFactoryAddress, MANTLE_NETWORKS } from './contracts/addresses';

// Define Mantle Sepolia chain
export const mantleSepolia = {
    id: 5003,
    name: 'Mantle Sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'MNT',
        symbol: 'MNT',
    },
    rpcUrls: {
        default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    },
    blockExplorers: {
        default: { name: 'MantleScan', url: 'https://sepolia.mantlescan.xyz' },
    },
    testnet: true,
} as const;

// Create public client for read operations
export function createReadClient(chainId: number = 5003) {
    const network = chainId === 5000 ? MANTLE_NETWORKS.mainnet : MANTLE_NETWORKS.sepolia;
    return createPublicClient({
        chain: mantleSepolia,
        transport: http(network.rpcUrl),
    });
}

// Create wallet client for write operations (requires window.ethereum)
export async function createWriteClient() {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
    }

    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    return createWalletClient({
        account,
        chain: mantleSepolia,
        transport: custom(window.ethereum),
    });
}

// Get connected wallet address
export async function getConnectedAddress(): Promise<string | null> {
    if (typeof window === 'undefined' || !window.ethereum) {
        return null;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts[0] || null;
    } catch {
        return null;
    }
}

// Check if wallet is connected
export async function isWalletConnected(): Promise<boolean> {
    const address = await getConnectedAddress();
    return !!address;
}

// Request wallet connection
export async function connectWallet(): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
}

// Switch to Mantle Sepolia network
export async function switchToMantleSepolia(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet found');
    }

    const chainId = '0x' + MANTLE_NETWORKS.sepolia.chainId.toString(16);

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
        });
    } catch (switchError: unknown) {
        // Chain not added, add it
        if ((switchError as { code: number }).code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId,
                    chainName: MANTLE_NETWORKS.sepolia.name,
                    nativeCurrency: MANTLE_NETWORKS.sepolia.nativeCurrency,
                    rpcUrls: [MANTLE_NETWORKS.sepolia.rpcUrl],
                    blockExplorerUrls: [MANTLE_NETWORKS.sepolia.blockExplorer],
                }],
            });
        } else {
            throw switchError;
        }
    }
}

// ========== FACTORY FUNCTIONS ==========

/**
 * Create a new roulette game on blockchain
 */
export async function createBlockchainGame(
    roomCode: string,
    entryFee: string, // in MNT (e.g., "0.01")
    maxPlayers: number,
    platformFeePercent: number // 200-500 (2-5%)
): Promise<{ gameAddress: string; txHash: string }> {
    const walletClient = await createWriteClient();
    const publicClient = createReadClient();
    const factoryAddress = getFactoryAddress(5003) as `0x${string}`;

    // Convert room code to bytes32
    const roomCodeBytes = keccak256(stringToBytes(roomCode)) as `0x${string}`;

    // Convert entry fee to wei
    const entryFeeWei = parseEther(entryFee);

    const hash = await walletClient.writeContract({
        address: factoryAddress,
        abi: ROULETTE_GAME_FACTORY_ABI,
        functionName: 'createGame',
        args: [roomCodeBytes, entryFeeWei, BigInt(maxPlayers), BigInt(platformFeePercent)],
    });

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Get game address from logs
    const gameCreatedLog = receipt.logs.find(log => {
        // GameCreated event signature
        return log.topics[0] === keccak256(stringToBytes('GameCreated(bytes32,address,address,uint256,uint256,uint256)'));
    });

    let gameAddress = '0x0000000000000000000000000000000000000000';
    if (gameCreatedLog && gameCreatedLog.topics[2]) {
        // Game address is the second indexed parameter
        gameAddress = '0x' + gameCreatedLog.topics[2].slice(26);
    }

    return { gameAddress, txHash: hash };
}

// ========== GAME FUNCTIONS ==========

/**
 * Enter a roulette game
 */
export async function enterGame(
    gameAddress: string,
    playerName: string,
    entryFee: string // in MNT
): Promise<{ txHash: string }> {
    const walletClient = await createWriteClient();
    const publicClient = createReadClient();

    const hash = await walletClient.writeContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'enter',
        args: [playerName],
        value: parseEther(entryFee),
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
}

/**
 * Commit seed hash (host only)
 */
export async function commitSeed(
    gameAddress: string,
    seed: string
): Promise<{ txHash: string; seedHash: string }> {
    const walletClient = await createWriteClient();
    const publicClient = createReadClient();

    // Hash the seed
    const seedBigInt = BigInt(seed);
    const seedHash = keccak256(
        encodeAbiParameters([{ type: 'uint256' }], [seedBigInt])
    );

    const hash = await walletClient.writeContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'commitSeed',
        args: [seedHash as `0x${string}`],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash, seedHash };
}

/**
 * Reveal seed and distribute prizes (host only)
 */
export async function revealAndDistribute(
    gameAddress: string,
    seed: string
): Promise<{ txHash: string; winner: string; winnerPrize: string }> {
    const walletClient = await createWriteClient();
    const publicClient = createReadClient();

    const seedBigInt = BigInt(seed);

    const hash = await walletClient.writeContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'revealAndDistribute',
        args: [seedBigInt],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Parse GameCompleted event
    let winner = '';
    let winnerPrize = '0';

    // Get winner from contract
    const gameInfo = await publicClient.readContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'getGameInfo',
    });

    winner = gameInfo[7] as string; // _winner
    winnerPrize = formatEther(gameInfo[5] as bigint); // _prizePool (before distribution, but close)

    return { txHash: hash, winner, winnerPrize };
}

/**
 * Cancel game and refund (host only)
 */
export async function cancelGame(
    gameAddress: string
): Promise<{ txHash: string }> {
    const walletClient = await createWriteClient();
    const publicClient = createReadClient();

    const hash = await walletClient.writeContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'cancel',
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
}

// ========== READ FUNCTIONS ==========

/**
 * Get game info from blockchain
 */
export async function getGameInfo(gameAddress: string) {
    const publicClient = createReadClient();

    const info = await publicClient.readContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'getGameInfo',
    });

    return {
        host: info[0] as string,
        roomCode: info[1] as string,
        entryFee: formatEther(info[2] as bigint),
        maxPlayers: Number(info[3]),
        playerCount: Number(info[4]),
        prizePool: formatEther(info[5] as bigint),
        state: Number(info[6]), // 0=OPEN, 1=LOCKED, 2=COMPLETED, 3=CANCELLED
        winner: info[7] as string,
    };
}

/**
 * Get all players in a game
 */
export async function getGamePlayers(gameAddress: string): Promise<string[]> {
    const publicClient = createReadClient();

    const players = await publicClient.readContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'getPlayers',
    });

    return players as string[];
}

/**
 * Check if address has entered game
 */
export async function hasPlayerEntered(
    gameAddress: string,
    playerAddress: string
): Promise<boolean> {
    const publicClient = createReadClient();

    const entered = await publicClient.readContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'hasEntered',
        args: [playerAddress as `0x${string}`],
    });

    return entered as boolean;
}

/**
 * Get player name by address
 */
export async function getPlayerName(
    gameAddress: string,
    playerAddress: string
): Promise<string> {
    const publicClient = createReadClient();

    const name = await publicClient.readContract({
        address: gameAddress as `0x${string}`,
        abi: ROULETTE_GAME_ABI,
        functionName: 'playerNames',
        args: [playerAddress as `0x${string}`],
    });

    return name as string;
}

// ========== UTILITIES ==========

/**
 * Generate a random seed for the game
 */
export function generateSeed(): string {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

/**
 * Format MNT amount for display
 */
export function formatMNT(amount: string | bigint): string {
    if (typeof amount === 'bigint') {
        return formatEther(amount);
    }
    return amount;
}

/**
 * Parse MNT string to wei
 */
export function parseMNT(amount: string): bigint {
    return parseEther(amount);
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(txHash: string, chainId: number = 5003): string {
    const network = chainId === 5000 ? MANTLE_NETWORKS.mainnet : MANTLE_NETWORKS.sepolia;
    return `${network.blockExplorer}/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 */
export function getAddressExplorerUrl(address: string, chainId: number = 5003): string {
    const network = chainId === 5000 ? MANTLE_NETWORKS.mainnet : MANTLE_NETWORKS.sepolia;
    return `${network.blockExplorer}/address/${address}`;
}

// Extend Window type for ethereum
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, callback: (...args: unknown[]) => void) => void;
            removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
        };
    }
}
