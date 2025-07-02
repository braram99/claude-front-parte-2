# 🤖 English Practice App

Una aplicación web moderna para practicar inglés conversacional con inteligencia artificial real, reconocimiento de voz y análisis inteligente de respuestas.

![English Practice App](https://img.shields.io/badge/React-19.1.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.0.0-purple)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.11-cyan)
![AI Powered](https://img.shields.io/badge/AI-OpenRouter-green)

## ✨ Características Principales

### 🎤 **Conversación con IA Real**
- Análisis inteligente de respuestas usando **Claude 3.5 Sonnet** via OpenRouter
- Feedback personalizado y contextual
- Respuestas de audio automáticas
- Sistema de puntuación avanzado (1-100)
- Sugerencias de mejora específicas

### 🎯 **Speech Recognition & Audio**
- Reconocimiento de voz en tiempo real (Web Speech API)
- Grabación de audio con MediaRecorder API
- Text-to-Speech para preguntas y respuestas del AI
- Transcripción automática de respuestas

### 📊 **Sistema de Progreso**
- Tracking diario de conversaciones
- Rachas de práctica consecutiva
- Estadísticas detalladas
- Metas personalizables
- Persistencia local con localStorage

### 🎨 **Interfaz Moderna**
- Diseño responsive con TailwindCSS
- Múltiples pantallas: Home, Speaking, Listening, Progress
- Animaciones y feedback visual
- UI/UX optimizada para móviles

## 🛠️ Tecnologías

### Frontend
- **React 19.1.0** - Biblioteca principal
- **Vite 7.0.0** - Build tool y dev server
- **TailwindCSS 4.1.11** - Styling framework
- **Lucide React** - Iconos modernos

### AI & Speech
- **OpenRouter API** - Acceso a Claude 3.5 Sonnet
- **Web Speech API** - Reconocimiento de voz nativo
- **MediaRecorder API** - Grabación de audio
- **SpeechSynthesis API** - Text-to-Speech

### Futuras Integraciones
- **Vosk** - Reconocimiento de voz offline
- **Google Speech API** - Speech recognition avanzado
- **Whisper** - Transcripción de audio

## 📁 Estructura del Proyecto

```
english-practice-app/
├── src/
│   ├── components/
│   │   ├── screens/              # 📱 Componentes de pantallas
│   │   │   ├── HomeScreen.jsx    # (Preparado para refactor)
│   │   │   ├── ProgressScreen.jsx
│   │   │   └── SpeakingScreen.jsx
│   │   └── VoiceRecorder.jsx     # 🎙️ Grabación avanzada
│   ├── hooks/
│   │   ├── useAudioRecorder.js   # ✅ Hook de grabación
│   │   ├── useProgress.js        # ✅ Sistema de progreso
│   │   └── useSpeechPractice.js  # 🎤 Speech practice
│   ├── services/
│   │   ├── aiService.js          # 🤖 Abstracción de AI
│   │   ├── googleSpeechService.js # 🎤 Google Speech (futuro)
│   │   ├── questionsService.js   # ✅ Banco de preguntas
│   │   ├── speechRecognitionService.js # 🎤 Web Speech
│   │   ├── ttsService.js         # 🔊 Text-to-Speech
│   │   └── voskService.js        # 🎤 Vosk offline (futuro)
│   ├── EnglishPracticeApp.jsx    # ✅ Componente principal
│   ├── main.jsx                  # ✅ Entry point
│   └── index.css                 # ✅ Estilos globales
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 20.19.0
- **npm** >= 8.0.0

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/english-practice-app.git
cd english-practice-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar API Key (OpenRouter)
```javascript
// En src/EnglishPracticeApp.jsx, línea 184:
const [apiKey] = useState('tu-openrouter-api-key-aquí');
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Build para producción
```bash
npm run build
npm run preview
```

## 🎯 Uso de la Aplicación

### 🏠 **Pantalla Principal**
- Ver progreso diario
- Acceder a diferentes modos de práctica
- Estadísticas rápidas

### 🎤 **Conversación con IA**
1. **Escuchar pregunta**: Toca el botón de audio para escuchar
2. **Grabar respuesta**: Mantén presionado el botón de micrófono
3. **Análisis automático**: El AI analiza tu respuesta en tiempo real
4. **Recibir feedback**: Obtén puntuación, sugerencias y follow-up questions
5. **Continuar conversación**: Responde las preguntas de seguimiento

### 📊 **Progreso**
- Rastrea conversaciones diarias
- Mantén rachas de práctica
- Revisa estadísticas históricas

## 🤖 Integración con AI

### OpenRouter API
```javascript
// Configuración actual
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "anthropic/claude-3.5-sonnet",
    messages: [/* conversación */]
  })
});
```

### Respuesta del AI
```json
{
  "encouragement": "Great job! Your English sounds very natural.",
  "score": 85,
  "suggestions": ["Try adding more details", "Use more descriptive words"],
  "confidence": 0.9,
  "mood": "encouraging",
  "audioText": "Excellent work! Keep practicing!",
  "followUpQuestion": "What do you like most about that?"
}
```

## 🎤 Funcionalidades de Speech

### Reconocimiento de Voz
- **Web Speech API** (navegadores modernos)
- Transcripción en tiempo real
- Soporte para inglés (en-US)
- Manejo de errores y fallbacks

### Text-to-Speech
- Reproducción de preguntas
- Respuestas del AI con audio
- Configuración de velocidad y tono
- Soporte multi-idioma

### Grabación de Audio
- MediaRecorder API
- Formato WebM/Opus
- Duración en tiempo real
- Reproducción de grabaciones

## 📝 Sistema de Preguntas

### Niveles de Dificultad
- **Beginner**: Preguntas personales básicas
- **Intermediate**: Experiencias y opiniones
- **Advanced**: Temas abstractos e hipotéticos

### Categorías
- Personal information
- Daily activities  
- Hobbies & interests
- Family & relationships
- Work & study
- Travel & experiences

### Ejemplo de Pregunta
```javascript
{
  question: "What's your favorite hobby?",
  level: "beginner",
  category: "personal",
  sampleAnswer: "My favorite hobby is reading because..."
}
```

## 🔧 Desarrollo

### Scripts Disponibles
```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build para producción  
npm run preview   # Preview del build
```

### Estructura de Hooks
```javascript
// useSimpleVoice - Hook principal de voz
const {
  isRecording,
  isProcessing, 
  transcript,
  duration,
  startRecording,
  stopRecording,
  processWithAI
} = useSimpleVoice();
```

### Debug y Logs
- Console logs detallados en desarrollo
- Estados de la aplicación visibles
- Error handling completo

## 🚀 Roadmap

### ✅ Implementado
- [x] Conversación con AI real (Claude 3.5 Sonnet)
- [x] Speech recognition en tiempo real
- [x] Sistema de progreso y estadísticas
- [x] Text-to-Speech automático
- [x] UI/UX responsive
- [x] Banco de preguntas multinivel

### 🔄 En Desarrollo
- [ ] Integración con Vosk (offline speech)
- [ ] Google Speech API como alternativa
- [ ] Análisis de pronunciación
- [ ] Sistema de achievements

### 🔮 Futuro
- [ ] Modo conversación libre
- [ ] Análisis de fluidez avanzado
- [ ] Integración con Whisper
- [ ] Exportar progreso a PDF
- [ ] Modo práctica de vocabulario
- [ ] Integración con Anki/Spaced repetition

## 🤝 Contribución

### Configuración de desarrollo
1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m 'Añadir nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

### Guidelines
- Usar TailwindCSS para estilos
- Seguir convenciones de React Hooks
- Añadir logs para debugging
- Mantener compatibilidad con mobile
- Documentar nuevas APIs

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

### Problemas Comunes

**1. Micrófono no funciona**
- Verificar permisos del navegador
- Usar HTTPS en producción
- Comprobar Web Speech API support

**2. AI no responde**
- Verificar API key de OpenRouter
- Comprobar conexión a internet
- Revisar logs de consola

**3. Audio no se reproduce**
- Verificar soporte de SpeechSynthesis
- Comprobar configuración de audio del dispositivo

### Contacto
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/english-practice-app/issues)
- **Email**: br792346@gmail.com@example.com
- **Discord**: Tu servidor de Discord

---

**Hecho con ❤️ usando React, AI y mucho café ☕**
