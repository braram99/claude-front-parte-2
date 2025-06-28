import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, Trophy, Calendar, MessageCircle, RotateCcw, Square, Loader2, CheckCircle, AlertCircle, StopCircle } from 'lucide-react';

// Hook real para grabación de audio
const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Handle stop recording
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      
    } catch (err) {
      setError('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl('');
    setDuration(0);
    setError(null);
  }, [audioUrl]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    cleanup
  };
};

// Hook real para Text-to-Speech
const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const speak = useCallback(async (text, options = {}) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech no soportado');
      return;
    }

    // Cancel any current speech
    synthRef.current.cancel();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Configure voice
      const voices = synthRef.current.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en-')) || voices[0];
      
      utterance.voice = englishVoice;
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentText(text);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentText('');
        resolve();
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentText('');
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  }, []);

  const stop = useCallback(() => {
    synthRef.current.cancel();
    setIsPlaying(false);
    setCurrentText('');
  }, []);

  const speakQuestion = useCallback((question) => {
    return speak(question, { rate: 0.8, pitch: 1.1 });
  }, [speak]);

  const speakExample = useCallback((example) => {
    return speak(`Here's an example: ${example}`, { rate: 0.85 });
  }, [speak]);

  return {
    isPlaying,
    currentText,
    speak,
    stop,
    speakQuestion,
    speakExample
  };
};

// Hook real para Speech Recognition
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const startListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setError(`Error en reconocimiento de voz: ${event.error}`);
      };

      recognition.start();
    } catch (err) {
      setError('Error al iniciar reconocimiento de voz');
      console.error(err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript
  };
};

// Hook integrado para práctica de habla
const useSpeechPractice = () => {
  const audioRecorder = useAudioRecorder();
  const tts = useTextToSpeech();
  const speechRecognition = useSpeechRecognition();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Procesar respuesta cuando se complete la grabación
  useEffect(() => {
    if (audioRecorder.audioBlob && !audioRecorder.isRecording) {
      processRecording();
    }
  }, [audioRecorder.audioBlob, audioRecorder.isRecording]);

  const processRecording = async () => {
    setIsProcessing(true);
    
    // Simular procesamiento (aquí podrías integrar con un servicio real)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generar feedback basado en duración de grabación
    const confidence = Math.min(0.95, 0.6 + (audioRecorder.duration * 0.05));
    let message = '';
    
    if (audioRecorder.duration >= 3) {
      message = '¡Excelente! Tu respuesta fue clara y completa.';
    } else if (audioRecorder.duration >= 1) {
      message = '¡Bien! Intenta dar una respuesta más detallada la próxima vez.';
    } else {
      message = 'Tu respuesta fue muy corta. Intenta hablar más tiempo.';
    }

    setFeedback({
      success: true,
      message,
      transcript: `Grabación de ${audioRecorder.duration} segundos procesada`,
      confidence,
      duration: audioRecorder.duration
    });
    
    setIsProcessing(false);
  };

  const clearSession = useCallback(() => {
    audioRecorder.clearRecording();
    speechRecognition.clearTranscript();
    setFeedback(null);
    setIsProcessing(false);
  }, [audioRecorder, speechRecognition]);

  return {
    // Audio recording
    isRecording: audioRecorder.isRecording,
    recordingDuration: audioRecorder.duration,
    audioUrl: audioRecorder.audioUrl,
    startRecording: audioRecorder.startRecording,
    stopRecording: audioRecorder.stopRecording,
    
    // Text-to-speech
    isPlayingQuestion: tts.isPlaying,
    playQuestion: tts.speakQuestion,
    playExample: tts.speakExample,
    stopTTS: tts.stop,
    
    // Speech recognition
    isListening: speechRecognition.isListening,
    transcript: speechRecognition.transcript,
    startListening: speechRecognition.startListening,
    stopListening: speechRecognition.stopListening,
    
    // Processing and feedback
    isProcessing,
    feedback,
    
    // Error handling
    error: audioRecorder.error || speechRecognition.error,
    clearError: () => {
      audioRecorder.clearRecording();
      speechRecognition.clearTranscript();
    },
    
    // Session management
    clearSession,
    
    // Audio playback
    playRecording: () => {
      if (audioRecorder.audioUrl) {
        const audio = new Audio(audioRecorder.audioUrl);
        audio.play();
      }
    }
  };
};

// Servicio de preguntas (temporal)
const questionsService = {
  getNextQuestion: () => ({
    question: "What's your favorite hobby and why do you enjoy it?",
    level: 'beginner',
    category: 'personal',
    sampleAnswer: "My favorite hobby is reading because it helps me relax and learn new things."
  })
};

// Hook de progreso simplificado
const useProgress = () => {
  const [progress] = useState({
    totalDays: 1,
    currentStreak: 1,
    totalRecordings: 0,
    questionsAnswered: 0,
    currentLevel: 'beginner',
    achievements: [],
    dailyGoal: 5,
    todayProgress: 0,
    completionRate: 0,
    isGoalCompleted: false,
    questionsRemaining: 5
  });

  const recordAnswer = useCallback((questionData) => {
    console.log('Respuesta registrada:', questionData);
  }, []);

  return { progress, recordAnswer };
};

const EnglishPracticeApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Hooks
  const speechPractice = useSpeechPractice();
  const { progress, recordAnswer } = useProgress();

  // Inicializar primera pregunta
  useEffect(() => {
    if (!currentQuestion) {
      const question = questionsService.getNextQuestion();
      setCurrentQuestion(question);
      initializeChat(question);
    }
  }, [currentQuestion]);

  // Inicializar chat
  const initializeChat = (question) => {
    const welcomeMessages = [
      {
        id: 1,
        type: 'bot',
        content: "¡Hola Brayan! 👋 Vamos a practicar inglés hablado hoy.",
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
    
    if (question.sampleAnswer) {
      welcomeMessages.push({
        id: 3,
        type: 'bot',
        content: `Aquí tienes un ejemplo: "${question.sampleAnswer}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isExample: true,
        exampleText: question.sampleAnswer
      });
    }
    
    setMessages(welcomeMessages);
  };

  // Manejar nueva pregunta
  const getNewQuestion = () => {
    speechPractice.clearSession();
    lastProcessedFeedbackRef.current = null; // Reset del feedback procesado
    const question = questionsService.getNextQuestion();
    setCurrentQuestion(question);
    
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

  // Manejar respuesta completada
  const lastProcessedFeedbackRef = useRef(null);
  
  useEffect(() => {
    if (speechPractice.feedback && 
        speechPractice.feedback.success && 
        speechPractice.feedback !== lastProcessedFeedbackRef.current) {
      
      // Marcar este feedback como procesado
      lastProcessedFeedbackRef.current = speechPractice.feedback;
      
      const userMessage = {
        id: Date.now() + Math.random(), // ID único
        type: 'user',
        content: speechPractice.feedback.transcript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true,
        duration: speechPractice.feedback.duration,
        confidence: speechPractice.feedback.confidence
      };

      const botMessage = {
        id: Date.now() + Math.random() + 1, // ID único
        type: 'bot',
        content: speechPractice.feedback.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFeedback: true
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
      recordAnswer(currentQuestion);
    }
  }, [speechPractice.feedback, currentQuestion, recordAnswer]);

  // 🏠 Pantalla Principal
  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">👋 ¡Hola Brayan!</h1>
          <p className="text-gray-600">¿Listo para practicar tu inglés?</p>
          <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Progreso de Hoy</p>
            <div className="flex items-center mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress.completionRate}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium">{progress.todayProgress}/{progress.dailyGoal}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => setCurrentScreen('speaking')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <Mic className="mx-auto mb-2" size={32} />
            <span className="text-xl font-semibold">🎤 Práctica de Conversación</span>
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
      </div>
    </div>
  );

  // 🎙️ Pantalla de Práctica
  const SpeakingScreen = () => (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setCurrentScreen('home')}
              className="p-2 hover:bg-green-700 rounded-full mr-3"
            >
              <Home size={20} />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                🎤
              </div>
              <div>
                <h2 className="font-semibold">Bot de Práctica de Inglés</h2>
                <p className="text-sm text-green-200">
                  {speechPractice.isRecording ? 'Grabando...' : 
                   speechPractice.isProcessing ? 'Procesando...' : 
                   speechPractice.isListening ? 'Escuchando...' : 'En línea'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={getNewQuestion}
            className="p-2 hover:bg-green-700 rounded-full"
            title="Nueva pregunta"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {speechPractice.error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{speechPractice.error}</p>
            </div>
            <button 
              onClick={speechPractice.clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'items-start'}`}>
            {message.type === 'bot' && (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
                🤖
              </div>
            )}
            
            <div className={`rounded-lg p-3 shadow-sm max-w-xs ${
              message.type === 'user' 
                ? 'bg-green-500 text-white rounded-tr-none' 
                : 'bg-white rounded-tl-none'
            }`}>
              <p className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                {message.content}
              </p>
              
              {message.hasAudio && message.question && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => speechPractice.playQuestion(message.question)}
                    disabled={speechPractice.isPlayingQuestion}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 disabled:opacity-50"
                  >
                    {speechPractice.isPlayingQuestion ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  </button>
                  <span className="text-xs text-gray-600">🔊 Toca para escuchar</span>
                </div>
              )}
              
              {message.isExample && message.exampleText && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => speechPractice.playExample(message.exampleText)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                  >
                    <Volume2 size={16} />
                  </button>
                  <span className="text-xs text-gray-600">📝 Respuesta ejemplo</span>
                </div>
              )}
              
              {message.type === 'user' && message.hasAudio && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={speechPractice.playRecording}
                    className="bg-green-400 text-white p-1 rounded-full hover:bg-green-300"
                  >
                    <Play size={12} />
                  </button>
                  <div className="flex space-x-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 bg-green-200 rounded" style={{height: `${12 + (i * 2)}px`}}></div>
                    ))}
                  </div>
                  <span className="text-xs text-green-200">{message.duration}s</span>
                  {message.confidence && (
                    <span className="text-xs text-green-200">
                      {Math.round(message.confidence * 100)}%
                    </span>
                  )}
                </div>
              )}
              
              {message.isFeedback && (
                <div className="mt-2">
                  <CheckCircle size={16} className="text-green-500 inline mr-1" />
                </div>
              )}
              
              <span className={`text-xs mt-1 block ${
                message.type === 'user' ? 'text-green-200' : 'text-gray-500'
              }`}>
                {message.type === 'user' ? '✓✓ ' : ''}{message.timestamp}
              </span>
            </div>
          </div>
        ))}
        
        {speechPractice.isProcessing && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
              🤖
            </div>
            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-gray-600">Procesando tu respuesta...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => currentQuestion && speechPractice.playQuestion(currentQuestion.question)}
            disabled={speechPractice.isPlayingQuestion || speechPractice.isRecording}
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
            disabled={speechPractice.isProcessing || speechPractice.isPlayingQuestion}
            className={`p-3 rounded-full flex-1 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 ${
              speechPractice.isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {speechPractice.isRecording ? (
              <>
                <StopCircle size={20} />
                <span>Parar Grabación ({speechPractice.recordingDuration}s)</span>
              </>
            ) : speechPractice.isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>Grabar Respuesta</span>
              </>
            )}
          </button>
          
          <button 
            onClick={getNewQuestion}
            disabled={speechPractice.isRecording || speechPractice.isProcessing}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 p-3 rounded-full"
          >
            <RotateCcw size={20} className="text-gray-600" />
          </button>
        </div>
        
        {speechPractice.isRecording && (
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Grabando... Habla claramente</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Pantallas simplificadas
  const ListeningScreen = () => (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-lg bg-white shadow-md">
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">🎧 Escuchar y Repetir</h2>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600">Próximamente... 🚧</p>
        </div>
      </div>
    </div>
  );

  const ProgressScreen = () => (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-lg bg-white shadow-md">
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">📊 Mi Progreso</h2>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600">Seguimiento de progreso próximamente... 📈</p>
        </div>
      </div>
    </div>
  );

  // Renderizar pantalla actual
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