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
    // Platforms
    Bodies.rectangle(canvas.width * 0.7, canvas.height * 0.7, 200, 20, { 
        isStatic: true,
        friction: 0.5
    }),
    Bodies.rectangle(canvas.width * 0.3, canvas.height * 0.5, 200, 20, { 
        isStatic: true,
        friction: 0.5
    }),
    Bodies.rectangle(canvas.width * 0.8, canvas.height * 0.3, 200, 20, { 
        isStatic: true,
        friction: 0.5
    })
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

// Função para verificar colisão com o solo
function checkGroundCollision() {
    // Verifica se o player está colidindo com o solo
    const collisions = Matter.Query.collides(player, [ground]);
    if (collisions.length > 0) {
        canJump = true; // Permite o pulo se o player estiver tocando o solo
    }
}

// Adiciona uma função de pulo ao player
function jump() {
    if (canJump) {
        // Aplica uma força vertical para cima
        Body.applyForce(player, player.position, { x: 0, y: -0.02 });
        canJump = false; // Impede que o player pule novamente até tocar o solo
    }
}

// Adiciona um evento de atualização para verificar colisão com o solo
Matter.Events.on(engine, 'afterUpdate', function() {
    checkGroundCollision();
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

// Start the game
gameLoop(); 