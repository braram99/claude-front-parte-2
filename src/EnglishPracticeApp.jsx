// src/EnglishPracticeApp.jsx - VERSIÓN CORREGIDA COMPLETA CON FIREBASE

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, RotateCcw, Square, Loader2, CheckCircle, AlertTriangle, Settings, Database, User, Wifi, WifiOff } from 'lucide-react';

// Hooks y servicios
import useProgress from './hooks/useProgress';
import questionsService from './services/questionsService';

// 🔐 CONFIGURACIÓN SEGURA DE API KEY
const getApiKey = () => {
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (envKey && envKey !== 'tu-api-key-real-aqui') {
    console.log('✅ Using API key from environment variables');
    return envKey;
  }
  
  const localKey = localStorage.getItem('openrouter_api_key');
  if (localKey) {
    console.log('✅ Using API key from localStorage');
    return localKey;
  }
  
  console.warn('⚠️ No valid API key found');
  return null;
};

// 🤖 REAL AI Service
const realAIService = {
  async analyzeAndRespond(question, transcript, apiKey) {
    console.log('🤖 REAL AI analyzing:', { question, transcript, hasApiKey: !!apiKey });
    
    if (!apiKey) {
      throw new Error('API_KEY_MISSING');
    }

    const cleanTranscript = transcript.trim();
    if (!cleanTranscript || cleanTranscript.length < 3) {
      return this.getFallbackResponse('EMPTY_TRANSCRIPT');
    }

    try {
      const requestPayload = {
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: `You are an encouraging English conversation teacher. The student answered a question and you need to provide helpful feedback. Always respond in JSON format:

{
  "encouragement": "positive message about their English",
  "score": number between 1-100,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "confidence": decimal 0-1,
  "mood": "encouraging/supportive/enthusiastic",
  "audioText": "what to say out loud",
  "followUpQuestion": "a follow-up question"
}`
          },
          {
            role: "user", 
            content: `Question: "${question}"
Student Response: "${transcript}"

Please evaluate and respond with encouraging feedback in JSON format.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'English Practice App'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API_KEY_INVALID');
        } else if (response.status === 429) {
          throw new Error('RATE_LIMIT_EXCEEDED');
        } else {
          throw new Error('SERVER_ERROR');
        }
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content;

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiContent);
      } catch (parseError) {
        const jsonMatch = aiContent.match(/\{.*\}/s);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('INVALID_JSON_RESPONSE');
        }
      }

      return parsedResponse;

    } catch (error) {
      console.error('❌ REAL AI Error:', error);
      throw error;
    }
  },

  getFallbackResponse(errorType) {
    const fallbacks = {
      'EMPTY_TRANSCRIPT': {
        encouragement: "I couldn't hear you clearly. Try speaking closer to the microphone.",
        score: 25,
        suggestions: ['Speak closer to microphone', 'Speak more slowly'],
        confidence: 0.1,
        mood: 'supportive',
        audioText: "I couldn't hear you clearly. Could you try again?",
        followUpQuestion: "Would you like to try speaking again?"
      },
      'API_KEY_MISSING': {
        encouragement: "No API key configured. Using practice mode.",
        score: 60,
        suggestions: ['Configure your OpenRouter API key'],
        confidence: 0.5,
        mood: 'supportive',
        audioText: "API key needed for full AI analysis. This is practice mode.",
        followUpQuestion: "Would you like to continue practicing?"
      }
    };

    return fallbacks[errorType] || fallbacks['EMPTY_TRANSCRIPT'];
  }
};

// 🎤 Hook de voice recording + recognition
const useSimpleVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [apiKeyStatus, setApiKeyStatus] = useState('unknown');
  
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const apiKey = getApiKey();
    setApiKeyStatus(apiKey ? 'valid' : 'missing');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = () => {};
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onresult = (event) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart;
            } else {
              interimTranscript += transcriptPart;
            }
          }
          
          setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
          setError(`Speech error: ${event.error}`);
        };

        recognition.start();
      }

    } catch (err) {
      setError('Could not access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
  }, [isRecording]);

  const processWithAI = useCallback(async (question) => {
    if (!transcript || transcript.trim().length === 0) {
      setError('No transcript available');
      return null;
    }

    setIsProcessing(true);

    try {
      const apiKey = getApiKey();
      
      if (!apiKey) {
        const fallbackResult = realAIService.getFallbackResponse('API_KEY_MISSING');
        const words = transcript.trim().split(' ').length;
        fallbackResult.score = Math.min(90, 40 + (words * 8) + Math.round(Math.random() * 20));
        return fallbackResult;
      }

      const result = await realAIService.analyzeAndRespond(question, transcript, apiKey);
      
      if ('speechSynthesis' in window && result.audioText) {
        const utterance = new SpeechSynthesisUtterance(result.audioText);
        utterance.rate = 0.9;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
      
      return result;
      
    } catch (error) {
      const fallbackResult = realAIService.getFallbackResponse('SERVER_ERROR');
      const words = transcript.trim().split(' ').length;
      fallbackResult.score = Math.min(90, 40 + (words * 8) + Math.round(Math.random() * 20));
      return fallbackResult;
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, apiKeyStatus]);

  const reset = useCallback(() => {
    setTranscript('');
    setDuration(0);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    duration,
    error,
    apiKeyStatus,
    startRecording,
    stopRecording,
    processWithAI,
    reset
  };
};

// 🚨 Componente de configuración de API Key
const ApiKeyConfig = ({ onClose }) => {
  const [tempKey, setTempKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = () => {
    if (tempKey.trim()) {
      localStorage.setItem('openrouter_api_key', tempKey.trim());
      setTestResult({ success: true, message: 'API key saved successfully!' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleTest = async () => {
    if (!tempKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setTesting(true);
    try {
      await realAIService.analyzeAndRespond("Test question", "This is a test", tempKey.trim());
      setTestResult({ success: true, message: 'API key works! ✅' });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `API key failed: ${error.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🔐 Configure OpenRouter API</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.message}
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={handleTest}
              disabled={testing || !tempKey.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white p-3 rounded-lg transition-colors"
            >
              {testing ? 'Testing...' : '🧪 Test API Key'}
            </button>
            
            <button
              onClick={handleSave}
              disabled={!tempKey.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white p-3 rounded-lg transition-colors"
            >
              💾 Save API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🚨 COMPONENTE PRINCIPAL CON FIREBASE
const EnglishPracticeApp = ({ 
  firebaseUser, 
  firebaseConnectionStatus, 
  onPracticeComplete,
  firebaseStats 
}) => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showApiConfig, setShowApiConfig] = useState(false);
  
  const voice = useSimpleVoice();
  const { progress, recordAnswer } = useProgress();

  useEffect(() => {
    if (!currentQuestion) {
      const question = questionsService.getNextQuestion();
      setCurrentQuestion(question);
      initializeChat(question);
    }
  }, [currentQuestion]);

  const initializeChat = (question) => {
    const apiStatus = voice.apiKeyStatus === 'valid' ? 'AI real activo' : 'Modo práctica';
    const firebaseStatus = firebaseConnectionStatus === 'connected' ? '+ Firebase activo' : '+ Local storage';
    
    const welcomeMessages = [
      {
        id: 1,
        type: 'bot',
        content: `¡Hola! 👋 ${apiStatus} ${firebaseStatus}. Vamos a practicar inglés conversacional.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        apiStatus: voice.apiKeyStatus,
        firebaseStatus: firebaseConnectionStatus
      },
      {
        id: 2,
        type: 'bot',
        content: `Pregunta: "${question.question}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        question: question.question,
        hasAudio: true
      }
    ];
    
    setMessages(welcomeMessages);
  };

  const handleVoiceComplete = async () => {
    if (!voice.transcript || voice.transcript.trim().length === 0) {
      console.warn('⚠️ No transcript available');
      return;
    }

    try {
      const aiResult = await voice.processWithAI(currentQuestion.question);
      
      if (aiResult) {
        const userMessage = {
          id: Date.now(),
          type: 'user',
          content: voice.transcript,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: voice.duration
        };

        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: aiResult.encouragement,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          score: aiResult.score,
          suggestions: aiResult.suggestions,
          followUpQuestion: aiResult.followUpQuestion,
          mood: aiResult.mood,
          apiKeyStatus: voice.apiKeyStatus,
          firebaseStatus: firebaseConnectionStatus
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);

        // Guardar en Firebase si está disponible
        if (onPracticeComplete && firebaseConnectionStatus === 'connected') {
          const practiceData = {
            question: currentQuestion.question,
            userResponse: voice.transcript,
            transcript: voice.transcript,
            aiResponse: aiResult,
            duration: voice.duration,
            level: currentQuestion.level || 'beginner',
            category: currentQuestion.category || 'general',
            score: aiResult.score
          };

          try {
            const saveResult = await onPracticeComplete(practiceData);
            if (saveResult.success) {
              const successMessage = {
                id: Date.now() + 2,
                type: 'system',
                content: '🔥 Conversación guardada en Firebase',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sessionId: saveResult.sessionId
              };
              setMessages(prev => [...prev, successMessage]);
            }
          } catch (firebaseError) {
            console.error('❌ Firebase error:', firebaseError);
          }
        } else if (firebaseConnectionStatus !== 'connected') {
          const localMessage = {
            id: Date.now() + 2,
            type: 'system',
            content: '📱 Datos guardados localmente',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, localMessage]);
        }

        recordAnswer({
          ...currentQuestion,
          userResponse: voice.transcript,
          aiResponse: aiResult
        });
      }
    } catch (error) {
      console.error('❌ Voice processing error:', error);
    }
  };

  const getNewQuestion = () => {
    voice.reset();
    const question = questionsService.getNextQuestion();
    setCurrentQuestion(question);
    
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      content: `Nueva pregunta: "${question.question}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      question: question.question,
      hasAudio: true
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const playQuestion = (question) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.8;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🏠 HOME SCREEN
  const HomeScreen = () => {
    const safeProgress = {
      ...progress,
      todayProgress: Math.min(progress.todayProgress || 0, progress.dailyGoal || 5),
      completionRate: Math.min(100, Math.max(0, 
        progress.dailyGoal > 0 
          ? Math.round(((progress.todayProgress || 0) / (progress.dailyGoal || 5)) * 100)
          : 0
      ))
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">👋 ¡Hola!</h1>
            <p className="text-gray-600">Practica con IA conversacional + Firebase</p>
            
            {/* Firebase Status */}
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              firebaseConnectionStatus === 'connected' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : firebaseConnectionStatus === 'error'
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    firebaseConnectionStatus === 'connected' ? 'bg-green-500' :
                    firebaseConnectionStatus === 'error' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <span>
                    {firebaseConnectionStatus === 'connected' ? '🔥 Firebase Activo' :
                     firebaseConnectionStatus === 'error' ? '📱 Modo Local' :
                     '🔄 Conectando Firebase...'}
                  </span>
                </div>
                <button
                  onClick={() => setShowApiConfig(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Settings size={16} />
                </button>
              </div>
              
              {/* Firebase Stats */}
              {firebaseStats && firebaseConnectionStatus === 'connected' && (
                <div className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>Total guardado:</span>
                    <span>{firebaseStats.totalSessions || 0} sesiones</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Promedio:</span>
                    <span>{firebaseStats.averageScore || 0}% score</span>
                  </div>
                </div>
              )}
              
              {/* Usuario Firebase */}
              {firebaseUser && (
                <div className="mt-2 text-xs">
                  <div className="flex items-center">
                    <User size={12} className="mr-1" />
                    <span>ID: {firebaseUser.uid.substring(0, 8)}...{firebaseUser.isAnonymous ? ' (Anónimo)' : ''}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progreso local */}
            <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Progreso de Hoy</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${safeProgress.completionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {safeProgress.todayProgress}/{safeProgress.dailyGoal}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setCurrentScreen('speaking')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Mic className="mx-auto mb-2" size={32} />
              <span className="text-xl font-semibold">🤖 Conversación con IA</span>
              <p className="text-sm text-blue-100 mt-1">
                {voice.apiKeyStatus === 'valid' ? 'AI real' : 'Modo práctica'} 
                {' + '}
                {firebaseConnectionStatus === 'connected' ? 'Firebase activo' : 'Local storage'}
              </p>
            </button>

            <button 
              onClick={() => setCurrentScreen('listening')}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Headphones className="mx-auto mb-2" size={32} />
              <span className="text-xl font-semibold">🎧 Escuchar y Repetir</span>
              <p className="text-sm text-green-100 mt-1">Práctica de pronunciación</p>
            </button>

            <button 
              onClick={() => setCurrentScreen('progress')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <BarChart3 className="mx-auto mb-2" size={32} />
              <span className="text-xl font-semibold">📊 Mi Progreso</span>
              <p className="text-sm text-purple-100 mt-1">Estadísticas y logros</p>
            </button>
          </div>

          {/* API Key Setup Prompt */}
          {voice.apiKeyStatus !== 'valid' && (
            <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="flex items-start">
                <AlertTriangle className="text-blue-500 mr-3 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 mb-1">🚀 Activa el AI Real</p>
                  <p className="text-xs text-gray-600 mb-3">
                    Configura tu API key de OpenRouter para análisis inteligente completo
                  </p>
                  <button
                    onClick={() => setShowApiConfig(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Configurar API Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 🎙️ SPEAKING SCREEN
  const SpeakingScreen = () => (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setCurrentScreen('home')}
              className="p-2 hover:bg-blue-700 rounded-full mr-3"
            >
              <Home size={20} />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                {voice.apiKeyStatus === 'valid' ? '🤖' : '📝'}
              </div>
              <div>
                <h2 className="font-semibold">
                  {voice.apiKeyStatus === 'valid' ? 'Conversación con AI Real' : 'Modo Práctica'}
                </h2>
                <p className="text-sm text-blue-200">
                  {voice.isRecording ? `Grabando... (${voice.duration}s)` : 
                   voice.isProcessing ? 'Analizando...' : 
                   firebaseConnectionStatus === 'connected' ? '🔥 Firebase + AI activo' : 
                   voice.apiKeyStatus === 'valid' ? 'AI real activo' : 'Sin API key'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className={`px-2 py-1 rounded text-xs ${
              firebaseConnectionStatus === 'connected' 
                ? 'bg-green-500 bg-opacity-20 text-green-100' 
                : firebaseConnectionStatus === 'error'
                ? 'bg-yellow-500 bg-opacity-20 text-yellow-100'
                : 'bg-blue-500 bg-opacity-20 text-blue-100'
            }`}>
              {firebaseConnectionStatus === 'connected' ? '🔥 DB' : 
               firebaseConnectionStatus === 'error' ? '📱 Local' : '🔄 Sync'}
            </div>
            <button
              onClick={() => setShowApiConfig(true)}
              className="p-2 hover:bg-blue-700 rounded-full"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={getNewQuestion}
              className="p-2 hover:bg-blue-700 rounded-full"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'items-start'}`}>
            {(message.type === 'bot' || message.type === 'ai' || message.type === 'system') && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white text-sm ${
                message.type === 'ai' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 
                message.type === 'system' ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                'bg-green-500'
              }`}>
                {message.type === 'ai' && message.apiKeyStatus === 'valid' ? '🤖' : 
                 message.type === 'system' ? '🔥' : '🎓'}
              </div>
            )}
            
            <div className={`rounded-lg p-3 shadow-sm max-w-xs ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white rounded-tr-none' 
                : message.type === 'ai'
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-tl-none'
                : message.type === 'system'
                ? 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-tl-none'
                : 'bg-white rounded-tl-none'
            }`}>
              <p className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                {message.content}
              </p>
              
              {/* Play Question Button */}
              {message.hasAudio && message.question && (
                <div className="mt-2">
                  <button 
                    onClick={() => playQuestion(message.question)}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                  >
                    <Play size={16} />
                  </button>
                  <span className="ml-2 text-xs text-gray-600">🔊 Escuchar</span>
                </div>
              )}
              
              {/* AI Response Details */}
              {message.type === 'ai' && message.score && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between bg-white rounded-lg p-2">
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {message.apiKeyStatus === 'valid' ? 'AI Real' : 'Práctica'}: {message.score}/100
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
                  
                  {/* Firebase Status in AI Response */}
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

                  {message.followUpQuestion && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">🤔 Pregunta de seguimiento:</p>
                      <p className="text-xs text-blue-700">{message.followUpQuestion}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* System Message Details */}
              {message.type === 'system' && message.sessionId && (
                <div className="mt-2 text-xs text-green-600">
                  ID: {message.sessionId.substring(0, 8)}...
                </div>
              )}
              
              <span className={`text-xs mt-2 block ${
                message.type === 'user' ? 'text-blue-200' : 
                message.type === 'ai' ? 'text-purple-600' : 
                message.type === 'system' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {message.timestamp}
              </span>
            </div>
          </div>
        ))}
        
        {/* Processing Indicator */}
        {voice.isProcessing && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
              {voice.apiKeyStatus === 'valid' ? '🤖' : '📝'}
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg rounded-tl-none p-3 shadow-sm border border-blue-200">
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-gray-700">
                  {voice.apiKeyStatus === 'valid' ? 'AI real analizando...' : 'Analizando en modo práctica...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div className="bg-white border-t p-4">
        <div className="space-y-4">
          {/* Current transcript */}
          {voice.transcript && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-700 font-medium text-sm">🎤 Live Transcript:</p>
              <p className="text-blue-600 text-sm">{voice.transcript}</p>
            </div>
          )}
          
          {/* Main button */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => currentQuestion && playQuestion(currentQuestion.question)}
              disabled={voice.isRecording || voice.isProcessing}
              className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 p-3 rounded-full"
            >
              <Volume2 size={20} className="text-gray-600" />
            </button>
            
            <button 
              onClick={voice.isRecording ? voice.stopRecording : voice.startRecording}
              disabled={voice.isProcessing}
              className={`p-3 rounded-full flex-1 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 ${
                voice.isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              }`}
            >
              {voice.isRecording ? (
                <>
                  <Square size={20} />
                  <span>Parar ({voice.duration}s)</span>
                </>
              ) : voice.isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Mic size={20} />
                  <span>🎤 Hablar</span>
                </>
              )}
            </button>
            
            <button 
              onClick={handleVoiceComplete}
              disabled={!voice.transcript || voice.isRecording || voice.isProcessing}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-300 text-white p-3 rounded-full"
            >
              <CheckCircle size={20} />
            </button>
          </div>

          {/* Status */}
          <div className="text-center text-xs">
            {voice.error && (
              <div className="bg-red-50 p-2 rounded text-red-600 mb-2">
                Error: {voice.error}
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  firebaseConnectionStatus === 'connected' ? 'bg-green-500' : 
                  firebaseConnectionStatus === 'error' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-gray-600">
                  {firebaseConnectionStatus === 'connected' ? 'Firebase' : 
                   firebaseConnectionStatus === 'error' ? 'Local' : 'Syncing'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  voice.apiKeyStatus === 'valid' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-gray-600">
                  {voice.apiKeyStatus === 'valid' ? 'AI Real' : 'Practice'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">Recording</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.transcript ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">Speech</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 🎧 LISTENING SCREEN
  const ListeningScreen = () => (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-lg bg-white shadow-md">
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">🎧 Escuchar y Repetir</h2>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Próximamente</h3>
          <p className="text-gray-600 mb-4">
            Esta sección estará disponible pronto con ejercicios de escucha y pronunciación.
          </p>
          <button 
            onClick={() => setCurrentScreen('speaking')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            🤖 Probar Conversación
          </button>
        </div>
      </div>
    </div>
  );

  // 📊 PROGRESS SCREEN
  const ProgressScreen = () => {
    const safeProgress = {
      ...progress,
      todayProgress: Math.min(progress.todayProgress || 0, progress.dailyGoal || 5),
      completionRate: Math.min(100, Math.max(0, 
        progress.dailyGoal > 0 
          ? Math.round(((progress.todayProgress || 0) / (progress.dailyGoal || 5)) * 100)
          : 0
      ))
    };

    return (
      <div className="min-h-screen bg-purple-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
            <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-lg bg-white shadow-md">
              <Home size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 ml-4">📊 Mi Progreso</h2>
          </div>
          
          <div className="space-y-4">
            {/* Firebase Data Card */}
            {firebaseConnectionStatus === 'connected' && firebaseStats && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 shadow-lg border border-green-200">
                <h3 className="text-lg font-semibold mb-4 text-center flex items-center justify-center">
                  <Database size={20} className="mr-2" />
                  🔥 Datos Firebase
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{firebaseStats.totalSessions || 0}</p>
                    <p className="text-sm text-gray-600">Sesiones en DB</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{firebaseStats.averageScore || 0}%</p>
                    <p className="text-sm text-gray-600">Promedio Total</p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-green-700">✅ Datos sincronizados con la nube</p>
                  {firebaseStats.totalQuestions && (
                    <p className="text-xs text-gray-600">
                      Total: {firebaseStats.totalQuestions} preguntas respondidas
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Estadísticas locales */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">
                📱 Progreso Local {firebaseConnectionStatus === 'connected' ? '+ Firebase' : '(Solo Local)'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{safeProgress.todayProgress}</p>
                  <p className="text-sm text-gray-600">Conversaciones Hoy</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{safeProgress.currentStreak}</p>
                  <p className="text-sm text-gray-600">Días Seguidos</p>
                </div>
              </div>
            </div>
            
            {/* Firebase Status Card */}
            <div className={`rounded-xl p-6 shadow-lg border ${
              firebaseConnectionStatus === 'connected' 
                ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                : firebaseConnectionStatus === 'error'
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
            }`}>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                {firebaseConnectionStatus === 'connected' ? '🔥 Firebase Activo' : 
                 firebaseConnectionStatus === 'error' ? '📱 Modo Local' : 
                 '🔄 Conectando...'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    firebaseConnectionStatus === 'connected' ? 'bg-green-500' : 
                    firebaseConnectionStatus === 'error' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-gray-700">
                    {firebaseConnectionStatus === 'connected' 
                      ? 'Datos guardados en la nube automáticamente' 
                      : firebaseConnectionStatus === 'error'
                      ? 'Datos guardados localmente (se sincronizarán)' 
                      : 'Estableciendo conexión con Firebase...'
                    }
                  </span>
                </div>
                
                {firebaseUser && (
                  <div className="flex items-center text-sm">
                    <User size={14} className="mr-3 text-gray-500" />
                    <span className="text-gray-700">
                      Usuario: {firebaseUser.uid.substring(0, 12)}...
                      {firebaseUser.isAnonymous && ' (Anónimo)'}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-gray-700">Reconocimiento de voz activo</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                  <span className="text-gray-700">
                    {voice.apiKeyStatus === 'valid' ? 'IA Claude 3.5 Sonnet activa' : 'Modo práctica activo'}
                  </span>
                </div>
                
                {/* Enlaces a Firebase Console */}
                {firebaseConnectionStatus === 'connected' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">🔗 Ver en Firebase:</p>
                    <div className="space-y-1">
                      <a 
                        href="https://console.firebase.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block"
                      >
                        📊 Ver sesiones guardadas
                      </a>
                      <a 
                        href="https://console.firebase.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block"
                      >
                        👤 Ver usuarios registrados
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Screen
  const renderScreen = () => {
    switch(currentScreen) {
      case 'home': return <HomeScreen />;
      case 'speaking': return <SpeakingScreen />;
      case 'listening': return <ListeningScreen />;
      case 'progress': return <ProgressScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <>
      {renderScreen()}
      {showApiConfig && <ApiKeyConfig onClose={() => setShowApiConfig(false)} />}
    </>
  );
};

export default EnglishPracticeApp;