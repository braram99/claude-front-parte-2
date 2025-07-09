// src/services/usersService.js
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

class UsersService {
  constructor() {
    this.collectionName = 'users';
    this.usersRef = collection(db, this.collectionName);
  }

  // 👤 Crear o actualizar usuario
  async createOrUpdateUser(userId, userData) {
    try {
      console.log('🔥 Creating/updating user:', userId);
      
      const userRef = doc(db, this.collectionName, userId);
      const existingUser = await getDoc(userRef);
      
      const defaultUserData = {
        id: userId,
        email: userData.email || null,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        country: userData.country || null,
        nativeLanguage: userData.nativeLanguage || 'es',
        englishLevel: userData.englishLevel || 'beginner',
        learningGoals: userData.learningGoals || [],
        preferences: {
          dailyGoal: 5,
          notifications: true,
          audioAutoplay: true,
          speechService: 'google',
          theme: 'light'
        },
        stats: {
          totalConversations: 0,
          totalQuestions: 0,
          totalPracticeTime: 0,
          averageScore: 0,
          streak: 0,
          longestStreak: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        isActive: true
      };

      if (existingUser.exists()) {
        // Usuario existe - actualizar solo campos necesarios
        const updateData = {
          ...userData,
          updatedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        };
        
        await updateDoc(userRef, updateData);
        console.log('✅ User updated successfully');
        
        return { ...existingUser.data(), ...updateData };
      } else {
        // Usuario nuevo - crear con todos los campos
        const newUserData = { ...defaultUserData, ...userData };
        await setDoc(userRef, newUserData);
        console.log('✅ New user created successfully');
        
        return newUserData;
      }
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      throw error;
    }
  }

  // 🔍 Obtener usuario por ID
  async getUserById(userId) {
    try {
      console.log('🔍 Getting user:', userId);
      
      const userRef = doc(db, this.collectionName, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('✅ User found:', userData.displayName || userData.email);
        return userData;
      } else {
        console.log('❌ User not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  }

  // 📧 Buscar usuario por email
  async getUserByEmail(email) {
    try {
      console.log('🔍 Searching user by email:', email);
      
      const q = query(this.usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('✅ User found by email');
        return userData;
      } else {
        console.log('❌ User not found by email');
        return null;
      }
    } catch (error) {
      console.error('❌ Error searching user by email:', error);
      throw error;
    }
  }

  // 🔄 Actualizar preferencias del usuario
  async updateUserPreferences(userId, preferences) {
    try {
      console.log('🔄 Updating user preferences:', userId);
      
      const userRef = doc(db, this.collectionName, userId);
      await updateDoc(userRef, {
        preferences: preferences,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Preferences updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  }

  // 📊 Actualizar estadísticas del usuario
  async updateUserStats(userId, statsUpdate) {
    try {
      console.log('📊 Updating user stats:', userId);
      
      const userRef = doc(db, this.collectionName, userId);
      
      // Usar increment para estadísticas numéricas
      const updateData = {
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      };

      // Procesar incrementos
      if (statsUpdate.totalConversations) {
        updateData['stats.totalConversations'] = increment(statsUpdate.totalConversations);
      }
      if (statsUpdate.totalQuestions) {
        updateData['stats.totalQuestions'] = increment(statsUpdate.totalQuestions);
      }
      if (statsUpdate.totalPracticeTime) {
        updateData['stats.totalPracticeTime'] = increment(statsUpdate.totalPracticeTime);
      }

      // Procesar valores absolutos
      if (statsUpdate.averageScore !== undefined) {
        updateData['stats.averageScore'] = statsUpdate.averageScore;
      }
      if (statsUpdate.streak !== undefined) {
        updateData['stats.streak'] = statsUpdate.streak;
      }
      if (statsUpdate.longestStreak !== undefined) {
        updateData['stats.longestStreak'] = statsUpdate.longestStreak;
      }

      await updateDoc(userRef, updateData);
      console.log('✅ Stats updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating stats:', error);
      throw error;
    }
  }

  // 🎯 Actualizar nivel de inglés
  async updateEnglishLevel(userId, newLevel) {
    try {
      console.log('🎯 Updating English level:', userId, newLevel);
      
      const userRef = doc(db, this.collectionName, userId);
      await updateDoc(userRef, {
        englishLevel: newLevel,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ English level updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating English level:', error);
      throw error;
    }
  }

  // 🏆 Actualizar racha de práctica
  async updateStreak(userId, currentStreak, isNewRecord = false) {
    try {
      console.log('🏆 Updating streak:', userId, currentStreak);
      
      const userRef = doc(db, this.collectionName, userId);
      const updateData = {
        'stats.streak': currentStreak,
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      };

      if (isNewRecord) {
        updateData['stats.longestStreak'] = currentStreak;
      }

      await updateDoc(userRef, updateData);
      console.log('✅ Streak updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating streak:', error);
      throw error;
    }
  }

  // 🔍 Obtener usuarios activos (para analytics)
  async getActiveUsers(limitCount = 100) {
    try {
      console.log('🔍 Getting active users');
      
      const q = query(
        this.usersRef, 
        where('isActive', '==', true),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`✅ Found ${users.length} active users`);
      return users;
    } catch (error) {
      console.error('❌ Error getting active users:', error);
      throw error;
    }
  }

  // 🗑️ Desactivar usuario (soft delete)
  async deactivateUser(userId) {
    try {
      console.log('🗑️ Deactivating user:', userId);
      
      const userRef = doc(db, this.collectionName, userId);
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ User deactivated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deactivating user:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const usersService = new UsersService();
export default usersService;
