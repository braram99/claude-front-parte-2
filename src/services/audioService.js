// src/services/audioService.js - Consolidated Audio Service
class AudioService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.mediaRecorder = null;
    this.stream = null;
    
    // State
    this.isRecording = false;
    this.isListening = false;
    this.isSpeaking = false;
    
    // Configuration
    this.config = {
      speechRecognition: {
        lang: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3
      },
      textToSpeech: {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8,
        lang: 'en-US'
      },
      recording: {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      }
    };

    console.log('🎤 Audio Service initialized');
  }

  // 🔍 Check browser support
  checkSupport() {
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const mediaRecorderSupported = 'MediaRecorder' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;

    return {
      speechRecognition: speechRecognitionSupported,
      mediaRecorder: mediaRecorderSupported,
      speechSynthesis: speechSynthesisSupported,
      allSupported: speechRecognitionSupported && mediaRecorderSupported && speechSynthesisSupported
    };
  }

  // 🎤 Start recording with speech recognition
  async startRecording(options = {}) {
    try {
      console.log('🎤 Starting recording with speech recognition...');
      
      const support = this.checkSupport();
      if (!support.allSupported) {
        throw new Error('Required audio features not supported');
      }

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Setup MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, this.config.recording);
      const chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        if (options.onRecordingComplete) {
          options.onRecordingComplete({ blob, url });
        }
      };

      // Setup Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      Object.assign(this.recognition, this.config.speechRecognition);

      let finalTranscript = '';

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('🎤 Speech recognition started');
        if (options.onStart) options.onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (options.onTranscript) {
          options.onTranscript({
            final: finalTranscript,
            interim: interimTranscript,
            combined: finalTranscript + interimTranscript
          });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log('🎤 Speech recognition ended');
        if (options.onEnd) options.onEnd({ transcript: finalTranscript });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        console.error('🚨 Speech recognition error:', event.error);
        if (options.onError) options.onError(event.error);
      };

      // Start both recording and recognition
      this.mediaRecorder.start();
      this.recognition.start();
      this.isRecording = true;

      console.log('✅ Recording and speech recognition started');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.cleanup();
      throw error;
    }
  }

  // 🛑 Stop recording
  stopRecording() {
    console.log('🛑 Stopping recording...');
    
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    
    this.isRecording = false;
    this.cleanup();
  }

  // 🔊 Text-to-Speech
  async speak(text, options = {}) {
    if (!this.checkSupport().speechSynthesis) {
      console.warn('⚠️ Speech synthesis not supported');
      return;
    }

    return new Promise((resolve) => {
      this.synthesis.cancel(); // Cancel any current speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply configuration
      Object.assign(utterance, this.config.textToSpeech, options);
      
      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 Speech started');
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('🔊 Speech ended');
        resolve();
      };
      
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('🔊 Speech error:', event.error);
        resolve();
      };
      
      this.synthesis.speak(utterance);
    });
  }

  // 🎭 Speak with mood/emotion
  async speakWithMood(text, mood = 'normal') {
    const moodConfigs = {
      encouraging: { rate: 0.9, pitch: 1.1, volume: 0.9 },
      supportive: { rate: 0.85, pitch: 1.0, volume: 0.8 },
      enthusiastic: { rate: 1.0, pitch: 1.2, volume: 1.0 },
      gentle: { rate: 0.8, pitch: 0.95, volume: 0.75 },
      normal: { rate: 0.9, pitch: 1.0, volume: 0.8 }
    };

    const config = moodConfigs[mood] || moodConfigs.normal;
    return this.speak(text, config);
  }

  // 🎯 Speak question (optimized for questions)
  async speakQuestion(question) {
    return this.speak(question, {
      rate: 0.8,
      pitch: 1.1,
      volume: 0.9
    });
  }

  // 🤖 Speak AI response
  async speakAIResponse(text, mood = 'encouraging') {
    return this.speakWithMood(text, mood);
  }

  // 🔇 Stop speaking
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // 🧹 Cleanup resources
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.recognition) {
      this.recognition = null;
    }
    
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }
  }

  // 📊 Get current status
  getStatus() {
    return {
      isRecording: this.isRecording,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      support: this.checkSupport()
    };
  }
}

// Export singleton instance
const audioService = new AudioService();
export default audioService;
