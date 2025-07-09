// src/components/ui/ProgressCard.jsx

import React from 'react';
import { TrendingUp, Target, Calendar, CheckCircle } from 'lucide-react';

const ProgressCard = ({ progress }) => {
  const safeProgress = {
    ...progress,
    todayProgress: Math.min(progress?.todayProgress || 0, progress?.dailyGoal || 5),
    completionRate: Math.min(100, Math.max(0, 
      progress?.dailyGoal > 0 
        ? Math.round(((progress?.todayProgress || 0) / (progress?.dailyGoal || 5)) * 100)
        : 0
    ))
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">📊 Progreso de Hoy</h3>
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Meta Diaria</span>
          <span className="text-sm text-gray-600">
            {safeProgress.todayProgress}/{safeProgress.dailyGoal}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${safeProgress.completionRate}%` }}
          >
            {safeProgress.completionRate >= 100 && (
              <div className="flex items-center justify-center h-full">
                <CheckCircle size={12} className="text-white" />
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <span className={`text-sm font-medium ${
            safeProgress.completionRate >= 100 
              ? 'text-green-600' 
              : safeProgress.completionRate >= 50 
              ? 'text-blue-600' 
              : 'text-gray-600'
          }`}>
            {safeProgress.completionRate}% completado
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatItem
          icon={<Target size={16} />}
          label="Racha Actual"
          value={`${safeProgress.currentStreak || 0} días`}
          color="orange"
        />
        <StatItem
          icon={<TrendingUp size={16} />}
          label="Total Sesiones"
          value={safeProgress.totalRecordings || 0}
          color="green"
        />
      </div>

      {/* Status Message */}
      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
        <p className="text-sm text-center">
          {safeProgress.completionRate >= 100 ? (
            <span className="text-green-700 font-medium">
              🎉 ¡Meta del día completada! Excelente trabajo.
            </span>
          ) : (
            <span className="text-blue-700">
              💪 Te quedan {Math.max(0, safeProgress.dailyGoal - safeProgress.todayProgress)} conversaciones para completar tu meta.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center space-x-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

export default ProgressCard;
