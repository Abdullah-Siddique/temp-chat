const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected with socket ID:', socket.id);

    socket.on('joinRoom', (roomId) => {
        // Check if the room already has 2 people.
        const room = io.sockets.adapter.rooms.get(roomId);
        const numClients = room ? room.size : 0;

        if (numClients >= 2) {
            // Reject the new user if the room is full
            socket.emit('roomFull');
            return;
        }

        // User joins the room
        socket.join(roomId);
        socket.roomId = roomId; // Store roomId in the socket object for later
        console.log(`Socket ${socket.id} joined room ${roomId}`);

        // Let the other person in the room know that someone has joined.
        socket.to(roomId).emit('userJoined');
        
        // Let the joining user know they are waiting if they are the first
        if (numClients === 0) {
            socket.emit('waiting');
        }
    });

    socket.on('chatMessage', (msg) => {
        // Broadcast the message to everyone else in the same room
        if (socket.roomId) {
            io.to(socket.roomId).emit('message', msg);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        // Let the other person in the room know that their partner has left.
        if (socket.roomId) {
            io.to(socket.roomId).emit('userLeft', 'The other user has left the chat.');
        }
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));