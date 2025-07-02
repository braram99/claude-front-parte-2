// src/services/googleSpeechService.js
// 🎤 Google Web Speech API Service (FREE MVP Solution)
// Preparado para cambiar a Vosk después del deploy

class GoogleSpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.finalTranscript = '';
    this.interimTranscript = '';
    
    console.log('🎤 Google Speech Service initialized:', {
      supported: this.isSupported,
      userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
    });
  }

  // 🔍 Verificar soporte
  checkSupport() {
    if (!this.isSupported) {
      console.warn('⚠️ Web Speech API not supported');
      return {
        supported: false,
        error: 'Speech recognition not supported in this browser. Please use Chrome or Edge.',
        fallback: 'Consider using Vosk for broader compatibility.'
      };
    }
    
    return {
      supported: true,
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Compatible',
      message: 'Google Web Speech API ready'
    };
  }

  // 🎤 Iniciar reconocimiento de voz
  async startListening(options = {}) {
    const {
      language = 'en-US',
      continuous = false,
      interimResults = true,
      maxAlternatives = 1,
      onStart = null,
      onResult = null,
      onEnd = null,
      onError = null,
      onInterim = null
    } = options;

    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        // Limpiar estado anterior
        this.finalTranscript = '';
        this.interimTranscript = '';
        
        // Detener cualquier reconocimiento activo
        if (this.recognition) {
          this.recognition.stop();
        }

        // Crear nueva instancia
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configuración optimizada para inglés
        this.recognition.continuous = continuous;
        this.recognition.interimResults = interimResults;
        this.recognition.lang = language;
        this.recognition.maxAlternatives = maxAlternatives;
        
        // Configuraciones adicionales para mejor precisión
        this.recognition.serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
        
        console.log('🎤 Starting speech recognition with config:', {
          language,
          continuous,
          interimResults,
          maxAlternatives
        });

        // Event Handlers
        this.recognition.onstart = () => {
          this.isListening = true;
          console.log('🎤 Speech recognition started');
          if (onStart) onStart();
        };

        this.recognition.onresult = (event) => {
          console.log('📝 Speech recognition result:', event);
          
          let interimTranscript = '';
          let finalTranscript = '';

          // Procesar todos los resultados
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence;

            console.log(`Result ${i}:`, {
              transcript,
              confidence,
              isFinal: result.isFinal
            });

            if (result.isFinal) {
              finalTranscript += transcript;
              this.finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Callbacks para resultados parciales
          if (interimTranscript && onInterim) {
            onInterim(interimTranscript);
          }

          // Callback para todos los resultados
          if (onResult) {
            onResult({
              final: finalTranscript,
              interim: interimTranscript,
              fullFinalTranscript: this.finalTranscript,
              confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0
            });
          }

          // Auto-resolver si tenemos resultado final
          if (finalTranscript && !continuous) {
            console.log('✅ Final transcript received:', finalTranscript);
            setTimeout(() => {
              this.stop();
              resolve({
                transcript: this.finalTranscript,
                confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.8,
                language: language
              });
            }, 500);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          console.log('🎤 Speech recognition ended');
          
          if (onEnd) onEnd();
          
          // Resolver con transcript final si no se resolvió antes
          if (!continuous && this.finalTranscript) {
            resolve({
              transcript: this.finalTranscript,
              confidence: 0.8,
              language: language
            });
          } else if (!continuous) {
            resolve({
              transcript: '',
              confidence: 0,
              language: language,
              error: 'No speech detected'
            });
          }
        };

        this.recognition.onerror = (event) => {
          this.isListening = false;
          console.error('🚨 Speech recognition error:', event.error);
          
          const errorMessages = {
            'no-speech': 'No speech was detected. Please try speaking closer to the microphone.',
            'audio-capture': 'Audio capture failed. Please check your microphone permissions.',
            'not-allowed': 'Microphone access denied. Please allow microphone access and try again.',
            'network': 'Network error occurred. Please check your internet connection.',
            'aborted': 'Speech recognition was aborted.',
            'language-not-supported': 'Language not supported.',
            'service-not-allowed': 'Speech service not allowed.'
          };
          
          const userFriendlyError = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
          
          if (onError) onError(userFriendlyError);
          
          if (!continuous) {
            reject(new Error(userFriendlyError));
          }
        };

        // Iniciar reconocimiento
        this.recognition.start();

      } catch (error) {
        console.error('Error setting up speech recognition:', error);
        reject(error);
      }
    });
  }

  // 🛑 Detener reconocimiento
  stop() {
    if (this.recognition && this.isListening) {
      console.log('🛑 Stopping speech recognition...');
      this.recognition.stop();
    }
  }

  // ❌ Abortar reconocimiento
  abort() {
    if (this.recognition && this.isListening) {
      console.log('❌ Aborting speech recognition...');
      this.recognition.abort();
    }
  }

  // 📊 Obtener estado actual
  getStatus() {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported,
      finalTranscript: this.finalTranscript,
      interimTranscript: this.interimTranscript,
      service: 'Google Web Speech API'
    };
  }

  // 🎯 Método específico para práctica de inglés
  async transcribeForPractice(audioBlob, options = {}) {
    console.log('🎯 Transcribing for English practice...');
    
    // Para Google Web Speech API, no necesitamos el audioBlob
    // El reconocimiento es en tiempo real desde el micrófono
    
    const defaultOptions = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3, // Más alternativas para mejor precisión
      ...options
    };

    try {
      const result = await this.startListening(defaultOptions);
      
      // Post-procesamiento específico para práctica de inglés
      const processedResult = this.processForEnglishPractice(result);
      
      console.log('✅ Transcription complete:', processedResult);
      return processedResult;
      
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Fallback graceful para el MVP
      return {
        transcript: '',
        confidence: 0,
        error: error.message,
        suggestions: [
          'Try speaking more clearly',
          'Check your microphone permissions',
          'Ensure good internet connection'
        ],
        service: 'Google Web Speech API'
      };
    }
  }

  // 🔄 Post-procesamiento para práctica de inglés
  processForEnglishPractice(rawResult) {
    const { transcript, confidence, language } = rawResult;
    
    if (!transcript || transcript.trim().length === 0) {
      return {
        transcript: '',
        confidence: 0,
        wordCount: 0,
        isValid: false,
        suggestions: [
          'Try speaking louder and clearer',
          'Make sure you\'re close to the microphone',
          'Speak for at least 3-5 seconds'
        ],
        service: 'Google Web Speech API'
      };
    }

    const cleanTranscript = transcript.trim();
    const words = cleanTranscript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Análisis básico para práctica
    const isValid = wordCount >= 1 && confidence > 0.3;
    const quality = this.assessSpeechQuality(cleanTranscript, confidence, wordCount);
    
    return {
      transcript: cleanTranscript,
      confidence: Math.round(confidence * 100) / 100,
      wordCount,
      isValid,
      quality,
      language,
      service: 'Google Web Speech API',
      suggestions: this.generateSuggestions(wordCount, confidence),
      metadata: {
        processingTime: Date.now(),
        words: words,
        avgWordsPerMinute: wordCount > 0 ? Math.round((wordCount / (Date.now() / 60000))) : 0
      }
    };
  }

  // 📈 Evaluar calidad del habla
  assessSpeechQuality(transcript, confidence, wordCount) {
    let score = 0;
    
    // Puntuación base por confianza
    score += confidence * 40;
    
    // Puntuación por longitud
    if (wordCount >= 10) score += 30;
    else if (wordCount >= 5) score += 20;
    else if (wordCount >= 2) score += 10;
    
    // Puntuación por complejidad
    const complexWords = transcript.match(/\b\w{6,}\b/g) || [];
    score += Math.min(complexWords.length * 5, 20);
    
    // Puntuación por gramática básica
    if (transcript.includes(' and ') || transcript.includes(' because ')) score += 10;
    
    return {
      score: Math.min(Math.round(score), 100),
      level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'needs-improvement'
    };
  }

  // 💡 Generar sugerencias
  generateSuggestions(wordCount, confidence) {
    const suggestions = [];
    
    if (confidence < 0.5) {
      suggestions.push('Try speaking more clearly and slowly');
    }
    
    if (wordCount < 3) {
      suggestions.push('Try to speak for a bit longer');
    }
    
    if (wordCount < 10) {
      suggestions.push('Add more details to your answer');
    }
    
    suggestions.push('Great job! Keep practicing regularly');
    
    return suggestions;
  }
}

// 🏭 Factory para cambiar entre servicios
class SpeechServiceFactory {
  static createService(type = 'google') {
    switch (type) {
      case 'google':
        return new GoogleSpeechService();
      case 'vosk':
        // TODO: Implementar después del deploy
        console.log('🚧 Vosk service not yet implemented');
        return new GoogleSpeechService(); // Fallback
      default:
        return new GoogleSpeechService();
    }
  }
}

// Exportar tanto el servicio específico como la factory
export { GoogleSpeechService, SpeechServiceFactory };

// Exportar instancia por defecto para el MVP
const speechService = new GoogleSpeechService();
export default speechService;
