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
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store active rooms
const rooms = new Map();

// Available categories - just Classic for now
const availableCategories = ['Klasik'];
    'Hastane', 'Okul', 'Restoran', 'Kuaför', 'Sinema', 'Kütüphane', 
    'Süpermarket', 'Benzin İstasyonu', 'Banka', 'Postane', 'Eczane', 'Kahvehane',
    'Spor Salonu', 'Müze', 'Park', 'Polis Karakolu', 'İtfaiye', 'Veteriner',
    'Optisyen', 'Diş Hekimi', 'Berber', 'Güzellik Salonu', 'Masaj Salonu', 'Berber Dükkanı',
    'Manav', 'Kasap', 'Bakkal', 'Terzi', 'Temizlik', 'Çiçekçi',
    'Pastane', 'Kahve Dükkanı', 'Çay Evi', 'Nargile Kafesi', 'İnternet Kafe', 'Fotokopi Merkezi',
    'ATM', 'Noterlik', 'Emlak Ofisi', 'Sigorta Acentesi', 'Seyahat Acentesi', 'Kargo Şirketi',
    'Taksi Durağı', 'Dolmuş Durağı', 'Metro İstasyonu', 'Vapur İskelesi', 'Hastane Acil', 'Sağlık Ocağı',
    'Üniversite', 'Lise', 'İlkokul', 'Anaokulu', 'Kreş', 'Dershane',
    'Cami', 'Kilise', 'Cemevi', 'Mezarlık', 'Düğün Salonu', 'Nikah Dairesi',
    'Mahalle Muhtarlığı', 'Belediye', 'Kaymakamlık', 'Valilik', 'Adliye', 'Vergi Dairesi',
    'Apartman Dairesi', 'Villa', 'Dubleks', 'Çatı Katı', 'Bodrum Kat', 'Balkon'
  ],
  
  'İş Yerleri': [
    'Ofis', 'Fabrika', 'Atölye', 'Depo', 'Mağaza', 'Dükkan',
    'Banka', 'Muhasebeci', 'Avukat', 'Doktor', 'Diş Hekimi', 'Veteriner',
    'Reklam Ajansı', 'Tasarım Stüdyosu', 'Yazılım Şirketi', 'Bilgisayar Tamiri', 'Web Ajansı', 'Grafik Tasarım',
    'İnşaat Firması', 'Mimarlık', 'Mühendislik', 'Danışmanlık', 'Emlak', 'Proje Ofisi',
    'Sigorta', 'Turizm Acentesi', 'Kargo', 'Nakliyat', 'Lojistik', 'Gümrük',
    'Gazete', 'Radyo', 'Televizyon', 'Prodüksiyon', 'Stüdyo', 'Medya',
    'Kuaför', 'Güzellik Salonu', 'Berber', 'Estetik', 'Spa', 'Masaj',
    'Restoran', 'Cafe', 'Pastane', 'Catering', 'Yemek Servisi', 'Aşçıbaşı',
    'Tekstil', 'Ayakkabı', 'Mobilya', 'Otomotiv', 'Elektronik', 'Gıda',
    'Çiftlik', 'Sera', 'Tarla', 'Bağ', 'Bahçe', 'Hayvancılık',
    'Maden', 'Petrol', 'Enerji', 'Elektrik', 'Santral', 'Tesis',
    'Çağrı Merkezi', 'Satış', 'İnsan Kaynakları', 'Pazarlama', 'Muhasebe', 'Bilgi İşlem'
  ],
  
  'Eğlence Yerleri': [
    'Sinema', 'Tiyatro', 'Opera', 'Konser Salonu', 'Müzik Kulübü', 'Jazz Bar',
    'Gece Kulübü', 'Diskotek', 'Bar', 'Pub', 'Bira Evi', 'Meyhane',
    'Karaoke', 'Bowling', 'Bilardo', 'Oyun Salonu', 'Video Oyun', 'Langırt',
    'Lunapark', 'Sirk', 'Tema Parkı', 'Su Parkı', 'Macera Parkı', 'Eğlence Parkı',
    'Kumarhane', 'Yarış Pisti', 'Go-Kart', 'Paintball', 'Lazer Tag', 'Escape Room',
    'Plaj', 'Sahil', 'Marina', 'Yat Kulübü', 'Tekne', 'Balık Tutma',
    'Kayak Merkezi', 'Snowboard', 'Paten', 'Buz Pateni', 'Curling', 'Hokey',
    'Futbol Sahası', 'Basketbol', 'Tenis', 'Voleybol', 'Badminton', 'Squash',
    'Yüzme Havuzu', 'Aqua Park', 'Sauna', 'Hamam', 'Spa', 'Wellness',
    'Kamp', 'Çadır', 'Karavan', 'Dağcılık', 'Trekking', 'Doğa Yürüyüşü',
    'Festival', 'Konser', 'Açık Hava', 'Piknik', 'Barbekü', 'Mangal',
    'Müze', 'Sanat Galerisi', 'Sergi', 'Kültür Merkezi', 'Sosyal Tesis', 'Dernek'
  ],
  
  'Ulaşım Yerleri': [
    'Havaalanı', 'Tren İstasyonu', 'Otobüs Terminali', 'Dolmuş Durağı', 'Taksi Durağı', 'Metro',
    'Tramvay', 'Vapur', 'Feribot', 'Hızlı Tren', 'Banliyö', 'Kargo Treni',
    'Benzin İstasyonu', 'LPG', 'Şarj İstasyonu', 'Oto Tamiri', 'Lastik', 'Yıkama',
    'Oto Galeri', 'Araba Kiralama', 'Oto Park', 'Vale', 'Park Yeri', 'Garaj',
    'Karayolu', 'Otoyol', 'Köprü', 'Tünel', 'Viraj', 'Kavşak',
    'Gümrük', 'Pasaport', 'Vize', 'Konsolosluk', 'Seyahat Acentesi', 'Tur Otobüsü',
    'Otel', 'Motel', 'Pansiyon', 'Hostel', 'Kamp', 'Konaklama',
    'Restoran', 'Cafe', 'Fast Food', 'Dinlenme Tesisi', 'Mola', 'Piknik',
    'Hastane', 'Acil Servis', 'Ambulans', 'Sağlık Merkezi', 'Eczane', 'Veteriner',
    'Polis', 'Jandarma', 'Askeriye', 'Güvenlik', 'Trafik', 'Radar',
    'Kargo', 'Postane', 'Kurye', 'Dağıtım', 'Depo', 'Yükleme',
    'Harita', 'GPS', 'Navigasyon', 'Kilometre Taşı', 'Yol Levhası', 'Trafik Işığı'
  ],
  
  'Fantastik Yerler': [
    'Uzay İstasyonu', 'Ay Üssü', 'Mars Kolonisi', 'Uzay Gemisi', 'Roket', 'Satelit',
    'Denizaltı', 'Suya Batık Şehir', 'Okyanus Tabanı', 'Mercan Resifi', 'Derin Deniz', 'Balık Sürüsü',
    'Korsan Gemisi', 'Hazine Adası', 'Korsan Koyu', 'Gemi Mezarlığı', 'Fırtına', 'Kasırga',
    'Saray', 'Kale', 'Şato', 'Kule', 'Zindan', 'Taht Odası',
    'Büyücü Kulesi', 'Sihir Okulu', 'Laboratuvar', 'İksir', 'Büyü Kitabı', 'Kristal Top',
    'Ejder İni', 'Ejder Mağarası', 'Ateş Dağı', 'Volkan', 'Lav Gölü', 'Kükürt Madenı',
    'Elf Köyü', 'Cüce Madenı', 'Hobbit Deliği', 'Büyülü Orman', 'Konuşan Ağaçlar', 'Peri Çemberi',
    'Vampir Şatosu', 'Hayalet Evi', 'Mezarlık', 'Zombi Kasabası', 'Korku Evi', 'Kanlı Ay',
    'Gökkuşağı Köprüsü', 'Bulut Şehri', 'Uçan Ada', 'Levitasyon', 'Anti-Gravite', 'Sonsuzluk',
    'Zaman Makinesi', 'Portal', 'Boyut Kapısı', 'Paralel Evren', 'Alternatif Gerçeklik', 'Matrix',
    'Robot Fabrikası', 'Cyborg Hastanesi', 'Yapay Zeka', 'Hologram', 'Sanal Gerçeklik', 'Simülasyon',
    'Ninja Köyü', 'Samuray Dojo', 'Kung Fu Tapınağı', 'Gizli Ajan', 'Casuslar', 'Gizli Üs',
    'Süper Kahraman Üssü', 'Gizli Kimlik', 'Maske', 'Pelerin', 'Süper Güç', 'Kurtarma Görevi'
  ],
  
  'Doğa Yerleri': [
    'Orman', 'Çam Ormanı', 'Meşe Ormanı', 'Kayın Ormanı', 'Tropikal Orman', 'Yağmur Ormanı',
    'Dağ', 'Dağ Zirvesi', 'Dağ Eteği', 'Yamaç', 'Uçurum', 'Kanyon',
    'Göl', 'Gölet', 'Baraj Gölü', 'Krater Gölü', 'Buzul Gölü', 'Tuz Gölü',
    'Nehir', 'Dere', 'Çay', 'Şelale', 'Pınar', 'Kaynak',
    'Deniz', 'Okyanus', 'Körfez', 'Koy', 'Boğaz', 'Ada',
    'Plaj', 'Kumsal', 'Koy', 'Mağara', 'Kaya', 'Kayalık',
    'Çöl', 'Kum Tepesi', 'Vaha', 'Miraç', 'Kaktüs', 'Deve Kervanı',
    'Buzul', 'Buz Dağı', 'Kutup', 'Tundra', 'Permafrost', 'Aurora',
    'Volkan', 'Krater', 'Lav', 'Magma', 'Termal Kaynak', 'Jeotermal',
    'Tarla', 'Çayır', 'Mera', 'Step', 'Prairie', 'Savana',
    'Bataklık', 'Mangrov', 'Delta', 'Nehir Ağzı', 'Lagün', 'Körfez',
    'Milli Park', 'Doğa Rezervi', 'Koruma Alanı', 'Safari', 'Hayvanat Bahçesi', 'Botanik Bahçesi'
  ],
  
  'Sporcu Yerleri': [
    'Futbol Stadyumu', 'Basketbol', 'Tenis', 'Voleybol', 'Hentbol', 'Rugby',
    'Atletizm', 'Koşu Pisti', 'Maraton', 'Sprint', 'Engelli Koşu', 'Atlama',
    'Yüzme Havuzu', 'Olimpik Havuz', 'Dalış', 'Su Topu', 'Yüzme', 'Aquatik',
    'Buz Pateni', 'Hokey', 'Curling', 'Figure Skating', 'Buzda Dans', 'Bobsled',
    'Kayak', 'Slalom', 'Snowboard', 'Kayak Atlama', 'Biatlon', 'Kızak',
    'Bisiklet', 'Velodrom', 'BMX', 'Mountain Bike', 'Yol Bisikleti', 'Bisiklet Yarışı',
    'Boks', 'Karate', 'Judo', 'Tekvando', 'Kung Fu', 'MMA',
    'Ağırlık Kaldırma', 'Powerlifting', 'Bodybuilding', 'Crossfit', 'Fitness', 'Pilates',
    'Golf', 'Mini Golf', 'Golf Sahası', 'Putting', 'Golf Kulübü', 'Golf Dersi',
    'At Yarışı', 'Hipodrom', 'Polo', 'Binicilik', 'Dressage', 'Atlı Spor',
    'Motor Yarışı', 'Formula 1', 'Rally', 'Motocross', 'Superbike', 'Karting',
    'Spor Merkezi', 'Antrenman', 'Kondisyon', 'Rehabilitasyon', 'Fizyoterapi', 'Spor Doktoru'
  ]
};

class GameRoom {
  constructor(code, hostId) {
    this.code = code;
    this.hostId = hostId;
    this.players = new Map();
    this.gameState = 'waiting'; // waiting, playing, ended
    this.location = null;
    this.category = null;
    this.availableLocations = [];
    this.spyIds = []; // Array to support multiple spies
    this.spyCount = 1; // Number of spies (1 or 2)
    this.eliminatedSpies = new Set(); // Track eliminated spies
    this.startTime = null;
    this.gameTimer = null;
    this.gameDuration = 8 * 60; // 8 minutes in seconds
    this.votes = new Map();
    this.votingInProgress = false;
    this.scores = new Map(); // playerId -> score
  }

  addPlayer(playerId, playerName) {
    if (this.players.size >= 8) {
      return false; // Room full
    }
    
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      isHost: playerId === this.hostId,
      isSpy: false,
      isConnected: true
    });
    
    // Initialize score
    this.scores.set(playerId, 0);
    
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.scores.delete(playerId);
    
    // If host leaves, assign new host
    if (playerId === this.hostId && this.players.size > 0) {
      const firstPlayer = this.players.values().next().value;
      this.hostId = firstPlayer.id;
      firstPlayer.isHost = true;
    }
  }

  startGame(category, duration, spyCount = 1) {
    if (this.players.size < 4) {
      return false; // Need at least 4 players
    }
    
    // Validate spy count
    if (spyCount < 1 || spyCount > 2 || spyCount >= this.players.size) {
      return false;
    }

    this.gameState = 'playing';
    this.category = category;
    this.gameDuration = duration || 8 * 60; // Default 8 minutes
    this.spyCount = spyCount;
    this.availableLocations = [...locationCategories[category]];
    this.location = this.availableLocations[Math.floor(Math.random() * this.availableLocations.length)];
    
    // Reset all players' spy status and spy tracking
    this.players.forEach(player => player.isSpy = false);
    this.spyIds = [];
    this.eliminatedSpies.clear();
    
    // Select random spies
    const playerIds = Array.from(this.players.keys());
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < spyCount; i++) {
      const spyId = shuffled[i];
      this.spyIds.push(spyId);
      this.players.get(spyId).isSpy = true;
    }
    
    // Start timer
    this.startTime = Date.now();
    
    return true;
  }

  endGame(reason, winner = null, winningSpyId = null) {
    this.gameState = 'ended';
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
    
    // Award points based on game result
    if (winner === 'spy') {
      if (reason === 'spyGuess' && winningSpyId) {
        // Only the spy who guessed correctly gets 2 points
        this.scores.set(winningSpyId, this.scores.get(winningSpyId) + 2);
      } else {
        // All remaining (non-eliminated) spies get 1 point
        this.spyIds.forEach(spyId => {
          if (!this.eliminatedSpies.has(spyId)) {
            this.scores.set(spyId, this.scores.get(spyId) + 1);
          }
        });
      }
    } else if (winner === 'citizens') {
      this.players.forEach((player, playerId) => {
        if (!player.isSpy) {
          this.scores.set(playerId, this.scores.get(playerId) + 1);
        }
      });
    }
    
    return { 
      reason, 
      location: this.location, 
      spyIds: this.spyIds, 
      eliminatedSpies: Array.from(this.eliminatedSpies),
      spyCount: this.spyCount,
      winner,
      winningSpyId,
      scores: Object.fromEntries(this.scores)
    };
  }

  startVoting() {
    this.votingInProgress = true;
    this.votes.clear();
  }

  addVote(voterId, accusedId) {
    if (!this.votingInProgress) return false;
    this.votes.set(voterId, accusedId);
    return true;
  }

  finishVoting() {
    if (!this.votingInProgress) return null;
    
    this.votingInProgress = false;
    const voteCounts = new Map();
    
    for (const accusedId of this.votes.values()) {
      voteCounts.set(accusedId, (voteCounts.get(accusedId) || 0) + 1);
    }
    
    // Find player(s) with most votes
    let maxVotes = 0;
    let playersWithMaxVotes = [];
    
    for (const [playerId, votes] of voteCounts.entries()) {
      if (votes > maxVotes) {
        maxVotes = votes;
        playersWithMaxVotes = [playerId];
      } else if (votes === maxVotes && votes > 0) {
        playersWithMaxVotes.push(playerId);
      }
    }
    
    this.votes.clear();
    
    // Check for tie
    if (playersWithMaxVotes.length > 1) {
      return { tie: true, tiedPlayers: playersWithMaxVotes };
    }
    
    return { tie: false, eliminatedPlayerId: playersWithMaxVotes[0] || null };
  }

  resetForNewRound() {
    this.gameState = 'waiting';
    this.location = null;
    this.category = null;
    this.availableLocations = [];
    this.spyIds = [];
    this.eliminatedSpies.clear();
    this.votingInProgress = false;
    this.votes.clear();
    
    // Reset spy status
    this.players.forEach(player => player.isSpy = false);
    
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }
  
  eliminatePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    if (player.isSpy) {
      this.eliminatedSpies.add(playerId);
      
      // Check if all spies are eliminated
      const remainingSpies = this.spyIds.filter(id => !this.eliminatedSpies.has(id));
      if (remainingSpies.length === 0) {
        // All spies eliminated - citizens win
        return { gameEnded: true, winner: 'citizens' };
      }
      // Game continues
      return { gameEnded: false, eliminatedSpy: true };
    } else {
      // Non-spy eliminated - spies win
      return { gameEnded: true, winner: 'spy' };
    }
  }
}

// Generate unique room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create room
  socket.on('createRoom', (playerName) => {
    const roomCode = generateRoomCode();
    const room = new GameRoom(roomCode, socket.id);
    
    if (room.addPlayer(socket.id, playerName)) {
      rooms.set(roomCode, room);
      socket.join(roomCode);
      
      socket.emit('roomCreated', {
        roomCode,
        playerId: socket.id,
        isHost: true
      });
      
      io.to(roomCode).emit('playersUpdate', Array.from(room.players.values()));
    }
  });

  // Join room
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', 'Oda bulunamadı');
      return;
    }
    
    if (room.gameState !== 'waiting') {
      socket.emit('error', 'Oyun zaten başlamış');
      return;
    }
    
    if (room.addPlayer(socket.id, playerName)) {
      socket.join(roomCode);
      
      socket.emit('roomJoined', {
        roomCode,
        playerId: socket.id,
        isHost: false
      });
      
      io.to(roomCode).emit('playersUpdate', Array.from(room.players.values()));
    } else {
      socket.emit('error', 'Oda dolu');
    }
  });

  // Get available categories
  socket.on('getCategories', () => {
    socket.emit('categoriesData', Object.keys(locationCategories));
  });

  // Start game
  socket.on('startGame', ({ roomCode, category, duration, spyCount }) => {
    const room = rooms.get(roomCode);
    
    if (!room || room.hostId !== socket.id) {
      socket.emit('error', 'Oyunu sadece host başlatabilir');
      return;
    }
    
    if (room.startGame(category, duration, spyCount)) {
      // Send game data to each player
      room.players.forEach((player, playerId) => {
        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket) {
          playerSocket.emit('gameStarted', {
            location: player.isSpy ? null : room.location,
            isSpy: player.isSpy,
            availableLocations: room.availableLocations, // For spy's reference
            category: room.category,
            gameDuration: room.gameDuration,
            spyCount: room.spyCount,
            players: Array.from(room.players.values()).map(p => ({
              id: p.id,
              name: p.name,
              isConnected: p.isConnected,
              score: room.scores.get(p.id) || 0,
              isSpy: p.isSpy
            }))
          });
        }
      });
    } else {
      socket.emit('error', 'Oyunu başlatmak için en az 4 oyuncu gerekli');
    }
  });

  // Start voting session
  socket.on('startVoting', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.gameState === 'playing' && !room.votingInProgress) {
      room.startVoting();
      io.to(roomCode).emit('votingStarted', {
        players: Array.from(room.players.values()).map(p => ({
          id: p.id,
          name: p.name
        }))
      });
    }
  });

  // Vote for elimination
  socket.on('vote', ({ roomCode, accusedId }) => {
    const room = rooms.get(roomCode);
    if (room && room.gameState === 'playing' && room.votingInProgress) {
      if (room.addVote(socket.id, accusedId)) {
        // Notify about vote count
        io.to(roomCode).emit('voteUpdate', {
          votesReceived: room.votes.size,
          totalPlayers: room.players.size
        });
        
        // Check if all players have voted
        if (room.votes.size >= room.players.size) {
          const voteResult = room.finishVoting();
          
          if (voteResult.tie) {
            // Handle tie - cancel voting and reset
            room.votingInProgress = false;
            
            const tiedPlayerNames = voteResult.tiedPlayers
              .map(id => {
                const player = room.players.get(id);
                return player ? player.name : 'Bilinmiyor';
              })
              .join(', ');
            
            io.to(roomCode).emit('votingCancelled', {
              reason: 'tie',
              tiedPlayers: tiedPlayerNames
            });
          } else {
            // Normal elimination
            const eliminatedPlayerId = voteResult.eliminatedPlayerId;
            const eliminatedPlayer = room.players.get(eliminatedPlayerId);
            
            if (!eliminatedPlayer) {
              socket.emit('error', 'Oyuncu bulunamadı');
              return;
            }
            
            const eliminationResult = room.eliminatePlayer(eliminatedPlayerId);
            
            if (eliminationResult.gameEnded) {
              // Game ends
              const gameResult = room.endGame('vote', eliminationResult.winner);
              io.to(roomCode).emit('gameEnded', {
                ...gameResult,
                eliminatedPlayer: eliminatedPlayer.name,
                eliminatedPlayerId
              });
            } else {
              // Game continues (spy eliminated but others remain)
              io.to(roomCode).emit('playerEliminated', {
                eliminatedPlayer: eliminatedPlayer.name,
                eliminatedPlayerId,
                isSpy: eliminatedPlayer.isSpy,
                gameContInues: true,
                remainingSpies: room.spyIds.filter(id => !room.eliminatedSpies.has(id)).length
              });
              
              // Reset voting
              room.votingInProgress = false;
            }
          }
        }
      }
    }
  });

  // Spy guesses location
  socket.on('spyGuess', ({ roomCode, guessedLocation }) => {
    const room = rooms.get(roomCode);
    if (room && room.gameState === 'playing' && room.spyIds.includes(socket.id) && !room.eliminatedSpies.has(socket.id)) {
      const isCorrect = guessedLocation === room.location;
      const winner = isCorrect ? 'spy' : 'citizens';
      const gameResult = room.endGame('spyGuess', winner, isCorrect ? socket.id : null);
      
      io.to(roomCode).emit('gameEnded', {
        ...gameResult,
        spyGuess: guessedLocation,
        wasSpyCorrect: isCorrect,
        guessingSpyId: socket.id
      });
    }
  });

  // New round (reset game but keep scores)
  socket.on('newRound', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.hostId === socket.id) {
      room.resetForNewRound();
      io.to(roomCode).emit('newRoundStarted', {
        players: Array.from(room.players.values()).map(p => ({
          id: p.id,
          name: p.name,
          score: room.scores.get(p.id) || 0
        }))
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Find and update room
    for (const [roomCode, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          // Delete empty room
          rooms.delete(roomCode);
        } else {
          // Update remaining players
          io.to(roomCode).emit('playersUpdate', Array.from(room.players.values()));
        }
        break;
      }
    }
  });
});

// Game timer check
setInterval(() => {
  rooms.forEach((room, roomCode) => {
    if (room.gameState === 'playing' && room.startTime) {
      const elapsed = Date.now() - room.startTime;
      if (elapsed >= room.gameDuration * 1000) {
        // Time's up - remaining spies win
        const gameResult = room.endGame('timeout', 'spy');
        io.to(roomCode).emit('gameEnded', gameResult);
      }
    }
  });
}, 1000); // Check every second

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Spyfall Turkish sunucusu ${PORT} portunda çalışıyor`);
});
