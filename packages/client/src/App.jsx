import React, { useEffect, useRef, useState } from "react";
import ChatBox from "./ChatBox";
import { io } from "socket.io-client";

const socket = io();

function App() {
  const canvasRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [planes, setPlanes] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    function onKeyDown(e) {
      let command;
      console.log(e);
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
      const newPlanes = { ...data };
      setPlanes(newPlanes);
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

    if (!planes) return;

    for (const key of Object.keys(planes)) {
      ctx.save();
      const plane = planes[key];
      // Translate to the plane's position. You may want to adjust the y coordinate if needed.
      ctx.translate(plane.x, plane.y);
      // Rotate the context based on the plane's angle
      ctx.rotate(plane.angle);

      // Draw a simple triangle to represent the plane
      ctx.beginPath();
      ctx.moveTo(20, 0); // tip of the plane
      ctx.lineTo(-20, -10); // back left
      ctx.lineTo(-20, 10); // back right
      ctx.closePath();
      // Use the preassigned random color for this plane
      ctx.fillStyle = plane.color;
      ctx.fill();
      ctx.restore();
    }
  }, [planes]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        position: "relative",
        width: "100vw",
      }}
    >
      <canvas
        height="1000px"
        ref={canvasRef}
        style={{ height: "100vh", width: "70vw" }}
        width="800px"
      ></canvas>
      <ChatBox messages={messages} socket={socket} userId={userId} />
    </div>
  );
}

export default App;