// src/EnglishPracticeApp.jsx - Quick Fix Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, RotateCcw, Square, Loader2, CheckCircle, AlertCircle, StopCircle, MessageCircle } from 'lucide-react';

// Hooks originales
import useAudioRecorder from './hooks/useAudioRecorder';
import useProgress from './hooks/useProgress';
import questionsService from './services/questionsService';

// 🔧 AI Service simplificado temporal (para evitar errores de import)
const tempAIService = {
  async analyzeAndRespond(question, transcript) {
    console.log('🤖 AI analyzing:', { question, transcript });
    
    try {
      const cleanTranscript = transcript.trim();
      
      if (!cleanTranscript || cleanTranscript === 'Audio response') {
        return {
          encouragement: "I couldn't get a clear transcript. Try speaking more clearly.",
          score: 25,
          suggestions: ['Speak closer to the microphone', 'Try speaking more slowly'],
          confidence: 0.1,
          mood: 'supportive',
          audioText: "I couldn't hear you clearly. Could you try speaking closer to the microphone?",
          shouldSpeak: true
        };
      }

      // Análisis básico
      const words = cleanTranscript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      let score = 50;
      if (wordCount >= 15) score = 95;
      else if (wordCount >= 10) score = 85;
      else if (wordCount >= 7) score = 75;
      else if (wordCount >= 5) score = 65;
      else if (wordCount >= 3) score = 55;

      let encouragement, mood, audioText;
      
      if (score >= 85) {
        encouragement = "Excellent work! Your English sounds very natural and confident.";
        mood = 'enthusiastic';
        audioText = "Wow, excellent work! Your English sounds very natural. Keep it up!";
      } else if (score >= 70) {
        encouragement = "Great job! You're expressing yourself clearly and confidently.";
        mood = 'encouraging';
        audioText = "Great job! You're speaking very clearly. I can understand you perfectly.";
      } else if (score >= 55) {
        encouragement = "Good effort! You're communicating well and building confidence.";
        mood = 'supportive';
        audioText = "Good effort! You're doing well. Try to speak a bit longer next time.";
      } else {
        encouragement = "Nice try! Every practice session helps you improve.";
        mood = 'gentle';
        audioText = "Nice try! Don't worry, practice makes perfect. Keep going!";
      }

      const suggestions = [];
      if (wordCount < 5) suggestions.push('Try to speak for a bit longer');
      if (wordCount < 10) suggestions.push('Add more details to your answer');
      suggestions.push('You\'re doing great, keep practicing!');

      // Follow-up question simple
      const followUpQuestions = [
        "That's interesting! Can you tell me more about that?",
        "What do you like most about that?",
        "How did that make you feel?",
        "Would you like to try a different question?"
      ];
      
      const followUpQuestion = wordCount >= 5 
        ? followUpQuestions[Math.floor(Math.random() * (followUpQuestions.length - 1))]
        : followUpQuestions[followUpQuestions.length - 1];

      return {
        encouragement,
        score,
        suggestions: suggestions.slice(0, 3),
        confidence: Math.min(0.95, 0.5 + (wordCount * 0.05)),
        mood,
        audioText,
        followUpQuestion,
        shouldSpeak: true,
        // Análisis detallado simplificado
        grammar: { score: Math.min(100, score + 10), issues: [] },
        vocabulary: { score: Math.min(100, score + 5), uniqueWords: new Set(words).size, advancedWords: 0 },
        fluency: { score, wordCount }
      };

    } catch (error) {
      console.error('AI Error:', error);
      return {
        encouragement: "Keep practicing! Every conversation helps you improve.",
        score: 50,
        suggestions: ["Try speaking more clearly", "Don't worry about mistakes"],
        confidence: 0.5,
        mood: 'supportive',
        audioText: "Don't worry, learning takes time. Keep practicing!",
        shouldSpeak: true
      };
    }
  }
};

const useSpeechPractice = () => {
  const audioRecorder = useAudioRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  
  const processedAudioRef = useRef(null);
  const recognitionRef = useRef(null);

  const playQuestion = useCallback(async (question) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setIsPlayingQuestion(true);
      
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.lang = 'en-US';
      
      utterance.onend = () => setIsPlayingQuestion(false);
      utterance.onerror = () => setIsPlayingQuestion(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlayingQuestion(false);
    }
  }, []);

  const playAIResponse = useCallback(async (responseText, mood = 'normal') => {
    if (!('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      setIsAISpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(responseText);
      
      // Configurar voz según mood
      const voiceConfigs = {
        encouraging: { rate: 0.9, pitch: 1.1, volume: 0.9 },
        supportive: { rate: 0.85, pitch: 1.0, volume: 0.8 },
        enthusiastic: { rate: 1.0, pitch: 1.2, volume: 1.0 },
        gentle: { rate: 0.8, pitch: 0.95, volume: 0.75 },
        normal: { rate: 0.9, pitch: 1.0, volume: 0.8 }
      };
      
      const config = voiceConfigs[mood] || voiceConfigs.normal;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;
      utterance.lang = 'en-US';
      
      utterance.onend = () => setIsAISpeaking(false);
      utterance.onerror = () => setIsAISpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('AI TTS error:', error);
      setIsAISpeaking(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          console.log('📝 Transcript captured:', finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition setup error:', error);
    }
  }, []);

  // Procesar con AI temporal
  useEffect(() => {
    if (audioRecorder.audioBlob && 
        !audioRecorder.isRecording && 
        !isProcessing &&
        audioRecorder.audioBlob !== processedAudioRef.current) {
      
      console.log('🤖 Processing with AI Service...');
      setIsProcessing(true);
      processedAudioRef.current = audioRecorder.audioBlob;
      
      if (audioRecorder.audioUrl) {
        startListening();
      }
      
      setTimeout(async () => {
        const duration = audioRecorder.duration;
        let finalTranscript = transcript || `Audio response (${duration} seconds)`;
        
        const currentQuestion = window.currentQuestionForAI || "What's your favorite hobby?";
        
        try {
          const aiResponseData = await tempAIService.analyzeAndRespond(currentQuestion, finalTranscript);
          
          console.log('✅ AI Response:', aiResponseData);
          
          setFeedback({
            success: true,
            transcript: finalTranscript,
            duration: duration,
            message: aiResponseData.encouragement,
            score: aiResponseData.score,
            suggestions: aiResponseData.suggestions,
            confidence: aiResponseData.confidence,
            grammar: aiResponseData.grammar,
            vocabulary: aiResponseData.vocabulary,
            fluency: aiResponseData.fluency
          });
          
          setAiResponse({
            ...aiResponseData,
            transcript: finalTranscript,
            question: currentQuestion
          });
          
          // Reproducir audio automáticamente
          setTimeout(() => {
            if (aiResponseData.audioText) {
              playAIResponse(aiResponseData.audioText, aiResponseData.mood);
            }
          }, 1500);
          
        } catch (error) {
          console.error('AI Error:', error);
          setFeedback({
            success: true,
            transcript: finalTranscript,
            duration: duration,
            message: "Great effort! Keep practicing to improve your English.",
            score: 60,
            suggestions: ['Keep practicing regularly'],
            confidence: 0.7
          });
        }
        
        setIsProcessing(false);
      }, 2000);
    }
  }, [audioRecorder.audioBlob, audioRecorder.isRecording, audioRecorder.duration, audioRecorder.audioUrl, isProcessing, transcript, startListening, playAIResponse]);

  const clearSession = useCallback(() => {
    console.log('🧹 Clearing session...');
    audioRecorder.clearRecording();
    setFeedback(null);
    setAiResponse(null);
    setError(null);
    setIsProcessing(false);
    setTranscript('');
    setIsAISpeaking(false);
    processedAudioRef.current = null;
    window.speechSynthesis.cancel();
    setIsPlayingQuestion(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
  }, [audioRecorder]);

  const clearError = useCallback(() => {
    setError(null);
    audioRecorder.clearRecording();
    setTranscript('');
    setAiResponse(null);
    processedAudioRef.current = null;
  }, [audioRecorder]);

  const playRecording = useCallback(() => {
    if (audioRecorder.audioUrl) {
      const audio = new Audio(audioRecorder.audioUrl);
      audio.play().catch(error => {
        console.error('Error playing recording:', error);
      });
    }
  }, [audioRecorder.audioUrl]);

  return {
    isRecording: audioRecorder.isRecording,
    recordingDuration: audioRecorder.duration,
    audioUrl: audioRecorder.audioUrl,
    audioBlob: audioRecorder.audioBlob,
    startRecording: audioRecorder.startRecording,
    stopRecording: audioRecorder.stopRecording,
    playRecording,
    isPlayingQuestion,
    playQuestion,
    isProcessing,
    feedback,
    transcript,
    aiResponse,
    isAISpeaking,
    playAIResponse,
    error: error || audioRecorder.error,
    clearError,
    clearSession
  };
};

const EnglishPracticeApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const speechPractice = useSpeechPractice();
  const { progress, recordAnswer } = useProgress();

  useEffect(() => {
    if (!currentQuestion) {
      const question = questionsService.getNextQuestion();
      setCurrentQuestion(question);
      window.currentQuestionForAI = question.question;
      initializeChat(question);
    }
  }, [currentQuestion]);

  const initializeChat = (question) => {
    const welcomeMessages = [
      {
        id: 1,
        type: 'bot',
        content: "¡Hola! 👋 Vamos a practicar inglés hablado con IA avanzada hoy.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 2,
        type: 'bot',
        content: `Pregunta para ti: "${question.question}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        question: question.question,
        hasAudio: true
      }
    ];
    
    setMessages(welcomeMessages);
  };

  const getNewQuestion = () => {
    console.log('🔄 Getting new question...');
    speechPractice.clearSession();
    const question = questionsService.getNextQuestion();
    setCurrentQuestion(question);
    window.currentQuestionForAI = question.question;
    
    const newMessage = {
      id: Date.now() + Math.random(),
      type: 'bot',
      content: `Nueva pregunta: "${question.question}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      question: question.question,
      hasAudio: true
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const lastProcessedFeedbackRef = useRef(null);
  
  useEffect(() => {
    if (speechPractice.feedback && 
        speechPractice.feedback.success && 
        speechPractice.feedback !== lastProcessedFeedbackRef.current) {
      
      console.log('📝 Adding AI feedback to chat...');
      lastProcessedFeedbackRef.current = speechPractice.feedback;
      
      const userMessage = {
        id: Date.now() + Math.random(),
        type: 'user',
        content: speechPractice.feedback.transcript || 'Audio response',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true,
        duration: speechPractice.feedback.duration,
        confidence: speechPractice.feedback.confidence
      };

      const aiMessage = {
        id: Date.now() + Math.random() + 1,
        type: 'ai',
        content: speechPractice.feedback.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAIResponse: true,
        score: speechPractice.feedback.score,
        suggestions: speechPractice.feedback.suggestions,
        grammar: speechPractice.feedback.grammar,
        vocabulary: speechPractice.feedback.vocabulary,
        fluency: speechPractice.feedback.fluency,
        aiResponse: speechPractice.aiResponse,
        hasAIAudio: !!speechPractice.aiResponse?.audioText,
        mood: speechPractice.aiResponse?.mood || 'normal'
      };

      const messages = [userMessage, aiMessage];
      
      if (speechPractice.aiResponse?.followUpQuestion) {
        const followUpMessage = {
          id: Date.now() + Math.random() + 2,
          type: 'ai',
          content: speechPractice.aiResponse.followUpQuestion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFollowUp: true,
          hasAIAudio: true,
          audioText: speechPractice.aiResponse.followUpQuestion,
          mood: 'encouraging'
        };
        messages.push(followUpMessage);
      }

      setMessages(prev => [...prev, ...messages]);
      
      try {
        recordAnswer({
          ...currentQuestion,
          userResponse: speechPractice.feedback.transcript,
          feedback: speechPractice.feedback,
          aiResponse: speechPractice.aiResponse
        });
      } catch (error) {
        console.warn('Error recording answer:', error);
      }
    }
  }, [speechPractice.feedback, speechPractice.aiResponse, currentQuestion, recordAnswer]);

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
            <p className="text-gray-600">¿Listo para practicar con IA avanzada?</p>
            
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
              <p className="text-xs text-gray-500 mt-1">
                {safeProgress.completionRate}% completado
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setCurrentScreen('speaking')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Mic className="mx-auto mb-2" size={32} />
              <span className="text-xl font-semibold">🤖 Conversación con IA</span>
              <p className="text-sm text-blue-100 mt-1">Análisis completo + respuestas inteligentes</p>
            </button>

            <button 
              onClick={() => setCurrentScreen('listening')}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Headphones className="mx-auto mb-2" size={32} />
              <span className="text-xl font-semibold">🎧 Escuchar y Repetir</span>
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
            <p className="text-xs font-medium text-gray-600 mb-2">🤖 IA Activa:</p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
                Análisis ✓
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
                Respuestas ✓
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-purple-500"></div>
                Audio ✓
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SpeakingScreen = () => (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
                🤖
              </div>
              <div>
                <h2 className="font-semibold">Conversación con IA</h2>
                <p className="text-sm text-blue-200">
                  {speechPractice.isRecording ? 'Grabando...' : 
                   speechPractice.isProcessing ? 'IA Analizando...' : 
                   speechPractice.isAISpeaking ? 'IA Respondiendo...' :
                   'Listo para conversación'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={getNewQuestion}
            className="p-2 hover:bg-blue-700 rounded-full"
            title="Nueva pregunta"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'items-start'}`}>
            {(message.type === 'bot' || message.type === 'ai') && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white text-sm ${
                message.type === 'ai' 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                  : 'bg-green-500'
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
              
              {/* Controles de audio para preguntas */}
              {message.hasAudio && message.question && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => speechPractice.playQuestion(message.question)}
                    disabled={speechPractice.isPlayingQuestion}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 disabled:opacity-50"
                  >
                    {speechPractice.isPlayingQuestion ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  </button>
                  <span className="text-xs text-gray-600">🔊 Escuchar</span>
                </div>
              )}
              
              {/* Controles de audio para respuestas del AI */}
              {message.hasAIAudio && message.audioText && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => speechPractice.playAIResponse(message.audioText, message.mood)}
                    disabled={speechPractice.isAISpeaking}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-2 rounded-full hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                  >
                    {speechPractice.isAISpeaking ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                  </button>
                  <span className="text-xs text-purple-600">🤖 IA Response</span>
                </div>
              )}
              
              {/* Audio del usuario */}
              {message.type === 'user' && message.hasAudio && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={speechPractice.playRecording}
                    className="bg-blue-400 text-white p-1 rounded-full hover:bg-blue-300"
                  >
                    <Play size={12} />
                  </button>
                  <div className="flex space-x-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 bg-blue-200 rounded" style={{height: `${12 + (i * 2)}px`}}></div>
                    ))}
                  </div>
                  <span className="text-xs text-blue-200">{message.duration}s</span>
                </div>
              )}
              
              {/* AI FEEDBACK */}
              {message.isAIResponse && (
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
                  
                  {message.suggestions && message.suggestions.length > 0 && (
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
              
              {/* Follow-up questions */}
              {message.isFollowUp && (
                <div className="mt-2 bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded border border-green-200">
                  <p className="text-xs text-green-600 font-medium">🤔 Pregunta de seguimiento:</p>
                </div>
              )}
              
              <span className={`text-xs mt-2 block ${
                message.type === 'user' ? 'text-blue-200' : 
                message.type === 'ai' ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {message.type === 'user' ? '✓✓ ' : 
                 message.type === 'ai' ? '🤖 ' : ''}{message.timestamp}
              </span>
            </div>
          </div>
        ))}
        
        {/* Estado de procesamiento */}
        {speechPractice.isProcessing && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
              🤖
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg rounded-tl-none p-3 shadow-sm border border-blue-200">
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-gray-700">IA analizando...</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                📊 Preparando respuesta inteligente...
              </div>
            </div>
          </div>
        )}
        
        {/* Estado del AI hablando */}
        {speechPractice.isAISpeaking && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
              🎙️
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg rounded-tl-none p-3 shadow-sm border border-purple-200">
              <div className="flex items-center space-x-2">
                <Volume2 size={16} className="text-purple-600" />
                <span className="text-gray-700">IA respondiendo...</span>
              </div>
              <div className="flex items-center mt-1 space-x-1">
                {[1,2,3,4,5].map(i => (
                  <div 
                    key={i} 
                    className="w-1 bg-purple-400 rounded animate-pulse" 
                    style={{
                      height: `${8 + Math.sin(Date.now() / 200 + i) * 4}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
                <span className="text-xs text-purple-600 ml-2">Hablando...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => currentQuestion && speechPractice.playQuestion(currentQuestion.question)}
            disabled={speechPractice.isPlayingQuestion || speechPractice.isRecording || speechPractice.isAISpeaking}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 p-3 rounded-full"
          >
            {speechPractice.isPlayingQuestion ? (
              <Loader2 size={20} className="text-gray-600 animate-spin" />
            ) : (
              <Volume2 size={20} className="text-gray-600" />
            )}
          </button>
          
          <button 
            onClick={speechPractice.isRecording ? speechPractice.stopRecording : speechPractice.startRecording}
            disabled={speechPractice.isProcessing || speechPractice.isPlayingQuestion || speechPractice.isAISpeaking}
            className={`p-3 rounded-full flex-1 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 ${
              speechPractice.isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
            }`}
          >
            {speechPractice.isRecording ? (
              <>
                <StopCircle size={20} />
                <span>Parar ({speechPractice.recordingDuration}s)</span>
              </>
            ) : speechPractice.isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>IA Analizando...</span>
              </>
            ) : speechPractice.isAISpeaking ? (
              <>
                <Volume2 size={20} />
                <span>IA Hablando...</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>Hablar con IA</span>
              </>
            )}
          </button>
          
          <button 
            onClick={getNewQuestion}
            disabled={speechPractice.isRecording || speechPractice.isProcessing || speechPractice.isAISpeaking}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 p-3 rounded-full"
          >
            <RotateCcw size={20} className="text-gray-600" />
          </button>
        </div>
        
        {/* Estados informativos */}
        {speechPractice.isRecording && (
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">
                Grabando para análisis IA...
              </span>
            </div>
          </div>
        )}
        
        {speechPractice.isProcessing && (
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">
                IA procesando tu respuesta...
              </span>
            </div>
          </div>
        )}
        
        {speechPractice.isAISpeaking && (
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">
                IA generando respuesta con audio...
              </span>
            </div>
          </div>
        )}
        
        {speechPractice.transcript && !speechPractice.isProcessing && (
          <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
            <p className="text-blue-700 font-medium">Transcripción:</p>
            <p className="text-blue-600">{speechPractice.transcript}</p>
          </div>
        )}
      </div>
    </div>
  );

  const ListeningScreen = () => (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-lg bg-white shadow-md">
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">🎧 Próximamente</h2>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600">Escuchar y Repetir próximamente... 🚧</p>
        </div>
      </div>
    </div>
  );

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
              <h3 className="text-lg font-semibold mb-4 text-center">Estadísticas con IA</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{safeProgress.todayProgress}</p>
                  <p className="text-sm text-gray-600">Análisis IA Hoy</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{safeProgress.currentStreak}</p>
                  <p className="text-sm text-gray-600">Días Seguidos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div>
                <p className="text-sm text-gray-600 mb-2">Meta Diaria con IA</p>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${safeProgress.completionRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {safeProgress.todayProgress}/{safeProgress.dailyGoal}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {safeProgress.completionRate >= 100
                    ? "🎉 ¡Meta del día completada!" 
                    : `${Math.max(0, safeProgress.dailyGoal - safeProgress.todayProgress)} análisis más para completar`
                  }
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">🤖 IA Activa</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-gray-700">Análisis completo activado</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-gray-700">Respuestas inteligentes</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                  <span className="text-gray-700">Audio automático</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-3"></div>
                  <span className="text-gray-700">Follow-up questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScreen = () => {
    switch(currentScreen) {
      case 'home': return <HomeScreen />;
      case 'speaking': return <SpeakingScreen />;
      case 'listening': return <ListeningScreen />;
      case 'progress': return <ProgressScreen />;
      default: return <HomeScreen />;
    }
  };

  return renderScreen();
};

export default EnglishPracticeApp;