// src/services/firebase.js - Configuración Principal
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// 🔥 IMPORTANTE: Reemplaza con tu configuración real
const firebaseConfig = {
  apiKey: "AIzaSyALz-F5N2R2XB5oiAUrh_iVINlQvkUdvfw",
  authDomain: "english-practice-app-b624a.firebaseapp.com",
  projectId: "english-practice-app-b624a",
  storageBucket: "english-practice-app-b624a.firebasestorage.app",
  messagingSenderId: "421231304740",
  appId: "G-0NNQ75DCYR"
};

// Inicializar Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log('🔥 Firebase initialized successfully');
  
  // Solo conectar a emuladores en desarrollo
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    console.log('🔧 Connecting to Firebase emulators...');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

export { app, auth, db };

// ========================================
// src/hooks/useFirebase.js - Hook Principal
// ========================================
import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs 
} from 'firebase/firestore';

export const useFirebase = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔐 Auto-login anónimo
  const signInAnonymous = async () => {
    try {
      console.log('🔐 Attempting anonymous sign in...');
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Anonymous sign in successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Anonymous sign in failed:', error);
      setError(error.message);
      throw error;
    }
  };

  // 👤 Crear/actualizar perfil de usuario
  const createUserProfile = async (userData = {}) => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userProfile = {
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isAnonymous: auth.currentUser.isAnonymous,
        totalSessions: 0,
        totalQuestions: 0,
        averageScore: 0,
        settings: {
          language: 'en-US',
          dailyGoal: 5,
          notifications: true,
          ...userData.settings
        },
        ...userData
      };

      await setDoc(userRef, userProfile, { merge: true });
      console.log('✅ User profile created/updated');
      return userProfile;
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
      throw error;
    }
  };

  // 📝 Guardar sesión de práctica
  const savePracticeSession = async (sessionData) => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const session = {
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        ...sessionData
      };

      const sessionRef = await addDoc(collection(db, 'practice_sessions'), session);
      console.log('✅ Practice session saved:', sessionRef.id);
      
      // Actualizar estadísticas del usuario
      await updateUserStats(sessionData);
      
      return sessionRef.id;
    } catch (error) {
      console.error('❌ Failed to save practice session:', error);
      throw error;
    }
  };

  // 📊 Actualizar estadísticas del usuario
  const updateUserStats = async (sessionData) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentData = userDoc.data();
        const newTotalSessions = (currentData.totalSessions || 0) + 1;
        const newTotalQuestions = (currentData.totalQuestions || 0) + 1;
        const currentTotalScore = (currentData.averageScore || 0) * (currentData.totalQuestions || 0);
        const newAverageScore = Math.round((currentTotalScore + (sessionData.aiResponse?.score || 0)) / newTotalQuestions);

        await setDoc(userRef, {
          totalSessions: newTotalSessions,
          totalQuestions: newTotalQuestions,
          averageScore: newAverageScore,
          lastActive: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Failed to update user stats:', error);
    }
  };

  // 📈 Guardar progreso diario
  const saveProgress = async (progressData) => {
    if (!auth.currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const progressRef = doc(db, 'progress', `${auth.currentUser.uid}_${today}`);
      const progressDoc = await getDoc(progressRef);

      let progress;
      if (progressDoc.exists()) {
        // Actualizar progreso existente
        const currentProgress = progressDoc.data();
        progress = {
          ...currentProgress,
          sessions: (currentProgress.sessions || 0) + 1,
          questionsAnswered: (currentProgress.questionsAnswered || 0) + 1,
          totalScore: (currentProgress.totalScore || 0) + (progressData.score || 0),
          totalDuration: (currentProgress.totalDuration || 0) + (progressData.duration || 0),
          lastUpdated: new Date().toISOString(),
        };
        progress.averageScore = Math.round(progress.totalScore / progress.questionsAnswered);
      } else {
        // Crear nuevo progreso
        progress = {
          userId: auth.currentUser.uid,
          date: today,
          sessions: 1,
          questionsAnswered: 1,
          totalScore: progressData.score || 0,
          averageScore: progressData.score || 0,
          totalDuration: progressData.duration || 0,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
      }

      await setDoc(progressRef, progress);
      console.log('✅ Progress saved for:', today);
      return progress;
    } catch (error) {
      console.error('❌ Failed to save progress:', error);
      throw error;
    }
  };

  // 📊 Obtener estadísticas del usuario
  const getUserStats = async () => {
    if (!auth.currentUser) return null;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return null;
    }
  };

  // 📈 Obtener progreso reciente
  const getRecentProgress = async (days = 7) => {
    if (!auth.currentUser) return [];

    try {
      const progressQuery = query(
        collection(db, 'progress'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('date', 'desc'),
        limit(days)
      );

      const progressSnapshot = await getDocs(progressQuery);
      const progressData = [];
      
      progressSnapshot.forEach((doc) => {
        progressData.push({ id: doc.id, ...doc.data() });
      });

      return progressData;
    } catch (error) {
      console.error('❌ Failed to get recent progress:', error);
      return [];
    }
  };

  // 📝 Obtener sesiones recientes
  const getRecentSessions = async (limit_count = 10) => {
    if (!auth.currentUser) return [];

    try {
      const sessionsQuery = query(
        collection(db, 'practice_sessions'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      
      sessionsSnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });

      return sessions;
    } catch (error) {
      console.error('❌ Failed to get recent sessions:', error);
      return [];
    }
  };

  // 🔄 Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user?.uid || 'No user');
      
      if (user) {
        setUser(user);
        
        // Crear perfil de usuario si no existe
        try {
          await createUserProfile();
        } catch (error) {
          console.error('Failed to create user profile:', error);
        }
      } else {
        // Auto-login anónimo si no hay usuario
        try {
          await signInAnonymous();
        } catch (error) {
          console.error('Auto-login failed:', error);
          setError('Failed to authenticate user');
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    error,
    signInAnonymous,
    createUserProfile,
    savePracticeSession,
    saveProgress,
    getUserStats,
    getRecentProgress,
    getRecentSessions,
    updateUserStats
  };
};

// ========================================
// src/components/FirebaseIntegration.jsx - Integración con App Principal
// ========================================
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import FirebaseDebugger from './FirebaseDebugger';
import { Bug, Database, User, TrendingUp } from 'lucide-react';

export const FirebaseIntegration = ({ children }) => {
  const { user, loading, error, savePracticeSession, saveProgress } = useFirebase();
  const [showDebugger, setShowDebugger] = useState(false);
  const [stats, setStats] = useState(null);

  // 🔄 Función para guardar datos de práctica
  const handlePracticeComplete = async (practiceData) => {
    try {
      console.log('💾 Saving practice data to Firebase...', practiceData);
      
      // Preparar datos de sesión
      const sessionData = {
        question: practiceData.question,
        userResponse: practiceData.userResponse || practiceData.transcript,
        aiResponse: practiceData.aiResponse,
        duration: practiceData.duration || 0,
        level: practiceData.level || 'beginner',
        category: practiceData.category || 'general'
      };

      // Guardar sesión
      const sessionId = await savePracticeSession(sessionData);
      
      // Guardar progreso
      const progressData = {
        score: practiceData.aiResponse?.score || 0,
        duration: practiceData.duration || 0
      };
      
      await saveProgress(progressData);
      
      console.log('✅ Practice data saved successfully:', sessionId);
      return sessionId;
      
    } catch (error) {
      console.error('❌ Failed to save practice data:', error);
      throw error;
    }
  };

  // 🔧 Mostrar estado de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }

  // 🚨 Mostrar error si hay problemas
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Firebase Connection Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Debug Button - Solo en desarrollo */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setShowDebugger(true)}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg z-40"
          title="Firebase Debugger"
        >
          <Bug size={20} />
        </button>
      )}

      {/* Firebase Status Indicator */}
      <div className="fixed top-4 right-4 z-30">
        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-600">
            {user ? 'Firebase Connected' : 'Firebase Disconnected'}
          </span>
        </div>
      </div>

      {/* App principal con contexto de Firebase */}
      <div>
        {React.cloneElement(children, {
          firebaseUser: user,
          onPracticeComplete: handlePracticeComplete
        })}
      </div>

      {/* Debug Modal */}
      {showDebugger && (
        <FirebaseDebugger onClose={() => setShowDebugger(false)} />
      )}
    </div>
  );
};

// ========================================
// src/EnglishPracticeApp.jsx - Modificaciones para Firebase
// ========================================

// AGREGAR AL INICIO DE TU ARCHIVO EnglishPracticeApp.jsx:
/*
import { FirebaseIntegration } from './components/FirebaseIntegration';

// MODIFICAR EL EXPORT FINAL:
const EnglishPracticeAppWithFirebase = () => (
  <FirebaseIntegration>
    <EnglishPracticeApp />
  </FirebaseIntegration>
);

export default EnglishPracticeAppWithFirebase;
*/

// ========================================
// .env - Variables de Entorno
// ========================================

/*
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu-app-id

# Development
VITE_USE_FIREBASE_EMULATOR=false
VITE_OPENROUTER_API_KEY=tu-openrouter-key
*/

// ========================================
// firestore.rules - Reglas de Seguridad
// ========================================

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Practice sessions - users can only access their own
    match /practice_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Progress tracking - users can only access their own
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        progressId.matches(request.auth.uid + '_.*');
    }
    
    // Test collection for debugging (solo en desarrollo)
    match /test/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/
