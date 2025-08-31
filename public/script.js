// Socket.IO connection
const socket = io();

// Game state
let gameState = {
    roomCode: null,
    playerId: null,
    isHost: false,
    players: [],
    isSpy: false,
    location: null,
    role: null, // New: Player role
    availableLocations: [],
    category: 'Klasik', // Default to classic
    gameTimer: null,
    gameDuration: 480,
    selectedVote: null,
    votingInProgress: false,
    hasVoted: false,
    // spyCount removed - always 1 in official Spyfall
};

// Custom locations data
let customLocations = {
    categoryName: '',
    locations: {}
};

// DOM Elements
const screens = {
    mainMenu: document.getElementById('mainMenu'),
    waitingRoom: document.getElementById('waitingRoom'),
    gameScreen: document.getElementById('gameScreen'),
    gameEndScreen: document.getElementById('gameEndScreen')
};

// Main Menu Elements
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const playerNameInput = document.getElementById('playerNameInput');

// Waiting Room Elements
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const playerCount = document.getElementById('playerCount');
const playersList = document.getElementById('playersList');
const gameSettings = document.getElementById('gameSettings');
// const categorySelect = document.getElementById('categorySelect'); // Removed for classic mode
const durationSelect = document.getElementById('durationSelect');
// roleAdherenceSelect removed
// spyCountSelect removed - always 1 spy
const startGameBtn = document.getElementById('startGameBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');

// Game Screen Elements
const gameTimer = document.getElementById('gameTimer');
const gameRoomCode = document.getElementById('gameRoomCode');
const peekRoleBtn = document.getElementById('peekRoleBtn');
const spyLocations = document.getElementById('spyLocations');
const categoryName = document.getElementById('categoryName');
const locationsList = document.getElementById('locationsList');
// spyCountDisplay removed - always shows 1
const remainingSpiesDisplay = document.getElementById('remainingSpiesDisplay');
const votingStatus = document.getElementById('votingStatus');
const voteCount = document.getElementById('voteCount');
const totalVotes = document.getElementById('totalVotes');
const gamePlayersList = document.getElementById('gamePlayersList');
const startVotingBtn = document.getElementById('startVotingBtn');
const spyGuessBtn = document.getElementById('spyGuessBtn');

// Modal Elements
const roleModal = document.getElementById('roleModal');
const roleContent = document.getElementById('roleContent');
const closeRoleBtn = document.getElementById('closeRoleBtn');

const votingModal = document.getElementById('votingModal');
const votingPlayersList = document.getElementById('votingPlayersList');
const confirmVoteBtn = document.getElementById('confirmVoteBtn');
const cancelVoteBtn = document.getElementById('cancelVoteBtn');

const spyGuessModal = document.getElementById('spyGuessModal');
const locationGuessSelect = document.getElementById('locationGuessSelect');
const confirmGuessBtn = document.getElementById('confirmGuessBtn');
const cancelGuessBtn = document.getElementById('cancelGuessBtn');

// Custom Location Elements
const categorySelect = document.getElementById('categorySelect');
const downloadKlasikBtn = document.getElementById('downloadKlasikBtn');
const customLocationControls = document.getElementById('customLocationControls');
const customCategoryName = document.getElementById('customCategoryName');
const uploadLocationsBtn = document.getElementById('uploadLocationsBtn');
const locationFileInput = document.getElementById('locationFileInput');
const downloadLocationsBtn = document.getElementById('downloadLocationsBtn');
const editLocationsBtn = document.getElementById('editLocationsBtn');

// Location Editor Elements
const locationEditorModal = document.getElementById('locationEditorModal');
const newLocationName = document.getElementById('newLocationName');
const addLocationBtn = document.getElementById('addLocationBtn');
const locationList = document.getElementById('locationList');
const roleEditor = document.getElementById('roleEditor');
const selectedLocationName = document.getElementById('selectedLocationName');
const roleInstructions = document.getElementById('roleInstructions');
const newRoleName = document.getElementById('newRoleName');
const addRoleBtn = document.getElementById('addRoleBtn');
const roleList = document.getElementById('roleList');
const saveLocationsBtn = document.getElementById('saveLocationsBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Game End Elements
const gameResultTitle = document.getElementById('gameResultTitle');
const gameResultDescription = document.getElementById('gameResultDescription');
const finalLocation = document.getElementById('finalLocation');
const finalSpy = document.getElementById('finalSpy');
const finalScores = document.getElementById('finalScores');
const newRoundBtn = document.getElementById('newRoundBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// Theme Toggle
const themeBtn = document.getElementById('themeBtn');

// Location Management - Removed for classic mode
// const manageLocationsBtn = document.getElementById('manageLocationsBtn');
// const downloadLocationsBtn = document.getElementById('downloadLocationsBtn');
// const uploadLocationsBtn = document.getElementById('uploadLocationsBtn');
// const uploadTriggerBtn = document.getElementById('uploadTriggerBtn');
// const locationModal = document.getElementById('locationModal');
// const editCategorySelect = document.getElementById('editCategorySelect');
// const locationTextarea = document.getElementById('locationTextarea');
// const saveLocationsBtn = document.getElementById('saveLocationsBtn');
// const resetLocationsBtn = document.getElementById('resetLocationsBtn');
// const cancelLocationEditBtn = document.getElementById('cancelLocationEditBtn');

// Toast
const errorToast = document.getElementById('errorToast');
const errorMessage = document.getElementById('errorMessage');

// Custom locations storage - Removed for classic mode
// let customLocations = null;

// Utility Functions
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showError(message) {
    errorMessage.textContent = message;
    errorToast.classList.add('show');
    setTimeout(() => {
        errorToast.classList.remove('show');
    }, 3000);
}

function generatePlayerName() {
    const adjectives = ['Cesur', 'Akıllı', 'Hızlı', 'Güçlü', 'Zeki', 'Çevik', 'Sakin', 'Komik'];
    const nouns = ['Aslan', 'Kartal', 'Kaplan', 'Kurt', 'Panter', 'Şahin', 'Ejder', 'Feniks'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${Math.floor(Math.random() * 99)}`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateGameTimer() {
    if (gameState.gameTimer) {
        const elapsed = Math.floor((Date.now() - gameState.gameTimer) / 1000);
        const remaining = Math.max(0, gameState.gameDuration - elapsed);
        gameTimer.textContent = formatTime(remaining);
        
        if (remaining <= 0) {
            clearInterval(gameState.timerInterval);
        }
    }
}

// Event Listeners
createRoomBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim() || generatePlayerName();
    socket.emit('createRoom', playerName);
});

joinRoomBtn.addEventListener('click', () => {
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    const playerName = playerNameInput.value.trim() || generatePlayerName();
    
    if (!roomCode) {
        showError('Lütfen oda kodunu girin');
        return;
    }
    
    socket.emit('joinRoom', { roomCode, playerName });
});

startGameBtn.addEventListener('click', () => {
    const duration = parseInt(durationSelect.value);
    const spyCount = 1; // Always 1 spy in official Spyfall
    const roleAdherence = false; // Role adherence removed
    
    if (categorySelect.value === 'custom') {
        if (!customCategoryName.value.trim()) {
            showError('Özel kategori için bir isim girin!');
            return;
        }
        if (Object.keys(customLocations.locations).length === 0) {
            showError('Özel kategori için en az bir lokasyon eklemelisiniz!');
            return;
        }
        // Send custom locations to server
        socket.emit('startGame', { 
            roomCode: gameState.roomCode, 
            category: 'custom',
            customData: {
                categoryName: customCategoryName.value.trim(),
                locations: customLocations.locations
            },
            duration,
            spyCount,
            roleAdherence
        });
    } else {
        socket.emit('startGame', { 
            roomCode: gameState.roomCode, 
            category: categorySelect.value,
            duration,
            spyCount,
            roleAdherence
        });
    }
});

leaveRoomBtn.addEventListener('click', () => {
    socket.disconnect();
    socket.connect();
    showScreen('mainMenu');
    resetGameState();
});

peekRoleBtn.addEventListener('click', () => {
    showRoleModal();
});

startVotingBtn.addEventListener('click', () => {
    if (!gameState.gameActive) {
        showError('Oyun devam etmiyor!');
        return;
    }
    
    // If there's an ongoing accusation, show voting modal instead of accusation modal
    if (startVotingBtn.textContent === '⚖️ Oy Ver') {
        showVotingModal();
    } else {
        // Official Spyfall: Open accusation modal to select who to accuse
        showAccusationModal();
    }
});

spyGuessBtn.addEventListener('click', () => {
    showSpyGuessModal();
});

// Modal event listeners
closeRoleBtn.addEventListener('click', () => {
    hideRoleModal();
});

cancelVoteBtn.addEventListener('click', () => {
    hideVotingModal();
});

confirmVoteBtn.addEventListener('click', () => {
    if (gameState.selectedVote !== null && gameState.selectedVote !== undefined) {
        // Check if this is accusation voting (boolean) or player selection (string)
        if (typeof gameState.selectedVote === 'boolean') {
            // Submit accusation vote (guilty/innocent)
            submitAccusationVote(gameState.selectedVote);
        } else {
            // Start accusation against selected player
            socket.emit('startAccusation', {
                roomCode: gameState.roomCode,
                accusedId: gameState.selectedVote
            });
        }
        hideVotingModal();
    }
});

// New function for accusation voting (guilty/innocent)
function submitAccusationVote(vote) {
    socket.emit('accusationVote', {
        roomCode: gameState.roomCode,
        vote: vote // true for guilty, false for innocent
    });
    hideVotingModal();
}

cancelGuessBtn.addEventListener('click', () => {
    hideSpyGuessModal();
});

confirmGuessBtn.addEventListener('click', () => {
    const guess = locationGuessSelect.value;
    if (guess) {
        socket.emit('spyGuess', {
            roomCode: gameState.roomCode,
            location: guess
        });
        hideSpyGuessModal();
    } else {
        showError('Lütfen bir lokasyon seçin');
    }
});

newRoundBtn.addEventListener('click', () => {
    // Prevent multiple clicks
    if (newRoundBtn.disabled) return;
    
    newRoundBtn.disabled = true;
    newRoundBtn.textContent = '⏳ Başlatılıyor...';
    
    socket.emit('newRound', gameState.roomCode);
    
    // Re-enable after 2 seconds (safety timeout)
    setTimeout(() => {
        newRoundBtn.disabled = false;
        newRoundBtn.textContent = '🔄 Yeni Tur';
    }, 2000);
});

backToMenuBtn.addEventListener('click', () => {
    socket.disconnect();
    socket.connect();
    showScreen('mainMenu');
    resetGameState();
});

// Theme toggle
themeBtn.addEventListener('click', () => {
    toggleTheme();
});

// Custom Location Event Listeners
categorySelect.addEventListener('change', () => {
    if (categorySelect.value === 'custom') {
        customLocationControls.style.display = 'block';
        loadCustomLocations();
    } else {
        customLocationControls.style.display = 'none';
        gameState.category = categorySelect.value;
    }
});

uploadLocationsBtn.addEventListener('click', () => {
    locationFileInput.click();
});

locationFileInput.addEventListener('change', handleFileUpload);

downloadKlasikBtn.addEventListener('click', downloadKlasikLocations);

downloadLocationsBtn.addEventListener('click', downloadCustomLocations);

editLocationsBtn.addEventListener('click', openLocationEditor);

// Location Editor Event Listeners
addLocationBtn.addEventListener('click', addNewLocation);
addRoleBtn.addEventListener('click', addNewRole);
saveLocationsBtn.addEventListener('click', saveCustomLocations);
cancelEditBtn.addEventListener('click', closeLocationEditor);

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === locationEditorModal) {
        closeLocationEditor();
    }
});

// Location management - Removed for classic mode
// manageLocationsBtn.addEventListener('click', () => {
//     showLocationModal();
// });

// downloadLocationsBtn.addEventListener('click', () => {
//     downloadLocations();
// });

// uploadTriggerBtn.addEventListener('click', () => {
//     uploadLocationsBtn.click();
// });

// uploadLocationsBtn.addEventListener('change', (e) => {
//     uploadLocations(e.target.files[0]);
// });

// saveLocationsBtn.addEventListener('click', () => {
//     saveLocationEdits();
// });

// resetLocationsBtn.addEventListener('click', () => {
//     resetLocations();
// });

// cancelLocationEditBtn.addEventListener('click', () => {
//     hideLocationModal();
// });

// Modal Functions
function showRoleModal() {
    roleContent.innerHTML = '';
    
    if (gameState.isSpy) {
        roleContent.innerHTML = `
            <div class="role-spy-card">
                <h3>🕵️ Sen Casussun!</h3>
                <p><strong>Rol:</strong> ${gameState.role}</p>
                <p>Lokasyonu bulmaya çalış, ama yakalanma!</p>
            </div>
        `;
    } else {
        roleContent.innerHTML = `
            <div class="role-location-card">
                <h3>📍 Lokasyon</h3>
                <div class="role-location-name">${gameState.location}</div>
                <h4>🎭 Rolün</h4>
                <div class="role-name">${gameState.role}</div>
                <small>Casusların seni fark etmesini engelle!</small>
            </div>
        `;
    }
    
    roleModal.classList.add('active');
}

function hideRoleModal() {
    roleModal.classList.remove('active');
}

function showAccusationModal() {
    votingPlayersList.innerHTML = '';
    gameState.selectedVote = null;
    
    // Change modal title for accusation
    const modalTitle = votingModal.querySelector('h3');
    if (modalTitle) modalTitle.textContent = '🚨 Suçlama';
    
    gameState.players.forEach(player => {
        if (player.id !== gameState.playerId) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'voting-player';
            playerDiv.textContent = player.name;
            playerDiv.addEventListener('click', () => {
                document.querySelectorAll('.voting-player').forEach(p => p.classList.remove('selected'));
                playerDiv.classList.add('selected');
                gameState.selectedVote = player.id;
            });
            votingPlayersList.appendChild(playerDiv);
        }
    });
    
    // Update confirm button text
    const confirmBtn = votingModal.querySelector('.btn-primary');
    if (confirmBtn) confirmBtn.textContent = '🚨 Suçla';
    
    votingModal.classList.add('active');
}

// Accusation voting modal (guilty/innocent)
function showVotingModal() {
    votingPlayersList.innerHTML = '';
    gameState.selectedVote = null;
    
    const modalTitle = votingModal.querySelector('h3');
    if (modalTitle) modalTitle.textContent = '⚖️ Oylama';
    
    // Show guilty/innocent buttons that highlight when selected
    const guiltyBtn = document.createElement('button');
    guiltyBtn.className = 'btn btn-danger voting-option';
    guiltyBtn.textContent = '😈 Suçlu';
    guiltyBtn.onclick = () => selectAccusationVote(true, guiltyBtn, innocentBtn);
    
    const innocentBtn = document.createElement('button');
    innocentBtn.className = 'btn btn-success voting-option';
    innocentBtn.textContent = '😇 Masum';
    innocentBtn.onclick = () => selectAccusationVote(false, innocentBtn, guiltyBtn);
    
    votingPlayersList.innerHTML = '';
    votingPlayersList.appendChild(guiltyBtn);
    votingPlayersList.appendChild(innocentBtn);
    
    // Show confirm button and update its text
    const confirmBtn = votingModal.querySelector('.btn-primary');
    if (confirmBtn) {
        confirmBtn.style.display = 'inline-block';
        confirmBtn.textContent = '✅ Oy Ver';
        confirmBtn.disabled = true; // Start disabled until selection made
    }
    
    votingModal.classList.add('active');
}

// Select accusation vote (highlight button, don't submit yet)
function selectAccusationVote(vote, selectedBtn, otherBtn) {
    gameState.selectedVote = vote;
    
    // Highlight selected button
    selectedBtn.classList.add('selected');
    selectedBtn.style.opacity = '1';
    selectedBtn.style.transform = 'scale(1.05)';
    
    // Unhighlight other button
    otherBtn.classList.remove('selected');
    otherBtn.style.opacity = '0.7';
    otherBtn.style.transform = 'scale(1)';
    
    // Enable confirm button
    const confirmBtn = votingModal.querySelector('.btn-primary');
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
}

function hideVotingModal() {
    votingModal.classList.remove('active');
}

function showSpyGuessModal() {
    locationGuessSelect.innerHTML = '<option value="">Lokasyon seçin...</option>';
    
    gameState.availableLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationGuessSelect.appendChild(option);
    });
    
    spyGuessModal.classList.add('active');
}

function hideSpyGuessModal() {
    spyGuessModal.classList.remove('active');
}

// Theme Functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Save to localStorage
    localStorage.setItem('spyfall-theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('spyfall-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Location Management Functions - Removed for classic mode
// function showLocationModal() {
//     // Populate category selector
//     socket.emit('getCategories');
//     locationModal.classList.add('active');
// }

// function hideLocationModal() {
//     locationModal.classList.remove('active');
// }

// function downloadLocations() {
//     const locations = customLocations || getDefaultLocations();
//     const dataStr = JSON.stringify(locations, null, 2);
//     const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(dataBlob);
//     link.download = 'spyfall-locations.json';
//     link.click();
// }

// function uploadLocations(file) {
//     if (!file) return;
    
//     const reader = new FileReader();
//     reader.onload = function(e) {
//         try {
//             const locations = JSON.parse(e.target.result);
//             customLocations = locations;
//             localStorage.setItem('spyfall-custom-locations', JSON.stringify(locations));
//             showError('Lokasyonlar başarıyla yüklendi!');
            
//             // Refresh categories
//             socket.emit('getCategories');
//         } catch (error) {
//             showError('Dosya formatı hatalı!');
//         }
//     };
//     reader.readAsText(file);
// }

// Game State Management
function resetGameState() {
    gameState = {
        roomCode: null,
        playerId: null,
        isHost: false,
        players: [],
        isSpy: false,
        location: null,
        role: null, // New: Reset role
        availableLocations: [],
        category: 'Klasik',
        gameTimer: null,
        gameDuration: 480,
        selectedVote: null,
        votingInProgress: false,
        hasVoted: false,
        // spyCount always 1 in official rules
        // eliminatedSpies removed - official Spyfall has no partial elimination
        isLastSpyGuess: false
    };
    
    // Timer is managed by server, no client-side timer to clear
}

function updatePlayersList(players) {
    gameState.players = players;
    playerCount.textContent = players.length;
    
    // Update waiting room players list
    playersList.innerHTML = '';
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${player.isHost ? '<span class="host-badge">👑</span>' : ''}
            ${player.eliminated ? '<span class="eliminated-badge">❌</span>' : ''}
        `;
        playersList.appendChild(playerDiv);
    });
    
    // Update game screen players list
    gamePlayersList.innerHTML = '';
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'game-player-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${player.name} (${player.score || 0} puan)`;
        
        playerDiv.appendChild(nameSpan);
        gamePlayersList.appendChild(playerDiv);
    });
    
    // CRITICAL: Show/hide settings and start button for host
    if (gameState.isHost && players.length >= 4) {
        gameSettings.style.display = 'block';
        startGameBtn.style.display = 'block';
    } else if (gameState.isHost) {
        gameSettings.style.display = 'block';
        startGameBtn.style.display = 'none';
    } else {
        gameSettings.style.display = 'none';
        startGameBtn.style.display = 'none';
    }
}

function displaySpyLocations() {
    locationsList.innerHTML = '';
    
    // Initialize marked locations if not exists
    if (!gameState.markedLocations) {
        gameState.markedLocations = new Set();
    }
    
    gameState.availableLocations.forEach(location => {
        const locationDiv = document.createElement('div');
        locationDiv.className = 'location-item';
        locationDiv.textContent = location;
        
        // Check if location is marked as eliminated
        if (gameState.markedLocations.has(location)) {
            locationDiv.classList.add('marked-eliminated');
            locationDiv.style.opacity = '0.5';
            locationDiv.style.textDecoration = 'line-through';
            locationDiv.style.backgroundColor = '#ffebee';
        }
        
        // Add click handler for spies to mark locations
        if (gameState.isSpy) {
            locationDiv.style.cursor = 'pointer';
            locationDiv.addEventListener('click', () => {
                if (gameState.markedLocations.has(location)) {
                    // Unmark location
                    gameState.markedLocations.delete(location);
                    locationDiv.classList.remove('marked-eliminated');
                    locationDiv.style.opacity = '1';
                    locationDiv.style.textDecoration = 'none';
                    locationDiv.style.backgroundColor = '';
                } else {
                    // Mark location as eliminated
                    gameState.markedLocations.add(location);
                    locationDiv.classList.add('marked-eliminated');
                    locationDiv.style.opacity = '0.5';
                    locationDiv.style.textDecoration = 'line-through';
                    locationDiv.style.backgroundColor = '#ffebee';
                }
            });
        }
        
        locationsList.appendChild(locationDiv);
    });
}

function updateScores(scores, players) {
    finalScores.innerHTML = '';
    
    // Handle scores array from server
    let sortedScores;
    if (Array.isArray(scores)) {
        // Server sends array of {playerId, playerName, score}
        sortedScores = scores.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else {
        // Fallback: Convert scores object to array
        sortedScores = Object.entries(scores)
            .map(([playerId, score]) => {
                const player = players.find(p => p.id === playerId);
                return { playerId, playerName: player ? player.name : 'Bilinmiyor', score: score || 0 };
            })
            .sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    
    sortedScores.forEach((scoreData) => {
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'score-name';
        nameSpan.textContent = scoreData.playerName || 'Bilinmiyor';
        
        const pointsSpan = document.createElement('span');
        pointsSpan.className = 'score-points';
        pointsSpan.textContent = `${scoreData.score || 0} puan`;
        
        scoreDiv.appendChild(nameSpan);
        scoreDiv.appendChild(pointsSpan);
        finalScores.appendChild(scoreDiv);
    });
}

// Socket Event Listeners
socket.on('roomCreated', (data) => {
    gameState.roomCode = data.roomCode;
    gameState.playerId = data.playerId;
    gameState.isHost = data.isHost;
    
    roomCodeDisplay.textContent = data.roomCode;
    gameRoomCode.textContent = data.roomCode;
    
    // Load categories for host
    socket.emit('getCategories');
    
    showScreen('waitingRoom');
});

socket.on('roomJoined', (data) => {
    gameState.roomCode = data.roomCode;
    gameState.playerId = data.playerId;
    gameState.isHost = data.isHost;
    
    roomCodeDisplay.textContent = data.roomCode;
    gameRoomCode.textContent = data.roomCode;
    showScreen('waitingRoom');
});

socket.on('categoriesData', (categories) => {
    // Classic mode - no category selection needed
    console.log('Categories loaded:', categories);
});

socket.on('playersUpdate', (players) => {
    updatePlayersList(players);
});



socket.on('gameStarted', (data) => {
    gameState.gameActive = true; // Fix: Set game as active
    gameState.location = data.location;
    gameState.role = data.role; // New: Store player role
    gameState.isSpy = data.isSpy;
    gameState.availableLocations = data.availableLocations;
    gameState.category = 'Klasik'; // Always classic now
    gameState.gameTimer = Date.now();
    gameState.gameDuration = data.duration;
    // Always 1 spy in official Spyfall
    
    // Update game info
    remainingSpiesDisplay.textContent = '1';
    
    // Show locations to all players, spy guess button only for spies
    spyLocations.style.display = 'block';
    displaySpyLocations();
    
    if (data.isSpy) {
        spyGuessBtn.style.display = 'block';
    } else {
        spyGuessBtn.style.display = 'none';
    }
    
    // Timer is managed by server through timerUpdate events
    
    showScreen('gameScreen');
});

socket.on('accusationStarted', (data) => {
    // Timer is managed by server, no client-side timer to stop
    
    // Reset voting state for fresh accusation
    gameState.hasVoted = false;
    gameState.selectedVote = null;
    
    showError(`🚨 ${data.accuserName}, ${data.accusedName} isimli oyuncuyu suçluyor! Herkes oy versin.`);
    
    votingStatus.style.display = 'block';
    voteCount.textContent = '0';
    totalVotes.textContent = (gameState.players.length - 1).toString(); // Exclude accused
    
    // Update button to show accusation in progress
    startVotingBtn.textContent = '⚖️ Oy Ver';
    startVotingBtn.classList.remove('btn-warning');
    startVotingBtn.classList.add('btn-primary');
    
    // Only disable button for accused player, others can reopen voting modal
    if (data.accusedId === gameState.playerId) {
        startVotingBtn.disabled = true;
        startVotingBtn.textContent = '❌ Suçlandınız';
    } else {
        startVotingBtn.disabled = false; // Allow reopening modal
        showVotingModal();
    }
});

socket.on('accusationVoteUpdate', (data) => {
    voteCount.textContent = data.voteCount;
    totalVotes.textContent = data.totalVoters;
});

socket.on('accusationFailed', (data) => {
    // Reset all voting state
    gameState.hasVoted = false;
    gameState.selectedVote = null;
    
    votingStatus.style.display = 'none';
    startVotingBtn.textContent = '🚨 Suçlama Başlat';
    startVotingBtn.classList.remove('btn-primary');
    startVotingBtn.classList.add('btn-warning');
    startVotingBtn.disabled = false;
    hideVotingModal();
    
    showError(`⚖️ Suçlama başarısız! ${data.accusedName} masum bulundu. Oyun devam ediyor.`);
});

// playerEliminated removed - in official Spyfall, game ends immediately when someone is eliminated

socket.on('gameEnded', (data) => {
    
    // Timer is managed by server, no client-side timer to clear
    
    // Reset game state
    gameState.gameActive = false; // Game ended
    gameState.votingInProgress = false;
    gameState.hasVoted = false;
    gameState.isLastSpyGuess = false; // Reset last spy guess flag
    votingStatus.style.display = 'none';
    startVotingBtn.textContent = '🚨 Suçlama Başlat';
    startVotingBtn.classList.remove('btn-primary');
    startVotingBtn.classList.add('btn-warning');
    
    finalLocation.textContent = data.location;
    
    // Show spy (official Spyfall has only 1 spy)
    if (data.spyId) {
        const spy = gameState.players.find(p => p.id === data.spyId);
        finalSpy.textContent = spy ? spy.name : 'Bilinmiyor';
    } else {
        finalSpy.textContent = 'Bilinmiyor';
    }
    
    // Update scores
    updateScores(data.scores, gameState.players);
    
    // Show new round button for host
    if (gameState.isHost) {
        newRoundBtn.style.display = 'block';
    }
    
    if (data.winner === 'spy' || data.winner === 'spies') {
        gameResultTitle.textContent = '🕵️ Casus Kazandı!';
        if (data.reason === 'spyGuess') {
            gameResultDescription.textContent = `${data.winningSpyName} lokasyonu doğru tahmin etti: ${data.location}`;
        } else if (data.reason === 'lastSpyGuess') {
            gameResultDescription.textContent = `${data.winningSpyName} son şans tahmini doğru: ${data.location} (1 puan)`;
        } else if (data.reason === 'timeout') {
            gameResultDescription.textContent = 'Süre doldu ve casus yakalanmadı!';
        } else if (data.reason === 'vote') {
            gameResultDescription.textContent = `Yanlış kişi elendi: ${data.eliminatedPlayer}`;
        } else {
            gameResultDescription.textContent = 'Casuslar kazandı!';
        }
    } else {
        gameResultTitle.textContent = '👥 Vatandaşlar Kazandı!';
        if (data.reason === 'vote') {
            gameResultDescription.textContent = `${data.eliminatedPlayer} elendi ve casus çıktı!`;
        } else if (data.reason === 'spyGuess' || data.reason === 'spyWrongGuess' || data.reason === 'lastSpyWrongGuess') {
            if (data.wrongGuess) {
                if (data.lastSpyGuess) {
                    gameResultDescription.textContent = `${data.eliminatedSpyName} son şans tahmini yanlış ("${data.wrongGuess}") - Vatandaşlar kazandı!`;
                } else {
                    gameResultDescription.textContent = `${data.eliminatedSpyName} yanlış tahmin etti ("${data.wrongGuess}") ve elendi!`;
                }
            } else {
                gameResultDescription.textContent = `Casus yanlış tahmin etti ve elendi!`;
            }
        } else {
            gameResultDescription.textContent = 'Vatandaşlar kazandı!';
        }
    }
    
    showScreen('gameEndScreen');
});

socket.on('newRoundStarted', (data) => {
    // Reset game state for new round
    gameState.gameActive = false; // Will be set to true when game starts
    gameState.location = null;
    gameState.role = null;
    gameState.isSpy = false;
    gameState.votingInProgress = false;
    gameState.hasVoted = false;
    gameState.isLastSpyGuess = false;
    // Reset marked locations for new round
    if (gameState.markedLocations) {
        gameState.markedLocations.clear();
    }
    // eliminatedSpies removed - not used in official Spyfall
    
    // Clear timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Reset UI elements
    votingStatus.style.display = 'none';
    startVotingBtn.textContent = '🚨 Suçlama Başlat';
    startVotingBtn.classList.remove('btn-primary');
    startVotingBtn.classList.add('btn-warning');
    newRoundBtn.style.display = 'none';
    newRoundBtn.disabled = false;
    newRoundBtn.textContent = '🔄 Yeni Tur';
    gameTimer.textContent = '08:00';
    remainingSpiesDisplay.textContent = '1';
    
    // Restore buttons for new round
    startVotingBtn.style.display = 'inline-block';
    startVotingBtn.disabled = false; // Ensure button is enabled
    spyGuessBtn.style.display = 'inline-block';
    spyGuessBtn.textContent = '🔮 Lokasyon Tahmin Et'; // Reset button text
    gameState.isLastSpyGuess = false; // Reset last spy guess flag
    
    // Update players if provided
    if (data && data.players) {
        updatePlayersList(data.players);
    }
    
    showScreen('waitingRoom');
    showError('🔄 Yeni tur başlıyor! Host oyunu başlatabilir.');
});

socket.on('spyGuessResult', (data) => {
    if (data.correct) {
        showError(`✅ ${data.guessingSpyName} lokasyonu doğru tahmin etti! Casuslar kazandı!`);
    } else {
        if (data.wrongGuess) {
            showError(`❌ ${data.eliminatedSpy} yanlış tahmin etti ("${data.wrongGuess}") ve elendi!`);
        } else {
            showError(`❌ ${data.eliminatedSpy} yanlış tahmin etti ve elendi!`);
        }
    }
});

// lastSpyGuessOpportunity removed - not part of official Spyfall rules

socket.on('timerUpdate', (data) => {
    const minutes = Math.floor(data.remainingTime / 60);
    const seconds = data.remainingTime % 60;
    gameTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});



socket.on('timeoutAccusationPhase', (data) => {
    showError(`⏰ Süre doldu! ${data.dealerName} suçlama turunu başlatıyor. Sıra: ${data.currentAccuserName}`);
    
    // Show accusation modal for current accuser
    if (data.currentAccuserId === gameState.playerId) {
        showAccusationModal();
    }
});

socket.on('timeoutAccusationContinue', (data) => {
    showError(`⚖️ ${data.failedAccuserName} başarısız! Sıra: ${data.currentAccuserName}`);
    
    // Show accusation modal for next accuser
    if (data.currentAccuserId === gameState.playerId) {
        showAccusationModal();
    }
});

socket.on('spyGuiltyFinalGuess', (data) => {
    showError(`🚨 ${data.spyName} suçlu bulundu! Son şans: Lokasyonu doğru tahmin ederse kazanır!`);
    
    // Show spy guess modal for the guilty spy
    if (data.spyId === gameState.playerId) {
        showSpyGuessModal();
        showError(`⚠️ Suçlu bulundun! Son şansın: Lokasyonu doğru tahmin edersen kazanırsın!`);
    }
});

socket.on('hostChanged', (data) => {
    showError(`👑 ${data.message} Yeni host: ${data.newHostName}`);
    
    // Update gameState if this player is the new host
    if (data.newHostId === gameState.playerId) {
        gameState.isHost = true;
        // Show host controls if in waiting room
        if (document.getElementById('waitingRoom').style.display === 'block') {
            document.getElementById('gameSettings').style.display = 'block';
        }
    }
});

socket.on('youAreNowHost', (data) => {
    gameState.isHost = true;
    showError(`🎉 ${data.message}`);
    
    // Show host controls if in waiting room
    if (document.getElementById('waitingRoom').style.display === 'block') {
        document.getElementById('gameSettings').style.display = 'block';
    }
});

socket.on('error', (message) => {
    showError(message);
});

socket.on('klasikLocations', (data) => {
    const klasikData = {
        categoryName: 'Klasik Spyfall',
        locations: data
    };
    
    const dataStr = JSON.stringify(klasikData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'klasik_spyfall_locations.json';
    link.click();
});

// Auto-focus inputs
roomCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Enter key handling
roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoomBtn.click();
    }
});

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (roomCodeInput.value.trim()) {
            joinRoomBtn.click();
        } else {
            createRoomBtn.click();
        }
    }
});

// Add category change listener - Removed for classic mode
// editCategorySelect.addEventListener('change', (e) => {
//     if (e.target.value) {
//         loadLocationForEdit(e.target.value);
//     }
// });

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showScreen('mainMenu');
    playerNameInput.placeholder = `örn: ${generatePlayerName()}`;
    
    // Initialize game state properly
    resetGameState();
    
    // Load theme
    loadTheme();
    
    loadCustomLocations();
});

// Custom Location Functions
function loadCustomLocations() {
    const saved = localStorage.getItem('spyfallCustomLocations');
    if (saved) {
        try {
            customLocations = JSON.parse(saved);
            customCategoryName.value = customLocations.categoryName || '';
        } catch (error) {
            console.error('Error loading custom locations:', error);
            customLocations = { categoryName: '', locations: {} };
        }
    }
}

function saveCustomLocationsToStorage() {
    localStorage.setItem('spyfallCustomLocations', JSON.stringify(customLocations));
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.categoryName && data.locations) {
                customLocations = data;
                customCategoryName.value = data.categoryName;
                showError('Lokasyonlar başarıyla yüklendi!');
            } else {
                showError('Geçersiz dosya formatı!');
            }
        } catch (error) {
            showError('Dosya okuma hatası!');
        }
    };
    reader.readAsText(file);
}

function downloadKlasikLocations() {
    // Request classic locations from server
    socket.emit('getKlasikLocations');
}

function downloadCustomLocations() {
    if (Object.keys(customLocations.locations).length === 0) {
        showError('İndirilecek lokasyon bulunamadı!');
        return;
    }
    
    const dataStr = JSON.stringify(customLocations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${customLocations.categoryName || 'custom'}_locations.json`;
    link.click();
}

function openLocationEditor() {
    populateLocationEditor();
    
    // Reset role editor to initial state
    selectedLocationName.textContent = '';
    roleInstructions.textContent = 'Sol taraftan bir lokasyon seçin, ardından burada roller ekleyin.';
    newRoleName.disabled = true;
    addRoleBtn.disabled = true;
    roleList.innerHTML = '';
    
    locationEditorModal.style.display = 'block';
}

function closeLocationEditor() {
    locationEditorModal.style.display = 'none';
}

function populateLocationEditor() {
    // Populate locations list
    locationList.innerHTML = '';
    for (const [locationName, roles] of Object.entries(customLocations.locations)) {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${locationName}</span>
            <button class="delete-btn" onclick="deleteLocation('${locationName}')">🗑️</button>
        `;
        
        // Add click event to the whole li for better usability
        li.addEventListener('click', (e) => {
            // Prevent delete button from triggering location selection
            if (e.target.classList.contains('delete-btn')) {
                return;
            }
            selectLocation(locationName);
        });
        
        locationList.appendChild(li);
    }
}

function addNewLocation() {
    const name = newLocationName.value.trim();
    if (!name) {
        showError('Lokasyon adı girin!');
        return;
    }
    
    if (customLocations.locations[name]) {
        showError('Bu lokasyon zaten mevcut!');
        return;
    }
    
    customLocations.locations[name] = [];
    newLocationName.value = '';
    populateLocationEditor();
}

function deleteLocation(locationName) {
    if (confirm(`"${locationName}" lokasyonunu silmek istediğinizden emin misiniz?`)) {
        delete customLocations.locations[locationName];
        populateLocationEditor();
        roleEditor.style.display = 'none';
    }
}

function selectLocation(locationName) {
    // Update selection UI
    document.querySelectorAll('#locationList li').forEach(li => li.classList.remove('selected'));
    
    // Find the clicked element and add selected class
    const clickedElements = document.querySelectorAll('#locationList li');
    for (let li of clickedElements) {
        if (li.querySelector('span').textContent === locationName) {
            li.classList.add('selected');
            break;
        }
    }
    
    // Show role editor section
    roleEditor.style.display = 'block';
    
    // Update role editor
    selectedLocationName.textContent = `- ${locationName}`;
    roleInstructions.textContent = `${locationName} lokasyonu için roller:`;
    
    // Enable role controls
    newRoleName.disabled = false;
    addRoleBtn.disabled = false;
    
    // Ensure location exists in customLocations
    if (!customLocations.locations[locationName]) {
        customLocations.locations[locationName] = [];
    }
    
    populateRoleEditor(locationName);
}

function populateRoleEditor(locationName) {
    roleList.innerHTML = '';
    const roles = customLocations.locations[locationName] || [];
    
    roles.forEach((role, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${role}</span>
            <button class="delete-btn" onclick="deleteRole('${locationName}', ${index})">🗑️</button>
        `;
        roleList.appendChild(li);
    });
}

function addNewRole() {
    const roleName = newRoleName.value.trim();
    const locationNameElement = selectedLocationName.textContent;
    // Extract location name, removing the "- " prefix
    const locationName = locationNameElement.replace(/^- /, '');
    
    if (!roleName) {
        showError('Rol adı girin!');
        return;
    }
    
    if (!locationName || locationName === '') {
        showError('Önce bir lokasyon seçin!');
        return;
    }
    
    // Ensure the location exists in customLocations
    if (!customLocations.locations[locationName]) {
        customLocations.locations[locationName] = [];
    }
    
    if (customLocations.locations[locationName].includes(roleName)) {
        showError('Bu rol zaten mevcut!');
        return;
    }
    
    customLocations.locations[locationName].push(roleName);
    newRoleName.value = '';
    populateRoleEditor(locationName);
    showError(`✅ "${roleName}" rolü eklendi!`);
}

function deleteRole(locationName, roleIndex) {
    const deletedRole = customLocations.locations[locationName][roleIndex];
    customLocations.locations[locationName].splice(roleIndex, 1);
    populateRoleEditor(locationName);
    showError(`🗑️ "${deletedRole}" rolü silindi!`);
}

function saveCustomLocations() {
    customLocations.categoryName = customCategoryName.value.trim();
    
    if (!customLocations.categoryName) {
        showError('Kategori adı girin!');
        return;
    }
    
    if (Object.keys(customLocations.locations).length === 0) {
        showError('En az bir lokasyon ekleyin!');
        return;
    }
    
    // No minimum role requirement - allow any number of roles
    
    saveCustomLocationsToStorage();
    closeLocationEditor();
    showError('Özel lokasyonlar kaydedildi!');
}