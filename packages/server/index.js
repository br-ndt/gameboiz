import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { physicsStep, handleInput, stepPhysics } from "./planePhysics.js";

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

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "static/index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected " + socket.id);

  socket.on("chat message", (msg) => {
    console.log(msg);
    io.emit("chat message", msg);
  });

  // Listen for control commands from the client
  socket.on("control", (data) => {
    // Expected data is a string like "up", "down", "increaseThrust", or "decreaseThrust"
    let plane = airplanes[socket.id];
    handleInput(plane, data);
  });

  airplanes[socket.id] = {
    x: getRandomIntInclusive(0, 100),
    y: getRandomIntInclusive(0, 100), // Starting altitude of 100 units
    vx: 10, // Initial horizontal speed
    vy: 0, // Initial vertical speed
    angle: Math.PI / 6, // 30 degrees in radians
    thrust: 50, // Thrust magnitude
    angularVelocity: 0.05, // Angular velocity in radians per second
    color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0") // Random color
  };

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete airplanes[socket.id];
  });
});

// Server update loop - update physics and broadcast new positions
const FPS = 60;
const dt = 1 / FPS; // time delta per frame
setInterval(() => {
  // Update physics for each airplane
  Object.keys(airplanes).forEach((id) => {
    airplanes[id] = stepPhysics(airplanes[id], dt);
  });

  // Emit the updated positions to all connected clients
  io.emit("update", airplanes);
  console.log(airplanes);
}, 1000 / FPS);

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
