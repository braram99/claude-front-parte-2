class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Reconocimiento en tiempo real
  async recognizeLive(options = {}) {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          if (options.onStart) options.onStart();
        };

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (options.onProgress) {
            options.onProgress({
              final: finalTranscript,
              interim: interimTranscript
            });
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          resolve();
        };

        this.recognition.onerror = (event) => {
          this.isListening = false;
          reject(new Error(`Speech recognition error: ${event.error}`));
        };

        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Detener reconocimiento
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Abortar reconocimiento
  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // Procesar respuesta
  async processAnswer(transcript) {
    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        message: "I didn't catch that. Could you try again?",
        transcript: '',
        confidence: 0
      };
    }

    // Análisis básico de la respuesta
    const wordCount = transcript.trim().split(' ').length;
    const confidence = Math.min(0.9, 0.5 + (wordCount * 0.1));

    let message = '';
    let success = true;

    if (wordCount >= 3) {
      message = "Great job! Your answer is clear and complete.";
    } else if (wordCount >= 1) {
      message = "Good start! Try to give a more complete answer next time.";
    } else {
      message = "I didn't catch that. Could you try speaking more clearly?";
      success = false;
    }

    return {
      success,
      message,
      transcript: transcript.trim(),
      confidence
    };
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening
    };
  }
}

// Exportar instancia singleton
const speechRecognitionService = new SpeechRecognitionService();
export default speechRecognitionService;