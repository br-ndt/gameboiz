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

  console.log(messages, "MESSAGES");

  return (
    <div
      style={{
        background: "black",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        height: "100%",
        justifyContent: "flex-end",
        width: "320px",
      }}
    >
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <p>
              {msg.userId}:{msg.text}
            </p>
          </div>
        ))}
      </div>
      <div>
        <input
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
