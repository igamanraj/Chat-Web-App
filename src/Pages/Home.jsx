import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "../Pages/Home.css";
import chatLogo from "../assets/chat.png";
import AgeVerification from "../assets/components/AgeVerification";
import { CgAttachment } from "react-icons/cg";
import { VscChromeClose } from "react-icons/vsc";
import { Tooltip } from "react-tooltip";

const socket = io("https://chat-app-backend-smpd.onrender.com");

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isSkipConfirm, setIsSkipConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    socket.on("partnerFound", () => {
      setConnected(true);
      setPartnerDisconnected(false);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, { me: false, text: msg }]);
    });
    socket.on("receiveImage", (imageUrl) => {
      setMessages((prev) => [...prev, { me: false, image: imageUrl }]);
    });

    socket.on("partnerDisconnected", () => {
      setConnected(false);
      setPartnerDisconnected(true);
    });

    return () => {
      socket.off("partnerFound");
      socket.off("message");
      socket.off("receiveImage");
      socket.off("partnerDisconnected");
    };
  }, []);
  // Send a message to the server
  const sendMessage = () => {
    if (selectedImage) {
      console.log("Sending image....");
      setIsSending(true);
      socket.emit("sendImage", selectedImage, (ack) => {
        if (ack) {
          console.log("Image sent successfully!");
        } else {
          console.log("Image failed to send!");
        }
      });
      setMessages((prev) => [...prev, { me: true, image: selectedImage }]);
      setSelectedImage(null);
    } else if (message.trim()) {
      socket.emit("message", message);
      setMessages((prev) => [...prev, { me: true, text: message }]);
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
    <div
      className={`${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-500 text-white"
      } h-screen flex flex-col`}
    >
      <header className="flex items-center justify-between p-4 bg-gray-800 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8">
            <img src={chatLogo} alt="Chat Logo" />
          </div>
          <h1 className="text-xl font-bold">Chat App</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="rounded-full p-2 bg-gray-700 dark:bg-gray-800 text-white dark:text-black hover:cursor-pointer"
          data-tooltip-id="darkmode-tooltip"
        >
          {darkMode ? "🌙" : "☀️"}
          <Tooltip id="darkmode-tooltip" place="bottom" content="Toggle Dark / Light Mode" />
        </button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <AgeVerification />
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.me
                ? msg.text
                  ? "my-message bg-blue-600 text-white self-end"
                  : "self-end"
                : msg.text
                ? "other-message bg-green-200 text-black self-start"
                : "self-start"
            }`}
          >
            {msg.text}
            {msg.image && (
              <img
                src={msg.image}
                alt="Received"
                className="w-32 h-auto rounded-md"
              />
            )}
          </div>
        ))}
        {!connected && (
          <p
            className={`text-center text-lg ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            {partnerDisconnected
              ? "Your partner disconnected. Waiting for a new partner..."
              : "Connecting to a random partner..."}
          </p>
        )}
      </main>

      <footer className="flex items-center p-4 bg-gray-800 dark:bg-gray-800">
        <button
          onClick={handleSkipUser}
          className="px-4 py-2 mr-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
        >
          {isSkipConfirm ? "Confirm" : "Skip"}
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setSelectedImage(reader.result);
              };
              reader.readAsDataURL(file);
            }
          }}
          style={{ display: "none" }}
          id="fileInput"
        />

        <label
          htmlFor="fileInput"
          className="cursor-pointer p-2 rounded-full hover:bg-gray-700"
          data-tooltip-id="attach-tooltip"
        >
          <CgAttachment />
          <Tooltip id="attach-tooltip" place="top" content="Attach Images" />
        </label>

        {selectedImage && (
          <div className="relative">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-16 h-auto rounded-md border"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-[-9px] right-[-9px] bg-[#3D3D3A] text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-600"
              
            >
              <VscChromeClose />
            </button>
            
          </div>
        )}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          disabled={!connected}
          className="flex-grow px-4 py-2 mr-2 rounded text-white"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
        >
          Send
        </button>
      </footer>
    </div>
  );
};

export default Home;
