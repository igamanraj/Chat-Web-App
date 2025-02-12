import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "../Pages/Home.css";
import chatLogo from "../assets/chat.png";
import AgeVerification from "../assets/components/AgeVerification";
import { IoImageOutline } from "react-icons/io5";

import { VscChromeClose } from "react-icons/vsc";
import { Tooltip } from "react-tooltip";
import BounceLoader from "react-spinners/BounceLoader";
import LinkPreview from "../assets/components/LinkPreview/LinkPreview";
import { BarLoader } from "react-spinners";

const socket = io("http://localhost:9000");

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
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    socket.on("partnerFound", () => {
      setConnected(true);
      setPartnerDisconnected(false);
    });

    socket.on("message", (msg) => {
      // Check if msg is an object with text property
      const messageText = typeof msg === "object" ? msg.text : msg;
      const messageId =
        typeof msg === "object"
          ? msg.messageId
          : Math.random().toString(36).substr(2, 9);

      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          me: false,
          text: messageText,
          reactions: {},
        },
      ]);
    });
    socket.on("receiveImage", (imageUrl) => {
      setMessages((prev) => [...prev, { me: false, image: imageUrl }]);
    });

    socket.on("partnerDisconnected", () => {
      setConnected(false);
      setPartnerDisconnected(true);
    });

    socket.on(
      "messageReaction",
      ({ messageId, emoji, userId: reactingUserId, action }) => {
        setMessages((prev) => {
          const newMessages = prev.map((msg) => {
            if (msg.id === messageId) {
              const reactions = { ...msg.reactions };

              // First remove any existing reactions from this user
              Object.keys(reactions).forEach((existingEmoji) => {
                reactions[existingEmoji] = reactions[existingEmoji].filter(
                  (id) => id !== reactingUserId
                );
                if (reactions[existingEmoji].length === 0) {
                  delete reactions[existingEmoji];
                }
              });

              // Add new reaction if action is 'add'
              if (action === "add") {
                if (!reactions[emoji]) {
                  reactions[emoji] = [];
                }
                reactions[emoji].push(reactingUserId);
              }

              return { ...msg, reactions };
            }
            return msg;
          });

          return newMessages;
        });
      }
    );

    return () => {
      socket.off("partnerFound");
      socket.off("message");
      socket.off("receiveImage");
      socket.off("partnerDisconnected");
      socket.off("messageReaction");
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
            setMessages((prev) => [
              ...prev,
              { me: true, image: selectedImage },
            ]);
            setSelectedImage(null);
          } else {
            console.log("Image failed to send!");
          }
          setIsSending(false);
        });
      }, 1000); // 1 seconds delay
    } else if (message.trim()) {
      const messageId = Math.random().toString(36).substr(2, 9);
      const newMessage = {
        id: messageId,
        me: true,
        text: message,
        reactions: {},
      };
      socket.emit("message", { text: message, messageId });
      setMessages((prev) => [...prev, newMessage]);
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
    if (!text || typeof text !== "string") return text;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (isValidUrl(part)) {
        return (
          <div key={index} className="message-link-container">
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="message-link"
            >
              {part}
            </a>
            <LinkPreview url={part} />
          </div>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const Message = ({ message }) => {
    const [showReactions, setShowReactions] = useState(false);
    let timeoutId;

    const handleContextMenu = (e) => {
      e.preventDefault();
      setShowReactions(true);
    };

    const handleTouchStart = () => {
      timeoutId = setTimeout(() => setShowReactions(true), 500);
    };

    const handleTouchEnd = () => {
      clearTimeout(timeoutId);
    };

    const handleClickOutside = () => {
      setShowReactions(false);
    };

    useEffect(() => {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
      <div
        className={`message ${
          message.me
            ? message.text
              ? "my-message bg-blue-600 text-white self-end"
              : "my-message has-image self-end"
            : message.text
            ? "other-message bg-gray-700 text-white self-start"
            : "other-message has-image self-start"
        }`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="message-content">
          {message.text &&
            typeof message.text === "string" &&
            formatMessageWithLinks(message.text)}
          {message.image && (
            <img
              src={message.image}
              alt="Shared"
              className="w-32 h-auto rounded-md"
            />
          )}
        </div>

        {/* Updated Reactions display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions-display">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <span
                key={emoji}
                className={`reaction-badge backdrop-blur-sm ${
                  users.includes(userId) ? "my-reaction" : ""
                }`}
                title={`${users.length} ${
                  users.length === 1 ? "reaction" : "reactions"
                }`}
              >
                {emoji}
                {users.length > 1 && (
                  <span className="reaction-count">{users.length}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div
            className="reaction-picker backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {["👍", "❤️", "😂", "😮", "😢", "👎"].map((emoji) => (
              <span
                key={emoji}
                onClick={() => {
                  handleReact(message.id, emoji);
                  setShowReactions(false);
                }}
                className="reaction-emoji  backdrop-blur-sm"
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleReact = (messageId, emoji) => {
    setMessages((prev) => {
      const newMessages = prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          const hasReacted = reactions[emoji]?.includes(userId);

          // First remove any existing reaction from this user
          Object.keys(reactions).forEach((existingEmoji) => {
            reactions[existingEmoji] = reactions[existingEmoji].filter(
              (id) => id !== userId
            );
            if (reactions[existingEmoji].length === 0) {
              delete reactions[existingEmoji];
            }
          });

          // If clicking the same emoji, we've already removed it
          // If clicking a different emoji, add the new reaction
          if (!hasReacted) {
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            reactions[emoji].push(userId);
            socket.emit("messageReaction", {
              messageId,
              emoji,
              userId,
              action: "add",
            });
          } else {
            socket.emit("messageReaction", {
              messageId,
              emoji,
              userId,
              action: "remove",
            });
          }

          return { ...msg, reactions };
        }
        return msg;
      });

      return newMessages;
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
          <Tooltip
            id="darkmode-tooltip"
            place="bottom"
            content="Toggle Dark / Light Mode"
          />
        </button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <AgeVerification />
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        {!connected && (
          <div className="text-center mt-4 flex items-center justify-center gap-3">
            <BounceLoader color="#364153" size={45} speedMultiplier={1.5} />
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
                <IoImageOutline  size={22}/>
                <Tooltip
                  id="attach-tooltip"
                  place="top"
                  content="Attach Images"
                />
              </label>
            </div>

            {selectedImage && (
              <div className="relative">
                {isSending && (
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-xs bg-opacity-50 rounded-md z-[1]">
                    <BarLoader color="#1E2939"  height={3} width={53}/>
                  </div>
                )}
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-md border"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-[#3D3D3A] text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-600 z-[2]"
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
