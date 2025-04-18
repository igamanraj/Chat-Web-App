import React, { useState, useEffect, useRef } from "react";
import "../Pages/Home.css";
import chatLogo from "../assets/chat.png";
import AgeVerification from "../assets/components/AgeVerification";
import BounceLoader from "react-spinners/BounceLoader";
import LinkPreview from "../assets/components/LinkPreview/LinkPreview";
import EmojiPicker from "../assets/components/EmojiPicker/Emoji";
import GifPicker from "../assets/components/GIFPicker/GIF";
import SyncLoader from "react-spinners/SyncLoader";
import { io } from "socket.io-client";
import { IoImageOutline } from "react-icons/io5";
import { VscChromeClose } from "react-icons/vsc";
import { Tooltip } from "react-tooltip";
import { ClipLoader } from "react-spinners";
import { IoMoon } from "react-icons/io5";
import { MdOutlineLightMode } from "react-icons/md";
import { IoMdSend } from "react-icons/io";
import VoiceRecorder from "../assets/components/VoiceRecorder/VoiceRecorder";

// Backend connection configuration Sets up Socket.io connection to the backend server
const BACKEND_URL = import.meta.env.VITE_REACT_BACKEND_URL;
const socket = io(BACKEND_URL);

//  State Management Core application state variables for chat functionality

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
  const [userId] = useState(() => Math.random().toString(36).substring(2, 9));
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Socket.io Event Handlers Setup listeners for real-time communication events
  useEffect(() => {
    //Handle partnerFound event
    socket.on("partnerFound", () => {
      setConnected(true);
      setPartnerDisconnected(false);
    });

    // Handle message event
    socket.on("message", (msg) => {
      const messageId =
        typeof msg === "object"
          ? msg.messageId
          : Math.random().toString(36).substring(2, 9);

      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          me: false,
          text: msg.text || null,
          gif: msg.gif || null,
          reactions: {},
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        },
      ]);
    });

    // Handle receiveImage event
    socket.on("receiveImage", (imageUrl) => {
      setMessages((prev) => [
        ...prev,
        {
          me: false,
          image: imageUrl,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          reactions: {},
        },
      ]);
    });

    // Handle partnerDisconnected event
    socket.on("partnerDisconnected", () => {
      setConnected(false);
      setPartnerDisconnected(true);
    });

    // In useEffect socket setup:
    socket.on("partnerTyping", (typing) => {
      setPartnerTyping(typing);
    });

    // Handle messageReaction event
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
    // Cleanup function to remove event listeners
    return () => {
      socket.off("partnerFound");
      socket.off("message");
      socket.off("receiveImage");
      socket.off("partnerDisconnected");
      socket.off("messageReaction");
      socket.off("partnerTyping");
    };
  }, []);

  // Handle message input change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only emit if not already typing
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", true);
    }
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", false);
    }, 2000); // Stop showing typing indicator after 2 seconds of inactivity
  };

  // Add to your existing useEffect cleanup
  useEffect(() => {
    // Existing socket listeners...

    // Cleanup function
    return () => {
      // Existing cleanup...
      socket.off("partnerTyping");

      // Clear typing timeout if component unmounts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  // Scroll to bottom of chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send a message to the server
  const sendMessage = () => {
    if (selectedImage) {
      console.log("🔃Sending image....");
      setIsSending(true);

      // Add delay before sending image
      setTimeout(() => {
        socket.emit("sendImage", selectedImage, (ack) => {
          if (ack) {
            console.log("✅Image sent successfully!");
            setMessages((prev) => [
              ...prev,
              {
                me: true,
                image: selectedImage,
                timestamp: new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
              },
            ]);
            setSelectedImage(null);
          } else {
            console.log("❌Image failed to send!");
          }
          setIsSending(false);
        });
      }, 1000); // 1 seconds delay
    } else if (message.trim()) {
      const messageId = Math.random().toString(36).substring(2, 9);
      const newMessage = {
        id: messageId,
        me: true,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        text: message,
        reactions: {},
      };
      socket.emit("message", { text: message, messageId });
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
    }
  };

  // Handle Enter key press to send message
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Skip user or confirm skip
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
  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Check if a string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Format message with clickable links
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

  // Message Component
  const Message = ({ message }) => {
    const showReactions = activeReactionMessageId === message.id;
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    let timeoutId;

    const handlePlayPause = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audioRef.current.ontimeupdate = () => {
          setCurrentTime(Math.floor(audioRef.current.currentTime));
        };
      }
    }, []);

    // Handle right-click context menu for reactions
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent bubbling to document click handler
      // Close any open reaction picker first
      setActiveReactionMessageId(message.id);
    };
    // Handle touch events for mobile devices
    const handleTouchStart = () => {
      timeoutId = setTimeout(() => {
        setActiveReactionMessageId(message.id);
      }, 500);
    };
    // Clear timeout if touch ends
    const handleTouchEnd = () => {
      clearTimeout(timeoutId);
    };
    // Add a click handler at the document level to close reaction picker when clicking outside
    useEffect(() => {
      const handleDocumentClick = () => {
        if (activeReactionMessageId) {
          setActiveReactionMessageId(null);
        }
      };

      document.addEventListener("click", handleDocumentClick);
      return () => document.removeEventListener("click", handleDocumentClick);
    }, [activeReactionMessageId]);

    return (
      <div
        className={`message ${
          message.me
            ? message.text
              ? "my-message bg-[#1E2939] text-white self-end"
              : "self-end"
            : message.text
              ? "other-message bg-gray-700 text-white self-start"
              : "self-start"
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
          {message.gif && (
            <img
              src={message.gif}
              alt="GIF"
              className="w-48 h-auto rounded-md"
            />
          )}
          {message.type === "audio" && (
            <div className={`flex items-center gap-3 min-w-[180px] max-w-[280px] ${
              message.me ? 'bg-[#1E2939]' : 'bg-gray-700'
            } p-3 rounded-lg`}>
              <button 
                onClick={handlePlayPause}
                className={`text-white hover:text-gray-300 transition-all duration-200 ${
                  isPlaying ? 'scale-110' : ''
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  {isPlaying ? (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-[2px]">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-[3px] rounded-full transition-all duration-150 ${
                        isPlaying ? 'bg-white' : 'bg-white/40'
                      }`}
                      style={{
                        height: `${
                          isPlaying 
                            ? 4 + Math.abs(Math.sin((Date.now() / 200) + i * 0.3)) * 12
                            : 4 + Math.abs(Math.sin(i * 0.3)) * 12
                        }px`,
                        opacity: isPlaying ? '1' : '0.4',
                        transform: isPlaying ? 'scaleY(1.1)' : 'scaleY(1)',
                        transition: 'all 0.1s ease'
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/60">
                  {formatDuration(currentTime)} / {audioRef.current?.duration ? formatDuration(Math.floor(audioRef.current.duration)) : '0:00'}
                </span>
              </div>
              <audio 
                ref={audioRef}
                className="hidden" 
                src={message.content}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
                preload="metadata"
              />
            </div>
          )}

          <span className="timestamp">{message.timestamp}</span>
        </div>

        {/* Updated Reactions display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions-display">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <span
                key={emoji}
                className={`reaction-badge backdrop-blur-md ${
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
            className="reaction-picker backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {["👍", "❤️", "😂", "😮", "😢", "👎"].map((emoji) => (
              <span
                key={emoji}
                onClick={() => {
                  handleReact(message.id, emoji);
                  setActiveReactionMessageId(null);
                }}
                className="reaction-emoji  backdrop-blur-md"
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };
  // Handle reaction events
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

  // Emoji Picker
  const onEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
  };
  // GIF Picker
  const handleGifSelect = (gifUrl) => {
    const newMessage = {
      id: Math.random().toString(36).substring(2, 9),
      me: true,
      gif: gifUrl,
      reactions: {},
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
    socket.emit("message", { gif: gifUrl, messageId: newMessage.id });
    setMessages((prev) => [...prev, newMessage]);
  };

  // Close Emoji Picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker &&
        !event.target.closest(".em-emoji-picker") &&
        !event.target.closest('[data-tooltip-id="emoji-tooltip"]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showEmojiPicker]);

  // Paste image from clipboard
  useEffect(() => {
    const handlePaste = (event) => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === "INPUT") {
        const items = (event.clipboardData || event.originalEvent.clipboardData)
          .items;
        for (let item of items) {
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(e.target.result);
            reader.readAsDataURL(file);
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Voice Message Handling
  useEffect(() => {
    socket.on("receiveVoiceMessage", (messageData) => {
      setMessages((prev) => [...prev, {
        id: messageData.messageId,
        type: "audio",
        content: messageData.url,
        me: false,
        senderId: messageData.senderId,
        timestamp: new Date(messageData.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        reactions: {}
      }]);
    });

    return () => {
      socket.off("receiveVoiceMessage");
    };
  }, []);

  const sendVoiceMessage = async (audioBlob) => {
    if (!audioBlob) return console.error("❌ No audio blob to send!");

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      socket.emit("sendVoiceMessage", reader.result, (response) => {
        if (response.success) {
          // console.log("✅ Voice message uploaded:", response.messageData.url);
          setMessages((prev) => [...prev, {
            id: response.messageData.messageId,
            type: "audio",
            content: response.messageData.url,
            me: true,
            senderId: socket.id,
            timestamp: new Date(response.messageData.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            reactions: {}
          }]);
        } else {
          console.error("❌ Failed to upload voice message:", response.error);
        }
      });
    };
  };

  // Add this helper function near your other utility functions
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-500 text-white"
      } h-screen flex flex-col`}
    >
      <header className="flex items-center justify-between p-4 bg-gray-800 dark:bg-gray-800 static">
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
          {darkMode ? (
            <IoMoon className="text-white" />
          ) : (
            <MdOutlineLightMode className="text-white" />
          )}
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
        {connected && partnerTyping && (
          <div className="other-message bg-gray-700 text-white self-start">
            <SyncLoader color="#8f959e" size={3} speedMultiplier={0.5} />
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
                onChange={handleMessageChange}
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
                <IoImageOutline size={22} />
                <Tooltip
                  id="attach-tooltip"
                  place="top"
                  content="Attach Images"
                />
              </label>

              <GifPicker onGifSelect={handleGifSelect} />
              <EmojiPicker
                onEmojiSelect={onEmojiSelect}
                showPicker={showEmojiPicker}
                togglePicker={() => setShowEmojiPicker(!showEmojiPicker)}
              />
            </div>
            <div>
              <VoiceRecorder onSendVoice={sendVoiceMessage} />
            </div>

            {selectedImage && (
              <div className="relative">
                {isSending && (
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-xs bg-opacity-50 rounded-md z-[1]">
                    <ClipLoader color="#d3cfcf" size={17} speedMultiplier={1} />
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
            <IoMdSend className="text-xl" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Home;
