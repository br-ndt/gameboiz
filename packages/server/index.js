import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { physicsStep } from "./planePhysics.js";
import { handleInput } from "./input.js";
import { respawnProjectile, spawnProjectile } from "./projectile.js";
import { moveProjectile } from "./projectile.js";

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const airplanes = {};
let projectileIndex = 0;
const projectiles = new Array(100).fill(spawnProjectile());

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "static/index.html"));
});

function createNewAirplane() {
  return {
    x: getRandomIntInclusive(0, 900),
    y: getRandomIntInclusive(200, 800),
    vx: 300,
    vy: 0,
    stalled: false,
    angle: Math.PI * 2 * Math.random(),
    thrust: 75,
    angularVelocity: 0.05,
    color:
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0"),
    isThrusting: true,
    score: 0,
    isFiring: false,
  }; 
}

io.on("connection", (socket) => {
  console.log("a user connected " + socket.id);

  socket.on("chat message", (msg) => {
    console.log(msg);
    io.emit("chat message", msg);
  });

  socket.on("control", (data) => {
    if (data === "resetPlanes") {
      // Reset the sending client's plane to a new random position with default props.
      airplanes[socket.id] = createNewAirplane();
    } else {
    let plane = airplanes[socket.id];
    handleInput(plane, data);
    }
  });

  airplanes[socket.id] = createNewAirplane();
});

// Server update loop - update physics and broadcast new positions
const FPS = 60;
const dt = 1 / FPS; // time delta per frame
setInterval(() => {
  // Update physics for each airplane
  Object.keys(airplanes).forEach((id) => {
    airplanes[id] = physicsStep(airplanes[id], dt);
    if (airplanes[id].isFiring) {
      projectiles[projectileIndex] = respawnProjectile(projectiles[projectileIndex], airplanes[id]);
      ++projectileIndex;
      if(projectileIndex >= 100) {
        projectileIndex = 0;
      }
    }
  });

  projectiles.forEach((projectile) => {
    moveProjectile(projectile);
  });

  // Emit the updated positions to all connected clients
  io.emit("update", { airplanes, projectiles });
}, 1000 / FPS);

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
