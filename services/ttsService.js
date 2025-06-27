class TextToSpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.currentVoice = null;
    this.isSupported = 'speechSynthesis' in window;
    this.isLoaded = false;
    
    if (this.isSupported) {
      this.initVoices();
    }
  }

  // Inicializar y cargar voces disponibles
  async initVoices() {
    return new Promise((resolve) => {
      if (this.synthesis.getVoices().length > 0) {
        this.loadVoices();
        resolve();
      } else {
        // Esperar a que las voces se carguen
        this.synthesis.onvoiceschanged = () => {
          this.loadVoices();
          resolve();
        };
      }
    });
  }

  // Cargar voces y seleccionar la mejor para inglés
  loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    // Buscar voces en inglés, priorizando US English
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-') && voice.lang !== 'en-IN'
    );
    
    // Priorizar voces específicas por calidad
    const preferredVoices = [
      'en-US', 'en-GB', 'en-AU', 'en-CA'
    ];
    
    for (const lang of preferredVoices) {
      const voice = englishVoices.find(v => v.lang === lang);
      if (voice) {
        this.currentVoice = voice;
        break;
      }
    }
    
    // Si no encuentra ninguna preferida, usar la primera disponible
    if (!this.currentVoice && englishVoices.length > 0) {
      this.currentVoice = englishVoices[0];
    }
    
    this.isLoaded = true;
  }

  // Hablar un texto
  async speak(text, options = {}) {
    if (!this.isSupported) {
      throw new Error('Text-to-speech not supported in this browser');
    }

    // Asegurar que las voces estén cargadas
    if (!this.isLoaded) {
      await this.initVoices();
    }

    return new Promise((resolve, reject) => {
      // Cancelar cualquier speech anterior
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configurar opciones
      utterance.voice = options.voice || this.currentVoice;
      utterance.rate = options.rate || 0.9; // Ligeramente más lento para aprendizaje
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      // Eventos
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`));
      
      // Opcional: callback de progreso
      if (options.onProgress) {
        utterance.onboundary = options.onProgress;
      }

      // Iniciar speech
      this.synthesis.speak(utterance);
    });
  }

  // Hablar una pregunta con énfasis
  async speakQuestion(question, options = {}) {
    // Añadir pausa después de la pregunta para claridad
    const textWithPause = question + '. '; 
    
    return this.speak(textWithPause, {
      rate: 0.8, // Más lento para preguntas
      pitch: 1.1, // Tono ligeramente más alto
      ...options
    });
  }

  // Hablar respuesta de ejemplo
  async speakExample(example, options = {}) {
    const prefixedText = `Here's an example: ${example}`;
    
    return this.speak(prefixedText, {
      rate: 0.85,
      pitch: 0.95,
      ...options
    });
  }

  // Dar encouragement/feedback
  async speakEncouragement(message = "Great job! Keep practicing!") {
    return this.speak(message, {
      rate: 1.0,
      pitch: 1.2,
      volume: 0.8
    });
  }

  // Pausar/Reanudar
  pause() {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  // Cancelar speech actual
  cancel() {
    this.synthesis.cancel();
  }

  // Verificar si está hablando
  isSpeaking() {
    return this.synthesis.speaking;
  }

  // Obtener voces disponibles
  getAvailableVoices() {
    return this.voices.filter(voice => voice.lang.startsWith('en-'));
  }

  // Cambiar voz
  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.currentVoice = voice;
      return true;
    }
    return false;
  }

  // Obtener información de la voz actual
  getCurrentVoice() {
    return this.currentVoice ? {
      name: this.currentVoice.name,
      lang: this.currentVoice.lang,
      gender: this.currentVoice.name.toLowerCase().includes('female') ? 'female' : 'male'
    } : null;
  }

  // Test de funcionalidad
  async test() {
    try {
      await this.speak("Hello! Text to speech is working correctly.");
      return true;
    } catch (error) {
      console.error('TTS test failed:', error);
      return false;
    }
  }

  // Configurar velocidad global
  setGlobalRate(rate) {
    this.defaultRate = Math.max(0.1, Math.min(2.0, rate));
  }

  // Configurar tono global
  setGlobalPitch(pitch) {
    this.defaultPitch = Math.max(0, Math.min(2, pitch));
  }

  // Método para practicar pronunciación
  async pronunciationPractice(word, options = {}) {
    // Hablar la palabra lentamente
    await this.speak(word, {
      rate: 0.6,
      pitch: 1.0,
      ...options
    });
    
    // Pequeña pausa
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Repetir a velocidad normal
    await this.speak(word, {
      rate: 0.9,
      pitch: 1.0,
      ...options
    });
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      isSupported: this.isSupported,
      isLoaded: this.isLoaded,
      currentVoice: this.getCurrentVoice(),
      isSpeaking: this.isSpeaking(),
      availableVoicesCount: this.getAvailableVoices().length
    };
  }
}

// Exportar instancia singleton
const ttsService = new TextToSpeechService();
export default ttsService;