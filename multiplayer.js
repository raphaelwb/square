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
        roomIdDisplay.textContent = `ID da Sala: ${id}`;
        statusDisplay.textContent = 'Aguardando Espectador...';
        isHost = true;
        window.isHost = true;
        gameStarted = true;
        window.gameStarted = true;
        console.log(`[Host] Sala criada com ID: ${id}`);
    });

    peer.on('connection', (conn) => {
        connection = conn;
        window.connection = conn;
        statusDisplay.textContent = 'Jogador conectado!';
        console.log('[Host] Espectador conectado!');
        setupConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('[Host] Erro na conexão:', err);
        statusDisplay.textContent = 'Erro ao criar sala. Tente novamente.';
    });
}

// Join an existing room
function joinRoom() {
    const hostId = peerIdInput.value;
    if (!hostId) {
        statusDisplay.textContent = 'Digite um ID válido!';
        console.log('[Espectador] ID da sala não fornecido');
        return;
    }

    peer = new Peer();
    peer.on('open', () => {
        connection = peer.connect(hostId);
        window.connection = connection;
        statusDisplay.textContent = 'Conectando...';
        console.log(`[Espectador] Tentando conectar à sala: ${hostId}`);
        isHost = false;
        window.isHost = false;
        gameStarted = true;
        window.gameStarted = true;
        setupConnection(connection);
    });

    peer.on('error', (err) => {
        console.error('[Espectador] Erro na conexão:', err);
        statusDisplay.textContent = 'Erro ao conectar. Verifique o ID e tente novamente.';
    });
}

// Setup connection handlers
function setupConnection(conn) {
    conn.on('open', () => {
        if (isHost) {
            statusDisplay.textContent = 'Jogador conectado!';
            console.log('[Host] Conexão estabelecida com o espectador');
        } else {
            statusDisplay.textContent = 'Conectado como espectador!';
            console.log('[Espectador] Conexão estabelecida com o host');
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
                
                console.log('[Espectador] Estado do jogo atualizado', {
                    player: window.player,
                    cameraY: window.cameraY,
                    score: window.score
                });
            }
        }
    });

    conn.on('close', () => {
        statusDisplay.textContent = 'Conexão perdida!';
        console.log(isHost ? '[Host] Espectador desconectado' : '[Espectador] Conexão com o host perdida');
        resetGame();
    });

    conn.on('error', (err) => {
        console.error(isHost ? '[Host]' : '[Espectador]', 'Erro na conexão:', err);
        statusDisplay.textContent = 'Erro na conexão. Tente novamente.';
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
    console.log(isHost ? '[Host]' : '[Espectador]', 'Estado do multiplayer resetado');
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