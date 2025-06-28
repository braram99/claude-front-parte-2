import { useState, useEffect, useCallback } from 'react';

const useProgress = () => {
  const [progress, setProgress] = useState({
    totalDays: 0,
    currentStreak: 0,
    totalRecordings: 0,
    questionsAnswered: 0,
    currentLevel: 'beginner',
    achievements: [],
    dailyGoal: 5, // 5 preguntas por día
    todayProgress: 0,
    startDate: null,
    lastActiveDate: null
  });

  const [todayQuestions, setTodayQuestions] = useState([]);

  // Cargar progreso desde memoria al inicializar
  useEffect(() => {
    loadProgress();
  }, []);

  // Obtener fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Cargar progreso desde memoria
  const loadProgress = () => {
    try {
      const savedProgress = JSON.parse(localStorage.getItem('englishPracticeProgress') || '{}');
      const savedTodayQuestions = JSON.parse(localStorage.getItem('todayQuestions') || '[]');
      
      // Verificar si es un nuevo día
      const today = getTodayDate();
      const lastActive = savedProgress.lastActiveDate;
      
      if (lastActive !== today) {
        // Nuevo día - resetear progreso diario pero mantener streak si fue ayer
        const wasYesterday = isYesterday(lastActive);
        
        setProgress(prev => ({
          ...prev,
          ...savedProgress,
          todayProgress: 0,
          currentStreak: wasYesterday ? (savedProgress.currentStreak || 0) : 0,
          lastActiveDate: today
        }));
        
        setTodayQuestions([]);
        localStorage.setItem('todayQuestions', JSON.stringify([]));
      } else {
        // Mismo día - cargar progreso completo
        setProgress(prev => ({
          ...prev,
          ...savedProgress
        }));
        setTodayQuestions(savedTodayQuestions);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      initializeProgress();
    }
  };

  // Verificar si una fecha fue ayer
  const isYesterday = (dateString) => {
    if (!dateString) return false;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateString === yesterday.toISOString().split('T')[0];
  };

  // Inicializar progreso para nuevo usuario
  const initializeProgress = () => {
    const today = getTodayDate();
    const initialProgress = {
      totalDays: 1,
      currentStreak: 1,
      totalRecordings: 0,
      questionsAnswered: 0,
      currentLevel: 'beginner',
      achievements: [],
      dailyGoal: 5,
      todayProgress: 0,
      startDate: today,
      lastActiveDate: today
    };
    
    setProgress(initialProgress);
    saveProgress(initialProgress);
  };

  // Guardar progreso en memoria
  const saveProgress = (progressData) => {
    try {
      localStorage.setItem('englishPracticeProgress', JSON.stringify(progressData));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Registrar nueva grabación/respuesta
  const recordAnswer = useCallback((questionData, audioBlob) => {
    const today = getTodayDate();
    
    setProgress(prev => {
      const newProgress = {
        ...prev,
        totalRecordings: prev.totalRecordings + 1,
        questionsAnswered: prev.questionsAnswered + 1,
        todayProgress: prev.todayProgress + 1,
        lastActiveDate: today,
        // Actualizar streak si es necesario
        currentStreak: prev.lastActiveDate === today ? prev.currentStreak : prev.currentStreak + 1,
        totalDays: prev.lastActiveDate === today ? prev.totalDays : prev.totalDays + 1
      };

      // Verificar logros
      const newAchievements = checkAchievements(newProgress, prev);
      newProgress.achievements = [...prev.achievements, ...newAchievements];

      saveProgress(newProgress);
      return newProgress;
    });

    // Guardar pregunta de hoy
    const newTodayQuestion = {
      question: questionData.question,
      timestamp: new Date().toISOString(),
      level: questionData.level,
      category: questionData.category
    };

    setTodayQuestions(prev => {
      const updated = [...prev, newTodayQuestion];
      localStorage.setItem('todayQuestions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Verificar logros nuevos
  const checkAchievements = (newProgress, oldProgress) => {
    const newAchievements = [];
    
    // Primer grabación
    if (oldProgress.totalRecordings === 0 && newProgress.totalRecordings === 1) {
      newAchievements.push({
        id: 'first_recording',
        title: '🎤 First Recording',
        description: 'Completed your first speaking exercise!',
        unlockedAt: new Date().toISOString()
      });
    }

    // 5 preguntas respondidas
    if (oldProgress.questionsAnswered < 5 && newProgress.questionsAnswered >= 5) {
      newAchievements.push({
        id: 'five_questions',
        title: '🌟 Getting Started',
        description: 'Answered 5 questions!',
        unlockedAt: new Date().toISOString()
      });
    }

    // Primera semana completa
    if (oldProgress.totalDays < 7 && newProgress.totalDays >= 7) {
      newAchievements.push({
        id: 'first_week',
        title: '📅 One Week Strong',
        description: 'Practiced for 7 days!',
        unlockedAt: new Date().toISOString()
      });
    }

    // Meta diaria alcanzada
    if (oldProgress.todayProgress < oldProgress.dailyGoal && newProgress.todayProgress >= newProgress.dailyGoal) {
      newAchievements.push({
        id: 'daily_goal',
        title: '🎯 Daily Goal Achieved',
        description: `Completed ${newProgress.dailyGoal} questions today!`,
        unlockedAt: new Date().toISOString()
      });
    }

    // Racha de 5 días
    if (oldProgress.currentStreak < 5 && newProgress.currentStreak >= 5) {
      newAchievements.push({
        id: 'five_day_streak',
        title: '🔥 On Fire!',
        description: '5-day practice streak!',
        unlockedAt: new Date().toISOString()
      });
    }

    // 25 preguntas respondidas
    if (oldProgress.questionsAnswered < 25 && newProgress.questionsAnswered >= 25) {
      newAchievements.push({
        id: 'twenty_five_questions',
        title: '🚀 Quarter Century',
        description: 'Answered 25 questions!',
        unlockedAt: new Date().toISOString()
      });
    }

    return newAchievements;
  };

  // Actualizar nivel
  const updateLevel = useCallback((newLevel) => {
    setProgress(prev => {
      const updated = { ...prev, currentLevel: newLevel };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Cambiar meta diaria
  const setDailyGoal = useCallback((goal) => {
    setProgress(prev => {
      const updated = { ...prev, dailyGoal: goal };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Obtener estadísticas para mostrar
  const getStats = () => {
    const completionRate = progress.dailyGoal > 0 
      ? Math.round((progress.todayProgress / progress.dailyGoal) * 100) 
      : 0;

    return {
      ...progress,
      completionRate,
      isGoalCompleted: progress.todayProgress >= progress.dailyGoal,
      questionsRemaining: Math.max(0, progress.dailyGoal - progress.todayProgress),
      todayQuestions: todayQuestions.length
    };
  };

  // Resetear progreso (para testing o nuevo usuario)
  const resetProgress = useCallback(() => {
    const today = getTodayDate();
    const resetData = {
      totalDays: 1,
      currentStreak: 1,
      totalRecordings: 0,
      questionsAnswered: 0,
      currentLevel: 'beginner',
      achievements: [],
      dailyGoal: 5,
      todayProgress: 0,
      startDate: today,
      lastActiveDate: today
    };
    
    setProgress(resetData);
    setTodayQuestions([]);
    localStorage.setItem('englishPracticeProgress', JSON.stringify(resetData));
    localStorage.setItem('todayQuestions', JSON.stringify([]));
  }, []);

  return {
    progress: getStats(),
    todayQuestions,
    recordAnswer,
    updateLevel,
    setDailyGoal,
    resetProgress,
    loadProgress
  };
};

export default useProgress;