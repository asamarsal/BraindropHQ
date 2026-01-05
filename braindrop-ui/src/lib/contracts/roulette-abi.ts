// Contract ABIs for BrainDrop Roulette GameFi
// Generated from braindrop-sc

export const ROULETTE_GAME_FACTORY_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "_platformWallet", "type": "address" },
            { "internalType": "uint256", "name": "_defaultPlatformFeePercent", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "bytes32", "name": "roomCode", "type": "bytes32" },
            { "indexed": true, "internalType": "address", "name": "gameAddress", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "host", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "entryFee", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "maxPlayers", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "platformFeePercent", "type": "uint256" }
        ],
        "name": "GameCreated",
        "type": "event"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "roomCode", "type": "bytes32" },
            { "internalType": "uint256", "name": "entryFee", "type": "uint256" },
            { "internalType": "uint256", "name": "maxPlayers", "type": "uint256" },
            { "internalType": "uint256", "name": "platformFeePercent", "type": "uint256" }
        ],
        "name": "createGame",
        "outputs": [{ "internalType": "address", "name": "gameAddress", "type": "address" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "roomCode", "type": "bytes32" },
            { "internalType": "uint256", "name": "entryFee", "type": "uint256" },
            { "internalType": "uint256", "name": "maxPlayers", "type": "uint256" }
        ],
        "name": "createGameWithDefaults",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "roomCode", "type": "bytes32" }],
        "name": "getGameByRoomCode",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalGames",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "roomCode", "type": "bytes32" }],
        "name": "isRoomCodeAvailable",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "platformWallet",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "defaultPlatformFeePercent",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getConfig",
        "outputs": [
            { "internalType": "address", "name": "_platformWallet", "type": "address" },
            { "internalType": "uint256", "name": "_defaultFeePercent", "type": "uint256" },
            { "internalType": "uint256", "name": "_minPlayers", "type": "uint256" },
            { "internalType": "uint256", "name": "_maxPlayers", "type": "uint256" },
            { "internalType": "uint256", "name": "_totalGames", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const ROULETTE_GAME_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "_host", "type": "address" },
            { "internalType": "bytes32", "name": "_roomCode", "type": "bytes32" },
            { "internalType": "uint256", "name": "_entryFee", "type": "uint256" },
            { "internalType": "uint256", "name": "_maxPlayers", "type": "uint256" },
            { "internalType": "address", "name": "_platformWallet", "type": "address" },
            { "internalType": "uint256", "name": "_platformFeePercent", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "totalPlayers", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "prizePool", "type": "uint256" }
        ],
        "name": "PlayerEntered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "bytes32", "name": "seedHash", "type": "bytes32" },
            { "indexed": false, "internalType": "uint256", "name": "totalPlayers", "type": "uint256" }
        ],
        "name": "SeedCommitted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "winnerName", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "winnerPrize", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "platformFee", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "seed", "type": "uint256" }
        ],
        "name": "GameCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{ "indexed": false, "internalType": "uint256", "name": "refundCount", "type": "uint256" }],
        "name": "GameCancelled",
        "type": "event"
    },
    {
        "inputs": [{ "internalType": "string", "name": "name", "type": "string" }],
        "name": "enter",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "_seedHash", "type": "bytes32" }],
        "name": "commitSeed",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_seed", "type": "uint256" }],
        "name": "revealAndDistribute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "cancel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "host",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "entryFee",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxPlayers",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "state",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "winner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "winnerPrize",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPlayers",
        "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPlayerCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPrizePool",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
        "name": "getPlayerInfo",
        "outputs": [
            { "internalType": "bool", "name": "entered", "type": "bool" },
            { "internalType": "string", "name": "name", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getGameInfo",
        "outputs": [
            { "internalType": "address", "name": "_host", "type": "address" },
            { "internalType": "bytes32", "name": "_roomCode", "type": "bytes32" },
            { "internalType": "uint256", "name": "_entryFee", "type": "uint256" },
            { "internalType": "uint256", "name": "_maxPlayers", "type": "uint256" },
            { "internalType": "uint256", "name": "_playerCount", "type": "uint256" },
            { "internalType": "uint256", "name": "_prizePool", "type": "uint256" },
            { "internalType": "uint8", "name": "_state", "type": "uint8" },
            { "internalType": "address", "name": "_winner", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "hasEntered",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "playerNames",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "seedCommitment",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "revealedSeed",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    { "stateMutability": "payable", "type": "receive" }
] as const;
