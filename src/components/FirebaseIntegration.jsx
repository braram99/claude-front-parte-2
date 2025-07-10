// src/components/FirebaseIntegration.jsx - Wrapper de Firebase
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import FirebaseDebugger from './FirebaseDebugger';
import { Bug, Database, User, TrendingUp, Wifi, WifiOff } from 'lucide-react';

export const FirebaseIntegration = ({ children }) => {
  const { 
    user, 
    loading, 
    error, 
    connectionStatus, 
    savePracticeSession, 
    saveProgress,
    getUserStats,
    getRecentSessions 
  } = useFirebase();
  
  const [showDebugger, setShowDebugger] = useState(false);
  const [stats, setStats] = useState(null);

  // 💾 Función principal para guardar datos de práctica
  const handlePracticeComplete = async (practiceData) => {
    try {
      console.log('🔥 [Firebase Integration] Saving practice data...', {
        question: practiceData.question,
        hasTranscript: !!practiceData.transcript,
        hasAiResponse: !!practiceData.aiResponse,
        score: practiceData.aiResponse?.score,
        duration: practiceData.duration
      });
      
      // Preparar datos de sesión
      const sessionData = {
        question: practiceData.question,
        userResponse: practiceData.userResponse || practiceData.transcript,
        transcript: practiceData.transcript,
        aiResponse: practiceData.aiResponse,
        duration: practiceData.duration || 0,
        level: practiceData.level || 'beginner',
        category: practiceData.category || 'general',
        score: practiceData.aiResponse?.score || 0
      };

      // Guardar sesión
      const sessionId = await savePracticeSession(sessionData);
      
      // Guardar progreso
      const progressData = {
        score: practiceData.aiResponse?.score || 0,
        duration: practiceData.duration || 0
      };
      
      await saveProgress(progressData);
      
      console.log('✅ [Firebase Integration] Practice data saved successfully:', sessionId);
      return {
        success: true,
        sessionId,
        message: 'Practice data saved to Firebase!'
      };
      
    } catch (error) {
      console.error('❌ [Firebase Integration] Failed to save practice data:', error);
      
      // No lanzar error para que la app siga funcionando
      return {
        success: false,
        error: error.message,
        message: 'Failed to save to Firebase, but practice continues!'
      };
    }
  };

  // 📊 Cargar estadísticas al montar
  useEffect(() => {
    if (user && connectionStatus === 'connected') {
      console.log('📊 Loading user stats from Firebase...');
      getUserStats().then(userStats => {
        if (userStats) {
          setStats(userStats);
          console.log('✅ User stats loaded:', userStats);
        }
      });
    }
  }, [user, connectionStatus, getUserStats]);

  // 🔧 Mostrar estado de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connecting to Firebase</h2>
          <p className="text-gray-600">Setting up your English practice session...</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>• Authenticating user</p>
            <p>• Initializing database</p>
            <p>• Loading your progress</p>
          </div>
        </div>
      </div>
    );
  }

  // 🚨 Mostrar error si hay problemas (pero permitir continuar)
  if (error) {
    console.warn('⚠️ Firebase error, but app will continue in offline mode:', error);
  }

  return (
    <div className="relative">
      {/* Firebase Status Indicator */}
      <div className="fixed top-4 right-4 z-30">
        <div className={`rounded-lg shadow-lg p-3 flex items-center space-x-2 transition-all ${
          connectionStatus === 'connected' 
            ? 'bg-green-50 border border-green-200' 
            : connectionStatus === 'error'
            ? 'bg-red-50 border border-red-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {connectionStatus === 'connected' ? (
            <>
              <Wifi size={16} className="text-green-600" />
              <div className="text-xs">
                <div className="font-medium text-green-800">Firebase Active</div>
                <div className="text-green-600">
                  {user?.uid ? `User: ${user.uid.substring(0, 8)}...` : 'Connected'}
                </div>
              </div>
            </>
          ) : connectionStatus === 'error' ? (
            <>
              <WifiOff size={16} className="text-red-600" />
              <div className="text-xs">
                <div className="font-medium text-red-800">Firebase Error</div>
                <div className="text-red-600">Offline Mode</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-xs">
                <div className="font-medium text-yellow-800">Connecting...</div>
                <div className="text-yellow-600">Please wait</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Debug Button - Solo en desarrollo */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setShowDebugger(true)}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg z-40 transition-all hover:scale-110"
          title="Firebase Debugger & Diagnostics"
        >
          <Bug size={20} />
        </button>
      )}

      {/* Stats Summary - Solo si hay stats */}
      {stats && connectionStatus === 'connected' && (
        <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-30 max-w-xs">
          <h4 className="text-sm font-medium text-gray-800 mb-2">📊 Firebase Stats</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total Sessions:</span>
              <span className="font-medium">{stats.totalSessions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Score:</span>
              <span className="font-medium">{stats.averageScore || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Questions:</span>
              <span className="font-medium">{stats.totalQuestions || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* App principal con contexto de Firebase */}
      <div>
        {React.cloneElement(children, {
          // Pasar props de Firebase al componente hijo
          firebaseUser: user,
          firebaseConnectionStatus: connectionStatus,
          firebaseError: error,
          onPracticeComplete: handlePracticeComplete,
          firebaseStats: stats,
          
          // Funciones adicionales de Firebase
          getRecentSessions,
          getUserStats: () => stats
        })}
      </div>

      {/* Debug Modal */}
      {showDebugger && (
        <FirebaseDebugger 
          onClose={() => setShowDebugger(false)}
          user={user}
          connectionStatus={connectionStatus}
          stats={stats}
        />
      )}
      
      {/* Error Toast - Solo mostrar si hay error pero no es crítico */}
      {error && connectionStatus === 'error' && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">
              Firebase offline - App continues locally
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseIntegration;
