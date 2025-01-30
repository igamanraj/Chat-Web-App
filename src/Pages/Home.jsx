import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import ".././App.css";
import chatLogo from "../assets/chat.png";
import AgeVerification from "../assets/components/AgeVerification";

const socket = io("https://chat-app-backend-smpd.onrender.com");

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isSkipConfirm, setIsSkipConfirm] = useState(false);

  useEffect(() => {
    socket.on("partnerFound", () => {
      setConnected(true);
      setPartnerDisconnected(false);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, { me: false, text: msg }]);
    });

    socket.on("partnerDisconnected", () => {
      setConnected(false);
      setPartnerDisconnected(true);
    });

    return () => {
      socket.off("partnerFound");
      socket.off("message");
      socket.off("partnerDisconnected");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      setMessages((prev) => [...prev, { me: true, text: message }]);
      socket.emit("message", message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleSkipUser = () => {
    if (isSkipConfirm) {
      socket.emit("disconnectFromPartner");
      setMessages([]);
      setConnected(false);
      setIsSkipConfirm(false);
      socket.emit("findNewPartner");
    } else {
      setIsSkipConfirm(true);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-500 text-white"} h-screen flex flex-col`}>
      <header className="flex items-center justify-between p-4 bg-gray-800 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8">
            <img src={chatLogo} alt="Chat Logo" />
          </div>
          <h1 className="text-xl font-bold">Chat App</h1>
        </div>
        <button onClick={toggleDarkMode} className="rounded-full p-2 bg-gray-700 dark:bg-gray-800 text-white dark:text-black hover:cursor-pointer">
          {darkMode ? "🌙" : "☀️"}
        </button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <AgeVerification />
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.me ? "my-message bg-blue-600 text-white self-end" : "other-message bg-gray-300 text-black self-start"}`}>
            {msg.text}
          </div>
        ))}
        {!connected && (
          <p className={`text-center text-lg ${darkMode ? "text-white" : "text-black"}`}>
            {partnerDisconnected ? "Your partner disconnected. Waiting for a new partner..." : "Connecting to a random partner..."}
          </p>
        )}
      </main>

      <footer className="flex items-center p-4 bg-gray-800 dark:bg-gray-800">
        <button onClick={handleSkipUser} className="px-4 py-2 mr-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer">
          {isSkipConfirm ? "Confirm" : "Skip"}
        </button>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message" disabled={!connected} className="flex-grow px-4 py-2 mr-2 rounded text-white" />
        <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
          Send
        </button>
      </footer>
    </div>
  );
};

export default Home;
