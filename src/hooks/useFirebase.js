// src/hooks/useFirebase.js - Hook Principal de Firebase
import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { 
  signInAnonymously, 
  onAuthStateChanged 
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
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

export const useFirebase = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // 🔐 Auto-login anónimo
  const signInAnonymous = async () => {
    try {
      console.log('🔐 Attempting anonymous sign in...');
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Anonymous sign in successful:', userCredential.user.uid);
      setConnectionStatus('connected');
      return userCredential.user;
    } catch (error) {
      console.error('❌ Anonymous sign in failed:', error);
      setError(error.message);
      setConnectionStatus('error');
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
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
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
        browser: navigator.userAgent,
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
      console.error('❌ No authenticated user for saving session');
      throw new Error('No authenticated user');
    }

    try {
      console.log('💾 Saving practice session to Firebase...', sessionData);
      
      const session = {
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
        question: sessionData.question || '',
        userResponse: sessionData.userResponse || sessionData.transcript || '',
        transcript: sessionData.transcript || sessionData.userResponse || '',
        duration: sessionData.duration || 0,
        
        // AI Response data
        aiResponse: sessionData.aiResponse || {},
        score: sessionData.score || sessionData.aiResponse?.score || 0,
        confidence: sessionData.confidence || sessionData.aiResponse?.confidence || 0,
        encouragement: sessionData.aiResponse?.encouragement || '',
        suggestions: sessionData.aiResponse?.suggestions || [],
        followUpQuestion: sessionData.aiResponse?.followUpQuestion || '',
        
        // Analysis
        grammar: sessionData.aiResponse?.grammar || {},
        vocabulary: sessionData.aiResponse?.vocabulary || {},
        fluency: sessionData.aiResponse?.fluency || {},
        
        // Metadata
        level: sessionData.level || 'beginner',
        category: sessionData.category || 'general',
        wordCount: sessionData.transcript ? sessionData.transcript.split(' ').length : 0,
        
        // Technical info
        speechService: 'google',
        aiService: 'openrouter',
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      };

      const sessionRef = await addDoc(collection(db, 'practice_sessions'), session);
      console.log('✅ Practice session saved to Firebase:', sessionRef.id);
      
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
        const newScore = sessionData.score || sessionData.aiResponse?.score || 0;
        const newAverageScore = Math.round((currentTotalScore + newScore) / newTotalQuestions);

        await setDoc(userRef, {
          totalSessions: newTotalSessions,
          totalQuestions: newTotalQuestions,
          averageScore: newAverageScore,
          lastActive: serverTimestamp(),
        }, { merge: true });
        
        console.log('✅ User stats updated');
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
          lastUpdated: serverTimestamp(),
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
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
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

  // 📝 Obtener sesiones recientes
  const getRecentSessions = async (limitCount = 10) => {
    if (!auth.currentUser) return [];

    try {
      const sessionsQuery = query(
        collection(db, 'practice_sessions'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
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
    console.log('🔄 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user?.uid || 'No user');
      
      if (user) {
        setUser(user);
        setConnectionStatus('connected');
        
        // Crear perfil de usuario si no existe
        try {
          await createUserProfile();
        } catch (error) {
          console.error('Failed to create user profile:', error);
        }
      } else {
        // Auto-login anónimo si no hay usuario
        try {
          console.log('🔐 No user found, attempting auto-login...');
          await signInAnonymous();
        } catch (error) {
          console.error('Auto-login failed:', error);
          setError('Failed to authenticate user');
          setConnectionStatus('error');
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    // Estado
    user,
    loading,
    error,
    connectionStatus,
    
    // Métodos
    signInAnonymous,
    createUserProfile,
    savePracticeSession,
    saveProgress,
    getUserStats,
    getRecentSessions,
    updateUserStats
  };
};
