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
    const message = `Venha jogar comigo! Use o código da sala: ${roomId}\n\nAcesse: ${gameUrl}`;
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
    addLog('Iniciando criação da sala...', 'system');
    
    // Disable buttons temporarily to prevent double-clicks
    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;
    shareWhatsAppBtn.style.display = 'none';
    
    peer = new Peer();
    peer.on('open', (id) => {
        roomIdDisplay.textContent = `Código da Sala: ${id}`;
        statusDisplay.textContent = 'Aguardando Interventor...';
        isHost = true;
        window.isHost = true;
        gameStarted = true;
        window.gameStarted = true;
        addLog(`Sala criada com ID: ${id}`, 'host');
        
        // Show share button and setup click handler
        shareWhatsAppBtn.style.display = 'flex';
        shareWhatsAppBtn.onclick = () => shareViaWhatsApp(id);
        
        // Re-enable join button only
        joinRoomBtn.disabled = false;
    });

    peer.on('connection', (conn) => {
        connection = conn;
        window.connection = conn;
        statusDisplay.textContent = 'Interventor conectado!';
        addLog('Interventor conectado à sala', 'host');
        setupConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('[Host] Connection error:', err);
        statusDisplay.textContent = 'Erro ao criar sala. Tente novamente.';
        addLog(`Erro ao criar sala: ${err.message}`, 'system');
        
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
        statusDisplay.textContent = 'Digite um ID válido!';
        addLog('ID da sala não fornecido', 'system');
        return;
    }

    // Disable buttons temporarily
    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;
    shareWhatsAppBtn.style.display = 'none';
    
    addLog('Tentando conectar...', 'system');

    peer = new Peer();
    peer.on('open', () => {
        connection = peer.connect(hostId);
        window.connection = connection;
        statusDisplay.textContent = 'Conectando...';
        addLog(`Tentando conectar à sala: ${hostId}`, 'interventor');
        isHost = false;
        window.isHost = false;
        gameStarted = true;
        window.gameStarted = true;
        setupConnection(connection);
    });

    peer.on('error', (err) => {
        console.error('[Interventor] Connection error:', err);
        statusDisplay.textContent = 'Erro de conexão. Verifique o ID e tente novamente.';
        addLog(`Erro ao conectar: ${err.message}`, 'system');
        
        // Re-enable buttons on error
        createRoomBtn.disabled = false;
        joinRoomBtn.disabled = false;
    });
}

// Setup connection handlers
function setupConnection(conn) {
    conn.on('open', () => {
        if (isHost) {
            statusDisplay.textContent = 'Interventor conectado!';
            addLog('Conexão estabelecida com o Interventor', 'host');
        } else {
            statusDisplay.textContent = 'Connected as interventor!';
            addLog('Conexão estabelecida com o Host', 'interventor');
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
                    addLog(`Movimento rápido detectado! Velocidade: ${speed.toFixed(2)}`, 'interventor');
                }
            }
        }
    });

    conn.on('close', () => {
        statusDisplay.textContent = 'Connection lost!';
        addLog(isHost ? 'Interventor desconectado' : 'Conexão com o host perdida', 'system');
        resetGame();
    });

    conn.on('error', (err) => {
        console.error(isHost ? '[Host]' : '[Interventor]', 'Connection error:', err);
        statusDisplay.textContent = 'Connection error. Please try again.';
        addLog(`Erro de conexão: ${err.message}`, 'system');
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
    addLog('Estado do multiplayer resetado', 'system');
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
addLog('Bem-vindo ao jogo! Crie uma sala ou entre em uma existente.', 'system'); 