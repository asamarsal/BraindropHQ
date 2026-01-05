const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"]
    }
});

// In-Memory Storage
// rooms[roomCode] = { 
//   entries: [], 
//   hostSocketId: string, 
//   createdAt: number,
//   // Blockchain fields:
//   gameAddress: string | null,
//   entryFee: string, // in wei
//   maxPlayers: number,
//   platformFeePercent: number,
//   gameState: 'PENDING' | 'OPEN' | 'LOCKED' | 'COMPLETED' | 'CANCELLED',
//   walletToName: Map<string, string>
// }
const rooms = {};

// Wallet to Socket mapping (for blockchain event notifications)
const walletToSocket = new Map();

// Helper: Generate Random Code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ========== REST API ENDPOINTS ==========

// Get room info
app.get('/api/room/:roomCode', (req, res) => {
    const room = rooms[req.params.roomCode.toUpperCase()];
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json({
        roomCode: req.params.roomCode.toUpperCase(),
        playerCount: room.entries.length,
        gameAddress: room.gameAddress,
        entryFee: room.entryFee,
        maxPlayers: room.maxPlayers,
        gameState: room.gameState,
        entries: room.entries
    });
});

// Register wallet address to player name (called after blockchain entry)
app.post('/api/room/:roomCode/register-wallet', (req, res) => {
    const { walletAddress, playerName } = req.body;
    const roomCode = req.params.roomCode.toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!walletAddress || !playerName) {
        return res.status(400).json({ error: 'Missing walletAddress or playerName' });
    }

    // Store wallet-name mapping
    if (!room.walletToName) {
        room.walletToName = new Map();
    }
    room.walletToName.set(walletAddress.toLowerCase(), playerName);

    // Add to entries if not already present
    const existingEntry = room.entries.find(e =>
        e.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!existingEntry) {
        const newEntry = {
            id: walletAddress.toLowerCase(),
            text: playerName,
            walletAddress: walletAddress.toLowerCase(),
            joinedAt: Date.now()
        };
        room.entries.push(newEntry);

        // Notify room
        io.to(roomCode).emit('update_entries', room.entries);
        io.to(roomCode).emit('player_joined_blockchain', {
            walletAddress: walletAddress.toLowerCase(),
            playerName,
            totalPlayers: room.entries.length
        });
    }

    res.json({ success: true, totalPlayers: room.entries.length });
});

// Update game contract address (called by host after deploy)
app.post('/api/room/:roomCode/set-contract', (req, res) => {
    const { gameAddress, entryFee, maxPlayers, platformFeePercent } = req.body;
    const roomCode = req.params.roomCode.toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    room.gameAddress = gameAddress;
    room.entryFee = entryFee || '0';
    room.maxPlayers = maxPlayers || 100;
    room.platformFeePercent = platformFeePercent || 300;
    room.gameState = 'OPEN';

    // Notify room of blockchain game creation
    io.to(roomCode).emit('game_created_blockchain', {
        gameAddress,
        entryFee,
        maxPlayers,
        platformFeePercent
    });

    res.json({ success: true });
});

// Update game state
app.post('/api/room/:roomCode/update-state', (req, res) => {
    const { gameState, winner, winnerName, txHash } = req.body;
    const roomCode = req.params.roomCode.toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    room.gameState = gameState;

    // Notify room
    io.to(roomCode).emit('game_state_updated', {
        gameState,
        winner,
        winnerName,
        txHash
    });

    if (gameState === 'COMPLETED' && winner) {
        io.to(roomCode).emit('game_completed_blockchain', {
            winner,
            winnerName,
            txHash
        });
    }

    res.json({ success: true });
});

// ========== SOCKET.IO EVENTS ==========

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- HOST EVENTS ---

    socket.on('create_room', (options, callback) => {
        const roomCode = generateRoomCode();
        const { entryFee, maxPlayers, platformFeePercent } = options || {};

        rooms[roomCode] = {
            entries: [],
            hostSocketId: socket.id,
            createdAt: Date.now(),
            // Blockchain fields
            gameAddress: null,
            entryFee: entryFee || '0',
            maxPlayers: maxPlayers || 100,
            platformFeePercent: platformFeePercent || 300,
            gameState: 'PENDING',
            walletToName: new Map()
        };

        socket.join(roomCode);
        console.log(`Room created: ${roomCode} by ${socket.id}`);

        callback({ success: true, roomCode });
    });

    socket.on('reconnect_host', (roomCode, callback) => {
        if (rooms[roomCode]) {
            rooms[roomCode].hostSocketId = socket.id;
            socket.join(roomCode);
            console.log(`Host reconnected to ${roomCode}`);
            callback({
                success: true,
                entries: rooms[roomCode].entries,
                gameAddress: rooms[roomCode].gameAddress,
                gameState: rooms[roomCode].gameState
            });
        } else {
            callback({ success: false, message: "Room expired or not found" });
        }
    });

    socket.on('update_entries_host', ({ roomCode, entries }) => {
        if (rooms[roomCode]) {
            rooms[roomCode].entries = entries;
            io.to(roomCode).emit('update_entries', rooms[roomCode].entries);
        }
    });

    socket.on('remove_player', ({ roomCode, playerId }) => {
        if (rooms[roomCode]) {
            rooms[roomCode].entries = rooms[roomCode].entries.filter(e => e.id !== playerId);
            io.to(roomCode).emit('update_entries', rooms[roomCode].entries);
        }
    });

    // --- BLOCKCHAIN HOST EVENTS ---

    socket.on('set_game_contract', ({ roomCode, gameAddress, entryFee, maxPlayers, platformFeePercent }) => {
        const room = rooms[roomCode];
        if (room && room.hostSocketId === socket.id) {
            room.gameAddress = gameAddress;
            room.entryFee = entryFee;
            room.maxPlayers = maxPlayers;
            room.platformFeePercent = platformFeePercent;
            room.gameState = 'OPEN';

            io.to(roomCode).emit('game_created_blockchain', {
                gameAddress,
                entryFee,
                maxPlayers,
                platformFeePercent
            });
        }
    });

    socket.on('game_locked', ({ roomCode, seedHash }) => {
        const room = rooms[roomCode];
        if (room && room.hostSocketId === socket.id) {
            room.gameState = 'LOCKED';
            io.to(roomCode).emit('game_state_updated', { gameState: 'LOCKED', seedHash });
        }
    });

    socket.on('game_completed', ({ roomCode, winner, winnerName, winnerPrize, txHash }) => {
        const room = rooms[roomCode];
        if (room && room.hostSocketId === socket.id) {
            room.gameState = 'COMPLETED';
            io.to(roomCode).emit('game_completed_blockchain', {
                winner,
                winnerName,
                winnerPrize,
                txHash
            });
        }
    });

    // --- PLAYER EVENTS ---

    socket.on('join_room', ({ roomCode, playerName }, callback) => {
        const room = rooms[roomCode.toUpperCase()];

        if (!room) {
            return callback({ success: false, message: "Room not found" });
        }

        // Add player to room entries (non-blockchain mode)
        const newEntry = {
            id: socket.id,
            text: playerName
        };

        room.entries.push(newEntry);
        socket.join(roomCode.toUpperCase());

        io.to(roomCode.toUpperCase()).emit('update_entries', room.entries);

        console.log(`Player ${playerName} joined ${roomCode}`);
        callback({
            success: true,
            roomCode: roomCode.toUpperCase(),
            entries: room.entries,
            gameAddress: room.gameAddress,
            entryFee: room.entryFee,
            gameState: room.gameState
        });
    });

    // Blockchain player join (with wallet)
    socket.on('join_room_blockchain', ({ roomCode, playerName, walletAddress }, callback) => {
        const room = rooms[roomCode.toUpperCase()];

        if (!room) {
            return callback({ success: false, message: "Room not found" });
        }

        if (!walletAddress) {
            return callback({ success: false, message: "Wallet address required" });
        }

        // Store wallet-socket mapping
        walletToSocket.set(walletAddress.toLowerCase(), socket.id);
        socket.data.walletAddress = walletAddress.toLowerCase();

        // Store in room
        if (!room.walletToName) {
            room.walletToName = new Map();
        }
        room.walletToName.set(walletAddress.toLowerCase(), playerName);

        // Add to entries
        const existingEntry = room.entries.find(e =>
            e.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
        );

        if (!existingEntry) {
            const newEntry = {
                id: walletAddress.toLowerCase(),
                text: playerName,
                walletAddress: walletAddress.toLowerCase(),
                socketId: socket.id,
                joinedAt: Date.now()
            };
            room.entries.push(newEntry);
        }

        socket.join(roomCode.toUpperCase());
        io.to(roomCode.toUpperCase()).emit('update_entries', room.entries);

        console.log(`Player ${playerName} (${walletAddress}) joined ${roomCode} via blockchain`);
        callback({
            success: true,
            roomCode: roomCode.toUpperCase(),
            entries: room.entries,
            gameAddress: room.gameAddress,
            entryFee: room.entryFee,
            gameState: room.gameState,
            playerCount: room.entries.length
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Clean up wallet mapping
        if (socket.data.walletAddress) {
            walletToSocket.delete(socket.data.walletAddress);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 BrainDrop Backend running on port ${PORT}`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
    console.log(`   REST API:  http://localhost:${PORT}/api`);
});
