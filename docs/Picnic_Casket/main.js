/**
 * @typedef {{
 * pos: Vector,
 * }} Player
 */

/**
 * @type { Player }
 */

title = "PICNIC CASKET";

description = `
COLLECT BRAINS
INTO WHITE
CASKET!
---------------
[TAP] OPEN/CLOSE
---------------
[HOLD] EXPAND
`;

// Each letter represents a pixel color.
// (l: black, r: red, g: green, b: blue
//  y: yellow, p: purple, c: cyan
//  L: light_black, R: light_red, G: light_green, B: light_blue
//  Y: light_yellow, P: light_purple, C: light_cyan)
characters = [
// Player (a)
`
brrb
brrb
bbbb
 bb
 bb
b  b
b  b
`,
// Brains (b)
`
 pp
pppp
ppppp
  pp
   p
`,
// Fire (c)
`
 R  
 R Y
RY RY
RRYYR
 RRR
`
];

const G = {
  WIDTH: 100,
  HEIGHT: 100,
};

// Plays a sound effect.
// play(type: "coin" | "laser" | "explosion" | "powerUp" |
// "hit" | "jump" | "select" | "lucky");
// Select the appearance theme.
// theme?: "simple" | "pixel" | "shape" | "shapeDark" | "crt" | "dark";
options = {
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  theme: 'pixel',
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 250
};

let player;
let switch_Directions;    // Stores the direction the player is heading towards
let casket_Hitbox_State;  // Keeps state of the casket whether it is open or closed
let casket_Size_State;    // Stores state of the size of the casket whether it is expanded or shrunk
let casket_Min_Size;   // When shrinking the casket, it will reset back to 10
let casket_Max_Size;   // When expanding the casket, it will reach up to 20
let casket_Current_Size;  // Starts off at size 10
let obstacles;   // Stores the list of brains and fires
let current_Difficulty;   // keeps in place the difficulty
let destroyedBrains;

function update() {
  // INIT
  if (!ticks) {
    // Creates the player character
    player = {
      pos: vec(G.WIDTH * 0.5, G.HEIGHT - 5)
    };
    switch_Directions = "toTheLeft";
    casket_Hitbox_State = 'open';
    casket_Size_State = 'shrink';
    casket_Min_Size = 15;
    casket_Max_Size = 50;
    casket_Current_Size = 15;
    obstacles = [];
    current_Difficulty = 2;
    destroyedBrains = 3;
  }

  // Updates difficulty whether time has passed or the player has a higher score
  if((current_Difficulty + 1 == Math.floor(difficulty) || score / 1000 == current_Difficulty) && current_Difficulty <= 7) {
    current_Difficulty += 1;
  }

  // Spawns in enemies
  if (obstacles.length <= current_Difficulty) {
    obstacles.push(new Obstacle());
  }

  // Determines if it should switch directions when hitting the border
  if(player.pos.x - (casket_Current_Size / 2) < 0) {
    switch_Directions = "toTheRight"
  } else if(player.pos.x + (casket_Current_Size / 2) > G.WIDTH) {
    switch_Directions = "toTheLeft"
  }

  let player_Offset = 0;
  // Determines which direction the player will automatically move to
  if(switch_Directions == "toTheRight") {
    player_Offset = -2;
    player.pos = vec(player.pos.x + (0.5 * difficulty), player.pos.y);
  } else if(switch_Directions == "toTheLeft") {
    player_Offset = 2;
    player.pos = vec(player.pos.x - (0.5 * difficulty), player.pos.y);
  }
  // Color of the run will be same color as health
  particle(
    player.pos.x + player_Offset, // x coordinate
    player.pos.y + 3, // y coordinate
    1, // The number of particles
    0.5, // The speed of the particles
    -PI/2, // The emitting angle
    PI/4  // The emitting width
  );

  // Updates the animation for the player
  color("black");
  char("a", player.pos);
  // ---------- CONTROLLER INPUT ----------
  // [TAP] - Opening/Closing Casket
  if(input.isJustPressed) {
    play("jump");
    if(casket_Hitbox_State == 'open') {
      casket_Hitbox_State = 'closed'
    } else {  // switches from closed -> open
      casket_Hitbox_State = 'open'
    }
  }
  // [HOLD] - Expanding Casket
  if(input.isPressed) {
    casket_Size_State = 'expand'
  // [HOLD] released - Shrinking Casket
  } else if(input.isJustReleased) {
    casket_Size_State = 'shrink';
  }

  // ---------- CASKET STATE ----------
  if(casket_Size_State == 'expand') {
    if(casket_Current_Size < casket_Max_Size) {
      casket_Current_Size += 1;
    }
    box(player.pos.x, player.pos.y - 6, casket_Current_Size, 4);
  } else if(casket_Size_State == 'shrink') {
    if(casket_Current_Size > casket_Min_Size) {
      casket_Current_Size -= 1;
    }
    box(player.pos.x, player.pos.y - 6, casket_Current_Size, 4);
  }
  if(casket_Hitbox_State == 'open') {
    color("light_black")
    box(player.pos.x, player.pos.y - 6, casket_Current_Size, 4);
  } else if(casket_Hitbox_State == 'closed') {
    color("light_cyan")
    box(player.pos.x, player.pos.y - 6, casket_Current_Size, 4);
  }

  obstacles.forEach(b => b.descend());
  obstacles.forEach(b => b.respawn());
  obstacles.forEach(b => b.obstacleCollision());

  // Life Total
  if(destroyedBrains == 3) {
    color("green");
  } else if(destroyedBrains == 2) {
    color("yellow");
  } else {  // destroyedBrains == 1
    color("light_red");
  }
  let amountOfBrains = destroyedBrains.toString() + "/3"
  text(amountOfBrains, 3, 10);  
}

// Classes
class Obstacle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.type;   // brains is (b), fires is (c)
    this.obstacleSpeed;
    this.setSpawn();
  }

  setSpawn() {
    // Sets the sprite
    let objNum = Math.floor(Math.random() * 2);
    if(objNum == 1) { this.type = "b"; } else { this.type = "c"; }
    // Creates a spawn location
    this.y = -5;
    this.x = Math.random() * G.WIDTH;
    this.obstacleSpeed = Math.random() + 0.25 * difficulty;
    // Checks to see if the spawn was outside the boundary
    if (this.x <= 5) {
      this.x += 5;
    } else if (this.x >= G.WIDTH - 5) {
      this.x -= 5;
    }
  }

  descend() {
    // Particles
    if(this.type == "b") {  // brains
      color("light_cyan")
      particle(
        this.x, // x coordinate
        this.y - 1, // y coordinate
        0.1, // The number of particles
        0.1, // The speed of the particles
        -PI/2, // The emitting angle
        PI/4  // The emitting width
      );
    } else {  // fire
      color("light_yellow");
      particle(
        this.x, // x coordinate
        this.y - 1, // y coordinate
        0.25, // The number of particles
        0.75, // The speed of the particles
        -PI/2, // The emitting angle
        PI/4  // The emitting width
      );
    }

    // Movement
    this.y += this.obstacleSpeed;
    color("black");
    char(this.type, this.x, this.y);
  }

  respawn() {
    // If the brains have fallen off the screen
    if(this.y > G.HEIGHT) {
      this.setSpawn();
    }
  }

  obstacleCollision() {
    // Checks collision against the white box
    if(char(this.type, this.x, this.y).isColliding.rect.light_black) {
      // Player catches a brain object
      if(this.type == "b") {
        play("powerUp");
        addScore(100, this.x, this.y);
        this.setSpawn();
      // Player hits a fire object
      } else {
        // Blocks a brain
        destroyedBrains -= 1;
        addScore(-150, this.x, this.y);
        // Blocks too many brains, loses the game
        if(destroyedBrains <= 0) {
          play("lucky");
          end();
        } else {
          play("select");
        }
      }
      this.setSpawn();
    // Checks collision against blue box
    } else if(char(this.type, this.x, this.y).isColliding.rect.light_cyan) {
        // Receive points for blocking fire
        if(this.type == "c") {
          addScore(50, this.x, this.y);
          play("explosion");
        } else {
        // Blocks a brain
          destroyedBrains -= 1;
          addScore(-150, this.x, this.y);
          // Blocks too many brains, loses the game
          if(destroyedBrains <= 0) {
            play("lucky");
            end();
          } else {
            play("select");
          }
        }
      this.setSpawn();
    }
  }
}
