// src/components/screens/SpeakingScreen.jsx - Refactorizado

import React from 'react';
import Header from '../ui/Header';
import ChatContainer from '../chat/ChatContainer';
import RecordingControls from '../recording/RecordingControls';

const SpeakingScreen = ({ 
  messages, 
  speechState, 
  currentQuestion,
  onHome,
  onNewQuestion,
  onPlayQuestion,
  onPlayAIResponse,
  onPlayRecording,
  onStartRecording,
  onStopRecording
}) => {
  const getSubtitle = () => {
    if (speechState.isRecording) return 'Grabando...';
    if (speechState.isProcessing) return 'IA Analizando...';
    if (speechState.isAISpeaking) return 'IA Respondiendo...';
    return 'Listo para conversación';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <Header
        title="Conversación con IA"
        subtitle={getSubtitle()}
        onHome={onHome}
        onRefresh={onNewQuestion}
        showRefresh={true}
      />

      {/* Chat Container */}
      <ChatContainer
        messages={messages}
        speechState={speechState}
        onPlayQuestion={onPlayQuestion}
        onPlayAIResponse={onPlayAIResponse}
        onPlayRecording={onPlayRecording}
      />

      {/* Recording Controls */}
      <RecordingControls
        speechState={speechState}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onPlayQuestion={onPlayQuestion}
        onNewQuestion={onNewQuestion}
        currentQuestion={currentQuestion}
      />
    </div>
  );
};

export default SpeakingScreen;
