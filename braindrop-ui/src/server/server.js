// server/server.js
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Game state
const games = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Host creates a game
  socket.on('create-game', (quiz) => {
    const gamePin = Math.floor(100000 + Math.random() * 900000).toString();
    games.set(gamePin, {
      host: socket.id,
      quiz,
      players: new Map(),
      currentQuestion: -1,
      state: 'lobby' // lobby, question, leaderboard, ended
    });
    socket.join(`game-${gamePin}`);
    socket.emit('game-created', { gamePin });
  });

  // Player joins game
  socket.on('join-game', ({ gamePin, playerName }) => {
    const game = games.get(gamePin);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    
    game.players.set(socket.id, {
      name: playerName,
      score: 0,
      answered: false
    });
    
    socket.join(`game-${gamePin}`);
    socket.emit('joined-game', { success: true });
    
    // Notify host of new player
    io.to(game.host).emit('player-joined', {
      players: Array.from(game.players.values()).map(p => p.name)
    });
  });

  // Host starts game
  socket.on('start-game', (gamePin) => {
    const game = games.get(gamePin);
    if (!game || game.host !== socket.id) return;
    
    game.state = 'question';
    game.currentQuestion = 0;
    
    // Send first question to all players
    const question = game.quiz.questions[0];
    io.to(`game-${gamePin}`).emit('question-start', {
      questionNumber: 1,
      totalQuestions: game.quiz.questions.length,
      question: question.question,
      answers: question.answers,
      timeLimit: question.timeLimit || 20
    });
    
    // Auto-end question after time limit
    setTimeout(() => {
      io.to(`game-${gamePin}`).emit('question-end');
      socket.emit('show-results', calculateResults(game));
    }, (question.timeLimit || 20) * 1000);
  });

  // Player submits answer
  socket.on('submit-answer', ({ gamePin, answerIndex, timeTaken }) => {
    const game = games.get(gamePin);
    if (!game) return;
    
    const player = game.players.get(socket.id);
    if (!player || player.answered) return;
    
    const question = game.quiz.questions[game.currentQuestion];
    const isCorrect = answerIndex === question.correctAnswer;
    
    if (isCorrect) {
      // Award points based on speed (max 1000 points)
      const timeBonus = Math.max(0, 500 - (timeTaken / question.timeLimit) * 500);
      player.score += Math.round(500 + timeBonus);
    }
    
    player.answered = true;
    
    socket.emit('answer-result', { correct: isCorrect, score: player.score });
    
    // Notify host of answer count
    const answeredCount = Array.from(game.players.values()).filter(p => p.answered).length;
    io.to(game.host).emit('answer-count', {
      answered: answeredCount,
      total: game.players.size
    });
  });

  // Host shows next question
  socket.on('next-question', (gamePin) => {
    const game = games.get(gamePin);
    if (!game || game.host !== socket.id) return;
    
    // Reset answered status
    game.players.forEach(p => p.answered = false);
    
    game.currentQuestion++;
    
    if (game.currentQuestion >= game.quiz.questions.length) {
      // Game ended
      game.state = 'ended';
      const finalResults = calculateFinalResults(game);
      io.to(`game-${gamePin}`).emit('game-ended', finalResults);
    } else {
      // Next question
      const question = game.quiz.questions[game.currentQuestion];
      io.to(`game-${gamePin}`).emit('question-start', {
        questionNumber: game.currentQuestion + 1,
        totalQuestions: game.quiz.questions.length,
        question: question.question,
        answers: question.answers,
        timeLimit: question.timeLimit || 20
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up player from games
    games.forEach((game, pin) => {
      if (game.players.has(socket.id)) {
        game.players.delete(socket.id);
        io.to(game.host).emit('player-left', {
          players: Array.from(game.players.values()).map(p => p.name)
        });
      }
    });
  });
});

function calculateResults(game) {
  const players = Array.from(game.players.values());
  return players
    .sort((a, b) => b.score - a.score)
    .map((p, idx) => ({ rank: idx + 1, name: p.name, score: p.score }));
}

function calculateFinalResults(game) {
  return calculateResults(game).slice(0, 5); // Top 5
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});