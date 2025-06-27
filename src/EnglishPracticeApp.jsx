import React, { useState } from 'react';
import { Home, Mic, Headphones, BarChart3, Play, Volume2, Trophy, Calendar, MessageCircle, RotateCcw } from 'lucide-react';

const EnglishPracticeApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isRecording, setIsRecording] = useState(false);

  // 🏠 Pantalla Principal (Home) - Diseño moderno
  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Saludo personalizado */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">👋 Hi Brayan!</h1>
          <p className="text-gray-600">Ready to practice your English?</p>
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

  // 🎙️ Pantalla de Práctica de Habla (WhatsApp style)
  const SpeakingScreen = () => (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header estilo WhatsApp */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
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
              <p className="text-sm text-green-200">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Mensaje del bot */}
        <div className="flex items-start">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
            🤖
          </div>
          <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-xs">
            <p className="text-gray-800">Hey Brayan! 👋 Let's practice speaking English today.</p>
            <span className="text-xs text-gray-500 mt-1 block">10:30 AM</span>
          </div>
        </div>

        {/* Pregunta del bot */}
        <div className="flex items-start">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
            🤖
          </div>
          <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-xs">
            <p className="text-gray-800 font-medium">Question for you:</p>
            <p className="text-gray-800 mt-1">"What's your favorite food?"</p>
            <span className="text-xs text-gray-500 mt-2 block">10:31 AM</span>
          </div>
        </div>

        {/* Mensaje de audio del bot */}
        <div className="flex items-start">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
            🤖
          </div>
          <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-xs">
            <div className="flex items-center space-x-2">
              <button className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600">
                <Play size={16} />
              </button>
              <div className="flex-1">
                <div className="bg-gray-200 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full w-0"></div>
                </div>
              </div>
              <span className="text-xs text-gray-500">0:03</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">🔊 Tap to hear pronunciation</p>
            <span className="text-xs text-gray-500 mt-1 block">10:31 AM</span>
          </div>
        </div>

        {/* Respuesta del usuario (placeholder) */}
        <div className="flex justify-end">
          <div className="bg-green-500 text-white rounded-lg rounded-tr-none p-3 shadow-sm max-w-xs">
            <div className="flex items-center space-x-2">
              <Mic size={16} />
              <span>Voice message</span>
              <div className="flex space-x-1">
                <div className="w-1 h-4 bg-green-200 rounded"></div>
                <div className="w-1 h-6 bg-green-200 rounded"></div>
                <div className="w-1 h-3 bg-green-200 rounded"></div>
                <div className="w-1 h-5 bg-green-200 rounded"></div>
              </div>
            </div>
            <span className="text-xs text-green-200 mt-1 block">✓✓ 10:32 AM</span>
          </div>
        </div>
      </div>

      {/* Input area estilo WhatsApp */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <button className="bg-gray-200 hover:bg-gray-300 p-3 rounded-full">
            <Volume2 size={20} className="text-gray-600" />
          </button>
          
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`p-3 rounded-full flex-1 flex items-center justify-center space-x-2 transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <Mic size={20} />
            <span>{isRecording ? 'Recording...' : 'Hold to record'}</span>
          </button>
          
          <button className="bg-gray-200 hover:bg-gray-300 p-3 rounded-full">
            <span className="text-gray-600">➡️</span>
          </button>
        </div>
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
              "Hello, how are you doing today?"
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg">
              <Play size={24} />
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg">
              <Mic size={24} />
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full shadow-lg">
              <RotateCcw size={24} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Progress</h3>
          <div className="bg-gray-200 rounded-full h-4 mb-3">
            <div className="bg-green-500 h-4 rounded-full w-2/3 transition-all duration-500"></div>
          </div>
          <p className="text-sm text-gray-600">6 of 10 phrases completed</p>
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
                <p className="text-2xl font-bold text-blue-500">15 days</p>
              </div>
            </div>
          </div>

          {/* Respuestas grabadas */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <MessageCircle className="text-green-500 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">🔊 Recorded Answers</h3>
                <p className="text-2xl font-bold text-green-500">42 recordings</p>
              </div>
            </div>
          </div>

          {/* Logros */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-3">
              <Trophy className="text-yellow-500 mr-3" size={24} />
              <h3 className="font-semibold text-gray-800">🥇 Achievements</h3>
            </div>
            <div className="space-y-2">
              <div className="bg-yellow-100 p-2 rounded-lg text-sm">✅ Completed 5 speaking tasks</div>
              <div className="bg-blue-100 p-2 rounded-lg text-sm">✅ First week completed</div>
              <div className="bg-green-100 p-2 rounded-lg text-sm">✅ 25 questions answered</div>
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