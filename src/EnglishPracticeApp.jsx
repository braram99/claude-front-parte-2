// src/EnglishPracticeApp.jsx - SUPER SIMPLE voice recognition

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Mic, BarChart3, Play, Volume2, RotateCcw, Square, Loader2, CheckCircle } from 'lucide-react';

// Solo usar los hooks/servicios más simples
import useProgress from './hooks/useProgress';
import questionsService from './services/questionsService';

// 🤖 AI Service super simple
const simpleAI = {
  async analyzeAndRespond(question, transcript) {
    console.log('🤖 AI analyzing:', { question, transcript });
    
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript || cleanTranscript.length < 3) {
      return {
        encouragement: "I couldn't hear you clearly. Try speaking closer to the microphone.",
        score: 25,
        suggestions: ['Speak closer to microphone', 'Speak more slowly'],
        audioText: "I couldn't hear you clearly. Could you try again?"
      };
    }

    const words = cleanTranscript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    let score = 50;
    if (wordCount >= 15) score = 95;
    else if (wordCount >= 10) score = 85;
    else if (wordCount >= 5) score = 65;

    const encouragements = [
      "Excellent work! Your English sounds very natural.",
      "Great job! You're speaking clearly and confidently.", 
      "Good effort! You're building confidence with each practice.",
      "Nice try! Keep practicing to improve your fluency."
    ];
    
    const level = score >= 85 ? 0 : score >= 70 ? 1 : score >= 55 ? 2 : 3;
    
    return {
      encouragement: encouragements[level],
      score,
      suggestions: ['Try speaking longer', 'Add more details', 'Keep practicing!'],
      audioText: encouragements[level]
    };
  }
};

// 🎤 Hook SUPER SIMPLE para voice recording + recognition
const useSimpleVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

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

  // Process with AI
  const processWithAI = useCallback(async (question) => {
    if (!transcript || transcript.trim().length === 0) {
      setError('No transcript available');
      return null;
    }

    setIsProcessing(true);
    console.log('🤖 Processing with AI:', { question, transcript });

    try {
      const result = await simpleAI.analyzeAndRespond(question, transcript);
      console.log('✅ AI result:', result);
      
      // Speak the response
      if ('speechSynthesis' in window && result.audioText) {
        const utterance = new SpeechSynthesisUtterance(result.audioText);
        utterance.rate = 0.9;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
      
      return result;
    } catch (error) {
      console.error('❌ AI processing error:', error);
      setError('AI processing failed');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [transcript]);

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
    startRecording,
    stopRecording,
    processWithAI,
    reset
  };
};

const EnglishPracticeApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  
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
    const welcomeMessages = [
      {
        id: 1,
        type: 'bot',
        content: "¡Hola! 👋 Vamos a practicar inglés con voice recognition simple.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
          suggestions: aiResult.suggestions
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
            <p className="text-gray-600">Voice Recognition Simple</p>
            
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
              <span className="text-xl font-semibold">🎤 Voice Practice</span>
              <p className="text-sm text-blue-100 mt-1">Simple Voice Recognition</p>
            </button>

            <button 
              onClick={() => setCurrentScreen('progress')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <BarChart3 className="mx-auto mb-2" size={32} />
              <span className="text-xl font-semibold">📊 Mi Progreso</span>
            </button>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-600 mb-2">🎤 Voice Recognition:</p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
                Mic ✓
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
                Speech API ✓
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-purple-500"></div>
                TTS ✓
              </div>
            </div>
          </div>
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
                🎤
              </div>
              <div>
                <h2 className="font-semibold">Voice Practice</h2>
                <p className="text-sm text-blue-200">
                  {voice.isRecording ? `Grabando... (${voice.duration}s)` : 
                   voice.isProcessing ? 'Procesando...' : 
                   'Listo para hablar'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={getNewQuestion}
            className="p-2 hover:bg-blue-700 rounded-full"
          >
            <RotateCcw size={20} />
          </button>
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
                {message.type === 'ai' ? '🤖' : '🎓'}
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
                        Score: {message.score}/100
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
              🤖
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg rounded-tl-none p-3 shadow-sm border border-blue-200">
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-gray-700">IA procesando...</span>
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
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">Recording</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.transcript ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">Speech Recognition</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${voice.isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">AI Processing</span>
              </div>
            </div>
          </div>
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
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">Estadísticas</h3>
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
      case 'progress': return <ProgressScreen />;
      default: return <HomeScreen />;
    }
  };

  return renderScreen();
};

export default EnglishPracticeApp;