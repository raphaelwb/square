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

// Create a new room
function createRoom() {
    peer = new Peer();
    peer.on('open', (id) => {
        roomIdDisplay.textContent = `Room ID: ${id}`;
        statusDisplay.textContent = 'Waiting for Interventor...';
        isHost = true;
        window.isHost = true;
        gameStarted = true;
        window.gameStarted = true;
        console.log(`[Host] Room created with ID: ${id}`);
    });

    peer.on('connection', (conn) => {
        connection = conn;
        window.connection = conn;
        statusDisplay.textContent = 'Interventor connected!';
        console.log('[Host] Interventor connected!');
        setupConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('[Host] Connection error:', err);
        statusDisplay.textContent = 'Error creating room. Please try again.';
    });
}

// Join an existing room
function joinRoom() {
    const hostId = peerIdInput.value;
    if (!hostId) {
        statusDisplay.textContent = 'Enter a valid ID!';
        console.log('[Interventor] Room ID not provided');
        return;
    }

    peer = new Peer();
    peer.on('open', () => {
        connection = peer.connect(hostId);
        window.connection = connection;
        statusDisplay.textContent = 'Connecting...';
        console.log(`[Interventor] Trying to connect to room: ${hostId}`);
        isHost = false;
        window.isHost = false;
        gameStarted = true;
        window.gameStarted = true;
        setupConnection(connection);
    });

    peer.on('error', (err) => {
        console.error('[Interventor] Connection error:', err);
        statusDisplay.textContent = 'Connection error. Check the ID and try again.';
    });
}

// Setup connection handlers
function setupConnection(conn) {
    conn.on('open', () => {
        if (isHost) {
            statusDisplay.textContent = 'Interventor connected!';
            console.log('[Host] Connection established with interventor');
        } else {
            statusDisplay.textContent = 'Connected as interventor!';
            console.log('[Interventor] Connection established with host');
        }
    });

    conn.on('data', (data) => {
        //console.log('DADOS RECEBIDOS', data);
        
        if (data.type === 'keyState') {
            if (!isHost) {
                window.keys = data.keys;
            }
        } else if (data.type === 'gameState') {
            if (!isHost) {
                // Update player state
                window.player = {
                    ...window.player,
                    x: data.player.x,
                    y: data.player.y,
                    velocityY: data.player.velocityY,
                    isJumping: data.player.isJumping
                };
                
                // Update game state
                window.cameraY = data.cameraY;
                window.score = data.score;
                window.platforms = data.platforms;
                
                console.log('[Interventor] Game state updated', {
                    player: window.player,
                    cameraY: window.cameraY,
                    score: window.score
                });
            }
        }
    });

    conn.on('close', () => {
        statusDisplay.textContent = 'Connection lost!';
        console.log(isHost ? '[Host] Interventor disconnected' : '[Interventor] Connection with host lost');
        resetGame();
    });

    conn.on('error', (err) => {
        console.error(isHost ? '[Host]' : '[Interventor]', 'Connection error:', err);
        statusDisplay.textContent = 'Connection error. Please try again.';
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
    console.log(isHost ? '[Host]' : '[Interventor]', 'Multiplayer state reset');
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