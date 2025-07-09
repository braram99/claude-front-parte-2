// src/components/screens/ProgressScreen.jsx - Refactorizado

import React from 'react';
import { Home } from 'lucide-react';

const ProgressScreen = ({ progress, onHome }) => {
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
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={onHome} className="p-2 rounded-lg bg-white shadow-md">
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 ml-4">📊 Mi Progreso</h2>
        </div>
        
        <div className="space-y-4">
          {/* Estadísticas principales */}
          <StatsCard progress={safeProgress} />
          
          {/* Progreso diario */}
          <DailyProgressCard progress={safeProgress} />
          
          {/* Estado de IA */}
          <AIActiveCard />
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ progress }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg">
    <h3 className="text-lg font-semibold mb-4 text-center">Estadísticas con IA</h3>
    <div className="grid grid-cols-2 gap-4">
      <StatItem
        value={progress.todayProgress}
        label="Análisis IA Hoy"
        color="blue"
      />
      <StatItem
        value={progress.currentStreak}
        label="Días Seguidos"
        color="green"
      />
    </div>
  </div>
);

const StatItem = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className={`${colorClasses[color]} p-3 rounded-lg text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

const DailyProgressCard = ({ progress }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg">
    <div>
      <p className="text-sm text-gray-600 mb-2">Meta Diaria con IA</p>
      <div className="flex items-center">
        <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.completionRate}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium">
          {progress.todayProgress}/{progress.dailyGoal}
        </span>
      </div>
    </div>
    
    <div className="mt-4 text-center">
      <p className="text-sm text-gray-600">
        {progress.completionRate >= 100
          ? "🎉 ¡Meta del día completada!" 
          : `${Math.max(0, progress.dailyGoal - progress.todayProgress)} análisis más para completar`
        }
      </p>
    </div>
  </div>
);

const AIActiveCard = () => (
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg border border-blue-200">
    <h3 className="text-lg font-semibold mb-3 text-gray-800">🤖 IA Activa</h3>
    <div className="space-y-2">
      <AIFeatureItem color="green" label="Análisis completo activado" />
      <AIFeatureItem color="blue" label="Respuestas inteligentes" />
      <AIFeatureItem color="purple" label="Audio automático" />
      <AIFeatureItem color="orange" label="Follow-up questions" />
    </div>
  </div>
);

const AIFeatureItem = ({ color, label }) => {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="flex items-center text-sm">
      <div className={`w-2 h-2 rounded-full ${colorClasses[color]} mr-3`}></div>
      <span className="text-gray-700">{label}</span>
    </div>
  );
};

export default ProgressScreen;
