import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "../Pages/Home.css";
import chatLogo from "../assets/chat.png";
import AgeVerification from "../assets/components/AgeVerification";
import { GrAttachment } from "react-icons/gr";
import { VscChromeClose } from "react-icons/vsc";
import { Tooltip } from "react-tooltip";
import BounceLoader from "react-spinners/BounceLoader";
import LinkPreview from '../assets/components/LinkPreview/LinkPreview';
import { ClipLoader } from "react-spinners";


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
  const messagesEndRef = useRef(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send a message to the server
  const sendMessage = () => {
    if (selectedImage) {
      console.log("Sending image....");
      setIsSending(true);
      
      // Add delay before sending image
      setTimeout(() => {
        socket.emit("sendImage", selectedImage, (ack) => {
          if (ack) {
            console.log("Image sent successfully!");
            setMessages((prev) => [...prev, { me: true, image: selectedImage }]);
            setSelectedImage(null);
          } else {
            console.log("Image failed to send!");
          }
          setIsSending(false);
        });
      }, 1500); // 1.5 seconds delay
      
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

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const formatMessageWithLinks = (text) => {
    if (!text) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (isValidUrl(part)) {
        return (
          <div key={index} className="message-link-container">
            <a href={part} target="_blank" rel="noopener noreferrer" className="message-link">
              {part}
            </a>
            <LinkPreview url={part} />
          </div>
        );
      }
      return <span key={index}>{part}</span>;
    });
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
                ? "other-message bg-gray-700 text-white self-start"
                : "self-start"
            }`}
          >
            <div className="message-text">
              {msg.text && formatMessageWithLinks(msg.text)}
            </div>
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
           <div className="text-center mt-4 flex items-center justify-center gap-3">
            <BounceLoader color="#364153" size={45}  speedMultiplier={1.5}/>
          <p
            className={`text-center text-lg ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            {partnerDisconnected
              ? "Your partner disconnected. Waiting for a new partner..."
              : "Connecting to a random partner..."}
          </p>
           </div>
        )}
        <div ref={messagesEndRef} />
      </main>

       {/* Footer/Input Area */}
       <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 dark:bg-gray-800 p-2 md:p-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-2">
          <button
            onClick={handleSkipUser}
            className="px-3 py-2 md:px-4 text-sm md:text-base bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
          >
            {isSkipConfirm ? "Confirm" : "Skip"}
          </button>

          <div className="flex-1 flex items-center gap-2 relative">
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
              className="hidden"
              id="fileInput"
            />

            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={!connected}
                className="w-full px-3 pl-10 py-2 rounded text-white focus:outline-none bg-gray-700 dark:bg-gray-700 text-sm md:text-base"
              />
              <label
                htmlFor="fileInput"
                className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-400 transition-colors"
                data-tooltip-id="attach-tooltip"
              >
                <GrAttachment className="text-  " />
                <Tooltip id="attach-tooltip" place="top" content="Attach Images" />
              </label>
            </div>

            {selectedImage && (
              <div className="relative">
                {isSending && (
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-xs bg-opacity-50 rounded-md z-10">
                    <ClipLoader color="#e0dbdb" size={20} />
                  </div>
                )}
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-md border"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-[#3D3D3A] text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-600"
                >
                  <VscChromeClose />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={sendMessage}
            className="px-3 py-2 md:px-4 text-sm md:text-base bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Home;
