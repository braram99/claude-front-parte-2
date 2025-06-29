import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, RotateCcw, Square, Loader2, CheckCircle, AlertCircle, StopCircle } from 'lucide-react';

// Use your original hooks
import useAudioRecorder from './hooks/useAudioRecorder';
import useProgress from './hooks/useProgress';
import questionsService from './services/questionsService';

// Enhanced AI Service with complete analysis
const aiService = {
  analyzeAnswer: async (question, transcript) => {
    console.log('🤖 AI analyzing:', { question, transcript });
    
    try {
      const cleanTranscript = transcript.trim();
      
      if (!cleanTranscript || cleanTranscript === 'Audio response') {
        return {
          message: "I couldn't get a clear transcript. Try speaking more clearly.",
          score: 25,
          suggestions: ['Speak closer to the microphone', 'Try speaking more slowly', 'Make sure you are in a quiet environment'],
          confidence: 0.1
        };
      }

      const analysis = performLocalAnalysis(question, cleanTranscript);
      console.log('✅ AI analysis complete:', analysis);
      return analysis;
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      return {
        message: "There was an issue analyzing your response, but keep practicing!",
        score: 50,
        suggestions: ['Keep practicing regularly', 'Focus on speaking clearly', 'Try again with a new question'],
        confidence: 0.5
      };
    }
  }
};

function performLocalAnalysis(question, transcript) {
  const words = transcript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const sentenceCount = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : wordCount;
  
  const lengthScore = calculateLengthScore(wordCount);
  const vocabularyScore = calculateVocabularyScore(words);
  const structureScore = calculateStructureScore(transcript, sentenceCount, avgWordsPerSentence);
  const relevanceScore = calculateRelevanceScore(question, transcript);
  
  const overallScore = Math.round(
    (lengthScore * 0.25) + 
    (vocabularyScore * 0.25) + 
    (structureScore * 0.25) + 
    (relevanceScore * 0.25)
  );

  const feedback = generateFeedback(overallScore, wordCount, words, transcript);

  return {
    message: feedback.message,
    score: Math.max(20, Math.min(100, overallScore)),
    suggestions: feedback.suggestions,
    confidence: calculateConfidence(wordCount, overallScore),
    grammar: {
      score: structureScore,
      issues: findGrammarIssues(transcript)
    },
    vocabulary: {
      score: vocabularyScore,
      uniqueWords: new Set(words).size,
      advancedWords: countAdvancedWords(words)
    },
    fluency: {
      score: lengthScore,
      wordCount: wordCount
    }
  };
}

function calculateLengthScore(wordCount) {
  if (wordCount >= 15) return 100;
  if (wordCount >= 10) return 85;
  if (wordCount >= 7) return 70;
  if (wordCount >= 5) return 55;
  if (wordCount >= 3) return 40;
  return 25;
}

function calculateVocabularyScore(words) {
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;
  
  let score = 60;
  
  if (uniqueRatio > 0.8) score += 30;
  else if (uniqueRatio > 0.6) score += 20;
  else if (uniqueRatio > 0.4) score += 10;
  
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  if (avgWordLength > 5) score += 15;
  else if (avgWordLength > 4) score += 10;
  else if (avgWordLength > 3) score += 5;
  
  const advancedWords = countAdvancedWords(words);
  score += advancedWords * 5;
  
  return Math.min(100, score);
}

function calculateStructureScore(transcript, sentenceCount, avgWordsPerSentence) {
  let score = 70;
  
  if (/^[A-Z]/.test(transcript.trim())) score += 10;
  if (/[.!?]$/.test(transcript.trim())) score += 5;
  if (sentenceCount > 1) score += 10;
  if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 15) score += 10;
  
  const connectingWords = ['and', 'but', 'because', 'so', 'however', 'also', 'therefore'];
  const hasConnectors = connectingWords.some(word => 
    transcript.toLowerCase().includes(` ${word} `)
  );
  if (hasConnectors) score += 5;
  
  return Math.min(100, score);
}

function calculateRelevanceScore(question, transcript) {
  const questionWords = question.toLowerCase().split(/\s+/);
  const transcriptLower = transcript.toLowerCase();
  
  const commonWords = ['what', 'is', 'are', 'the', 'a', 'an', 'do', 'does', 'did', 'you', 'your'];
  const keyWords = questionWords.filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
  
  if (keyWords.length === 0) return 75;
  
  let addressedConcepts = 0;
  keyWords.forEach(keyWord => {
    if (transcriptLower.includes(keyWord) || 
        hasSimilarConcept(transcriptLower, keyWord)) {
      addressedConcepts++;
    }
  });
  
  const relevanceRatio = addressedConcepts / keyWords.length;
  return Math.round(relevanceRatio * 100);
}

function hasSimilarConcept(text, concept) {
  const synonyms = {
    'favorite': ['like', 'love', 'prefer', 'enjoy', 'best'],
    'hobby': ['activity', 'interest', 'pastime', 'do', 'play'],
    'food': ['eat', 'meal', 'dish', 'cook', 'restaurant']
  };
  
  if (synonyms[concept]) {
    return synonyms[concept].some(synonym => text.includes(synonym));
  }
  
  return false;
}

function countAdvancedWords(words) {
  const advancedWords = [
    'excellent', 'fantastic', 'amazing', 'incredible', 'wonderful',
    'important', 'significant', 'essential', 'necessary', 'crucial',
    'beautiful', 'gorgeous', 'magnificent', 'stunning', 'attractive'
  ];
  
  let count = 0;
  words.forEach(word => {
    if (advancedWords.includes(word) || word.length > 7) {
      count++;
    }
  });
  
  return count;
}

function findGrammarIssues(transcript) {
  const issues = [];
  
  if (!/^[A-Z]/.test(transcript.trim())) {
    issues.push('Start sentences with capital letters');
  }
  
  if (!/[.!?]$/.test(transcript.trim())) {
    issues.push('End sentences with punctuation');
  }
  
  return issues;
}

function calculateConfidence(wordCount, score) {
  let confidence = 0.5;
  confidence += Math.min(0.3, wordCount * 0.02);
  confidence += (score / 100) * 0.2;
  return Math.min(0.95, Math.max(0.3, confidence));
}

function generateFeedback(score, wordCount, words, transcript) {
  let message = '';
  let suggestions = [];

  if (score >= 85) {
    message = '¡Excelente respuesta! Tu inglés es muy claro y natural.';
    suggestions = ['Keep practicing at this excellent level', 'Try discussing more complex topics'];
  } else if (score >= 70) {
    message = '¡Muy buena respuesta! Estás progresando muy bien.';
    suggestions = ['Try to add more details to your answers', 'Use connecting words like "and", "but", "because"'];
  } else if (score >= 55) {
    message = '¡Buena respuesta! Sigue practicando para mejorar.';
    suggestions = ['Try to speak for a bit longer', 'Use more descriptive words'];
  } else if (score >= 40) {
    message = 'Buen esfuerzo. Con práctica constante mejorarás mucho.';
    suggestions = ['Start with simple, complete sentences', 'Focus on clear pronunciation'];
  } else {
    message = 'Sigue intentando. Cada práctica te ayuda a mejorar.';
    suggestions = ['Try to speak more slowly and clearly', 'Use simple words and short sentences'];
  }

  if (wordCount < 5) {
    suggestions.unshift('Try to give longer, more complete answers');
  }
  
  return { message, suggestions: suggestions.slice(0, 3) };
}

const useSpeechPractice = () => {
  const audioRecorder = useAudioRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [transcript, setTranscript] = useState('');
  
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
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        await new Promise(resolve => {
          window.speechSynthesis.onvoiceschanged = resolve;
        });
      }
      
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.lang = 'en-US';
      
      const updatedVoices = window.speechSynthesis.getVoices();
      const englishVoice = updatedVoices.find(voice => 
        voice.lang === 'en-US' || voice.lang === 'en-GB'
      ) || updatedVoices.find(voice => voice.lang.startsWith('en-')) || updatedVoices[0];
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.onend = () => setIsPlayingQuestion(false);
      utterance.onerror = () => setIsPlayingQuestion(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlayingQuestion(false);
    }
  }, []);

  const playExample = useCallback(async (example) => {
    if (!('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      setIsPlayingQuestion(true);
      
      const utterance = new SpeechSynthesisUtterance(`Here's an example: ${example}`);
      utterance.rate = 0.85;
      utterance.lang = 'en-US';
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang === 'en-US' || voice.lang.startsWith('en-')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.onend = () => setIsPlayingQuestion(false);
      utterance.onerror = () => setIsPlayingQuestion(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlayingQuestion(false);
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

  useEffect(() => {
    if (audioRecorder.audioBlob && 
        !audioRecorder.isRecording && 
        !isProcessing &&
        audioRecorder.audioBlob !== processedAudioRef.current) {
      
      console.log('🎯 Processing new audio with AI...');
      setIsProcessing(true);
      processedAudioRef.current = audioRecorder.audioBlob;
      
      if (audioRecorder.audioUrl) {
        startListening();
      }
      
      setTimeout(async () => {
        const duration = audioRecorder.duration;
        let finalTranscript = transcript || `Audio response (${duration} seconds)`;
        
        const currentQuestion = window.currentQuestionForAI || "What's your favorite hobby?";
        const aiAnalysis = await aiService.analyzeAnswer(currentQuestion, finalTranscript);
        
        setFeedback({
          success: true,
          transcript: finalTranscript,
          duration: duration,
          ...aiAnalysis
        });
        
        setIsProcessing(false);
        console.log('✅ AI processing complete');
      }, 2000);
    }
  }, [audioRecorder.audioBlob, audioRecorder.isRecording, audioRecorder.duration, audioRecorder.audioUrl, isProcessing, transcript, startListening]);

  const clearSession = useCallback(() => {
    console.log('🧹 Clearing session...');
    audioRecorder.clearRecording();
    setFeedback(null);
    setError(null);
    setIsProcessing(false);
    setTranscript('');
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
    playExample,
    isProcessing,
    feedback,
    transcript,
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
        content: "¡Hola! 👋 Vamos a practicar inglés hablado hoy.",
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
      
      console.log('📝 Adding enhanced feedback to chat...');
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

      const botMessage = {
        id: Date.now() + Math.random() + 1,
        type: 'bot',
        content: speechPractice.feedback.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFeedback: true,
        score: speechPractice.feedback.score,
        suggestions: speechPractice.feedback.suggestions,
        grammar: speechPractice.feedback.grammar,
        vocabulary: speechPractice.feedback.vocabulary,
        fluency: speechPractice.feedback.fluency
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
      
      try {
        recordAnswer({
          ...currentQuestion,
          userResponse: speechPractice.feedback.transcript,
          feedback: speechPractice.feedback
        });
      } catch (error) {
        console.warn('Error recording answer:', error);
      }
    }
  }, [speechPractice.feedback, currentQuestion, recordAnswer]);

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
            <p className="text-gray-600">¿Listo para practicar tu inglés?</p>
            
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

          <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-600 mb-2">Estado:</p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
                IA Avanzada Activada ✓
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                <h2 className="font-semibold">Práctica con IA Avanzada</h2>
                <p className="text-sm text-green-200">
                  {speechPractice.isRecording ? 'Grabando...' : 
                   speechPractice.isProcessing ? 'Analizando con IA...' : 
                   'Listo para análisis completo'}
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
                  <span className="text-xs text-gray-600">🔊 Escuchar</span>
                </div>
              )}
              
              {message.isExample && message.exampleText && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => speechPractice.playExample(message.exampleText)}
                    disabled={speechPractice.isPlayingQuestion}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Volume2 size={16} />
                  </button>
                  <span className="text-xs text-gray-600">📝 Ejemplo</span>
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
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-500 mr-1" />
                      {message.score && (
                        <span className="text-xs text-gray-600 font-medium">
                          Puntuación General: {message.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {(message.grammar || message.vocabulary || message.fluency) && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <p className="font-medium text-gray-700 mb-1">🧠 Análisis Detallado:</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {message.grammar && (
                          <div className="bg-blue-100 p-1 rounded">
                            <p className="font-medium text-blue-700">Gramática</p>
                            <p className="text-blue-600">{message.grammar.score}/100</p>
                          </div>
                        )}
                        {message.vocabulary && (
                          <div className="bg-purple-100 p-1 rounded">
                            <p className="font-medium text-purple-700">Vocabulario</p>
                            <p className="text-purple-600">{message.vocabulary.score}/100</p>
                          </div>
                        )}
                        {message.fluency && (
                          <div className="bg-green-100 p-1 rounded">
                            <p className="font-medium text-green-700">Fluidez</p>
                            <p className="text-green-600">{message.fluency.score}/100</p>
                          </div>
                        )}
                      </div>
                      
                      {message.vocabulary && (
                        <div className="mt-1 text-xs text-gray-600">
                          <p>Palabras únicas: {message.vocabulary.uniqueWords}</p>
                          {message.vocabulary.advancedWords > 0 && (
                            <p>Vocabulario avanzado: {message.vocabulary.advancedWords} palabras</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">💡 Sugerencias para mejorar:</p>
                      <ul className="space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.grammar && message.grammar.issues && message.grammar.issues.length > 0 && (
                    <div className="text-xs text-orange-600">
                      <p className="font-medium mb-1">⚠️ Mejoras gramaticales:</p>
                      <ul className="space-y-1">
                        {message.grammar.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-orange-500 mr-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                <span className="text-gray-600">Analizando con IA avanzada...</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Evaluando gramática, vocabulario y fluidez...
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
                <span>Parar ({speechPractice.recordingDuration}s)</span>
              </>
            ) : speechPractice.isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Analizando con IA...</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>Grabar para Análisis IA</span>
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
              <span className="text-sm text-gray-600">
                Grabando para análisis completo... Habla claramente
              </span>
            </div>
          </div>
        )}
        
        {speechPractice.transcript && (
          <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
            <p className="text-blue-700 font-medium">Transcripción detectada:</p>
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
          <div className="bg-white rounded-xl p-6 shadow-lg space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Estadísticas de Hoy</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{safeProgress.todayProgress}</p>
                  <p className="text-sm text-gray-600">Preguntas Analizadas</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{safeProgress.currentStreak}</p>
                  <p className="text-sm text-gray-600">Días Seguidos</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Meta Diaria con IA</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${safeProgress.completionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {safeProgress.todayProgress}/{safeProgress.dailyGoal}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {safeProgress.completionRate >= 100
                  ? "🎉 ¡Meta del día completada con IA!" 
                  : `${Math.max(0, safeProgress.dailyGoal - safeProgress.todayProgress)} análisis más para completar tu meta`
                }
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">🤖 Análisis IA Avanzado</p>
              <p className="text-xs text-gray-600">
                Cada respuesta es analizada por gramática, vocabulario, fluidez y relevancia
              </p>
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