// src/services/tempAIService.js - FULL UPGRADE AI Conversacional Inteligente

class ConversationalAIService {
  constructor() {
    this.conversationHistory = [];
    this.userProfile = {
      name: null,
      country: null,
      interests: [],
      englishLevel: 'beginner',
      preferredTopics: [],
      conversationCount: 0
    };
    
    // AI Personality: 60% Amigable + 30% Profesional + 10% Divertido
    this.personality = {
      greeting: ["Hi there!", "Hello!", "Hey!", "Great to see you!"],
      encouragement: ["You're doing great!", "That's awesome!", "Nice job!", "Keep it up!"],
      curiosity: ["I'm curious about", "Tell me more about", "That sounds interesting!", "I'd love to know"],
      teacherMode: ["Let me help you with", "Here's a tip", "Remember that", "Practice this"]
    };
    
    console.log('🤖 Conversational AI Tutor initialized - FULL UPGRADE');
  }

  // 🧠 Analyze user input and extract information
  analyzeUserInput(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    const analysis = {
      hasQuestion: /\?/.test(transcript),
      hasGreeting: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(transcript),
      hasLocation: /\b(from|live|country|city)\b/i.test(transcript),
      hasPersonalInfo: /\b(my name|i'm|i am|my|me)\b/i.test(transcript),
      hasInterest: /\b(like|love|enjoy|hobby|favorite|prefer)\b/i.test(transcript),
      sentimentPositive: /\b(good|great|nice|love|amazing|wonderful|fantastic)\b/i.test(transcript),
      sentimentNegative: /\b(bad|terrible|hate|difficult|hard|problem)\b/i.test(transcript),
      hasFamily: /\b(family|mother|father|sister|brother|mom|dad|parent)\b/i.test(transcript),
      hasWork: /\b(work|job|study|school|university|teacher|student)\b/i.test(transcript),
      hasFood: /\b(eat|food|cook|restaurant|taste|delicious|hungry)\b/i.test(transcript)
    };

    // Extract specific information
    const locationMatch = transcript.match(/from\s+([^.!?]+)/i);
    if (locationMatch) {
      this.userProfile.country = locationMatch[1].trim();
    }

    const nameMatch = transcript.match(/my name is\s+(\w+)|i'm\s+(\w+)|i am\s+(\w+)/i);
    if (nameMatch) {
      this.userProfile.name = nameMatch[1] || nameMatch[2] || nameMatch[3];
    }

    // Extract interests
    const interestPatterns = [
      /i like ([^.!?]+)/i,
      /i love ([^.!?]+)/i,
      /i enjoy ([^.!?]+)/i,
      /my hobby is ([^.!?]+)/i,
      /my favorite ([^.!?]+)/i
    ];

    interestPatterns.forEach(pattern => {
      const match = transcript.match(pattern);
      if (match && !this.userProfile.interests.includes(match[1].trim())) {
        this.userProfile.interests.push(match[1].trim());
      }
    });

    return analysis;
  }

  // 🎯 Main analyze and respond method - UPGRADED
  async analyzeAndRespond(question, transcript) {
    console.log('🤖 Conversational AI analyzing:', { question, transcript });
    
    try {
      // Clean and analyze transcript
      const cleanTranscript = transcript.trim();
      
      if (!cleanTranscript || cleanTranscript.length < 3) {
        return this.generateErrorResponse();
      }

      // Analyze user input for context
      const inputAnalysis = this.analyzeUserInput(cleanTranscript);
      
      // Calculate score (keep original logic but enhanced)
      const score = this.calculateAdvancedScore(cleanTranscript, inputAnalysis);
      
      // Update conversation history
      this.addToHistory('user', cleanTranscript, question);
      
      // Generate conversational response
      const response = this.generateConversationalResponse(
        cleanTranscript, 
        question, 
        inputAnalysis, 
        score
      );

      // Add AI response to history
      this.addToHistory('ai', response.encouragement, question);

      console.log('✅ Conversational AI Response:', response);
      return response;

    } catch (error) {
      console.error('❌ Conversational AI error:', error);
      return this.generateErrorResponse();
    }
  }

  // 💬 Generate contextual conversational response - MAIN UPGRADE
  generateConversationalResponse(transcript, originalQuestion, analysis, score) {
    const responses = {
      directAnswer: this.generateDirectAnswer(transcript, originalQuestion, analysis),
      encouragement: this.generatePersonalizedEncouragement(score, transcript, analysis),
      followUp: this.generateIntelligentFollowUp(transcript, analysis),
      suggestions: this.generateContextualSuggestions(score, transcript, analysis)
    };

    // Build natural conversational response
    let fullResponse = responses.directAnswer;
    
    // Add personal encouragement about their English
    if (score >= 70) {
      fullResponse += ` ${responses.encouragement}`;
    }
    
    // Add natural follow-up question
    fullResponse += ` ${responses.followUp}`;

    return {
      encouragement: fullResponse,
      score: score,
      suggestions: responses.suggestions,
      confidence: Math.min(0.95, 0.6 + (transcript.split(' ').length * 0.05)),
      mood: this.determineMood(score, analysis),
      audioText: fullResponse,
      followUpQuestion: responses.followUp,
      shouldSpeak: true,
      // Enhanced analysis
      grammar: this.analyzeGrammar(transcript),
      vocabulary: this.analyzeVocabulary(transcript),
      fluency: this.analyzeFluency(transcript),
      conversationContext: {
        userProfile: this.userProfile,
        historyLength: this.conversationHistory.length,
        detectedTopics: this.extractTopics(transcript),
        conversationFlow: this.analyzeConversationFlow()
      }
    };
  }

  // 🎯 Generate direct answer to user's input - SMART RESPONSES
  generateDirectAnswer(transcript, originalQuestion, analysis) {
    const lowerTranscript = transcript.toLowerCase();

    // User asked where AI is from
    if (analysis.hasQuestion && /where.*you.*from/i.test(transcript)) {
      const responses = [
        "I'm an AI teacher, so I live in the digital world! 😊",
        "I exist in the cloud, but I love learning about different places!",
        "I'm from the digital realm, but I'm fascinated by your world!",
        "I'm an AI, so I don't have a physical location, but I'm here to help you practice English!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // User asked about AI's name
    if (/what.*your name|who are you/i.test(transcript)) {
      return "I'm your English tutor AI! You can call me Teacher Bot. What should I call you?";
    }

    // User asked how AI is doing
    if (/how are you|how.*doing/i.test(transcript)) {
      return "I'm doing great, thanks for asking! I love helping students practice English.";
    }

    // User shared their location
    if (this.userProfile.country) {
      const countryResponses = {
        'dominican republic': "Dominican Republic is beautiful! I've heard the beaches are amazing and the people are very friendly.",
        'mexico': "Mexico has such rich culture and delicious food! The diversity there is incredible.",
        'colombia': "Colombia is known for its coffee and beautiful landscapes! What's your favorite thing about it?",
        'spain': "Spain has such beautiful architecture and culture! The language sounds so elegant there.",
        'united states': "The US is so diverse! What state are you in? Each one is like a different country.",
        'canada': "Canada seems like such a beautiful and peaceful country! Do you experience those cold winters?",
        'brazil': "Brazil! The land of beautiful beaches, carnival, and amazing music!",
        'argentina': "Argentina! I've heard the steaks are incredible and Buenos Aires is like the Paris of South America.",
        'default': `${this.userProfile.country} sounds like a wonderful place! I'd love to learn more about it.`
      };
      
      const country = this.userProfile.country.toLowerCase();
      return countryResponses[country] || countryResponses.default;
    }

    // User shared interests/hobbies
    if (analysis.hasInterest) {
      if (/music/i.test(transcript)) {
        return "Music is amazing! It's a universal language. What kind of music moves your soul?";
      }
      if (/read|book/i.test(transcript)) {
        return "Reading is fantastic for learning English too! What's the last book that captivated you?";
      }
      if (/cook|food/i.test(transcript)) {
        return "Cooking is such a wonderful hobby! Food brings people together. What's your signature dish?";
      }
      if (/sport|exercise/i.test(transcript)) {
        return "Sports are great for staying healthy! Physical activity and mental exercise go hand in hand.";
      }
      return "That sounds really interesting! Hobbies make life so much richer, don't they?";
    }

    // User talked about family
    if (analysis.hasFamily) {
      return "Family is so important! They're the people who support us through everything.";
    }

    // User talked about work/study
    if (analysis.hasWork) {
      return "That's great! Work and study help us grow as people. What do you enjoy most about it?";
    }

    // User shared food preferences
    if (analysis.hasFood) {
      return "Food is one of life's greatest pleasures! Every culture has such unique flavors.";
    }

    // User greeted
    if (analysis.hasGreeting) {
      const name = this.userProfile.name ? `, ${this.userProfile.name}` : '';
      return `Hello${name}! It's wonderful to practice English with you today!`;
    }

    // Default conversational responses based on sentiment
    if (analysis.sentimentPositive) {
      const positiveResponses = [
        "That's wonderful to hear! Your positive energy is contagious!",
        "I love your enthusiasm! It makes learning so much more enjoyable.",
        "That sounds absolutely fantastic! Tell me more about what makes it so special.",
        "Your excitement is inspiring! Positive feelings help with language learning too."
      ];
      return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    }

    if (analysis.sentimentNegative) {
      const supportiveResponses = [
        "I understand that can be challenging. Let's talk about it - sometimes sharing helps.",
        "That sounds difficult. Remember, every challenge is an opportunity to grow stronger.",
        "I hear you. It's okay to have tough moments - they're part of the human experience.",
        "Thanks for sharing that with me. Talking about difficulties can be therapeutic."
      ];
      return supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
    }

    // Default conversational response
    const genericResponses = [
      "That's really interesting to hear! I appreciate you sharing that with me.",
      "Thanks for telling me about that! Every conversation teaches me something new.",
      "I find that fascinating! Human experiences are so diverse and wonderful.",
      "That's a great thing to talk about! I love learning about different perspectives."
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }

  // 🎉 Generate personalized encouraging feedback
  generatePersonalizedEncouragement(score, transcript, analysis) {
    const wordCount = transcript.split(' ').length;
    const name = this.userProfile.name ? `, ${this.userProfile.name}` : '';
    
    if (score >= 85) {
      const encouragements = [
        `Your English is really flowing naturally${name}!`,
        "You're speaking with incredible confidence!",
        "That was beautifully expressed!",
        "Your pronunciation sounds fantastic!"
      ];
      return encouragements[Math.floor(Math.random() * encouragements.length)];
    } else if (score >= 70) {
      const encouragements = [
        `You're doing really well${name}!`,
        "Your English is improving so nicely!",
        "Great job expressing yourself clearly!",
        "You're getting more comfortable with English!"
      ];
      return encouragements[Math.floor(Math.random() * encouragements.length)];
    } else if (wordCount >= 5) {
      return "Good effort! I can see you're really trying, and that's what matters most!";
    } else {
      return "Nice start! Every word you speak is progress.";
    }
  }

  // ❓ Generate intelligent follow-up questions
  generateIntelligentFollowUp(transcript, analysis) {
    // Context-aware follow-ups based on conversation history
    const recentTopics = this.getRecentTopics();
    
    // Location-based follow-ups
    if (this.userProfile.country) {
      const locationFollowUps = [
        `What's the weather like in ${this.userProfile.country} today?`,
        `What's your favorite food from ${this.userProfile.country}?`,
        `Do you have any special traditions in ${this.userProfile.country}?`,
        `What would you tell a tourist to visit in ${this.userProfile.country}?`,
        `What's unique about the culture in ${this.userProfile.country}?`
      ];
      return locationFollowUps[Math.floor(Math.random() * locationFollowUps.length)];
    }

    // Interest-based follow-ups
    if (analysis.hasInterest) {
      const interestFollowUps = [
        "How did you first get into that?",
        "What's the most exciting part about it?",
        "How long have you been passionate about that?",
        "Would you teach someone else how to do it?",
        "What advice would you give to beginners?"
      ];
      return interestFollowUps[Math.floor(Math.random() * interestFollowUps.length)];
    }

    // Family-based follow-ups
    if (analysis.hasFamily) {
      const familyFollowUps = [
        "Do you have a big family or a small one?",
        "What's your favorite family tradition?",
        "Who in your family are you closest to?",
        "Do you live near your family?"
      ];
      return familyFollowUps[Math.floor(Math.random() * familyFollowUps.length)];
    }

    // Work/study follow-ups
    if (analysis.hasWork) {
      const workFollowUps = [
        "What's the most interesting part of your work?",
        "How long have you been doing that?",
        "What skills have you learned recently?",
        "Do you enjoy what you do?"
      ];
      return workFollowUps[Math.floor(Math.random() * workFollowUps.length)];
    }

    // General conversational follow-ups
    const generalFollowUps = [
      "What's something that made you smile recently?",
      "What are you looking forward to this week?",
      "Tell me about your typical day!",
      "What's your favorite way to relax?",
      "If you could learn any new skill, what would it be?",
      "What's the best advice someone ever gave you?",
      "What makes you feel proud of yourself?",
      "What's your favorite season and why?"
    ];

    return generalFollowUps[Math.floor(Math.random() * generalFollowUps.length)];
  }

  // 💡 Generate contextual suggestions
  generateContextualSuggestions(score, transcript, analysis) {
    const wordCount = transcript.split(' ').length;
    const suggestions = [];

    if (wordCount < 5) {
      suggestions.push("Try to speak in longer sentences - add more details!");
    }

    if (score < 70) {
      suggestions.push("Speak slowly and clearly - don't rush");
      suggestions.push("Don't worry about perfection - focus on communication");
    }

    if (wordCount >= 10) {
      suggestions.push("Excellent length! Now try adding descriptive adjectives");
    }

    if (analysis.hasQuestion) {
      suggestions.push("Great job asking questions - that shows engagement!");
    }

    if (this.userProfile.interests.length > 0) {
      suggestions.push("Try connecting topics to your interests");
    }

    // Always add encouraging suggestion
    suggestions.push("You're making great progress - keep the conversation flowing!");

    return suggestions.slice(0, 3);
  }

  // 📊 Calculate advanced score
  calculateAdvancedScore(transcript, analysis) {
    const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    let score = 40; // Base score
    
    // Length bonus
    if (wordCount >= 15) score += 30;
    else if (wordCount >= 10) score += 25;
    else if (wordCount >= 7) score += 20;
    else if (wordCount >= 5) score += 15;
    else if (wordCount >= 3) score += 10;
    
    // Complexity bonus
    const complexWords = words.filter(w => w.length > 6).length;
    score += complexWords * 3;
    
    // Question bonus (shows engagement)
    if (analysis.hasQuestion) score += 10;
    
    // Personal info bonus (shows openness)
    if (analysis.hasPersonalInfo) score += 8;
    
    // Interest sharing bonus
    if (analysis.hasInterest) score += 8;
    
    // Complete sentence bonus
    const sentenceCount = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    score += sentenceCount * 5;
    
    // Conversation engagement bonus
    if (this.conversationHistory.length > 0) score += 5;
    
    // Positive sentiment bonus
    if (analysis.sentimentPositive) score += 5;
    
    return Math.min(100, Math.max(20, score));
  }

  // Enhanced analysis methods
  analyzeGrammar(transcript) {
    const issues = [];
    const score = 80; // Default good score
    
    if (!transcript.match(/[A-Z]/)) {
      issues.push('Try starting sentences with capital letters');
    }
    
    if (transcript.match(/\b(me go|me like|me want)\b/i)) {
      issues.push('Use "I" instead of "me" as subject');
    }
    
    return { score, issues: issues.slice(0, 2) };
  }

  analyzeVocabulary(transcript) {
    const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words).size;
    const advancedWords = this.countAdvancedWords(words);
    
    const score = Math.min(100, 60 + (uniqueWords * 2) + (advancedWords * 5));
    
    return { score, uniqueWords, advancedWords };
  }

  analyzeFluency(transcript) {
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    let score = 50;
    if (wordCount >= 15) score = 95;
    else if (wordCount >= 10) score = 85;
    else if (wordCount >= 5) score = 70;
    
    return { score, wordCount };
  }

  countAdvancedWords(words) {
    const advancedWords = [
      'consequently', 'furthermore', 'nevertheless', 'specifically',
      'particularly', 'significantly', 'extraordinary', 'fascinating',
      'remarkable', 'exceptional', 'comprehensive', 'sophisticated',
      'absolutely', 'definitely', 'probably', 'especially', 'actually'
    ];
    
    return words.filter(word => 
      advancedWords.includes(word.toLowerCase()) || word.length > 8
    ).length;
  }

  // 😊 Determine AI mood based on performance and context
  determineMood(score, analysis) {
    if (score >= 85) return 'enthusiastic';
    if (score >= 70) return 'encouraging';
    if (analysis.sentimentPositive) return 'supportive';
    if (analysis.sentimentNegative) return 'gentle';
    return 'supportive';
  }

  // 📝 Add message to conversation history
  addToHistory(sender, message, question) {
    this.conversationHistory.push({
      sender,
      message,
      question,
      timestamp: new Date().toISOString(),
      topics: this.extractTopics(message)
    });

    // Keep only last 15 messages for better context
    if (this.conversationHistory.length > 15) {
      this.conversationHistory = this.conversationHistory.slice(-15);
    }

    this.userProfile.conversationCount++;
  }

  // 🏷️ Extract topics from text
  extractTopics(text) {
    const topicKeywords = {
      location: ['country', 'city', 'from', 'live', 'place', 'home'],
      hobbies: ['like', 'love', 'hobby', 'enjoy', 'favorite', 'fun'],
      food: ['eat', 'food', 'cook', 'restaurant', 'taste', 'delicious'],
      family: ['family', 'mother', 'father', 'sister', 'brother', 'parent'],
      work: ['work', 'job', 'study', 'school', 'university', 'career'],
      travel: ['travel', 'visit', 'trip', 'vacation', 'beach', 'journey'],
      music: ['music', 'song', 'sing', 'band', 'concert', 'instrument'],
      sports: ['sport', 'football', 'soccer', 'basketball', 'tennis', 'exercise']
    };

    const foundTopics = [];
    const lowerText = text.toLowerCase();

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundTopics.push(topic);
      }
    });

    return foundTopics;
  }

  // 📚 Get recent conversation topics
  getRecentTopics() {
    return this.conversationHistory
      .slice(-5)
      .flatMap(entry => entry.topics)
      .filter((topic, index, arr) => arr.indexOf(topic) === index);
  }

  // 🔄 Analyze conversation flow
  analyzeConversationFlow() {
    const recentMessages = this.conversationHistory.slice(-4);
    return {
      turnCount: recentMessages.length,
      topics: this.getRecentTopics(),
      userEngagement: recentMessages.filter(m => m.sender === 'user').length,
      conversationDepth: this.userProfile.interests.length + (this.userProfile.country ? 1 : 0)
    };
  }

  // ❌ Generate error response
  generateErrorResponse() {
    return {
      encouragement: "I couldn't hear you clearly. Could you try speaking a bit louder and closer to the microphone?",
      score: 25,
      suggestions: ['Speak closer to the microphone', 'Try speaking more slowly', 'Don\'t worry, try again!'],
      confidence: 0.1,
      mood: 'supportive',
      audioText: "I couldn't hear you clearly. Could you try again?",
      shouldSpeak: true,
      grammar: { score: 25, issues: [] },
      vocabulary: { score: 25, uniqueWords: 0, advancedWords: 0 },
      fluency: { score: 25, wordCount: 0 }
    };
  }

  // 🔄 Reset conversation (for new session)
  resetConversation() {
    this.conversationHistory = [];
    this.userProfile = {
      name: null,
      country: null,
      interests: [],
      englishLevel: 'beginner',
      preferredTopics: [],
      conversationCount: 0
    };
    console.log('🔄 Conversation reset - FULL UPGRADE');
  }

  // 📊 Get conversation stats
  getConversationStats() {
    return {
      messageCount: this.conversationHistory.length,
      userProfile: this.userProfile,
      recentTopics: this.getRecentTopics(),
      conversationFlow: this.analyzeConversationFlow()
    };
  }

  // Legacy methods for compatibility
  generateResponse(score, wordCount) {
    return this.generatePersonalizedEncouragement(score, '', {});
  }

  generateSuggestions(wordCount) {
    return this.generateContextualSuggestions(50, '', {});
  }

  generateFollowUp(wordCount) {
    return this.generateIntelligentFollowUp('', {});
  }

  detectGrammarIssues(text) {
    return this.analyzeGrammar(text).issues;
  }

  getErrorResponse() {
    return this.generateErrorResponse();
  }
}

// Export singleton instance - UPGRADED
const tempAIService = new ConversationalAIService();
export default tempAIService;