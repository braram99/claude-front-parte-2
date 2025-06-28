class TextToSpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.currentVoice = null;
    this.isSupported = 'speechSynthesis' in window;
    
    if (this.isSupported) {
      this.initVoices();
    }
  }

  // Inicializar voces
  async initVoices() {
    return new Promise((resolve) => {
      if (this.synthesis.getVoices().length > 0) {
        this.loadVoices();
        resolve();
      } else {
        this.synthesis.onvoiceschanged = () => {
          this.loadVoices();
          resolve();
        };
      }
    });
  }

  // Cargar voces disponibles
  loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    // Buscar voces en inglés
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-')
    );
    
    // Preferir voces específicas
    const preferredVoices = ['en-US', 'en-GB', 'en-AU'];
    
    for (const lang of preferredVoices) {
      const voice = englishVoices.find(v => v.lang === lang);
      if (voice) {
        this.currentVoice = voice;
        break;
      }
    }
    
    if (!this.currentVoice && englishVoices.length > 0) {
      this.currentVoice = englishVoices[0];
    }
  }

  // Hablar texto
  async speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('Text-to-speech not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.voice = options.voice || this.currentVoice;
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        resolve(); // No rechazamos para no romper el flujo
      };

      this.synthesis.speak(utterance);
    });
  }

  // Hablar pregunta
  async speakQuestion(question, options = {}) {
    const text = question + '.';
    
    return this.speak(text, {
      rate: 0.8,
      pitch: 1.1,
      ...options
    });
  }

  // Hablar ejemplo
  async speakExample(example, options = {}) {
    const text = `Here's an example: ${example}`;
    
    return this.speak(text, {
      rate: 0.85,
      pitch: 0.95,
      ...options
    });
  }

  // Hablar encouragement
  async speakEncouragement(message = "Great job! Keep practicing!") {
    return this.speak(message, {
      rate: 1.0,
      pitch: 1.2,
      volume: 0.8
    });
  }

  // Cancelar speech actual
  cancel() {
    if (this.isSupported) {
      this.synthesis.cancel();
    }
  }

  // Verificar si está hablando
  isSpeaking() {
    return this.isSupported ? this.synthesis.speaking : false;
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      isSupported: this.isSupported,
      isSpeaking: this.isSpeaking(),
      currentVoice: this.currentVoice ? {
        name: this.currentVoice.name,
        lang: this.currentVoice.lang
      } : null,
      availableVoicesCount: this.voices.length
    };
  }
}

// Exportar instancia singleton
const ttsService = new TextToSpeechService();
export default ttsService;