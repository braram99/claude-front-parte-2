// Banco de preguntas organizadas por categorías y niveles
const questionBank = {
  beginner: {
    personal: [
      "What's your name?",
      "How old are you?",
      "Where are you from?",
      "What's your favorite color?",
      "What's your favorite food?",
      "Do you have any pets?",
      "What's your favorite hobby?",
      "What time do you wake up?",
      "What's your favorite season?",
      "Do you like music?"
    ],
    daily: [
      "What did you eat for breakfast?",
      "How was your day today?",
      "What time did you go to bed yesterday?",
      "What's the weather like today?",
      "What are you wearing today?",
      "What did you do yesterday?",
      "What are your plans for tomorrow?",
      "How do you feel today?",
      "What's your favorite day of the week?",
      "What time is it now?"
    ],
    preferences: [
      "Do you prefer tea or coffee?",
      "What's your favorite movie?",
      "Do you like to read books?",
      "What's your favorite sport?",
      "Do you prefer summer or winter?",
      "What's your favorite subject in school?",
      "Do you like to cook?",
      "What's your favorite animal?",
      "Do you prefer sweet or salty food?",
      "What's your favorite game?"
    ]
  },
  intermediate: {
    experiences: [
      "Tell me about your last vacation.",
      "What's the most interesting place you've visited?",
      "Describe your best friend.",
      "What's your favorite childhood memory?",
      "Tell me about a time you felt proud.",
      "What's the best gift you've ever received?",
      "Describe your ideal weekend.",
      "What's something new you learned recently?",
      "Tell me about your family.",
      "What's your biggest achievement?"
    ],
    opinions: [
      "What do you think about social media?",
      "How important is learning English to you?",
      "What's your opinion on technology?",
      "Do you think people should exercise every day?",
      "What's your view on online learning?",
      "How do you feel about changes in your life?",
      "What's your opinion on traveling?",
      "Do you think it's important to have hobbies?",
      "What's your view on friendship?",
      "How do you feel about trying new foods?"
    ],
    plans: [
      "What are your goals for this year?",
      "Where would you like to travel next?",
      "What would you like to learn in the future?",
      "How do you plan to improve your English?",
      "What job would you like to have?",
      "What would you do if you won the lottery?",
      "How do you want to spend your next birthday?",
      "What changes would you make in your life?",
      "What's your dream house like?",
      "How do you plan to stay healthy?"
    ]
  },
  advanced: {
    hypothetical: [
      "If you could change one thing about the world, what would it be?",
      "If you could have dinner with anyone, who would you choose?",
      "If you could live in any time period, when would it be?",
      "If you had unlimited money, what would you do?",
      "If you could have any superpower, what would it be?",
      "If you could speak any language fluently, which would you choose?",
      "If you could solve one global problem, what would it be?",
      "If you could be famous for something, what would it be?",
      "If you could live anywhere in the world, where would you go?",
      "If you could master any skill instantly, what would it be?"
    ],
    abstract: [
      "What does success mean to you?",
      "How do you define happiness?",
      "What's more important: money or time?",
      "What makes a good leader?",
      "How do you handle stress and pressure?",
      "What's the role of technology in education?",
      "How do cultural differences affect communication?",
      "What's the importance of preserving traditions?",
      "How do you think AI will change our future?",
      "What's the balance between work and personal life?"
    ]
  }
};

// Consejos y respuestas modelo para cada nivel
const sampleAnswers = {
  beginner: {
    "What's your favorite food?": "My favorite food is pizza because it's delicious and I can share it with friends.",
    "Where are you from?": "I'm from Colombia. It's a beautiful country in South America.",
    "What's your favorite color?": "My favorite color is blue because it reminds me of the ocean."
  },
  intermediate: {
    "Tell me about your last vacation.": "Last month I went to the beach with my family. We stayed there for a week and enjoyed swimming and eating fresh seafood.",
    "What's your biggest achievement?": "My biggest achievement was graduating from university. It took me four years of hard work, but I felt very proud when I received my diploma."
  },
  advanced: {
    "What does success mean to you?": "Success to me means finding a balance between personal fulfillment and contributing positively to society. It's not just about money or status, but about making a meaningful impact."
  }
};

class QuestionsService {
  constructor() {
    this.currentLevel = 'beginner';
    this.currentCategory = 'personal';
    this.usedQuestions = new Set();
    this.questionHistory = [];
  }

  // Obtener una pregunta aleatoria según nivel y categoría
  getRandomQuestion(level = this.currentLevel, category = null) {
    const levelQuestions = questionBank[level];
    if (!levelQuestions) return null;

    // Si no se especifica categoría, elegir una aleatoria
    const availableCategories = Object.keys(levelQuestions);
    const selectedCategory = category || availableCategories[Math.floor(Math.random() * availableCategories.length)];
    
    const categoryQuestions = levelQuestions[selectedCategory];
    if (!categoryQuestions || categoryQuestions.length === 0) return null;

    // Filtrar preguntas ya usadas
    const unusedQuestions = categoryQuestions.filter(q => !this.usedQuestions.has(q));
    
    // Si todas las preguntas fueron usadas, reiniciar
    if (unusedQuestions.length === 0) {
      this.usedQuestions.clear();
      return this.getRandomQuestion(level, selectedCategory);
    }

    // Seleccionar pregunta aleatoria
    const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
    const selectedQuestion = unusedQuestions[randomIndex];
    
    // Marcar como usada
    this.usedQuestions.add(selectedQuestion);
    
    // Agregar al historial
    this.questionHistory.push({
      question: selectedQuestion,
      level,
      category: selectedCategory,
      timestamp: new Date().toISOString()
    });

    return {
      question: selectedQuestion,
      level,
      category: selectedCategory,
      sampleAnswer: sampleAnswers[level]?.[selectedQuestion] || null
    };
  }

  // Obtener la siguiente pregunta basada en progreso
  getNextQuestion() {
    return this.getRandomQuestion(this.currentLevel);
  }

  // Cambiar nivel de dificultad
  setLevel(level) {
    if (questionBank[level]) {
      this.currentLevel = level;
      this.usedQuestions.clear(); // Reiniciar preguntas usadas
    }
  }

  // Obtener estadísticas
  getStats() {
    return {
      currentLevel: this.currentLevel,
      questionsAnswered: this.questionHistory.length,
      availableLevels: Object.keys(questionBank),
      totalQuestions: this.getTotalQuestions()
    };
  }

  // Obtener total de preguntas disponibles
  getTotalQuestions() {
    let total = 0;
    Object.values(questionBank).forEach(level => {
      Object.values(level).forEach(category => {
        total += category.length;
      });
    });
    return total;
  }

  // Obtener historial de preguntas
  getHistory() {
    return this.questionHistory;
  }

  // Obtener preguntas por categoría
  getQuestionsByCategory(level = this.currentLevel) {
    return questionBank[level] || {};
  }

  // Reiniciar progreso
  reset() {
    this.usedQuestions.clear();
    this.questionHistory = [];
    this.currentLevel = 'beginner';
    this.currentCategory = 'personal';
  }

  // Obtener respuesta de ejemplo
  getSampleAnswer(question, level = this.currentLevel) {
    return sampleAnswers[level]?.[question] || null;
  }

  // Sugerir nivel basado en progreso
  suggestLevel() {
    const answered = this.questionHistory.length;
    
    if (answered < 10) return 'beginner';
    if (answered < 30) return 'intermediate';
    return 'advanced';
  }
}

// Exportar instancia singleton
const questionsService = new QuestionsService();
export default questionsService;