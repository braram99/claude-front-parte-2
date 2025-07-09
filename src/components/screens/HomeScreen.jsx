// src/components/screens/HomeScreen.jsx - Refactorizado

import React from 'react';
import { Mic, Headphones, BarChart3 } from 'lucide-react';
import ProgressCard from '../ui/ProgressCard';
import AIStatusIndicator from '../ui/AIStatusIndicator';

const HomeScreen = ({ progress, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Header de bienvenida */}
        <WelcomeHeader />
        
        {/* Progreso diario */}
        <ProgressCard progress={progress} />
        
        {/* Botones de navegación */}
        <NavigationButtons onNavigate={onNavigate} />
        
        {/* Estado de IA */}
        <AIStatusIndicator className="mt-6" />
      </div>
    </div>
  );
};

const WelcomeHeader = () => (
  <div className="text-center mb-8">
    <h1 className="text-3xl font-bold text-gray-800 mb-2">👋 ¡Hola!</h1>
    <p className="text-gray-600">¿Listo para practicar con IA avanzada?</p>
  </div>
);

const NavigationButtons = ({ onNavigate }) => {
  const buttons = [
    {
      id: 'speaking',
      icon: Mic,
      title: '🤖 Conversación con IA',
      subtitle: 'Análisis completo + respuestas inteligentes',
      color: 'blue'
    },
    {
      id: 'listening',
      icon: Headphones,
      title: '🎧 Escuchar y Repetir',
      subtitle: '',
      color: 'green'
    },
    {
      id: 'progress',
      icon: BarChart3,
      title: '📊 Mi Progreso',
      subtitle: '',
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-4 mb-6">
      {buttons.map((button) => (
        <NavigationButton
          key={button.id}
          {...button}
          onClick={() => onNavigate(button.id)}
        />
      ))}
    </div>
  );
};

const NavigationButton = ({ icon: Icon, title, subtitle, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600'
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full ${colorClasses[color]} text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105`}
    >
      <Icon className="mx-auto mb-2" size={32} />
      <span className="text-xl font-semibold block">{title}</span>
      {subtitle && (
        <p className="text-sm opacity-80 mt-1">{subtitle}</p>
      )}
    </button>
  );
};

export default HomeScreen;
