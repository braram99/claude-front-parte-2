// src/EnglishPracticeApp.jsx - FIXED VERSION CON API KEY CORRECTA

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, RotateCcw, Square, Loader2, CheckCircle, AlertTriangle, Settings } from 'lucide-react';

// Hooks y servicios
import useProgress from './hooks/useProgress';
import questionsService from './services/questionsService';

// 🔐 CONFIGURACIÓN SEGURA DE API KEY
const getApiKey = () => {
  // 1. Intentar desde variables de entorno (RECOMENDADO)
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (envKey && envKey !== 'tu-api-key-real-aqui') {
    console.log('✅ Using API key from environment variables');
    return envKey;
  }
  
  // 2. Fallback desde localStorage (para testing)
  const localKey = localStorage.getItem('openrouter_api_key');
  if (localKey) {
    console.log('✅ Using API key from localStorage');
    return localKey;
  }
  
  // 3. No hay API key válida
  console.warn('⚠️ No valid API key found');
  return null;
};

// 🤖 REAL AI Service - MEJORADO con manejo de errores
const realAIService = {
  async analyzeAndRespond(question, transcript, apiKey) {
    console.log('🤖 REAL AI analyzing:', { question, transcript, hasApiKey: !!apiKey });
    
    // Validaciones iniciales
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

      console.log('📤 Sending request to OpenRouter...');

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

      console.log('📥 OpenRouter response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Errores específicos
        if (response.status === 401) {
          throw new Error('API_KEY_INVALID');
        } else if (response.status === 429) {
          throw new Error('RATE_LIMIT_EXCEEDED');
        } else if (response.status >= 500) {
          throw new Error('SERVER_ERROR');
        } else {
          throw new Error(`API_ERROR_${response.status}`);
        }
      }

      const data = await response.json();
      console.log('✅ OpenRouter response received:', data);

      const aiContent = data.choices[0].message.content;

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiContent);
      } catch (parseError) {
        console.warn('⚠️ JSON parse failed, trying to extract...');
        const jsonMatch = aiContent.match(/\{.*\}/s);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('INVALID_JSON_RESPONSE');
        }
      }

      console.log('✅ Parsed AI response:', parsedResponse);
      return parsedResponse;

    } catch (error) {
      console.error('❌ REAL AI Error:', error);
      throw error;
    }
  },

  // 🔄 Respuestas de fallback para errores
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
        suggestions: ['Configure your OpenRouter API key', 'Check environment variables'],
        confidence: 0.5,
        mood: 'supportive',
        audioText: "API key needed for full AI analysis. This is practice mode.",
        followUpQuestion: "Would you like to continue practicing?"
      },
      'API_KEY_INVALID': {
        encouragement: "API key invalid. Using practice mode.",
        score: 60,
        suggestions: ['Check your API key', 'Verify OpenRouter account'],
        confidence: 0.5,
        mood: 'supportive',
        audioText: "API key needs verification. Continuing in practice mode.",
        followUpQuestion: "Let's continue practicing anyway!"
      },
      'RATE_LIMIT_EXCEEDED': {
        encouragement: "Rate limit reached. You're practicing a lot today!",
        score: 70,
        suggestions: ['Take a short break', 'Try again in a few minutes'],
        confidence: 0.6,
        mood: 'encouraging',
        audioText: "You've been practicing a lot! Take a quick break.",
        followUpQuestion: "Ready to continue after a short break?"
      },
      'SERVER_ERROR': {
        encouragement: "Server temporarily unavailable. Your practice continues!",
        score: 65,
        suggestions: ['Try again later', 'Continue practicing'],
        confidence: 0.5,
        mood: 'supportive',
        audioText: "Technical issue, but your practice is valuable!",
        followUpQuestion: "Let's keep practicing anyway!"
      }
    };

    return fallbacks[errorType] || fallbacks['EMPTY_TRANSCRIPT'];
  }
};

// 🎤 Hook de voice recording + recognition MEJORADO
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

  // 🔍 Verificar API key al inicializar
  useEffect(() => {
    const apiKey = getApiKey();
    if (apiKey) {
      setApiKeyStatus('valid');
      console.log('✅ API key detected');
    } else {
      setApiKeyStatus('missing');
      console.warn('⚠️ No API key found - will use fallback mode');
    }
  }, []);

  // Start recording + recognition
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      console.log('🎙️ Starting recording + recognition...');

      // 1. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Start recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        console.log('🎙️ Recording stopped');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // 3. Start timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // 4. Start speech recognition
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
          console.log('📝 Current transcript:', finalTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
          console.error('🚨 Speech recognition error:', event.error);
          setError(`Speech error: ${event.error}`);
        };

        recognition.start();
        console.log('🎤 Speech recognition started');
      } else {
        console.warn('⚠️ Speech recognition not supported');
        setError('Speech recognition not supported in this browser');
      }

    } catch (err) {
      console.error('❌ Recording error:', err);
      setError('Could not access microphone');
    }
  }, []);

  // Stop recording + recognition
  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping recording + recognition...');
    
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

  // Process with REAL AI o fallback
  const processWithAI = useCallback(async (question) => {
    if (!transcript || transcript.trim().length === 0) {
      setError('No transcript available');
      return null;
    }

    setIsProcessing(true);
    console.log('🤖 Processing with AI:', { question, transcript, apiKeyStatus });

    try {
      const apiKey = getApiKey();
      
      if (!apiKey) {
        console.log('📝 No API key - using fallback mode');
        const fallbackResult = realAIService.getFallbackResponse('API_KEY_MISSING');
        
        // Añadir variación al score para simular análisis
        const words = transcript.trim().split(' ').length;
        fallbackResult.score = Math.min(90, 40 + (words * 8) + Math.round(Math.random() * 20));
        
        return fallbackResult;
      }

      const result = await realAIService.analyzeAndRespond(question, transcript, apiKey);
      console.log('✅ AI result:', result);
      
      // Speak the response if available
      if ('speechSynthesis' in window && result.audioText) {
        const utterance = new SpeechSynthesisUtterance(result.audioText);
        utterance.rate = 0.9;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ AI processing error:', error);
      
      // Manejo específico de errores
      let fallbackResult;
      if (error.message.includes('API_KEY_INVALID')) {
        fallbackResult = realAIService.getFallbackResponse('API_KEY_INVALID');
        setApiKeyStatus('invalid');
      } else if (error.message.includes('RATE_LIMIT')) {
        fallbackResult = realAIService.getFallbackResponse('RATE_LIMIT_EXCEEDED');
      } else {
        fallbackResult = realAIService.getFallbackResponse('SERVER_ERROR');
      }
      
      // Mantener un score razonable basado en el transcript
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

// 🚨 COMPONENTE DE CONFIGURACIÓN DE API KEY
const ApiKeyConfig = ({ onClose }) => {
  const [tempKey, setTempKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = () => {
    if (tempKey.trim()) {
      localStorage.setItem('openrouter_api_key', tempKey.trim());
      console.log('✅ API key saved to localStorage');
      setTestResult({ success: true, message: 'API key saved successfully!' });
      setTimeout(() => {
        window.location.reload(); // Recargar para aplicar cambios
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
      const testResult = await realAIService.analyzeAndRespond(
        "Test question", 
        "This is a test", 
        tempKey.trim()
      );
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 mb-2">
              <strong>📋 Cómo obtener tu API Key:</strong>
            </p>
            <ol className="text-xs text-blue-700 space-y-1">
              <li>1. Ve a <a href="https://openrouter.ai/" target="_blank" className="underline">openrouter.ai</a></li>
              <li>2. Crea una cuenta gratuita</li>
              <li>3. Ve a "Keys" en tu dashboard</li>
              <li>4. Crea una nueva API key</li>
              <li>5. Copia y pega aquí</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🚨 IMPORTANTE: El componente principal DEBE estar aquí
const EnglishPracticeApp = () => {
  // 🔐 HOOKS DENTRO DEL COMPONENTE
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showApiConfig, setShowApiConfig] = useState(false);
  
  const voice = useSimpleVoice();
  const { progress, recordAnswer } = useProgress();

  // Initialize question
  useEffect(() => {
    if (!currentQuestion) {
      const question = questionsService.getNextQuestion();
      setCurrentQuestion(question);
      initializeChat(question);
    }
  }, [currentQuestion]);

  const initializeChat = (question) => {
    const apiStatus = voice.apiKeyStatus === 'valid' ? 'AI real activo' : 'Modo práctica (sin API key)';
    
    const welcomeMessages = [
      {
        id: 1,
        type: 'bot',
        content: `¡Hola! 👋 ${apiStatus}. Vamos a practicar inglés conversacional.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        apiStatus: voice.apiKeyStatus
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

  // Handle voice processing
  const handleVoiceComplete = async () => {
    if (!voice.transcript || voice.transcript.trim().length === 0) {
      console.warn('⚠️ No transcript available');
      return;
    }

    console.log('🎯 Processing voice response:', voice.transcript);

    try {
      const aiResult = await voice.processWithAI(currentQuestion.question);
      
      if (aiResult) {
        // Add user message
        const userMessage = {
          id: Date.now(),
          type: 'user',
          content: voice.transcript,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: voice.duration
        };

        // Add AI response
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: aiResult.encouragement,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          score: aiResult.score,
          suggestions: aiResult.suggestions,
          followUpQuestion: aiResult.followUpQuestion,
          mood: aiResult.mood,
          apiKeyStatus: voice.apiKeyStatus
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);

        // Record progress
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
            <p className="text-gray-600">Practica con AI conversacional</p>
            
            {/* API Status */}
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              voice.apiKeyStatus === 'valid' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : voice.apiKeyStatus === 'invalid'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    voice.apiKeyStatus === 'valid' ? 'bg-green-500' :
                    voice.apiKeyStatus === 'invalid' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span>
                    {voice.apiKeyStatus === 'valid' ? '🤖 AI Real Activo' :
                     voice.apiKeyStatus === 'invalid' ? '❌ API Key Inválida' :
                     '⚠️ Sin API Key - Modo Práctica'}
                  </span>
                </div>
                <button
                  onClick={() => setShowApiConfig(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
            
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
                {voice.apiKeyStatus === 'valid' ? 'AI real activo' : 'Modo práctica sin API key'}
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
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    🚀 Activa el AI Real
                  </p>
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

  // 🎙️ SPEAKING SCREEN (sin cambios, solo añadir indicadores de API status)
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
                   voice.apiKeyStatus === 'valid' ? 'AI real activo' : 'Sin API key'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
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
            {(message.type === 'bot' || message.type === 'ai') && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white text-sm ${
                message.type === 'ai' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-green-500'
              }`}>
                {message.type === 'ai' && message.apiKeyStatus === 'valid' ? '🤖' : '🎓'}
              </div>
            )}
            
            <div className={`rounded-lg p-3 shadow-sm max-w-xs ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white rounded-tr-none' 
                : message.type === 'ai'
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-tl-none'
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
              
              <span className={`text-xs mt-2 block ${
                message.type === 'user' ? 'text-blue-200' : 
                message.type === 'ai' ? 'text-purple-600' : 'text-gray-500'
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
                  voice.apiKeyStatus === 'valid' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-gray-600">
                  {voice.apiKeyStatus === 'valid' ? 'AI Real' : 'Modo Práctica'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">Recording</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.transcript ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">Recognition</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">Processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 🎧 LISTENING SCREEN (sin cambios)
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

  // 📊 PROGRESS SCREEN (sin cambios)
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
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Estadísticas {voice.apiKeyStatus === 'valid' ? 'con AI Real' : 'en Modo Práctica'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{safeProgress.todayProgress}</p>
                  <p className="text-sm text-gray-600">Conversaciones</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{safeProgress.currentStreak}</p>
                  <p className="text-sm text-gray-600">Días Seguidos</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-6 shadow-lg border ${
              voice.apiKeyStatus === 'valid' 
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
            }`}>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                {voice.apiKeyStatus === 'valid' ? '🤖 AI Real Activo' : '📝 Modo Práctica'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    voice.apiKeyStatus === 'valid' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-gray-700">
                    {voice.apiKeyStatus === 'valid' 
                      ? 'Análisis inteligente con Claude 3.5' 
                      : 'Práctica sin límites'
                    }
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-gray-700">Reconocimiento de voz activo</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                  <span className="text-gray-700">Audio feedback automático</span>
                </div>
                {voice.apiKeyStatus === 'valid' && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-3"></div>
                    <span className="text-gray-700">OpenRouter API configurado</span>
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

// 🚨 EXPORT AQUÍ - FUERA DEL COMPONENTE
export default EnglishPracticeApp;