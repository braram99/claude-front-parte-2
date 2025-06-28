import React, { useState, useEffect } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, Trophy, Calendar, MessageCircle, RotateCcw, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Hooks simplificados temporales
const useSimpleProgress = () => {
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

  const recordAnswer = () => {
    console.log('Answer recorded');
  };

  return { progress, recordAnswer };
};

const useSimpleSpeechPractice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const startRecording = () => {
    setIsRecording(true);
    setError(null);
    console.log('Recording started...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setTranscript('Hello, this is a test response');
      setFeedback({
        success: true,
        message: 'Great job! Your pronunciation is clear.',
        transcript: 'Hello, this is a test response',
        confidence: 0.85
      });
    }, 2000);
  };

  const playQuestion = (text) => {
    setIsPlayingQuestion(true);
    console.log('Playing:', text);
    setTimeout(() => setIsPlayingQuestion(false), 2000);
  };

  const playExample = (text) => console.log('Playing example:', text);
  const playRecording = () => console.log('Playing recording');
  const clearSession = () => {
    setTranscript('');
    setFeedback(null);
    setError(null);
  };
  const clearError = () => setError(null);

  return {
    isRecording, isProcessing, isPlayingQuestion, transcript, feedback, error, recordingDuration,
    startRecording, stopRecording, playQuestion, playExample, playRecording, clearSession, clearError
  };
};

// Servicio de preguntas simplificado
const simpleQuestionsService = {
  getNextQuestion: () => ({
    question: "What's your name?",
    level: 'beginner',
    category: 'personal',
    sampleAnswer: "My name is Brayan and I'm learning English."
  })
};

const EnglishPracticeApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Hooks
  const speechPractice = useSimpleSpeechPractice();
  const { progress, recordAnswer } = useSimpleProgress();

  // Inicializar primera pregunta
  useEffect(() => {
    if (!currentQuestion) {
      const question = simpleQuestionsService.getNextQuestion();
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
        content: "Hey Brayan! 👋 Let's practice speaking English today.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 2,
        type: 'bot',
        content: `Question for you: "${question.question}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        question: question.question,
        hasAudio: true
      }
    ];
    
    if (question.sampleAnswer) {
      welcomeMessages.push({
        id: 3,
        type: 'bot',
        content: `Here's an example: "${question.sampleAnswer}"`,
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
    const question = simpleQuestionsService.getNextQuestion();
    setCurrentQuestion(question);
    
    const newMessage = {
      id: messages.length + 1,
      type: 'bot',
      content: `New question: "${question.question}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      question: question.question,
      hasAudio: true
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // Manejar respuesta completada
  useEffect(() => {
    if (speechPractice.feedback && speechPractice.feedback.success) {
      const userMessage = {
        id: messages.length + 1,
        type: 'user',
        content: speechPractice.feedback.transcript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true,
        duration: 3,
        confidence: speechPractice.feedback.confidence
      };

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: speechPractice.feedback.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFeedback: true
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
      recordAnswer(currentQuestion);
    }
  }, [speechPractice.feedback, currentQuestion, recordAnswer, messages.length]);

  // 🏠 Pantalla Principal
  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">👋 Hi Brayan!</h1>
          <p className="text-gray-600">Ready to practice your English?</p>
          <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Today's Progress</p>
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
            <span className="text-xl font-semibold">🎤 Start Speaking Practice</span>
          </button>

          <button 
            onClick={() => setCurrentScreen('listening')}
            className="w-full bg-green-500 hover:bg-green-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <Headphones className="mx-auto mb-2" size={32} />
            <span className="text-xl font-semibold">🎧 Listen & Repeat</span>
          </button>

          <button 
            onClick={() => setCurrentScreen('progress')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <BarChart3 className="mx-auto mb-2" size={32} />
            <span className="text-xl font-semibold">📊 My Progress</span>
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
                <h2 className="font-semibold">English Practice Bot</h2>
                <p className="text-sm text-green-200">
                  {speechPractice.isRecording ? 'Listening...' : speechPractice.isProcessing ? 'Processing...' : 'Online'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={getNewQuestion}
            className="p-2 hover:bg-green-700 rounded-full"
            title="Get new question"
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
                  <span className="text-xs text-gray-600">🔊 Tap to hear pronunciation</span>
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
                  <span className="text-xs text-gray-600">📝 Example answer</span>
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
                    <div className="w-1 h-4 bg-green-200 rounded"></div>
                    <div className="w-1 h-6 bg-green-200 rounded"></div>
                    <div className="w-1 h-3 bg-green-200 rounded"></div>
                    <div className="w-1 h-5 bg-green-200 rounded"></div>
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
        
        {speechPractice.isRecording && speechPractice.transcript && (
          <div className="flex justify-end">
            <div className="bg-gray-300 text-gray-700 rounded-lg rounded-tr-none p-3 shadow-sm max-w-xs">
              <p className="italic">"{speechPractice.transcript}"</p>
              <span className="text-xs text-gray-500">Recording...</span>
            </div>
          </div>
        )}
        
        {speechPractice.isProcessing && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
              🤖
            </div>
            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-gray-600">Processing your answer...</span>
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
                <Square size={20} />
                <span>Stop Recording ({speechPractice.recordingDuration}s)</span>
              </>
            ) : speechPractice.isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>Hold to Record</span>
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
              <span className="text-sm text-gray-600">Recording... Speak clearly</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Pantallas simples para Listening y Progress
  const ListeningScreen = () => (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-lg bg-white shadow-md">
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">🎧 Listen & Repeat</h2>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600">Coming soon... 🚧</p>
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
          <h2 className="text-2xl font-bold text-gray-800 ml-4">📊 My Progress</h2>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600">Progress tracking coming soon... 📈</p>
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