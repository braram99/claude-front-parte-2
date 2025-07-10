// src/components/recording/RecordingControls.jsx
import React from 'react';
import { Mic, Square, Volume2, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '../ui';

const RecordingControls = ({
  speechState,
  currentQuestion,
  apiKeyStatus,
  firebaseConnectionStatus,
  onStartRecording,
  onStopRecording,
  onProcessComplete,
  onPlayQuestion
}) => {
  return (
    <Card className="border-t border-gray-200 rounded-none">
      <div className="space-y-4">
        {/* Current transcript */}
        {speechState.transcript && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-blue-700 font-medium text-sm">🎤 Live Transcript:</p>
            <p className="text-blue-600 text-sm">{speechState.transcript}</p>
          </div>
        )}
        
        {/* Main Controls */}
        <div className="flex items-center space-x-3">
          {/* Play Question */}
          <Button 
            variant="secondary"
            icon={Volume2}
            onClick={() => currentQuestion && onPlayQuestion(currentQuestion.question)}
            disabled={speechState.isRecording || speechState.isProcessing}
            className="p-3"
          />
          
          {/* Main Recording Button */}
          <Button 
            variant={speechState.isRecording ? "danger" : "gradient"}
            size="lg"
            className="flex-1"
            onClick={speechState.isRecording ? onStopRecording : onStartRecording}
            disabled={speechState.isProcessing}
            icon={speechState.isRecording ? Square : speechState.isProcessing ? Loader2 : Mic}
            loading={speechState.isProcessing}
          >
            {speechState.isRecording ? (
              `Parar (${speechState.duration}s)`
            ) : speechState.isProcessing ? (
              'Procesando...'
            ) : (
              '🎤 Hablar'
            )}
          </Button>
          
          {/* Process Button */}
          <Button
            variant="success"
            icon={CheckCircle}
            onClick={onProcessComplete}
            disabled={!speechState.transcript || speechState.isRecording || speechState.isProcessing}
            className="p-3"
          />
        </div>

        {/* Status Indicators */}
        <div className="text-center text-xs">
          {speechState.error && (
            <div className="bg-red-50 p-2 rounded text-red-600 mb-2">
              Error: {speechState.error}
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-4">
            <StatusDot
              active={firebaseConnectionStatus === 'connected'}
              label="Firebase"
              color="green"
            />
            <StatusDot
              active={apiKeyStatus === 'valid'}
              label="AI Real"
              color="blue"
            />
            <StatusDot
              active={speechState.isRecording}
              label="Recording"
              color="red"
              pulse={speechState.isRecording}
            />
            <StatusDot
              active={!!speechState.transcript}
              label="Speech"
              color="green"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

const StatusDot = ({ active, label, color, pulse = false }) => {
  const colors = {
    green: active ? 'bg-green-500' : 'bg-gray-300',
    blue: active ? 'bg-blue-500' : 'bg-gray-300', 
    red: active ? 'bg-red-500' : 'bg-gray-300'
  };

  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-2 ${colors[color]} ${pulse ? 'animate-pulse' : ''}`}></div>
      <span className="text-gray-600">{label}</span>
    </div>
  );
};

export default RecordingControls;
