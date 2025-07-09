// src/hooks/useSpeechPractice.js
// 🎤 Hook actualizado para usar Google Web Speech API

import { useState, useCallback, useRef, useEffect } from 'react';
import useAudioRecorder from './useAudioRecorder';
import speechService from '../services/googleSpeechService';

const useSpeechPractice = () => {
  const audioRecorder = useAudioRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const processedAudioRef = useRef(null);
  const recognitionActiveRef = useRef(false);

  // 🔊 Text-to-Speech para preguntas
  const playQuestion = useCallback(async (question) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setIsPlayingQuestion(true);
      
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.lang = 'en-US';
      
      utterance.onend = () => setIsPlayingQuestion(false);
      utterance.onerror = () => setIsPlayingQuestion(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlayingQuestion(false);
    }
  }, []);

  // 🤖 Text-to-Speech para respuestas de IA
  const playAIResponse = useCallback(async (responseText, mood = 'normal') => {
    if (!('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      setIsAISpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(responseText);
      
      const voiceConfigs = {
        encouraging: { rate: 0.9, pitch: 1.1, volume: 0.9 },
        supportive: { rate: 0.85, pitch: 1.0, volume: 0.8 },
        enthusiastic: { rate: 1.0, pitch: 1.2, volume: 1.0 },
        gentle: { rate: 0.8, pitch: 0.95, volume: 0.75 },
        normal: { rate: 0.9, pitch: 1.0, volume: 0.8 }
      };
      
      const config = voiceConfigs[mood] || voiceConfigs.normal;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;
      utterance.lang = 'en-US';
      
      utterance.onend = () => setIsAISpeaking(false);
      utterance.onerror = () => setIsAISpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('AI TTS error:', error);
      setIsAISpeaking(false);
    }
  }, []);

  // 🎤 Iniciar transcripción con Google Speech API
  const startTranscription = useCallback(async () => {
    console.log('🎤 Starting Google Speech transcription...');
    
    // Verificar soporte
    const support = speechService.checkSupport();
    if (!support.supported) {
      setError(support.error);
      return;
    }

    try {
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      recognitionActiveRef.current = true;

      const result = await speechService.startListening({
        language: 'en-US',
        continuous: false,
        interimResults: true,
        maxAlternatives: 3,
        
        onStart: () => {
          console.log('🎤 Speech recognition started');
          setIsListening(true);
        },
        
        onResult: (result) => {
          console.log('📝 Partial result:', result);
          if (result.interim) {
            setInterimTranscript(result.interim);
          }
          if (result.final) {
            setTranscript(prev => prev + result.final);
          }
        },
        
        onInterim: (interim) => {
          setInterimTranscript(interim);
        },
        
        onEnd: () => {
          console.log('🎤 Speech recognition ended');
          setIsListening(false);
          setInterimTranscript('');
          recognitionActiveRef.current = false;
        },
        
        onError: (error) => {
          console.error('🚨 Speech recognition error:', error);
          setError(error);
          setIsListening(false);
          setInterimTranscript('');
          recognitionActiveRef.current = false;
        }
      });

      // Procesar resultado final
      if (result.transcript) {
        console.log('✅ Final transcription:', result.transcript);
        setTranscript(result.transcript);
        return result;
      }

    } catch (error) {
      console.error('Transcription error:', error);
      setError(error.message);
      setIsListening(false);
      recognitionActiveRef.current = false;
    }
  }, []);

  // 🛑 Detener transcripción
  const stopTranscription = useCallback(() => {
    console.log('🛑 Stopping transcription...');
    speechService.stop();
    setIsListening(false);
    setInterimTranscript('');
    recognitionActiveRef.current = false;
  }, []);

  // 🎯 Procesar grabación con IA simplificada
  const processWithAI = useCallback(async (audioBlob, transcript, duration) => {
    console.log('🤖 Processing with AI Service...');
    
    try {
      // Simulación de AI service (puedes conectar tu AI real aquí)
      const currentQuestion = window.currentQuestionForAI || "What's your favorite hobby?";
      
      const cleanTranscript = transcript.trim();
      let score = 50;
      
      if (!cleanTranscript || cleanTranscript === 'Audio response') {
        return {
          encouragement: "I couldn't get a clear transcript. Try speaking more clearly.",
          score: 25,
          suggestions: ['Speak closer to the microphone', 'Try speaking more slowly'],
          confidence: 0.1,
          mood: 'supportive',
          audioText: "I couldn't hear you clearly. Could you try speaking closer to the microphone?",
          shouldSpeak: true
        };
      }

      const words = cleanTranscript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      // Scoring simple
      if (wordCount >= 15) score = 95;
      else if (wordCount >= 10) score = 85;
      else if (wordCount >= 7) score = 75;
      else if (wordCount >= 5) score = 65;
      else if (wordCount >= 3) score = 55;

      let encouragement, mood, audioText;
      
      if (score >= 85) {
        encouragement = "Excellent work! Your English sounds very natural and confident.";
        mood = 'enthusiastic';
        audioText = "Wow, excellent work! Your English sounds very natural. Keep it up!";
      } else if (score >= 70) {
        encouragement = "Great job! You're expressing yourself clearly and confidently.";
        mood = 'encouraging';
        audioText = "Great job! You're speaking very clearly. I can understand you perfectly.";
      } else if (score >= 55) {
        encouragement = "Good effort! You're communicating well and building confidence.";
        mood = 'supportive';
        audioText = "Good effort! You're doing well. Try to speak a bit longer next time.";
      } else {
        encouragement = "Nice try! Every practice session helps you improve.";
        mood = 'gentle';
        audioText = "Nice try! Don't worry, practice makes perfect. Keep going!";
      }

      const suggestions = [];
      if (wordCount < 5) suggestions.push('Try to speak for a bit longer');
      if (wordCount < 10) suggestions.push('Add more details to your answer');
      suggestions.push('You\'re doing great, keep practicing!');

      const followUpQuestions = [
        "That's interesting! Can you tell me more about that?",
        "What do you like most about that?",
        "How did that make you feel?",
        "Would you like to try a different question?"
      ];
      
      const followUpQuestion = wordCount >= 5 
        ? followUpQuestions[Math.floor(Math.random() * (followUpQuestions.length - 1))]
        : followUpQuestions[followUpQuestions.length - 1];

      return {
        encouragement,
        score,
        suggestions: suggestions.slice(0, 3),
        confidence: Math.min(0.95, 0.5 + (wordCount * 0.05)),
        mood,
        audioText,
        followUpQuestion,
        shouldSpeak: true,
        grammar: { score: Math.min(100, score + 10), issues: [] },
        vocabulary: { score: Math.min(100, score + 5), uniqueWords: new Set(words).size, advancedWords: 0 },
        fluency: { score, wordCount }
      };

    } catch (error) {
      console.error('AI Error:', error);
      return {
        encouragement: "Keep practicing! Every conversation helps you improve.",
        score: 50,
        suggestions: ["Try speaking more clearly", "Don't worry about mistakes"],
        confidence: 0.5,
        mood: 'supportive',
        audioText: "Don't worry, learning takes time. Keep practicing!",
        shouldSpeak: true
      };
    }
  }, []);

  // 🔄 Efecto principal: procesar cuando termina la grabación
  useEffect(() => {
    if (audioRecorder.audioBlob && 
        !audioRecorder.isRecording && 
        !isProcessing &&
        audioRecorder.audioBlob !== processedAudioRef.current) {
      
      console.log('🔄 Processing recording...');
      setIsProcessing(true);
      processedAudioRef.current = audioRecorder.audioBlob;
      
      // Iniciar transcripción automáticamente después de la grabación
      setTimeout(async () => {
        try {
          let finalTranscript = transcript;
          
          // Si no hay transcript, intentar transcripción
          if (!finalTranscript || finalTranscript.trim().length === 0) {
            console.log('🎤 No transcript yet, starting speech recognition...');
            const transcriptionResult = await startTranscription();
            finalTranscript = transcriptionResult?.transcript || `Audio response (${audioRecorder.duration} seconds)`;
          }
          
          console.log('📝 Using transcript:', finalTranscript);
          
          // Procesar con IA
          const aiResponseData = await processWithAI(
            audioRecorder.audioBlob, 
            finalTranscript, 
            audioRecorder.duration
          );
          
          console.log('✅ AI Response:', aiResponseData);
          
          // Actualizar estado con resultados
          setFeedback({
            success: true,
            transcript: finalTranscript,
            duration: audioRecorder.duration,
            message: aiResponseData.encouragement,
            score: aiResponseData.score,
            suggestions: aiResponseData.suggestions,
            confidence: aiResponseData.confidence,
            grammar: aiResponseData.grammar,
            vocabulary: aiResponseData.vocabulary,
            fluency: aiResponseData.fluency
          });
          
          setAiResponse({
            ...aiResponseData,
            transcript: finalTranscript,
            question: window.currentQuestionForAI || "What's your favorite hobby?"
          });
          
          // Reproducir respuesta de IA
          setTimeout(() => {
            if (aiResponseData.audioText) {
              playAIResponse(aiResponseData.audioText, aiResponseData.mood);
            }
          }, 1500);
          
        } catch (error) {
          console.error('Processing error:', error);
          setFeedback({
            success: true,
            transcript: transcript || `Audio response (${audioRecorder.duration} seconds)`,
            duration: audioRecorder.duration,
            message: "Great effort! Keep practicing to improve your English.",
            score: 60,
            suggestions: ['Keep practicing regularly'],
            confidence: 0.7
          });
        }
        
        setIsProcessing(false);
      }, 1000);
    }
  }, [audioRecorder.audioBlob, audioRecorder.isRecording, audioRecorder.duration, isProcessing, transcript, startTranscription, processWithAI, playAIResponse]);

  // 🧹 Limpiar sesión
  const clearSession = useCallback(() => {
    console.log('🧹 Clearing session...');
    
    // Detener todos los servicios
    audioRecorder.clearRecording();
    speechService.stop();
    window.speechSynthesis.cancel();
    
    // Limpiar estado
    setFeedback(null);
    setAiResponse(null);
    setError(null);
    setIsProcessing(false);
    setTranscript('');
    setInterimTranscript('');
    setIsAISpeaking(false);
    setIsPlayingQuestion(false);
    setIsListening(false);
    
    // Limpiar refs
    processedAudioRef.current = null;
    recognitionActiveRef.current = false;
  }, [audioRecorder]);

  // 📱 Reproducir grabación
  const playRecording = useCallback(() => {
    if (audioRecorder.audioUrl) {
      const audio = new Audio(audioRecorder.audioUrl);
      audio.play().catch(error => {
        console.error('Error playing recording:', error);
      });
    }
  }, [audioRecorder.audioUrl]);

  // 🎤 Métodos públicos del hook
  return {
    // Estados de grabación
    isRecording: audioRecorder.isRecording,
    recordingDuration: audioRecorder.duration,
    audioUrl: audioRecorder.audioUrl,
    audioBlob: audioRecorder.audioBlob,
    
    // Estados de transcripción
    isListening,
    transcript,
    interimTranscript,
    
    // Estados de procesamiento
    isProcessing,
    feedback,
    aiResponse,
    
    // Estados de reproducción
    isPlayingQuestion,
    isAISpeaking,
    
    // Errores
    error: error || audioRecorder.error,
    
    // Métodos de control
    startRecording: audioRecorder.startRecording,
    stopRecording: audioRecorder.stopRecording,
    playRecording,
    playQuestion,
    playAIResponse,
    startTranscription,
    stopTranscription,
    clearSession,
    
    // Información del servicio
    speechService: 'Google Web Speech API'
  };
};

export default useSpeechPractice;
