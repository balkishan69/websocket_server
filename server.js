import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

// Add a route handler for the root path
app.get('/', (req, res) => {
  res.send('Metaverse WebSocket Server');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const players = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', (player) => {
    players.set(socket.id, player);
    socket.broadcast.emit('playerJoined', player);
    
    // Send existing players to the new player
    players.forEach((existingPlayer) => {
      if (existingPlayer.id !== socket.id) {
        socket.emit('playerJoined', existingPlayer);
      }
    });
  });

  socket.on('move', (position) => {
    const player = players.get(socket.id);
    if (player) {
      player.x = position.x;
      player.y = position.y;
      socket.broadcast.emit('playerMoved', player);
    }
  });

  socket.on('chat', (message) => {
    const player = players.get(socket.id);
    if (player) {
      const chatMessage = {
        id: Date.now().toString(),
        playerId: socket.id,
        username: player.username,
        message: message,
        timestamp: Date.now()
      };
      io.emit('chatMessage', chatMessage);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    players.delete(socket.id);
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});