import React, { useEffect, useRef, useState, useMemo } from "react";
import ChatBox from "./ChatBox";
import Scoreboard from "./Scoreboard";
import { io } from "socket.io-client";

const socket = io();

function App() {
  const canvasRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [planes, setPlanes] = useState(null);
  const [projectiles, setProjectiles] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    function onKeyDown(e) {
      let command;
      switch (e.key) {
        case "ArrowUp":
          command = "up";
          break;
        case "ArrowDown":
          command = "down";
          break;
        case "ArrowRight":
          command = "increaseThrust";
          break;
        case "ArrowLeft":
          command = "decreaseThrust";
          break;
        case " ":
          command = "fire";
          break;
        case "m":
        case "M":
          command = "resetPlanes";  
          break;
        default:
          return; // ignore other keys
      }
      socket.emit("control", command);
    }
    let storedUserId = sessionStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substring(7);
      sessionStorage.setItem("userId", storedUserId);
    }
    setUserId(storedUserId);

    // Listen for messages
    socket.on("chat message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for update events containing airplane states
    socket.on("update", (data) => {
      // data is an object mapping socket ids to plane objects
      // For each plane in data, assign a random color if not already set
      const newPlanes = { ...data.airplanes };
      setPlanes(newPlanes);
      setProjectiles(data.projectiles);
    });

    addEventListener("keydown", onKeyDown);

    return () => {
      socket.off("chat message");
      removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Update the canvas with the current state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, 850);
    ctx.lineTo(canvas.width, 850);
    ctx.strokeStyle = "red";
    ctx.stroke();
    ctx.restore();

    if (!planes) return;

    for (const key of Object.keys(planes)) {
      ctx.save();
      const plane = planes[key];
      // Translate to the plane's position. You may want to adjust the y coordinate if needed.
      ctx.translate(plane.x, plane.y);
      // Rotate the context based on the plane's angle
      ctx.rotate(plane.angle);
      ctx.scale(2, 2);

      if (socket.id && key === socket.id) {
        ctx.shadowColor = "yellow";
        ctx.shadowBlur = 20;
      }
      // render plane

      // Pixelated fuselage body (central rectangle)
      ctx.fillStyle = plane.color;
      ctx.fillRect(-3, -15, 6, 30);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -15, 6, 30);

      // Pixelated wings (left and right) – using a contrasting dark grey color
      ctx.fillStyle = "#555";
      // Left wing
      ctx.fillRect(-13, -6, 10, 12);
      ctx.strokeRect(-13, -6, 10, 12);
      // Right wing
      ctx.fillRect(3, -6, 10, 12);
      ctx.strokeRect(3, -6, 10, 12);

      // Pixelated tail (rear section; since nose is at top, tail is at the bottom)
      ctx.fillStyle = "#777";
      ctx.fillRect(-2, 15, 4, 6);
      ctx.strokeRect(-2, 15, 4, 6);

      // Pixelated nose section
      // Draw a small rectangle at the very top of the fuselage for detail
      ctx.fillStyle = "#AAA";
      ctx.fillRect(-2, -19, 4, 4);
      ctx.strokeRect(-2, -19, 4, 4);

      // Draw a spinning propellor at the nose tip (centered at the top of the nose)
      ctx.save();
      ctx.translate(0, -20); // move to the nose tip center
      const propAngle = (Date.now() / 200) % (2 * Math.PI); // spins faster
      ctx.rotate(propAngle);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      // Draw three blades, equally spaced (0°, 120°, and 240°)
      [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach((angle) => {
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      ctx.restore();
    }

    projectiles.filter(projectile => projectile.fired).forEach((projectile) => {
      ctx.save();
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2); // Draw a small circle
      ctx.fill();
      ctx.restore();
    });
  }, [planes, projectiles, userId]);

  const scores = useMemo(() => {
    if (!planes || Object.keys(planes).length === 0) {
      return {};
    }
    const retVal = {};
    for (const [key, value] of Object.entries(planes)) {
      retVal[key] = value.score;
    }
    return retVal;
  }, [planes]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflowX: "hidden",
        width: "100vw",
      }}
    >
      <div style={{ position: "relative" }}>
        <canvas height="900px" ref={canvasRef} width="1500px"></canvas>
        <Scoreboard scores={scores} />
      </div>
      <ChatBox messages={messages} socket={socket} userId={userId} />
    </div>
  );
}

export default App;
