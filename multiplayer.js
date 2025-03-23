// Multiplayer properties
let peer = null;
let connection = null;
let isHost = false;
let gameStarted = false;

// UI Elements
const createRoomBtn = document.getElementById('createRoom');
const joinRoomBtn = document.getElementById('joinRoom');
const peerIdInput = document.getElementById('peerId');
const roomIdDisplay = document.getElementById('roomId');
const statusDisplay = document.getElementById('status');
const gameLogsDiv = document.getElementById('game-logs');
const shareWhatsAppBtn = document.getElementById('shareWhatsApp');

// Share room code via WhatsApp
function shareViaWhatsApp(roomId) {
    const gameUrl = window.location.href.split('?')[0]; // Get base URL without parameters
    const message = `Come play with me! Use room code: ${roomId}\n\nAccess: ${gameUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Prevent double-tap zoom on buttons
function preventZoom(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Add touch event handlers for buttons
[createRoomBtn, joinRoomBtn, shareWhatsAppBtn].forEach(button => {
    button.addEventListener('touchstart', preventZoom, { passive: false });
    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        // Simulate click after touch
        button.click();
    }, { passive: false });
});

// Logging system
function addLog(message, type = 'system') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    gameLogsDiv.insertBefore(logEntry, gameLogsDiv.firstChild);

    // Limit the number of logs to prevent memory issues
    while (gameLogsDiv.children.length > 50) {
        gameLogsDiv.removeChild(gameLogsDiv.lastChild);
    }
}

// Create a new room
function createRoom() {
    addLog('Starting room creation...', 'system');
    
    // Disable buttons temporarily to prevent double-clicks
    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;
    shareWhatsAppBtn.style.display = 'none';
    
    peer = new Peer();
    peer.on('open', (id) => {
        roomIdDisplay.textContent = `Room Code: ${id}`;
        statusDisplay.textContent = 'Waiting for Player...';
        isHost = true;
        window.isHost = true;
        gameStarted = true;
        window.gameStarted = true;
        addLog(`Room created with ID: ${id}`, 'host');
        
        // Show share button and setup click handler
        shareWhatsAppBtn.style.display = 'flex';
        shareWhatsAppBtn.onclick = () => shareViaWhatsApp(id);
        
        // Re-enable join button only
        joinRoomBtn.disabled = false;
    });

    peer.on('connection', (conn) => {
        connection = conn;
        window.connection = conn;
        statusDisplay.textContent = 'Player connected!';
        addLog('Player connected to room', 'host');
        setupConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('[Host] Connection error:', err);
        statusDisplay.textContent = 'Error creating room. Please try again.';
        addLog(`Error creating room: ${err.message}`, 'system');
        
        // Re-enable buttons on error
        createRoomBtn.disabled = false;
        joinRoomBtn.disabled = false;
        shareWhatsAppBtn.style.display = 'none';
    });
}

// Join an existing room
function joinRoom() {
    const hostId = peerIdInput.value;
    if (!hostId) {
        statusDisplay.textContent = 'Enter a valid room code!';
        addLog('Room code not provided', 'system');
        return;
    }

    // Disable buttons temporarily
    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;
    shareWhatsAppBtn.style.display = 'none';
    
    addLog('Attempting to connect...', 'system');

    peer = new Peer();
    peer.on('open', () => {
        connection = peer.connect(hostId);
        window.connection = connection;
        statusDisplay.textContent = 'Connecting...';
        addLog(`Trying to connect to room: ${hostId}`, 'interventor');
        isHost = false;
        window.isHost = false;
        gameStarted = true;
        window.gameStarted = true;
        setupConnection(connection);
    });

    peer.on('error', (err) => {
        console.error('[Player] Connection error:', err);
        statusDisplay.textContent = 'Connection error. Check the code and try again.';
        addLog(`Connection error: ${err.message}`, 'system');
        
        // Re-enable buttons on error
        createRoomBtn.disabled = false;
        joinRoomBtn.disabled = false;
    });
}

// Setup connection handlers
function setupConnection(conn) {
    conn.on('open', () => {
        if (isHost) {
            statusDisplay.textContent = 'Player connected!';
            addLog('Connection established with player', 'host');
        } else {
            statusDisplay.textContent = 'Connected to game!';
            addLog('Connection established with host', 'interventor');
        }
    });

    conn.on('data', (data) => {
        if (data.type === 'gameState') {
            if (!isHost) {
                // Update player position and velocity using Matter.js Body
                Matter.Body.setPosition(window.player, {
                    x: data.player.x,
                    y: data.player.y
                });
                Matter.Body.setVelocity(window.player, {
                    x: data.player.velocityX,
                    y: data.player.velocityY
                });
                Matter.Body.setAngle(window.player, data.player.angle);
                
                // Update platforms if they changed
                if (data.platforms) {
                    data.platforms.forEach((platformData, index) => {
                        if (window.platforms[index]) {
                            Matter.Body.setPosition(window.platforms[index], {
                                x: platformData.x,
                                y: platformData.y
                            });
                        }
                    });
                }

                // Log significant changes in position
                const speed = Math.sqrt(
                    data.player.velocityX * data.player.velocityX + 
                    data.player.velocityY * data.player.velocityY
                );
                if (speed > 5) {
                    addLog(`Fast movement detected! Speed: ${speed.toFixed(2)}`, 'interventor');
                }
            }
        }
    });

    conn.on('close', () => {
        statusDisplay.textContent = 'Connection lost!';
        addLog(isHost ? 'Player disconnected' : 'Connection with host lost', 'system');
        resetGame();
    });

    conn.on('error', (err) => {
        console.error(isHost ? '[Host]' : '[Player]', 'Connection error:', err);
        statusDisplay.textContent = 'Connection error. Please try again.';
        addLog(`Connection error: ${err.message}`, 'system');
    });
}

// Reset multiplayer state
function resetMultiplayer() {
    statusDisplay.textContent = '';
    gameStarted = false;
    window.gameStarted = false;
    
    if (connection) {
        connection.close();
        connection = null;
        window.connection = null;
    }
    if (peer) {
        peer.destroy();
        peer = null;
    }
    isHost = false;
    window.isHost = false;
    addLog('Multiplayer state reset', 'system');
}

// Event Listeners
createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', joinRoom);

// Export multiplayer functions and variables
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.resetMultiplayer = resetMultiplayer;
window.isHost = isHost;
window.gameStarted = gameStarted;
window.connection = connection;
window.peer = peer;

// Initialize with a welcome message
addLog('Welcome to the game! Create a room or join an existing one.', 'system'); 