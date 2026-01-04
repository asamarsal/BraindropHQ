const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// In-Memory Storage
// rooms[roomCode] = { entries: [], hostSocketId: string, createdAt: number }
const rooms = {};

// Helper: Generate Random Code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- HOST EVENTS ---

    socket.on('create_room', (callback) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            entries: [], // { id, text }
            hostSocketId: socket.id,
            createdAt: Date.now()
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
            callback({ success: true, entries: rooms[roomCode].entries });
        } else {
            callback({ success: false, message: "Room expired or not found" });
        }
    });

    socket.on('update_entries_host', ({ roomCode, entries }) => {
        if (rooms[roomCode]) {
            rooms[roomCode].entries = entries;
            // Broadcast to everyone in room (though usually only Host needs current state, 
            // players might want to see list too)
            io.to(roomCode).emit('update_entries', rooms[roomCode].entries);
        }
    });

    socket.on('remove_player', ({ roomCode, playerId }) => {
        if (rooms[roomCode]) {
            rooms[roomCode].entries = rooms[roomCode].entries.filter(e => e.id !== playerId);
            io.to(roomCode).emit('update_entries', rooms[roomCode].entries);
        }
    });

    // --- PLAYER EVENTS ---

    socket.on('join_room', ({ roomCode, playerName }, callback) => {
        const room = rooms[roomCode.toUpperCase()];

        if (!room) {
            return callback({ success: false, message: "Room not found" });
        }

        // Add player to room entries
        const newEntry = {
            id: socket.id, // Use socket ID as unique ID for simplicity in this session
            text: playerName
        };

        // Prevent duplicate names? Optional. For now let's allow.
        room.entries.push(newEntry);

        socket.join(roomCode.toUpperCase());

        // Notify Room (Host updates UI)
        io.to(roomCode.toUpperCase()).emit('update_entries', room.entries);

        console.log(`Player ${playerName} joined ${roomCode}`);
        callback({ success: true, roomCode: roomCode.toUpperCase(), entries: room.entries });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Optional: Remove player from room on disconnect?
        // Usually in live games, we might want to keep them if they just refresh.
        // For this simple version, let's NOT remove automatically to support refresh logic 
        // (unless we track IDs better).
        // If we used socket.id as entry ID, removing them is tricky if they reconnect with new socket.id.
        // Better to let Host remove manually or use persistent UUIDs.
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
