// src/components/chat/MessageBubble.jsx
import React from 'react';
import { Play, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '../ui';

const MessageBubble = ({ 
  message, 
  apiKeyStatus,
  firebaseConnectionStatus,
  onPlayQuestion,
  onPlayRecording 
}) => {
  const isUser = message.type === 'user';
  const isAI = message.type === 'ai';
  const isSystem = message.type === 'system';

  const getAvatar = () => {
    if (isAI && apiKeyStatus === 'valid') return '🤖';
    if (isSystem) return '🔥';
    if (!isUser) return '🎓';
    return null;
  };

  const getBubbleColor = () => {
    if (isUser) return 'bg-blue-500 text-white rounded-tr-none';
    if (isAI) return 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-tl-none';
    if (isSystem) return 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-tl-none';
    return 'bg-white rounded-tl-none';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'items-start'}`}>
      {/* Avatar for non-user messages */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white text-sm ${
          isAI ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 
          isSystem ? 'bg-gradient-to-r from-green-500 to-blue-500' :
          'bg-green-500'
        }`}>
          {getAvatar()}
        </div>
      )}
      
      {/* Message Bubble */}
      <div className={`rounded-lg p-3 shadow-sm max-w-xs ${getBubbleColor()}`}>
        <p className={isUser ? 'text-white' : 'text-gray-800'}>
          {message.content}
        </p>
        
        {/* Play Question Button */}
        {message.hasAudio && message.question && (
          <div className="mt-2">
            <Button 
              size="sm"
              variant="success"
              onClick={() => onPlayQuestion(message.question)}
              icon={Play}
            >
              🔊 Escuchar
            </Button>
          </div>
        )}
        
        {/* AI Response Details */}
        {isAI && message.score && (
          <AIResponseDetails 
            message={message}
            apiKeyStatus={apiKeyStatus}
            firebaseConnectionStatus={firebaseConnectionStatus}
          />
        )}
        
        {/* System Message Details */}
        {isSystem && message.sessionId && (
          <div className="mt-2 text-xs text-green-600">
            ID: {message.sessionId.substring(0, 8)}...
          </div>
        )}
        
        {/* Timestamp */}
        <span className={`text-xs mt-2 block ${
          isUser ? 'text-blue-200' : 
          isAI ? 'text-purple-600' : 
          isSystem ? 'text-green-600' : 'text-gray-500'
        }`}>
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};

const AIResponseDetails = ({ message, apiKeyStatus, firebaseConnectionStatus }) => (
  <div className="mt-3 space-y-2">
    {/* Score Display */}
    <div className="flex items-center justify-between bg-white rounded-lg p-2">
      <div className="flex items-center">
        <CheckCircle size={16} className="text-green-500 mr-2" />
        <span className="text-sm font-medium text-gray-700">
          {apiKeyStatus === 'valid' ? 'AI Real' : 'Práctica'}: {message.score}/100
        </span>
      </div>
      <div className={`px-2 py-1 rounded text-xs font-medium ${
        message.score >= 85 ? 'bg-green-100 text-green-700' :
        message.score >= 70 ? 'bg-blue-100 text-blue-700' :
        'bg-yellow-100 text-yellow-700'
      }`}>
        {message.score >= 85 ? 'Excelente' :
         message.score >= 70 ? 'Muy Bien' : 'Bien'}
      </div>
    </div>
    
    {/* Firebase Status */}
    {message.firebaseStatus && (
      <div className={`text-xs p-2 rounded ${
        message.firebaseStatus === 'connected' 
          ? 'bg-green-50 text-green-700' 
          : 'bg-yellow-50 text-yellow-700'
      }`}>
        {message.firebaseStatus === 'connected' 
          ? '🔥 Guardado en Firebase' 
          : '📱 Guardado localmente'}
      </div>
    )}
    
    {/* Suggestions */}
    {message.suggestions && (
      <div className="bg-white bg-opacity-80 p-2 rounded text-xs">
        <p className="font-medium text-gray-700 mb-1">💡 Sugerencias:</p>
        <ul className="space-y-1">
          {message.suggestions.slice(0, 2).map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-1">•</span>
              <span className="text-gray-700">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Follow-up Question */}
    {message.followUpQuestion && (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded border border-blue-200">
        <p className="text-xs text-blue-600 font-medium">🤔 Pregunta de seguimiento:</p>
        <p className="text-xs text-blue-700">{message.followUpQuestion}</p>
      </div>
    )}
  </div>
);

export default MessageBubble;
