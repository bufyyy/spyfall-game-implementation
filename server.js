const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const spyfallClassic = require('./spyfall-data');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://spyfall-game-implementation.vercel.app", "https://spyfall-game-implementation-git-main-bufyyy.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Spyfall server is running' });
});

// Store active rooms
const rooms = new Map();

// Available categories - just Classic for now
const availableCategories = ['Klasik'];

// Game Room class
class GameRoom {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = new Map();
        this.location = null;
        this.gameActive = false;
        this.gameTimer = 0;
        this.gameDuration = 300; // 5 minutes default
        this.spyId = null; // Only one spy in official Spyfall
        this.spyCount = 1; // Always 1 in official rules
        this.availableLocations = [];
        this.timerStopped = false; // Official rule: clock can be stopped for accusations
        this.accusationInProgress = false;
        this.currentAccuser = null;
        this.accusedPlayer = null;
        this.accusationVotes = new Map(); // For unanimous voting
        this.scores = new Map();
        this.dealerId = null; // Track current dealer
        this.timeoutAccusationPhase = false;
        this.timeoutAccusationOrder = [];
        this.roundNumber = 0;
        this.usedLocations = new Set(); // Track used locations to avoid repeats
        this.spyFinalGuessOpportunity = null; // Track spy's final guess after being found guilty
        this.spyFinalGuessAccuser = null; // Track who accused the spy for bonus points
        this.spyEliminated = false; // Track if the single spy is eliminated
        this.roles = new Map(); // New: Store player roles
        // Remove last spy guess opportunity (not in official rules) // Store ID of spy who gets final guess after elimination
    }

    addPlayer(id, name) {
        this.players.set(id, {
            id,
            name,
            isSpy: false,
            role: null // New: Player role
        });
        this.scores.set(id, 0);
    }

    removePlayer(id) {
        this.players.delete(id);
        this.scores.delete(id);
        this.roles.delete(id); // New: Clean up role
        
        let newHostAssigned = false;
        let newHostId = null;
        
        if (id === this.hostId && this.players.size > 0) {
            this.hostId = this.players.keys().next().value;
            newHostAssigned = true;
            newHostId = this.hostId;
        }
        
        return { newHostAssigned, newHostId };
    }

    startGame(category = 'Klasik', duration = 480, spyCount = 1, customData = null) {
        // Reset game state - official Spyfall uses 8 minutes (480 seconds)
        this.spyId = null;
        this.spyEliminated = false;
        this.timerStopped = false;
        this.accusationInProgress = false;
        this.currentAccuser = null;
        this.accusedPlayer = null;
        this.accusationVotes.clear();
        this.timeoutAccusationPhase = false;
        this.timeoutAccusationOrder = [];
        this.spyFinalGuessOpportunity = null;
        this.spyFinalGuessAccuser = null;
        
        // Set dealer (first game: host, later: previous spy)
        if (!this.dealerId) {
            this.dealerId = this.hostId; // Host is first dealer
        }
        
        // Increment round number
        this.roundNumber++;
        this.spyCount = spyCount;
        this.gameDuration = duration;
        this.gameTimer = duration;
        
        // Reset all players
        for (let player of this.players.values()) {
            player.isSpy = false;
            player.role = null;
        }
        
        let locationData;
        
        if (category === 'custom' && customData) {
            // Use custom locations
            locationData = customData.locations;
            this.category = customData.categoryName;
        } else {
            // Use classic Spyfall locations
            locationData = spyfallClassic;
            this.category = 'Klasik Spyfall';
        }
        
        // Add dynamic player locations
        const playerNames = Array.from(this.players.values()).map(p => p.name);
        const dynamicLocations = {};
        playerNames.forEach(name => {
            const locationName = `${name}'nin Evi`;
            dynamicLocations[locationName] = [
                'Ev Sahibi',
                'Misafir',
                'Aile Üyesi',
                'Komşu',
                'Temizlik Görevlisi',
                'Tesisatçı',
                'Elektrikçi',
                'Kurye'
            ];
        });
        
        // Combine location data with dynamic locations
        const allLocations = { ...locationData, ...dynamicLocations };
        
        // Choose random location (avoid used ones if possible)
        const locations = Object.keys(allLocations);
        const unusedLocations = locations.filter(loc => !this.usedLocations.has(loc));
        
        if (unusedLocations.length > 0) {
            this.location = unusedLocations[Math.floor(Math.random() * unusedLocations.length)];
        } else {
            // All locations used, reset and pick any
            this.usedLocations.clear();
            this.location = locations[Math.floor(Math.random() * locations.length)];
        }
        
        // Mark this location as used
        this.usedLocations.add(this.location);
        
        // Get available roles for this location
        const availableRoles = [...allLocations[this.location]];
        
        // Select exactly one spy (official Spyfall rule)
        const playerIds = Array.from(this.players.keys());
        this.spyId = playerIds[Math.floor(Math.random() * playerIds.length)];
        
        this.players.get(this.spyId).isSpy = true;
        this.players.get(this.spyId).role = 'Casus'; // Spy gets "Casus" as role
        
        // Assign roles to non-spy players
        const nonSpyPlayers = Array.from(this.players.values()).filter(p => !p.isSpy);
        for (let player of nonSpyPlayers) {
            if (availableRoles.length > 0) {
                const randomRoleIndex = Math.floor(Math.random() * availableRoles.length);
                player.role = availableRoles.splice(randomRoleIndex, 1)[0];
            } else {
                player.role = 'Sıradan Kişi';
            }
        }
        
        // Set available locations for spies to see (include dynamic locations)
        this.availableLocations = Object.keys(allLocations);
        
        this.gameActive = true;
    }

    eliminatePlayer(playerId, byVote = false) {
        const player = this.players.get(playerId);
        if (!player) return { gameEnded: false };
        
        if (player.isSpy) {
            // Spy eliminated - citizens win immediately (no last guess in official rules)
            this.spyEliminated = true;
            return { gameEnded: true, winner: 'citizens', eliminatedSpy: true };
        } else {
            // Non-spy eliminated, spy wins
            return { gameEnded: true, winner: 'spy', eliminatedSpy: false };
        }
    }

    endGame(reason, winner = null, winningSpyId = null) {
        this.gameActive = false;
        this.timerStopped = false; // Reset timer state
        
        // Official Spyfall scoring system
        if (reason === 'spyGuess' && winningSpyId) {
            // Spy guessed correctly - gets 4 points (official rule)
            const currentScore = this.scores.get(winningSpyId) || 0;
            this.scores.set(winningSpyId, currentScore + 4);
        } else if (winner === 'spy') {
            if (reason === 'timeout') {
                // Spy wins by timeout - gets 2 points (official rule)
                const currentScore = this.scores.get(this.spyId) || 0;
                this.scores.set(this.spyId, currentScore + 2);
            } else if (reason === 'accusation') {
                // Spy wins by misdirecting accusation - gets 4 points (official rule)
                const currentScore = this.scores.get(this.spyId) || 0;
                this.scores.set(this.spyId, currentScore + 4);
            }
        } else if (winner === 'citizens') {
            // Citizens win - all non-spies get 1 point, accuser gets +1 bonus (2 total)
            for (let [playerId, player] of this.players.entries()) {
                if (!player.isSpy) {
                    const currentScore = this.scores.get(playerId) || 0;
                    if (playerId === winningSpyId) { // winningSpyId used as accuserId here
                        this.scores.set(playerId, currentScore + 2); // Accuser gets 2 points
                    } else {
                        this.scores.set(playerId, currentScore + 1); // Others get 1 point
                    }
                }
            }
        }
    }

    // Official Spyfall accusation system
    startAccusation(accuserId, accusedId) {
        this.timerStopped = true;
        this.accusationInProgress = true;
        this.currentAccuser = accuserId;
        this.accusedPlayer = accusedId;
        this.accusationVotes.clear();
    }

    addAccusationVote(voterId, vote) {
        // vote is true for "guilty", false for "innocent"
        this.accusationVotes.set(voterId, vote);
    }

    finishAccusation() {
        const totalVoters = this.players.size - 1; // Accused doesn't vote
        const guiltyVotes = Array.from(this.accusationVotes.values()).filter(vote => vote === true).length;
        
        // Requires UNANIMOUS agreement (all non-accused players must vote guilty)
        const unanimous = guiltyVotes === totalVoters && this.accusationVotes.size === totalVoters;
        
        this.accusationInProgress = false;
        
        if (unanimous) {
            // Accused is eliminated
            return { unanimous: true, accusedPlayerId: this.accusedPlayer };
        } else {
            // Accusation failed
            if (this.timeoutAccusationPhase) {
                // Continue timeout accusation phase with next player
                return { unanimous: false, continueTimeoutAccusation: true };
            } else {
                // Regular accusation failed, resume timer
                this.timerStopped = false;
                // Don't reset accusation IDs here - let the caller handle it
                return { unanimous: false };
            }
        }
    }

    startTimeoutAccusationPhase() {
        this.timeoutAccusationPhase = true;
        this.timerStopped = true; // Keep timer stopped during accusation phase
        
        // Create accusation order starting with dealer, going left
        const playerIds = Array.from(this.players.keys());
        const dealerIndex = playerIds.indexOf(this.dealerId);
        
        this.timeoutAccusationOrder = [];
        for (let i = 0; i < playerIds.length; i++) {
            const index = (dealerIndex + i) % playerIds.length;
            this.timeoutAccusationOrder.push(playerIds[index]);
        }
        
        return this.getNextTimeoutAccuser();
    }

    getNextTimeoutAccuser() {
        if (this.timeoutAccusationOrder.length === 0) {
            // All players have tried, spy wins
            return { finished: true, spyWins: true };
        }
        
        const nextAccuserId = this.timeoutAccusationOrder.shift();
        return { finished: false, nextAccuserId };
    }

    resetForNewRound() {
        // Official rule: Previous spy becomes next dealer
        const previousSpyId = this.spyId;
        
        this.location = null;
        this.gameActive = false;
        this.gameTimer = 0;
        this.spyId = null;
        this.availableLocations = [];
        this.timerStopped = false;
        this.accusationInProgress = false;
        this.currentAccuser = null;
        this.accusedPlayer = null;
        this.accusationVotes.clear();
        this.timeoutAccusationPhase = false;
        this.timeoutAccusationOrder = [];
        this.spyEliminated = false;
        this.spyFinalGuessOpportunity = null;
        this.spyFinalGuessAccuser = null;
        
        // Set previous spy as new dealer
        if (previousSpyId && this.players.has(previousSpyId)) {
            this.dealerId = previousSpyId;
        }
        // Remove last spy guess opportunity (not in official rules)
        
        // Reset player states but keep scores
        for (let player of this.players.values()) {
            player.isSpy = false;
            player.role = null;
        }
    }
}

// Utility function to generate a room code
function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('createRoom', (playerName) => {
        let roomCode;
        do {
            roomCode = generateRoomCode();
        } while (rooms.has(roomCode));

        const room = new GameRoom(roomCode, socket.id);
        room.addPlayer(socket.id, playerName);
        rooms.set(roomCode, room);

        socket.join(roomCode);
                 socket.emit('roomCreated', { 
             roomCode, 
             hostId: socket.id, 
             playerId: socket.id, 
             isHost: true 
         });
        // Send players with host information
        const playersWithHost = Array.from(room.players.values()).map(player => ({
            ...player,
            isHost: player.id === room.hostId
        }));
        socket.emit('playersUpdate', playersWithHost);
    });

    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('error', 'Oda bulunamadı!');
            return;
        }

        if (room.gameActive) {
            socket.emit('error', 'Oyun devam ediyor, katılamazsınız!');
            return;
        }

        if (room.players.size >= 8) {
            socket.emit('error', 'Oda dolu!');
            return;
        }

        room.addPlayer(socket.id, playerName);
        socket.join(roomCode);
        
                 socket.emit('roomJoined', { 
             roomCode, 
             hostId: room.hostId, 
             playerId: socket.id, 
             isHost: socket.id === room.hostId 
         });
        // Send players with host information for joinRoom
        const playersWithHost = Array.from(room.players.values()).map(player => ({
            ...player,
            isHost: player.id === room.hostId
        }));
        io.to(roomCode).emit('playersUpdate', playersWithHost);
    });

    socket.on('getCategories', () => {
        socket.emit('categoriesData', availableCategories);
    });

    socket.on('getKlasikLocations', () => {
        socket.emit('klasikLocations', spyfallClassic);
    });

    socket.on('startGame', ({ roomCode, category, duration, spyCount, customData, roleAdherence }) => {
        const room = rooms.get(roomCode);
        
        if (!room || socket.id !== room.hostId) {
            socket.emit('error', 'Yetkiniz yok!');
            return;
        }

        if (room.players.size < 4) {
            socket.emit('error', 'En az 4 oyuncu gerekli!');
            return;
        }

        room.startGame(category, duration, spyCount, customData);
        
        // Send game start data to all players
        for (let [playerId, player] of room.players.entries()) {
            io.to(playerId).emit('gameStarted', {
                location: player.isSpy ? null : room.location,
                role: player.role,
                isSpy: player.isSpy,
                availableLocations: room.availableLocations,
                duration: room.gameDuration,
                spyId: room.spyId, // For end game display
                roundNumber: room.roundNumber,
                dealerId: room.dealerId,
                dealerName: (function(dealer) { return dealer ? dealer.name : 'Bilinmiyor'; })(room.players.get(room.dealerId)),
                roleAdherence: roleAdherence || false
            });
        }
    });

    socket.on('startAccusation', ({ roomCode, accusedId }) => {
        const room = rooms.get(roomCode);
        
        if (!room || !room.gameActive) {
            socket.emit('error', 'Oyun aktif değil!');
            return;
        }
        
        if (room.timerStopped || room.accusationInProgress) {
            socket.emit('error', 'Zaten bir süreç devam ediyor!');
            return;
        }
        
        if (!room.players.has(accusedId)) {
            socket.emit('error', 'Geçersiz oyuncu!');
            return;
        }

        room.startAccusation(socket.id, accusedId);
        
        const accusedPlayer = room.players.get(accusedId);
        const accuserPlayer = room.players.get(socket.id);
        
        io.to(roomCode).emit('accusationStarted', {
            accuserId: socket.id,
            accuserName: accuserPlayer ? accuserPlayer.name : 'Bilinmiyor',
            accusedId: accusedId,
            accusedName: accusedPlayer ? accusedPlayer.name : 'Bilinmiyor'
        });
    });

    socket.on('accusationVote', ({ roomCode, vote }) => {
        const room = rooms.get(roomCode);
        
        if (!room || !room.accusationInProgress) {
            socket.emit('error', 'Suçlama aktif değil!');
            return;
        }
        
        // Accused player cannot vote
        if (socket.id === room.accusedPlayer) {
            socket.emit('error', 'Suçlanan oyuncu oy veremez!');
            return;
        }

        room.addAccusationVote(socket.id, vote);
        
        const voteCount = room.accusationVotes.size;
        const totalVoters = room.players.size - 1; // Exclude accused player
        
        io.to(roomCode).emit('accusationVoteUpdate', { voteCount, totalVoters });
        
        // Check if all players voted
        if (voteCount === totalVoters) {
            const accusationResult = room.finishAccusation();
            
            if (accusationResult.unanimous) {
                // Unanimous decision - check if accused is the spy
                const accusedPlayer = room.players.get(accusationResult.accusedPlayerId);
                
                if (accusedPlayer && accusedPlayer.isSpy) {
                    // Spy found guilty - give them one final guess opportunity (official rule)
                    room.spyFinalGuessOpportunity = accusationResult.accusedPlayerId;
                    room.spyFinalGuessAccuser = room.currentAccuser; // Store accuser for bonus points
                    room.timerStopped = true; // Keep timer stopped
                    
                    io.to(roomCode).emit('spyGuiltyFinalGuess', {
                        spyId: accusationResult.accusedPlayerId,
                        spyName: accusedPlayer.name,
                        accuserName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(room.currentAccuser))
                    });
                } else {
                    // Non-spy eliminated - spy wins
                    room.endGame('accusation', 'spy', room.currentAccuser);
                    
                    io.to(roomCode).emit('gameEnded', {
                        reason: 'accusation',
                        winner: 'spy',
                        location: room.location,
                        spyId: room.spyId,
                        eliminatedPlayer: accusedPlayer ? accusedPlayer.name : 'Bilinmiyor',
                        accuserName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(room.currentAccuser)),
                        scores: Array.from(room.scores.entries()).map(([id, score]) => ({
                            playerId: id,
                            playerName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(id)),
                            score: score || 0
                        }))
                    });
                }
            } else if (accusationResult.continueTimeoutAccusation) {
                // Continue timeout accusation phase with next player
                const nextAccuser = room.getNextTimeoutAccuser();
                
                if (nextAccuser.finished && nextAccuser.spyWins) {
                    // All players have tried, spy wins
                    room.endGame('timeout', 'spy');
                    
                    io.to(roomCode).emit('gameEnded', {
                        reason: 'timeout',
                        winner: 'spy',
                        location: room.location,
                        spyId: room.spyId,
                        scores: Array.from(room.scores.entries()).map(([id, score]) => ({
                            playerId: id,
                            playerName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(id)),
                            score: score || 0
                        }))
                    });
                } else {
                    // Next player's turn to accuse
                    io.to(roomCode).emit('timeoutAccusationContinue', {
                        currentAccuserId: nextAccuser.nextAccuserId,
                        currentAccuserName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(nextAccuser.nextAccuserId)),
                        failedAccuserName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(room.currentAccuser))
                    });
                }
                
                // Reset for next accusation
                room.currentAccuser = null;
                room.accusedPlayer = null;
            } else {
                // Regular accusation failed - store names before they might be reset
                const accuserPlayer = room.players.get(room.currentAccuser);
                const accusedPlayer = room.players.get(room.accusedPlayer);
                
                console.log(`Accusation failed - Accuser ID: ${room.currentAccuser}, Accused ID: ${room.accusedPlayer}`);
                console.log(`Accuser Player:`, accuserPlayer);
                console.log(`Accused Player:`, accusedPlayer);
                
                io.to(roomCode).emit('accusationFailed', {
                    accuserName: accuserPlayer ? accuserPlayer.name : 'Bilinmiyor',
                    accusedName: accusedPlayer ? accusedPlayer.name : 'Bilinmiyor'
                });
                
                // Reset accusation state for regular (non-timeout) failed accusations
                room.currentAccuser = null;
                room.accusedPlayer = null;
            }
        }
    });

    socket.on('spyGuess', ({ roomCode, location }) => {
        const room = rooms.get(roomCode);
        const player = room ? room.players.get(socket.id) : null;
        
        const isFinalGuess = room && room.spyFinalGuessOpportunity === socket.id;
        
        if (!room || !player || !player.isSpy) {
            socket.emit('error', 'Tahmin yapamazsınız!');
            return;
        }
        
        if (!room.gameActive && !isFinalGuess) {
            socket.emit('error', 'Oyun aktif değil!');
            return;
        }
        
        if (room.spyEliminated && !isFinalGuess) {
            socket.emit('error', 'Casus zaten elendi!');
            return;
        }
        
        if (room.accusationInProgress && !isFinalGuess) {
            socket.emit('error', 'Suçlama devam ederken tahmin yapamazsınız!');
            return;
        }

        // Official Spyfall: Spy stops the clock to make guess
        room.timerStopped = true;

        // Normalize location strings for comparison (trim whitespace)
        const normalizedGuess = location.trim();
        const normalizedActual = room.location.trim();
        
        console.log(`Spy guess - Player: ${player.name}, Guessed: "${normalizedGuess}", Actual: "${normalizedActual}", Match: ${normalizedGuess === normalizedActual}`);
        
        if (normalizedGuess === normalizedActual) {
            // Spy guessed correctly
            if (isFinalGuess) {
                // Final guess after being found guilty - gets 4 points (official rule)
                room.spyFinalGuessOpportunity = null;
                room.spyFinalGuessAccuser = null;
                room.endGame('spyFinalGuess', 'spy', socket.id);
            } else {
                // Regular spy guess - gets 4 points (official rule)
                room.endGame('spyGuess', 'spy', socket.id);
            }
            
            io.to(roomCode).emit('gameEnded', {
                reason: isFinalGuess ? 'spyFinalGuess' : 'spyGuess',
                winner: 'spy',
                location: room.location,
                spyId: room.spyId,
                winningSpyName: player.name,
                guessedLocation: normalizedGuess,
                isFinalGuess: isFinalGuess,
                scores: Array.from(room.scores.entries()).map(([id, score]) => ({
                    playerId: id,
                    playerName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(id)),
                    score: score || 0
                }))
            });
        } else {
            // Wrong guess
            if (isFinalGuess) {
                // Final guess wrong - citizens win, accuser gets bonus points
                const accuserId = room.spyFinalGuessAccuser;
                room.spyFinalGuessOpportunity = null;
                room.spyFinalGuessAccuser = null;
                room.endGame('spyFinalGuessWrong', 'citizens', accuserId);
            } else {
                // Regular wrong guess - citizens win (1 point each)
                room.endGame('spyWrongGuess', 'citizens');
            }
            
            io.to(roomCode).emit('gameEnded', {
                reason: isFinalGuess ? 'spyFinalGuessWrong' : 'spyWrongGuess',
                winner: 'citizens',
                location: room.location,
                spyId: room.spyId,
                eliminatedSpyName: player.name,
                wrongGuess: location,
                isFinalGuess: isFinalGuess,
                scores: Array.from(room.scores.entries()).map(([id, score]) => ({
                    playerId: id,
                    playerName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(id)),
                    score: score || 0
                }))
            });
        }
    });

    socket.on('newRound', (roomCode) => {
        const room = rooms.get(roomCode);
        
        if (!room || socket.id !== room.hostId) {
            socket.emit('error', 'Yetkiniz yok!');
            return;
        }

        room.resetForNewRound();
        
        const playersData = Array.from(room.players.values()).map(player => ({
            id: player.id,
            name: player.name,
            score: room.scores.get(player.id) || 0,
            isHost: player.id === room.hostId
        }));
        
        io.to(roomCode).emit('newRoundStarted', {
            players: playersData
        });
        io.to(roomCode).emit('playersUpdate', playersData);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        // Find and remove player from any room
        for (let [roomCode, room] of rooms.entries()) {
            if (room.players.has(socket.id)) {
                const removeResult = room.removePlayer(socket.id);
                
                if (room.players.size === 0) {
                    rooms.delete(roomCode);
                } else {
                    // Notify about player update
                    const playersWithHost = Array.from(room.players.values()).map(player => ({
                        ...player,
                        isHost: player.id === room.hostId
                    }));
                    io.to(roomCode).emit('playersUpdate', playersWithHost);
                    
                    // Notify about new host if one was assigned
                    if (removeResult.newHostAssigned) {
                        const newHost = room.players.get(removeResult.newHostId);
                        io.to(roomCode).emit('hostChanged', {
                            newHostId: removeResult.newHostId,
                            newHostName: newHost ? newHost.name : 'Bilinmiyor',
                            message: 'Host ayrıldı. Yeni host atandı!'
                        });
                        
                        // Send special message to the new host
                        io.to(removeResult.newHostId).emit('youAreNowHost', {
                            message: 'Artık bu odanın hostusun! Oyunu başlatabilirsin.'
                        });
                    }
                }
                break;
            }
        }
    });
});

// Timer management for all rooms
setInterval(() => {
    for (let room of rooms.values()) {
        if (room.gameActive && room.gameTimer > 0 && !room.timerStopped) {
            room.gameTimer--;
            
            // Broadcast timer update to all players
            io.to(room.code).emit('timerUpdate', { remainingTime: room.gameTimer });
            
            if (room.gameTimer === 0) {
                // Official Spyfall: Start timeout accusation phase
                const accusationPhase = room.startTimeoutAccusationPhase();
                
                if (accusationPhase.finished && accusationPhase.spyWins) {
                    // No one to start accusation, spy wins immediately
                    room.endGame('timeout', 'spy');
                    
                    io.to(room.code).emit('gameEnded', {
                        reason: 'timeout',
                        winner: 'spy',
                        location: room.location,
                        spyId: room.spyId,
                        scores: Array.from(room.scores.entries()).map(([id, score]) => ({
                            playerId: id,
                            playerName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(id)),
                            score: score || 0
                        }))
                    });
                } else {
                    // Start timeout accusation phase
                    const dealerPlayer = room.players.get(room.dealerId);
                    io.to(room.code).emit('timeoutAccusationPhase', {
                        dealerId: room.dealerId,
                        dealerName: dealerPlayer ? dealerPlayer.name : 'Bilinmiyor',
                        currentAccuserId: accusationPhase.nextAccuserId,
                        currentAccuserName: (function(player) { return player ? player.name : 'Bilinmiyor'; })(room.players.get(accusationPhase.nextAccuserId))
                    });
                }
            }
        }
    }
}, 1000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Spyfall Turkish sunucusu ${PORT} portunda çalışıyor`);
});
