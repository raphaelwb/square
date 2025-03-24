// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set fixed canvas size
canvas.width = 800;
canvas.height = 600;

// Matter.js setup
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;

// Create engine
const engine = Engine.create();
engine.gravity.y = 1;

// Create player (circle)
const PLAYER_RADIUS = 20;
const player = Bodies.circle(
    canvas.width / 4,  // x position
    canvas.height / 4, // y position
    PLAYER_RADIUS,     // radius
    {
        density: 0.001,    // Makes the ball lighter
        friction: 0.1,     // Reduces sliding friction
        frictionAir: 0.001, // Reduces air resistance
        restitution: 0.5,  // Bounce factor
        render: {
            fillStyle: '#00f'
        }
    }
);

ground = Bodies.rectangle(canvas.width / 2, canvas.height - 10, canvas.width, 20, { 
    isStatic: true,
    friction: 0.5
})

// Create ground and platforms
const platforms = [
    // Ground
    ground,
    // Left wall
    Bodies.rectangle(10, canvas.height / 2, 20, canvas.height, { 
        isStatic: true,
        friction: 0.5
    }),
    // Right wall
    Bodies.rectangle(canvas.width - 10, canvas.height / 2, 20, canvas.height, { 
        isStatic: true,
        friction: 0.5
    }),
    // Top wall
    Bodies.rectangle(canvas.width / 2, 10, canvas.width, 20, { 
        isStatic: true,
        friction: 0.5
    }),
];

// Add all bodies to the world
World.add(engine.world, [player, ...platforms]);

// Movement properties
const MOVE_FORCE = 0.004;
const MAX_VELOCITY = 5;

// Key states
const keys = {
    left: false,
    right: false,
    space: false
};

// Button event listeners
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const jumpButton = document.getElementById('jump-button');

leftButton.addEventListener('mousedown', () => {
    keys.left = true;
});
leftButton.addEventListener('mouseup', () => {
    keys.left = false;
});
leftButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.left = true;
});
leftButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.left = false;
});

rightButton.addEventListener('mousedown', () => {
    keys.right = true;
});
rightButton.addEventListener('mouseup', () => {
    keys.right = false;
});
rightButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.right = true;
});
rightButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.right = false;
});

jumpButton.addEventListener('mousedown', () => {
    keys.space = true;
});
jumpButton.addEventListener('mouseup', () => {
    keys.space = false;
});
jumpButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.space = true;
});
jumpButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.space = false;
});

let canJump = true; // Variável para controlar se o player pode pular

// Função para verificar colisão com plataformas do tipo '_'
function checkPlatformCollision() {
    // Filtra as plataformas do tipo '_'
    const flatPlatforms = platforms.filter(platform => platform.vertices.length === 4);
    
    // Verifica se o player está colidindo com alguma plataforma do tipo '_'
    const collisions = Matter.Query.collides(player, flatPlatforms);
    if (collisions.length > 0) {
        canJump = true; // Permite o pulo se o player estiver tocando uma plataforma do tipo '_'
    }
}

// Adiciona uma função de pulo ao player
function jump() {
    if (canJump) {
        // Aplica uma força vertical para cima
        Body.applyForce(player, player.position, { x: 0, y: -0.02 });
        canJump = false; // Impede que o player pule novamente até tocar uma plataforma do tipo '_'
    }
}

// Adiciona um evento de atualização para verificar colisão com plataformas do tipo '_'
Matter.Events.on(engine, 'afterUpdate', function() {
    checkPlatformCollision();
});

// Add keyboard event listeners
document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft') {
        keys.left = true;
    } else if (event.code === 'ArrowRight') {
        keys.right = true;
    } else if (event.code === 'Space') {
        keys.space = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') {
        keys.left = false;
    } else if (event.code === 'ArrowRight') {
        keys.right = false;
    } else if (event.code === 'Space') {
        keys.space = false;
    }
});

// Read level data from level.txt
fetch('level.txt')
    .then(response => response.text())
    .then(levelData => {
        const level = levelData.trim().split('\n').map(row => row.trim().split(''));
        
        // Find player start position
        let startX, startY;
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                if (level[y][x] === '@') {
                    startX = x;
                    startY = y;
                    break;
                }
            }
            if (startX !== undefined) break;
        }
        
        // Set player starting position
        if (startX !== undefined && startY !== undefined) {
            Matter.Body.setPosition(player, {
                x: (startX + 0.5) * (canvas.width / level[0].length),
                y: (startY + 0.5) * (canvas.height / level.length)
            });
        } else {
            // Fallback to default starting position if '#' is not found in level.txt
            Matter.Body.setPosition(player, {
                x: canvas.width / 4,
                y: canvas.height / 4
            });
        }
        
        // Create platforms and obstacles based on level data
        const platformChars = ['|', '_', '\\', '/'];
        const platformHeight = (canvas.height / level.length) * 0.5;
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                const char = level[y][x];
                if (platformChars.includes(char)) {
                    let height = platformHeight;
                    let yPos = (y + 0.5) * (canvas.height / level.length);
                    if (char === '|') {
                        height *= 3;  // Triplicar a altura para |
                        yPos = (y + 1) * (canvas.height / level.length) - height / 2 - (canvas.height / level.length) * 0.25;  // Posicionar 25% para cima
                        platforms.push(
                            Bodies.rectangle(
                                (x + 0.5) * (canvas.width / level[0].length),
                                yPos,
                                canvas.width / level[0].length,
                                height,
                                {
                                    isStatic: true,
                                    friction: 0.5
                                }
                            )
                        );
                    } else if (char === '\\') {
                        height *= 3;  // Triplicar a altura para \
                        yPos = (y + 1) * (canvas.height / level.length) - height / 2 - (canvas.height / level.length) * 0.25;  // Posicionar 25% para cima
                        platforms.push(
                            Bodies.rectangle(
                                (x + 0.5) * (canvas.width / level[0].length),
                                yPos,
                                canvas.width / level[0].length,
                                height,
                                {
                                    isStatic: true,
                                    friction: 0.5,
                                    angle: -Math.PI / 4  // Rotacionar 45 graus no sentido horário
                                }
                            )
                        );
                    } else if (char === '/') {
                        height *= 3;  // Triplicar a altura para /
                        yPos = (y + 1) * (canvas.height / level.length) - height / 2 - (canvas.height / level.length) * 0.25;  // Posicionar 25% para cima
                        platforms.push(
                            Bodies.rectangle(
                                (x + 0.5) * (canvas.width / level[0].length),
                                yPos,
                                canvas.width / level[0].length,
                                height,
                                {
                                    isStatic: true,
                                    friction: 0.5,
                                    angle: Math.PI / 4  // Rotacionar 45 graus no sentido anti-horário
                                }
                            )
                        );
                    } else {
                        platforms.push(
                            Bodies.rectangle(
                                (x + 0.5) * (canvas.width / level[0].length),
                                yPos,
                                canvas.width / level[0].length,
                                height,
                                {
                                    isStatic: true,
                                    friction: 0.5
                                }
                            )
                        );
                    }
                } else if (char === '$') {
                    // Create goal platform
                    platforms.push(
                        Bodies.rectangle(
                            (x + 0.5) * (canvas.width / level[0].length),
                            (y + 0.5) * (canvas.height / level.length),
                            canvas.width / level[0].length,
                            platformHeight,
                            {
                                isStatic: true,
                                friction: 0.5,
                                render: {
                                    fillStyle: 'gold'
                                }
                            }
                        )
                    );
                }
            }
        }
        
        // Add all platforms to the world
        World.add(engine.world, platforms);

        // Start the game
        gameLoop();
    })
    .catch(error => {
        console.error('Error reading level.txt:', error);
        
        // Fallback to default starting position if there's an error reading level.txt
        Matter.Body.setPosition(player, {
            x: canvas.width / 4,
            y: canvas.height / 4
        });
        
        // ... rest of the code ...
    });

// Game loop
function gameLoop() {
    // Update physics
    Engine.update(engine, 1000 / 60);
    
    // Only allow host to control the player
    if (!window.gameStarted || window.isHost) {
        // Handle player movement from keyboard
        if (keys.left) {
            Body.applyForce(player, player.position, { x: -MOVE_FORCE, y: 0 });
        }
        if (keys.right) {
            Body.applyForce(player, player.position, { x: MOVE_FORCE, y: 0 });
        }
        if (keys.space) {
            keys.space = false;  // Definindo que a tecla space foi liberada
            jump();
        }
        
        // Limit horizontal velocity
        if (Math.abs(player.velocity.x) > MAX_VELOCITY) {
            Body.setVelocity(player, {
                x: Math.sign(player.velocity.x) * MAX_VELOCITY,
                y: player.velocity.y
            });
        }
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw platforms
    ctx.fillStyle = '#666';
    platforms.forEach(platform => {
        const vertices = platform.vertices;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
    });
    
    // Draw player
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    // Draw player rotation indicator (line from center to edge)
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(player.position.x, player.position.y);
    ctx.lineTo(
        player.position.x + Math.cos(player.angle) * PLAYER_RADIUS,
        player.position.y + Math.sin(player.angle) * PLAYER_RADIUS
    );
    ctx.stroke();

    
    // Send game state to connected peer if we are the host
    if (window.isHost && window.connection && window.gameStarted) {
        window.connection.send({
            type: 'gameState',
            player: {
                x: player.position.x,
                y: player.position.y,
                velocityX: player.velocity.x,
                velocityY: player.velocity.y,
                angle: player.angle
            },
            platforms: platforms.map(p => ({
                x: p.position.x,
                y: p.position.y,
                width: p.bounds.max.x - p.bounds.min.x,
                height: p.bounds.max.y - p.bounds.min.y
            }))
        });
    }
    
    requestAnimationFrame(gameLoop);
}

// Make game objects available to multiplayer.js
window.player = player;
window.platforms = platforms;
window.keys = keys;

function showVictoryMessage() {
    const victoryMessage = document.getElementById('victory-message');
    victoryMessage.style.display = 'block';
    setTimeout(() => {
        victoryMessage.style.display = 'none';
    }, 3000);
} 