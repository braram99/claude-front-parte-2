// src/services/progressService.js
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  query, 
  where, 
  orderBy,
  limit,
  getDocs, 
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

class ProgressService {
  constructor() {
    this.collectionName = 'progress';
    this.sessionsCollectionName = 'practice_sessions';
    this.progressRef = collection(db, this.collectionName);
    this.sessionsRef = collection(db, this.sessionsCollectionName);
  }

  // 📊 Crear o actualizar progreso diario
  async createOrUpdateDailyProgress(userId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const progressId = `${userId}_${targetDate}`;
      
      console.log('📊 Creating/updating daily progress:', progressId);
      
      const progressRef = doc(db, this.collectionName, progressId);
      const existingProgress = await getDoc(progressRef);
      
      const defaultProgressData = {
        id: progressId,
        userId: userId,
        date: targetDate,
        timestamp: Timestamp.fromDate(new Date(targetDate)),
        stats: {
          questionsAnswered: 0,
          totalConversations: 0,
          practiceTimeMinutes: 0,
          averageScore: 0,
          totalWords: 0,
          uniqueTopics: [],
          completedGoal: false
        },
        achievements: [],
        sessions: [], // IDs de sesiones de práctica
        notes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (existingProgress.exists()) {
        // Progreso existe - solo actualizar timestamp
        await updateDoc(progressRef, {
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Daily progress updated');
        return { ...existingProgress.data(), updatedAt: new Date() };
      } else {
        // Nuevo progreso diario
        await setDoc(progressRef, defaultProgressData);
        console.log('✅ New daily progress created');
        return defaultProgressData;
      }
    } catch (error) {
      console.error('❌ Error creating/updating daily progress:', error);
      throw error;
    }
  }

  // 🎯 Registrar sesión de práctica
  async recordPracticeSession(userId, sessionData) {
    try {
      console.log('🎯 Recording practice session for user:', userId);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Datos de la sesión
      const session = {
        userId: userId,
        date: today,
        timestamp: serverTimestamp(),
        question: sessionData.question || '',
        userResponse: sessionData.userResponse || '',
        transcript: sessionData.transcript || sessionData.userResponse || '',
        aiResponse: sessionData.aiResponse || {},
        score: sessionData.score || sessionData.aiResponse?.score || 0,
        confidence: sessionData.confidence || sessionData.aiResponse?.confidence || 0,
        duration: sessionData.duration || 0,
        wordCount: sessionData.wordCount || 0,
        category: sessionData.category || 'general',
        level: sessionData.level || 'beginner',
        feedback: sessionData.feedback || sessionData.aiResponse?.encouragement || '',
        suggestions: sessionData.suggestions || sessionData.aiResponse?.suggestions || [],
        mood: sessionData.aiResponse?.mood || 'neutral',
        grammarScore: sessionData.aiResponse?.grammar?.score || 0,
        vocabularyScore: sessionData.aiResponse?.vocabulary?.score || 0,
        fluencyScore: sessionData.aiResponse?.fluency?.score || 0,
        metadata: {
          userAgent: navigator.userAgent,
          speechService: sessionData.speechService || 'google',
          aiService: sessionData.aiService || 'openrouter',
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }
      };

      // Guardar sesión
      const sessionRef = await addDoc(this.sessionsRef, session);
      console.log('✅ Practice session saved:', sessionRef.id);

      // Actualizar progreso diario
      await this.updateDailyProgressStats(userId, today, {
        sessionId: sessionRef.id,
        score: session.score,
        duration: session.duration,
        wordCount: session.wordCount,
        topic: session.category
      });

      return {
        sessionId: sessionRef.id,
        ...session
      };
    } catch (error) {
      console.error('❌ Error recording practice session:', error);
      throw error;
    }
  }

  // 📈 Actualizar estadísticas diarias
  async updateDailyProgressStats(userId, date, sessionData) {
    try {
      const progressId = `${userId}_${date}`;
      const progressRef = doc(db, this.collectionName, progressId);
      
      // Obtener progreso actual
      const currentProgress = await getDoc(progressRef);
      let stats = currentProgress.exists() ? currentProgress.data().stats : {};
      
      // Calcular nuevas estadísticas
      const newQuestionsAnswered = (stats.questionsAnswered || 0) + 1;
      const newTotalConversations = (stats.totalConversations || 0) + 1;
      const newPracticeTime = (stats.practiceTimeMinutes || 0) + (sessionData.duration / 60);
      const newTotalWords = (stats.totalWords || 0) + (sessionData.wordCount || 0);
      
      // Calcular promedio de score
      const currentAverage = stats.averageScore || 0;
      const currentCount = stats.questionsAnswered || 0;
      const newAverageScore = currentCount === 0 
        ? sessionData.score 
        : ((currentAverage * currentCount) + sessionData.score) / newQuestionsAnswered;

      // Actualizar temas únicos
      const uniqueTopics = stats.uniqueTopics || [];
      if (sessionData.topic && !uniqueTopics.includes(sessionData.topic)) {
        uniqueTopics.push(sessionData.topic);
      }

      // Verificar si se completó la meta diaria (ejemplo: 5 preguntas)
      const dailyGoal = 5; // Esto debería venir de las preferencias del usuario
      const completedGoal = newQuestionsAnswered >= dailyGoal;

      const updatedStats = {
        questionsAnswered: newQuestionsAnswered,
        totalConversations: newTotalConversations,
        practiceTimeMinutes: Math.round(newPracticeTime * 100) / 100,
        averageScore: Math.round(newAverageScore * 100) / 100,
        totalWords: newTotalWords,
        uniqueTopics: uniqueTopics,
        completedGoal: completedGoal
      };

      // Actualizar documento
      await updateDoc(progressRef, {
        stats: updatedStats,
        [`sessions`]: increment(1),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Daily progress stats updated');
      return updatedStats;
    } catch (error) {
      console.error('❌ Error updating daily progress stats:', error);
      throw error;
    }
  }

  // 📅 Obtener progreso de un período
  async getProgressByDateRange(userId, startDate, endDate) {
    try {
      console.log(`📅 Getting progress for ${userId} from ${startDate} to ${endDate}`);
      
      const q = query(
        this.progressRef,
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const progressData = [];
      
      querySnapshot.forEach((doc) => {
        progressData.push({ id: doc.id, ...doc.data() });
      });

      console.log(`✅ Found ${progressData.length} progress records`);
      return progressData;
    } catch (error) {
      console.error('❌ Error getting progress by date range:', error);
      throw error;
    }
  }

  // 📊 Obtener progreso de hoy
  async getTodayProgress(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`📊 Getting today's progress for ${userId}: ${today}`);
      
      const progressId = `${userId}_${today}`;
      const progressRef = doc(db, this.collectionName, progressId);
      const progressSnap = await getDoc(progressRef);
      
      if (progressSnap.exists()) {
        const data = progressSnap.data();
        console.log('✅ Today progress found');
        return data;
      } else {
        console.log('📝 Creating new today progress');
        return await this.createOrUpdateDailyProgress(userId, today);
      }
    } catch (error) {
      console.error('❌ Error getting today progress:', error);
      throw error;
    }
  }

  // 🔥 Obtener racha actual del usuario
  async getCurrentStreak(userId) {
    try {
      console.log(`🔥 Calculating current streak for ${userId}`);
      
      // Obtener últimos 30 días de progreso
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const progressData = await this.getProgressByDateRange(userId, startDate, endDate);
      
      // Calcular racha desde hoy hacia atrás
      let currentStreak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const dayProgress = progressData.find(p => p.date === dateStr);
        
        if (dayProgress && dayProgress.stats.completedGoal) {
          currentStreak++;
        } else {
          break; // Racha rota
        }
      }
      
      console.log(`✅ Current streak: ${currentStreak} days`);
      return currentStreak;
    } catch (error) {
      console.error('❌ Error calculating current streak:', error);
      return 0;
    }
  }

  // 🎯 Obtener sesiones de práctica recientes
  async getRecentSessions(userId, limitCount = 20) {
    try {
      console.log(`🎯 Getting recent sessions for ${userId}`);
      
      const q = query(
        this.sessionsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });

      console.log(`✅ Found ${sessions.length} recent sessions`);
      return sessions;
    } catch (error) {
      console.error('❌ Error getting recent sessions:', error);
      throw error;
    }
  }

  // 📈 Obtener estadísticas agregadas del usuario
  async getUserAggregateStats(userId, days = 30) {
    try {
      console.log(`📈 Getting aggregate stats for ${userId} (${days} days)`);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const progressData = await this.getProgressByDateRange(userId, startDate, endDate);
      
      // Calcular estadísticas agregadas
      const totalDays = progressData.length;
      const totalQuestions = progressData.reduce((sum, day) => sum + (day.stats.questionsAnswered || 0), 0);
      const totalPracticeTime = progressData.reduce((sum, day) => sum + (day.stats.practiceTimeMinutes || 0), 0);
      const totalWords = progressData.reduce((sum, day) => sum + (day.stats.totalWords || 0), 0);
      const averageScore = totalQuestions > 0 
        ? progressData.reduce((sum, day) => sum + ((day.stats.averageScore || 0) * (day.stats.questionsAnswered || 0)), 0) / totalQuestions
        : 0;
      
      const allTopics = progressData.flatMap(day => day.stats.uniqueTopics || []);
      const uniqueTopics = [...new Set(allTopics)];
      
      const completedDays = progressData.filter(day => day.stats.completedGoal).length;
      const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

      const stats = {
        period: { days, startDate, endDate },
        totals: {
          activeDays: totalDays,
          questionsAnswered: totalQuestions,
          practiceTimeMinutes: Math.round(totalPracticeTime * 100) / 100,
          practiceTimeHours: Math.round((totalPracticeTime / 60) * 100) / 100,
          totalWords: totalWords,
          uniqueTopics: uniqueTopics.length,
          completedDays: completedDays
        },
        averages: {
          questionsPerDay: totalDays > 0 ? Math.round((totalQuestions / totalDays) * 100) / 100 : 0,
          practiceTimePerDay: totalDays > 0 ? Math.round((totalPracticeTime / totalDays) * 100) / 100 : 0,
          score: Math.round(averageScore * 100) / 100,
          wordsPerSession: totalQuestions > 0 ? Math.round((totalWords / totalQuestions) * 100) / 100 : 0
        },
        rates: {
          completionRate: Math.round(completionRate * 100) / 100,
          consistencyScore: Math.round((completedDays / days) * 100 * 100) / 100
        },
        topTopics: uniqueTopics.slice(0, 5)
      };

      console.log('✅ Aggregate stats calculated');
      return stats;
    } catch (error) {
      console.error('❌ Error getting aggregate stats:', error);
      throw error;
    }
  }

  // 🏆 Agregar logro
  async addAchievement(userId, achievementData) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const progressId = `${userId}_${today}`;
      const progressRef = doc(db, this.collectionName, progressId);
      
      const achievement = {
        id: achievementData.id,
        title: achievementData.title,
        description: achievementData.description,
        icon: achievementData.icon || '🏆',
        unlockedAt: serverTimestamp(),
        type: achievementData.type || 'general'
      };

      // Obtener progreso actual
      const currentProgress = await getDoc(progressRef);
      const existingAchievements = currentProgress.exists() 
        ? currentProgress.data().achievements || []
        : [];

      // Verificar si el logro ya existe
      if (!existingAchievements.find(a => a.id === achievement.id)) {
        existingAchievements.push(achievement);
        
        await updateDoc(progressRef, {
          achievements: existingAchievements,
          updatedAt: serverTimestamp()
        });

        console.log('🏆 Achievement added:', achievement.title);
        return achievement;
      } else {
        console.log('⚠️ Achievement already exists:', achievement.id);
        return null;
      }
    } catch (error) {
      console.error('❌ Error adding achievement:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const progressService = new ProgressService();
export default progressService;
