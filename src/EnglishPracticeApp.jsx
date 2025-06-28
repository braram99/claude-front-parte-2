import React, { useState, useEffect } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, Trophy, Calendar, MessageCircle, RotateCcw, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import questionsService from './services/questionsService';
import useSpeechPractice from './hooks/useSpeechPractice';
import useProgress from './hooks/useProgress';

const EnglishPracticeApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Hooks
  const {
    isRecording,
    isProcessing,
    isPlayingQuestion,
    transcript,
    feedback,
    error,
    recordingDuration,
    startRecording,
    stopRecording,
    playQuestion,
    playExample,
    playRecording,
    clearSession,
    clearError
  } = useSpeechPractice();

  const { progress, recordAnswer } = useProgress();

  // Inicializar primera pregunta
  useEffect(() => {
    if (!currentQuestion) {
      const question = questionsService.getNextQuestion();
      setCurrentQuestion(question);
      initializeChat(question);
    }
  }, [currentQuestion]);

  // Inicializar chat con mensajes de bienvenida
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
    clearSession();
    const question = questionsService.getNextQuestion();
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
    if (feedback && feedback.success) {
      // Agregar mensaje del usuario
      const userMessage = {
        id: messages.length + 1,
        type: 'user',
        content: feedback.transcript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true,
        audioUrl: feedback.audioUrl,
        duration: feedback.duration,
        confidence: feedback.confidence
      };

      // Agregar respuesta del bot
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: feedback.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFeedback: true
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
      
      // Registrar progreso
      recordAnswer(currentQuestion, feedback.audioBlob);
    }
  }, [feedback, currentQuestion, recordAnswer]);

  // 🏠 Pantalla Principal (Home)
  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Saludo personalizado */}
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

        {/* 3 Botones principales */}
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

  // 🎙️ Pantalla de Práctica de Habla
  const SpeakingScreen = () => (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header estilo WhatsApp */}
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
                  {isRecording ? 'Listening...' : isProcessing ? 'Processing...' : 'Online'}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
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
              {/* Contenido del mensaje */}
              <p className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                {message.content}
              </p>
              
              {/* Audio player para preguntas */}
              {message.hasAudio && message.question && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => playQuestion(message.question)}
                    disabled={isPlayingQuestion}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 disabled:opacity-50"
                  >
                    {isPlayingQuestion ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  </button>
                  <span className="text-xs text-gray-600">🔊 Tap to hear pronunciation</span>
                </div>
              )}
              
              {/* Audio player para ejemplos */}
              {message.isExample && message.exampleText && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => playExample(message.exampleText)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                  >
                    <Volume2 size={16} />
                  </button>
                  <span className="text-xs text-gray-600">📝 Example answer</span>
                </div>
              )}
              
              {/* Audio player para respuestas del usuario */}
              {message.type === 'user' && message.hasAudio && (
                <div className="mt-2 flex items-center space-x-2">
                  <button 
                    onClick={playRecording}
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
              
              {/* Feedback styling */}
              {message.isFeedback && (
                <div className="mt-2">
                  {feedback?.success ? (
                    <CheckCircle size={16} className="text-green-500 inline mr-1" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500 inline mr-1" />
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
        
        {/* Transcript en tiempo real */}
        {isRecording && transcript && (
          <div className="flex justify-end">
            <div className="bg-gray-300 text-gray-700 rounded-lg rounded-tr-none p-3 shadow-sm max-w-xs">
              <p className="italic">"{transcript}"</p>
              <span className="text-xs text-gray-500">Recording...</span>
            </div>
          </div>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
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

      {/* Input area estilo WhatsApp */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          {/* Botón para reproducir pregunta actual */}
          <button 
            onClick={() => currentQuestion && playQuestion(currentQuestion.question)}
            disabled={isPlayingQuestion || isRecording}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 p-3 rounded-full"
          >
            {isPlayingQuestion ? (
              <Loader2 size={20} className="text-gray-600 animate-spin" />
            ) : (
              <Volume2 size={20} className="text-gray-600" />
            )}
          </button>
          
          {/* Botón principal de grabación */}
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isPlayingQuestion}
            className={`p-3 rounded-full flex-1 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRecording ? (
              <>
                <Square size={20} />
                <span>Stop Recording ({recordingDuration}s)</span>
              </>
            ) : isProcessing ? (
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
          
          {/* Botón para nueva pregunta */}
          <button 
            onClick={getNewQuestion}
            disabled={isRecording || isProcessing}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 p-3 rounded-full"
          >
            <RotateCcw size={20} className="text-gray-600" />
          </button>
        </div>
        
        {/* Recording indicator */}
        {isRecording && (
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

  // 🎧 Pantalla Listen & Repeat
  const ListeningScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setCurrentScreen('home')}
            className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
          >
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">🎧 Listen & Repeat</h2>
        </div>

        {/* Contenido de listening */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Phrase:</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xl text-gray-700 text-center font-medium">
              {currentQuestion ? currentQuestion.question : "Loading..."}
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => currentQuestion && playQuestion(currentQuestion.question)}
              disabled={isPlayingQuestion}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white p-4 rounded-full shadow-lg"
            >
              {isPlayingQuestion ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
            </button>
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-4 rounded-full shadow-lg text-white ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRecording ? <Square size={24} /> : <Mic size={24} />}
            </button>
            <button 
              onClick={getNewQuestion}
              disabled={isRecording || isProcessing}
              className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white p-4 rounded-full shadow-lg"
            >
              <RotateCcw size={24} />
            </button>
          </div>
          
          {/* Live transcript */}
          {(isRecording || transcript) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Your response:</p>
              <p className="text-gray-800 italic">"{transcript || 'Listening...'}"</p>
            </div>
          )}
          
          {/* Feedback */}
          {feedback && (
            <div className={`mt-4 p-3 rounded-lg ${
              feedback.success ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <p className={`font-medium ${feedback.success ? 'text-green-800' : 'text-orange-800'}`}>
                {feedback.message}
              </p>
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Suggestions:</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Progress</h3>
          <div className="bg-gray-200 rounded-full h-4 mb-3">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress.completionRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {progress.todayProgress} of {progress.dailyGoal} questions completed
          </p>
          
          {progress.isGoalCompleted && (
            <div className="mt-3 p-2 bg-green-100 rounded-lg text-center">
              <span className="text-green-700 font-medium">🎉 Daily goal completed!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 📊 Pantalla de Progreso
  const ProgressScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setCurrentScreen('home')}
            className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
          >
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">📊 My Progress</h2>
        </div>

        {/* Stats Cards */}
        <div className="space-y-4">
          {/* Días practicando */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <Calendar className="text-blue-500 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">🕒 Days Practicing</h3>
                <p className="text-2xl font-bold text-blue-500">{progress.totalDays} days</p>
                <p className="text-sm text-gray-600">Current streak: {progress.currentStreak} days</p>
              </div>
            </div>
          </div>

          {/* Respuestas grabadas */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <MessageCircle className="text-green-500 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">🔊 Total Progress</h3>
                <p className="text-2xl font-bold text-green-500">{progress.questionsAnswered} questions</p>
                <p className="text-sm text-gray-600">{progress.totalRecordings} recordings made</p>
              </div>
            </div>
          </div>

          {/* Progreso de hoy */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Trophy className="text-yellow-500 mr-3" size={24} />
                <h3 className="font-semibold text-gray-800">📅 Today's Goal</h3>
              </div>
              <span className="text-lg font-bold text-gray-800">
                {progress.todayProgress}/{progress.dailyGoal}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.completionRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {progress.isGoalCompleted ? 
                '🎉 Goal completed!' : 
                `${progress.questionsRemaining} questions remaining`
              }
            </p>
          </div>

          {/* Logros */}
          {progress.achievements && progress.achievements.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-3">
                <Trophy className="text-yellow-500 mr-3" size={24} />
                <h3 className="font-semibold text-gray-800">🥇 Achievements</h3>
              </div>
              <div className="space-y-2">
                {progress.achievements.slice(-3).map((achievement, index) => (
                  <div key={achievement.id || index} className="bg-yellow-100 p-3 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🏆</span>
                      <div>
                        <p className="font-medium text-yellow-800">{achievement.title}</p>
                        <p className="text-sm text-yellow-700">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nivel actual */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">📈 Current Level</h3>
                <p className="text-xl font-bold text-purple-500 capitalize">{progress.currentLevel}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Level Progress</p>
                <p className="text-lg font-bold text-gray-800">
                  {Math.min(100, Math.round((progress.questionsAnswered / 10) * 100))}%
                </p>
              </div>
            </div>
          </div>
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