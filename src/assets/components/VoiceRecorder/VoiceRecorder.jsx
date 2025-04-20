import React, { useEffect, useState } from "react";
import { IoMdMic } from "react-icons/io";
import { IoMdMicOff } from "react-icons/io";
import { IoTrash } from "react-icons/io5";
import { IoSend } from "react-icons/io5";

const VoiceRecorder = ({ onSendVoice }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioStream, setAudioStream] = useState(null);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [clickMode, setClickMode] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (durationInterval) {
        clearInterval(durationInterval);
      }
    };
  }, [mediaRecorder, audioStream, durationInterval]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.start(100);
      setMediaRecorder(recorder);
      setAudioStream(stream);
      setRecording(true);
      setRecordingComplete(false);
      setAudioBlob(null);
      setRecordingDuration(0);

      // Start duration counter
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setDurationInterval(interval);

      // Gentle vibration feedback for start
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          setAudioStream(null);
        }

        // Clear duration counter
        if (durationInterval) {
          clearInterval(durationInterval);
        }

        // Gentle vibration feedback for stop
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        setRecording(false);
        setRecordingComplete(true);
        resolve();
      };

      mediaRecorder.stop();
    });
  };

  const handleDelete = () => {
    setAudioChunks([]);
    setRecordingComplete(false);
    setAudioBlob(null);
    setRecordingDuration(0);
    setClickMode(false);
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoice(audioBlob);
      handleDelete();
    }
  };

  const handleMouseDown = () => {
    setIsHolding(true);
    if (!clickMode) {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    if (!clickMode && recording) {
      stopRecording();
    }
  };

  const handleClick = () => {
    if (!isHolding) {
      if (!recording && !recordingComplete) {
        setClickMode(true);
        startRecording();
      } else if (recording && clickMode) {
        stopRecording();
      }
    }
  };

  return (
    <div className="relative">
    {/* Recording controls overlay */}
    {(recording || recordingComplete) && (
      <div className="absolute -top-[140px] right-0 flex flex-col items-center bg-[#1E2939] rounded-4xl p-3 min-w-[40px] shadow-lg backdrop-blur-sm bg-opacity-95">
        <button
          onClick={handleSend}
          className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors duration-200"
        >
          <IoSend className="text-xl text-blue-500" />
        </button>
        <div className="text-white text-sm my-2 font-medium">
          {formatDuration(recordingDuration)}
        </div>
        <button
          onClick={handleDelete}
          className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors duration-200"
        >
          <IoTrash className="text-xl text-red-500" />
        </button>
      </div>
    )}
    
    {/* Mic button */}
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onClick={handleClick}
      className={`p-2 rounded-full transition-all duration-500 ease-in-out transform ${
        recording 
          ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50 animate-[pulse_2s_ease-in-out_infinite]' 
          : 'bg-blue-100 hover:bg-blue-200 hover:scale-105'
      }`}
    >
      {recording ? (
        <IoMdMicOff className="text-xl text-white transition-transform duration-300 ease-in-out" />
      ) : (
        <IoMdMic className="text-xl text-blue-500 transition-transform duration-300 ease-in-out" />
      )}
    </button>
  </div>
);
};

export default VoiceRecorder; 