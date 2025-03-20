import React, { useState, useEffect } from "react";

const ChatBox = ({ messages, socket, userId }) => {
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim()) {
      const message = {
        userId,
        text: input,
      };
      socket.emit("chat message", message);
      setInput("");
    }
  };

  return (
    <div
      style={{
        background: "black",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        height: "100%",
        justifyContent: "flex-end",
      }}
    >
      <div style={{ padding: "0 4px" }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <p>
              <strong
                style={{ color: msg.userId === userId ? "yellow" : "white" }}
              >
                {msg.userId}
              </strong>
              : {msg.text}
            </p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", width: "100%" }}>
        <input
          style={{ flexGrow: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;
