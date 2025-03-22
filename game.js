const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game properties
window.player = {
    x: 50,
    y: 0,
    width: 30,
    height: 30,
    velocityY: 0,
    isJumping: false,
    jumpForce: -15,
    gravity: 0.8,
    speed: 5
};

window.platforms = [];
window.score = 0;
window.cameraY = 0;
window.keys = {
    left: false,
    right: false,
    up: false
};

// Platform class
class Platform {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 20;
    }

    draw() {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x, this.y - window.cameraY, this.width, this.height);
    }

    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y + player.height > this.y &&
               player.y + player.height < this.y + this.height + 5 &&
               player.velocityY > 0;
    }
}

// Load level from file
async function loadLevel() {
    try {
        const response = await fetch('level.txt');
        const levelData = await response.text();
        const lines = levelData.split('\n');
        
        // Clear existing platforms
        window.platforms = [];
        
        // Constants for platform spacing
        const PLATFORM_WIDTH = 40;
        const PLATFORM_HEIGHT = 20;
        const VERTICAL_SPACING = 150; // Space between platforms vertically
        
        // Find player starting position and create platforms
        for (let y = 0; y < lines.length; y++) {
            const line = lines[y];
            const playerX = line.indexOf('P');
            if (playerX !== -1) {
                window.player.x = playerX * PLATFORM_WIDTH; // Convert ASCII position to game coordinates
                window.player.y = y * VERTICAL_SPACING; // Use vertical spacing for player position
                // Ensure player starts on a platform
                window.player.y -= window.player.height;
            }
            
            // Create platforms from ASCII art
            for (let x = 0; x < line.length; x++) {
                if (line[x] === '_') {
                    window.platforms.push({
                        x: x * PLATFORM_WIDTH,
                        y: y * VERTICAL_SPACING, // Use vertical spacing for platform position
                        width: PLATFORM_WIDTH,
                        height: PLATFORM_HEIGHT
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading level:', error);
        // Fallback to some default platforms if file loading fails
        const groundY = canvas.height - 20; // Base platform at the bottom of the screen
        window.platforms = [
            { x: 0, y: groundY, width: canvas.width, height: 20 }, // Base platform
            { x: 300, y: groundY - 150, width: 200, height: 20 }, // Middle platform
            { x: 100, y: groundY - 300, width: 200, height: 20 } // Top platform
        ];
        window.player.y = groundY - window.player.height; // Start player just above the ground platform
    }
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw waiting message if game hasn't started
    if (!window.gameStarted) {
        ctx.fillStyle = '#000';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Create a room to start', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('or join an existing room', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Update player position
    // Check if we're the host
    const isHost = window.isHost !== undefined ? window.isHost : true;
    
    if (isHost) {
        // Horizontal movement
        if (window.keys.left) window.player.x -= window.player.speed;
        if (window.keys.right) window.player.x += window.player.speed;
        
        // Apply gravity
        window.player.velocityY += window.player.gravity;
        window.player.y += window.player.velocityY;
        
        // Platform collision
        for (let platform of window.platforms) {
            if (window.player.y + window.player.height > platform.y &&
                window.player.y + window.player.height < platform.y + platform.height &&
                window.player.x + window.player.width > platform.x &&
                window.player.x < platform.x + platform.width) {
                window.player.y = platform.y - window.player.height;
                window.player.velocityY = 0;
                window.player.isJumping = false;
                break;
            }
        }
        
        // Jump
        if (window.keys.up && !window.player.isJumping) {
            window.player.velocityY = window.player.jumpForce;
            window.player.isJumping = true;
        }
        
        // Camera follow
        window.cameraY = window.player.y - canvas.height / 2;
        
        // Send game state to spectator
        if (window.connection && window.connection.open) {
            window.connection.send({
                type: 'gameState',
                player: {
                    x: window.player.x,
                    y: window.player.y,
                    velocityY: window.player.velocityY,
                    isJumping: window.player.isJumping
                },
                cameraY: window.cameraY,
                score: window.score,
                platforms: window.platforms
            });
        }
    }
    
    // Draw platforms
    ctx.fillStyle = '#666';
    for (let platform of window.platforms) {
        ctx.fillRect(platform.x, platform.y - window.cameraY, platform.width, platform.height);
    }
    
    // Draw player
    ctx.fillStyle = '#00f';
    ctx.fillRect(window.player.x, window.player.y - window.cameraY, window.player.width, window.player.height);
    
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${window.score}`, 10, 30);
    
    // Draw multiplayer status
    if (isHost) {
        ctx.fillText('Host', 10, 60);
    } else {
        ctx.fillText('Spectator', 10, 60);
    }
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!window.gameStarted) return;
    
    // Check if we're the host
    const isHost = window.isHost !== undefined ? window.isHost : true;
    if (!isHost) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            window.keys.left = true;
            break;
        case 'ArrowRight':
            window.keys.right = true;
            break;
        case 'ArrowUp':
        case ' ':
            window.keys.up = true;
            break;
    }
    
    // Send key state to spectator
    if (window.connection && window.connection.open) {
        window.connection.send({
            type: 'keyState',
            keys: { ...window.keys }
        });
    }
});

document.addEventListener('keyup', (e) => {
    if (!window.gameStarted) return;
    
    // Check if we're the host
    const isHost = window.isHost !== undefined ? window.isHost : true;
    if (!isHost) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            window.keys.left = false;
            break;
        case 'ArrowRight':
            window.keys.right = false;
            break;
        case 'ArrowUp':
        case ' ':
            window.keys.up = false;
            break;
    }
    
    // Send key state to spectator
    if (window.connection && window.connection.open) {
        window.connection.send({
            type: 'keyState',
            keys: { ...window.keys }
        });
    }
});

// Reset game
function resetGame() {
    window.player.x = 50;
    window.player.y = 0;
    window.player.velocityY = 0;
    window.player.isJumping = false;
    window.cameraY = 0;
    window.score = 0;
    window.keys = {
        left: false,
        right: false,
        up: false
    };
    loadLevel(); // Reload the level
    
    // Reset multiplayer state
    if (typeof window.resetMultiplayer === 'function') {
        window.resetMultiplayer();
    }
}

// Start game
loadLevel();
gameLoop(); 