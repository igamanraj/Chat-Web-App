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

      // Initial vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate(200);
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

        // End vibration feedback
        if (navigator.vibrate) {
          navigator.vibrate([50]); // Short vibration to indicate stop
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
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoice(audioBlob);
      handleDelete(); // Reset after sending
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!recordingComplete ? (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`p-2 rounded-full transition-all duration-300 ${
            recording 
              ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50 animate-pulse' 
              : 'bg-blue-100 hover:bg-blue-200'
          }`}
        >
          {recording ? (
            <IoMdMicOff className="text-xl text-white" />
          ) : (
            <IoMdMic className="text-xl text-blue-500" />
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-gray-700/50 p-1 rounded-full">
          <button
            onClick={handleDelete}
            className="p-2 rounded-full text-red-500 hover:bg-red-500/10"
          >
            <IoTrash className="text-xl" />
          </button>
          <span className="text-xs text-white/80 min-w-[40px]">
            {formatDuration(recordingDuration)}
          </span>
          <button
            onClick={handleSend}
            className="p-2 rounded-full text-blue-500 hover:bg-blue-500/10"
          >
            <IoSend className="text-xl" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
