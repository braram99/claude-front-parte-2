import React, { useEffect } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';
import useAudioRecorder from '../hooks/useAudioRecorder';

const VoiceRecorder = ({ onRecordingComplete, question }) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    cleanup
  } = useAudioRecorder();

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Notify parent when recording is complete
  useEffect(() => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob, audioUrl);
    }
  }, [audioBlob, audioUrl, onRecordingComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-red-600 underline text-sm mt-1"
        >
          Refresh page to try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      {/* Question Display */}
      {question && (
        <div className="mb-6 text-center">
          <p className="text-gray-600 mb-2">Answer this question:</p>
          <p className="text-lg font-medium text-gray-800">"{question}"</p>
        </div>
      )}

      {/* Recording Controls */}
      <div className="text-center">
        {!isRecording && !audioUrl && (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-full shadow-lg transition-all transform hover:scale-105"
          >
            <Mic size={32} />
          </button>
        )}

        {isRecording && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xl font-mono text-red-600">{formatTime(duration)}</span>
            </div>
            
            <button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-all"
            >
              <Square size={24} />
            </button>
            
            <p className="text-sm text-gray-600">Recording... Tap to stop</p>
          </div>
        )}

        {audioUrl && (
          <div className="space-y-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-green-700 font-medium mb-2">✅ Recording Complete!</p>
              <p className="text-sm text-gray-600">Duration: {formatTime(duration)}</p>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <audio controls className="flex-1 max-w-sm">
                <source src={audioUrl} type="audio/webm" />
                Your browser does not support audio playback.
              </audio>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={clearRecording}
                className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Trash2 size={16} />
                <span>Record Again</span>
              </button>
              
              <button
                onClick={startRecording}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Mic size={16} />
                <span>New Recording</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          💡 Tip: Speak clearly and in a quiet environment for best results
        </p>
      </div>
    </div>
  );
};

export default VoiceRecorder;