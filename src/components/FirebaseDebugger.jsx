// src/components/FirebaseDebugger.jsx
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  RefreshCw,
  Eye,
  Bug
} from 'lucide-react';

// Firebase imports
import { auth, db } from '../services/firebase';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  connectAuthEmulator 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc,
  onSnapshot,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';

const FirebaseDebugger = ({ onClose }) => {
  const [debugResults, setDebugResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [testData, setTestData] = useState(null);
  const [liveData, setLiveData] = useState({});
  const [logs, setLogs] = useState([]);

  // 📝 Logger function
  const addLog = (type, message, data = null) => {
    const newLog = {
      id: Date.now(),
      type, // success, error, info, warning
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]); // Keep last 20 logs
    console.log(`🔍 [Firebase Debug ${type.toUpperCase()}]:`, message, data);
  };

  // 🔥 Firebase Connection Test
  const testFirebaseConnection = async () => {
    addLog('info', 'Testing Firebase connection...');
    
    try {
      // Test Auth
      const authResult = await testAuthentication();
      setDebugResults(prev => ({ ...prev, auth: authResult }));

      // Test Firestore
      const firestoreResult = await testFirestore();
      setDebugResults(prev => ({ ...prev, firestore: firestoreResult }));

      // Test Real Data
      const dataResult = await testDataOperations();
      setDebugResults(prev => ({ ...prev, data: dataResult }));

      addLog('success', 'Firebase diagnostic complete!');
      
    } catch (error) {
      addLog('error', 'Firebase diagnostic failed', error.message);
    }
  };

  // 🔐 Test Authentication
  const testAuthentication = async () => {
    addLog('info', '🔐 Testing Firebase Authentication...');
    
    try {
      // Check if already signed in
      if (auth.currentUser) {
        addLog('success', 'User already authenticated', {
          uid: auth.currentUser.uid,
          isAnonymous: auth.currentUser.isAnonymous
        });
        
        return {
          connected: true,
          user: {
            uid: auth.currentUser.uid,
            isAnonymous: auth.currentUser.isAnonymous,
            metadata: {
              creationTime: auth.currentUser.metadata.creationTime,
              lastSignInTime: auth.currentUser.metadata.lastSignInTime
            }
          },
          message: 'Authentication working ✅'
        };
      }

      // Try anonymous sign in
      addLog('info', 'Attempting anonymous sign in...');
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      addLog('success', 'Anonymous authentication successful!', {
        uid: user.uid,
        isAnonymous: user.isAnonymous
      });

      return {
        connected: true,
        user: {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          metadata: {
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime
          }
        },
        message: 'Anonymous auth successful ✅'
      };

    } catch (error) {
      addLog('error', 'Authentication failed', error.message);
      
      return {
        connected: false,
        error: error.message,
        code: error.code,
        message: 'Authentication failed ❌'
      };
    }
  };

  // 🗄️ Test Firestore
  const testFirestore = async () => {
    addLog('info', '🗄️ Testing Firestore connection...');
    
    try {
      // Test basic connectivity
      await enableNetwork(db);
      addLog('success', 'Firestore network enabled');

      // Test read operation
      const testDocRef = doc(db, 'test', 'connection');
      const testDoc = await getDoc(testDocRef);
      
      addLog('info', 'Test document read attempt completed', {
        exists: testDoc.exists(),
        id: testDoc.id
      });

      // Test write operation
      const testData = {
        timestamp: new Date().toISOString(),
        test: true,
        debugSession: Date.now()
      };

      await setDoc(testDocRef, testData);
      addLog('success', 'Test document written successfully', testData);

      // Verify write by reading back
      const verifyDoc = await getDoc(testDocRef);
      if (verifyDoc.exists()) {
        addLog('success', 'Test document verified', verifyDoc.data());
      }

      return {
        connected: true,
        readable: true,
        writable: true,
        testData: verifyDoc.data(),
        message: 'Firestore fully operational ✅'
      };

    } catch (error) {
      addLog('error', 'Firestore test failed', error.message);
      
      return {
        connected: false,
        error: error.message,
        code: error.code,
        message: 'Firestore connection failed ❌'
      };
    }
  };

  // 📊 Test Data Operations
  const testDataOperations = async () => {
    addLog('info', '📊 Testing data operations...');
    
    if (!auth.currentUser) {
      addLog('warning', 'No authenticated user for data operations');
      return { error: 'No authenticated user' };
    }

    try {
      const userId = auth.currentUser.uid;
      const testSessionData = {
        userId,
        question: "Test question from debug?",
        userResponse: "This is a test response from the Firebase debugger.",
        aiAnalysis: {
          score: 85,
          encouragement: "Great test! The debugging is working perfectly.",
          suggestions: ["Keep testing", "Firebase is connected"]
        },
        timestamp: new Date().toISOString(),
        duration: 15,
        debugMode: true
      };

      // Test practice session creation
      addLog('info', 'Creating test practice session...');
      const sessionRef = await addDoc(collection(db, 'practice_sessions'), testSessionData);
      addLog('success', 'Practice session created', { id: sessionRef.id });

      // Test user profile creation/update
      addLog('info', 'Creating/updating user profile...');
      const userRef = doc(db, 'users', userId);
      const userProfile = {
        userId,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        totalSessions: 1,
        settings: {
          language: 'en-US',
          debugMode: true
        },
        debugInfo: {
          lastDebugSession: new Date().toISOString(),
          browser: navigator.userAgent,
          connection: 'verified'
        }
      };

      await setDoc(userRef, userProfile, { merge: true });
      addLog('success', 'User profile updated');

      // Test progress tracking
      addLog('info', 'Creating progress entry...');
      const today = new Date().toISOString().split('T')[0];
      const progressRef = doc(db, 'progress', `${userId}_${today}`);
      const progressData = {
        userId,
        date: today,
        sessions: 1,
        totalScore: 85,
        averageScore: 85,
        questionsAnswered: 1,
        totalDuration: 15,
        lastUpdated: new Date().toISOString(),
        debugSession: true
      };

      await setDoc(progressRef, progressData, { merge: true });
      addLog('success', 'Progress entry created');

      setTestData({
        sessionId: sessionRef.id,
        userId,
        progressId: `${userId}_${today}`,
        userProfile,
        sessionData: testSessionData,
        progressData
      });

      return {
        success: true,
        sessionsCreated: 1,
        userProfileUpdated: true,
        progressTracked: true,
        testData: {
          sessionId: sessionRef.id,
          userId,
          timestamp: new Date().toISOString()
        },
        message: 'All data operations successful ✅'
      };

    } catch (error) {
      addLog('error', 'Data operations failed', error.message);
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        message: 'Data operations failed ❌'
      };
    }
  };

  // 👁️ Setup live data monitoring
  const setupLiveMonitoring = () => {
    if (!auth.currentUser) return;

    addLog('info', '👁️ Setting up live data monitoring...');

    const userId = auth.currentUser.uid;

    // Monitor user profile
    const userRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setLiveData(prev => ({ ...prev, userProfile: doc.data() }));
        addLog('info', 'User profile updated in real-time');
      }
    });

    // Monitor practice sessions
    const sessionsRef = collection(db, 'practice_sessions');
    const unsubscribeSessions = onSnapshot(sessionsRef, (snapshot) => {
      const sessions = [];
      snapshot.forEach((doc) => {
        if (doc.data().userId === userId) {
          sessions.push({ id: doc.id, ...doc.data() });
        }
      });
      setLiveData(prev => ({ ...prev, sessions }));
      addLog('info', `Found ${sessions.length} practice sessions`);
    });

    // Monitor today's progress
    const today = new Date().toISOString().split('T')[0];
    const progressRef = doc(db, 'progress', `${userId}_${today}`);
    const unsubscribeProgress = onSnapshot(progressRef, (doc) => {
      if (doc.exists()) {
        setLiveData(prev => ({ ...prev, todayProgress: doc.data() }));
        addLog('info', 'Today\'s progress updated');
      }
    });

    // Return cleanup function
    return () => {
      unsubscribeUser();
      unsubscribeSessions();
      unsubscribeProgress();
      addLog('info', 'Live monitoring stopped');
    };
  };

  // 🔄 Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        addLog('success', 'User authenticated', { 
          uid: user.uid, 
          isAnonymous: user.isAnonymous 
        });
        
        // Setup live monitoring when user is authenticated
        const cleanup = setupLiveMonitoring();
        return cleanup;
      } else {
        addLog('info', 'No user authenticated');
      }
    });

    return unsubscribe;
  }, []);

  // 🚀 Run full diagnostic
  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setDebugResults({});
    setLogs([]);
    
    addLog('info', '🚀 Starting Firebase diagnostic...');
    
    try {
      await testFirebaseConnection();
    } catch (error) {
      addLog('error', 'Diagnostic failed', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  // 📱 Component render
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bug size={24} />
              <div>
                <h2 className="text-xl font-bold">Firebase Debugger</h2>
                <p className="text-blue-100">English Practice App - Connection Diagnostic</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Control Panel */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={runFullDiagnostic}
                disabled={isRunning}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                {isRunning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                <span>{isRunning ? 'Running...' : 'Run Diagnostic'}</span>
              </button>
              
              {currentUser && (
                <div className="flex items-center space-x-2 text-sm">
                  <User size={16} className="text-green-500" />
                  <span className="text-gray-600">
                    User: {currentUser.uid.substring(0, 8)}...
                    {currentUser.isAnonymous && ' (Anonymous)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Authentication Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <User size={20} className="mr-2" />
                Authentication
              </h3>
              
              {debugResults.auth ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {debugResults.auth.connected ? 
                      <CheckCircle size={16} className="text-green-500" /> : 
                      <XCircle size={16} className="text-red-500" />
                    }
                    <span className="text-sm">{debugResults.auth.message}</span>
                  </div>
                  
                  {debugResults.auth.user && (
                    <div className="text-xs text-gray-600 bg-white p-2 rounded">
                      <p><strong>UID:</strong> {debugResults.auth.user.uid}</p>
                      <p><strong>Anonymous:</strong> {debugResults.auth.user.isAnonymous ? 'Yes' : 'No'}</p>
                      <p><strong>Created:</strong> {debugResults.auth.user.metadata?.creationTime}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Run diagnostic to test authentication</p>
              )}
            </div>

            {/* Firestore Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Database size={20} className="mr-2" />
                Firestore
              </h3>
              
              {debugResults.firestore ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {debugResults.firestore.connected ? 
                      <CheckCircle size={16} className="text-green-500" /> : 
                      <XCircle size={16} className="text-red-500" />
                    }
                    <span className="text-sm">{debugResults.firestore.message}</span>
                  </div>
                  
                  {debugResults.firestore.connected && (
                    <div className="text-xs space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={debugResults.firestore.readable ? 'text-green-600' : 'text-red-600'}>
                          {debugResults.firestore.readable ? '✅' : '❌'} Read
                        </span>
                        <span className={debugResults.firestore.writable ? 'text-green-600' : 'text-red-600'}>
                          {debugResults.firestore.writable ? '✅' : '❌'} Write
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Run diagnostic to test Firestore</p>
              )}
            </div>
          </div>

          {/* Data Operations */}
          {debugResults.data && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Database size={20} className="mr-2" />
                Data Operations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    {debugResults.data.sessionsCreated ? 
                      <CheckCircle size={16} className="text-green-500" /> : 
                      <XCircle size={16} className="text-red-500" />
                    }
                    <span className="text-sm font-medium">Practice Sessions</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Created: {debugResults.data.sessionsCreated || 0}
                  </p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    {debugResults.data.userProfileUpdated ? 
                      <CheckCircle size={16} className="text-green-500" /> : 
                      <XCircle size={16} className="text-red-500" />
                    }
                    <span className="text-sm font-medium">User Profile</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {debugResults.data.userProfileUpdated ? 'Updated' : 'Failed'}
                  </p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    {debugResults.data.progressTracked ? 
                      <CheckCircle size={16} className="text-green-500" /> : 
                      <XCircle size={16} className="text-red-500" />
                    }
                    <span className="text-sm font-medium">Progress</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {debugResults.data.progressTracked ? 'Tracked' : 'Failed'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Data */}
          {Object.keys(liveData).length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Eye size={20} className="mr-2" />
                Live Data Monitor
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveData.sessions && (
                  <div className="bg-white rounded p-3">
                    <h4 className="font-medium mb-2">Practice Sessions</h4>
                    <p className="text-sm text-gray-600">
                      Found: {liveData.sessions.length} sessions
                    </p>
                    {liveData.sessions.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Latest: {new Date(liveData.sessions[0]?.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                
                {liveData.todayProgress && (
                  <div className="bg-white rounded p-3">
                    <h4 className="font-medium mb-2">Today's Progress</h4>
                    <div className="text-sm space-y-1">
                      <p>Sessions: {liveData.todayProgress.sessions}</p>
                      <p>Average Score: {liveData.todayProgress.averageScore}</p>
                      <p>Questions: {liveData.todayProgress.questionsAnswered}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debug Logs */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Debug Logs</h3>
            
            <div className="bg-black rounded text-white p-3 font-mono text-xs max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400">No logs yet. Run diagnostic to see logs.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-400">[{log.timestamp}]</span>
                    <span className={`ml-2 ${
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      {log.type.toUpperCase()}:
                    </span>
                    <span className="ml-2">{log.message}</span>
                    {log.data && (
                      <div className="ml-8 text-gray-300">
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Firebase Console Links */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">🔗 Firebase Console Links</h3>
            <div className="space-y-2 text-sm">
              <p>Check your Firebase Console to see the data:</p>
              <div className="space-y-1">
                <a 
                  href="https://console.firebase.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline block"
                >
                  🔥 Firebase Console → Authentication → Users
                </a>
                <a 
                  href="https://console.firebase.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline block"
                >
                  📊 Firebase Console → Firestore Database → Data
                </a>
              </div>
              
              {testData && (
                <div className="mt-3 bg-white rounded p-3">
                  <h4 className="font-medium mb-2">Test Data Created:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>User ID:</strong> {testData.userId}</p>
                    <p><strong>Session ID:</strong> {testData.sessionId}</p>
                    <p><strong>Progress ID:</strong> {testData.progressId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDebugger;
