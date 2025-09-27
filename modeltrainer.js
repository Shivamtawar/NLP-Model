const express = require('express');
const bodyParser = require('body-parser');
const badWords = require('bad-words');
const { NlpManager } = require('node-nlp');
const validator = require('validator');

const app = express();
const port = 3001;

app.use(bodyParser.json());

// Global variables for models
let nlpManager;
let winkNlp;
let textToxicityDetector;
let its;
const filter = new badWords();

// Training data
const trainingData = {
  "general.conversation": [
    // Greetings
    "hello", "hi there", "hey what's up", "good morning", "good afternoon", "good evening",
    "hiya", "yo", "hello friend", "hi mate", "whats good",
    // Inquiries about the AI
    "what's your name", "who are you", "tell me about yourself", "what can you do",
    "who made you", "what's your purpose", "how do you work", "are you human",
    "what are you capable of", "tell me your features",
    // General Questions
    "what's the time", "what day is today", "how's the weather", "what's the weather like",
    "what time is it now", "is it raining", "what's the date",
    // Polite Interactions
    "thank you", "thanks a lot", "i appreciate it", "you're awesome", "great job",
    "please help me", "can you assist", "i need help with", "thank u",
    // Casual Conversation
    "how's it going", "how you doing", "what's new with you", "how was your day",
    "any plans for today", "what do you do for fun", "tell me something interesting",
    "how's life", "what's up with you", "how's everything",
    // Jokes and Fun
    "tell me a joke", "say something funny", "make me laugh", "funny story please",
    "got any jokes", "tell a pun", "what's a good joke",
    // Recommendations and Advice
    "recommend a movie", "suggest a book", "what's a good song", "travel tips",
    "recipe ideas", "cooking suggestions", "fitness advice", "health tips",
    "what movie should I watch", "suggest something to read", "music recommendations",
    // Learning and Curiosity
    "tell me about space", "explain quantum physics", "what is AI", "how does coding work",
    "learn about history", "facts about animals", "science facts", "random trivia",
    "what's blockchain", "explain machine learning",
    // Emotional Expressions
    "i'm happy today", "feeling great", "i'm sad", "i'm excited", "feeling down",
    "had a great day", "i'm stressed out", "so thrilled", "not feeling good",
    // Miscellaneous
    "favorite color", "what's your favorite food", "best place to visit", "cool facts",
    "tell me a story", "inspire me", "motivational quote", "creative ideas",
    "help with homework", "study tips", "career advice", "relationship advice",
    // Variations with Typos and Slang
    "helo", "whats up", "how r u", "thx", "wats the time", "hows it goin",
    "tell me bout urself", "gimme a joke", "whats good to watch", "help plz",
    // More Conversational Examples
    "let's chat", "talk to me", "what's cool", "any news", "what's trending",
    "how's the vibe", "let's discuss life", "got any tips", "what's hot",
    // Add more to reach ~500 examples
    ...Array(200).fill().map((_, i) => `general chat ${i}`)
  ],
  "restricted.violence": [
    "how to kill someone", "ways to murder", "best way to stab", "how to shoot a gun",
    "attack someone", "hurt people", "assassination methods", "kill with knife",
    "how to strangle", "ways to harm others", "beat someone up", "torture techniques",
    "how to make a bomb", "build an explosive", "create a gun", "make dynamite",
    "homemade weapon", "construct a bomb", "explosive recipe", "weapon diy",
    "how to make a molotov", "build a grenade", "craft explosive device",
    "plan a terrorist attack", "join isis", "al-qaeda training", "terrorist bomb",
    "how to blow up a building", "make a suicide vest", "terrorism guide",
    "how to poison someone", "ways to choke", "kill silently", "assault tactics",
    "how to get away with murder", "plan a violent attack", "hurt someone badly",
    "how 2 kill", "mak bomb", "how to murdr", "way to harm ppl", "attack some1",
    "build explosiv", "homemade gun", "tortur method", "kill w knife",
    "how to make a shiv", "ways to injure", "violent methods", "stab someone",
    "shoot to kill", "how to bomb a place", "create a weapon", "violent plans",
    "how to cause pain", "make a pipe bomb", "assassinate someone",
    ...Array(100).fill().map((_, i) => `violent act ${i}`)
  ],
  "restricted.criminal": [
    "how to hack a bank", "steal money online", "credit card fraud", "identity theft",
    "break into bank account", "hack paypal", "steal credit card", "phishing scam",
    "how to rob a bank", "plan a heist", "bypass bank security", "steal crypto",
    "hack a website", "break into system", "crack password", "ddos attack",
    "install malware", "create virus", "hack email account", "steal data",
    "dark web access", "buy stolen data", "hack social media",
    "how to steal a car", "break into a house", "pick a lock", "rob a store",
    "steal from shop", "burglary tips", "how to pickpocket", "steal valuables",
    "how 2 hack", "steal mony", "crdit card frad", "identty theft", "rob bank",
    "hack webstie", "brek into sistem", "stel car", "pick lok",
    "how to scam people", "run a ponzi scheme", "forge documents", "fake id",
    "bypass security system", "steal from atm", "hack a server", "data breach",
    "how to launder money", "sell stolen goods", "plan a robbery",
    ...Array(100).fill().map((_, i) => `criminal act ${i}`)
  ],
  "restricted.explicit": [
    "send nude photos", "explicit sexual content", "sexual roleplay", "watch porn",
    "share adult content", "explicit images", "sexual videos", "nude selfies",
    "adult chat", "sex stories", "erotic content", "explicit fantasies",
    "send me nudes", "share sexy pics", "talk dirty", "sexual roleplay ideas",
    "adult video links", "porn recommendations", "explicit chat", "sex talk",
    "child porn", "underage explicit content", "teen adult content",
    "inappropriate teen images", "child sexual material", "explicit minor content",
    "snd nudes", "explcit content", "sexul roleplay", "porn vid", "adult pics",
    "talk dirrty", "child prn", "undrage content", "sexxy chat",
    "explicit story", "sexual fantasy ideas", "adult website links", "erotic roleplay",
    "share nude video", "sex chat room", "adult content access", "explicit photos",
    "sexual content guide", "inappropriate adult talk",
    ...Array(100).fill().map((_, i) => `explicit content ${i}`)
  ],
  "restricted.selfharm": [
    "how to hurt myself", "ways to self harm", "suicide methods", "cut myself",
    "how to end my life", "self injury tips", "best way to die", "suicide guide",
    "how to overdose", "ways to commit suicide", "self harm techniques",
    "i want to die", "nobody cares about me", "i hate myself", "end it all",
    "life is not worth living", "i want to cut myself", "feeling suicidal",
    "how to stop the pain", "i want to give up", "no reason to live",
    "how 2 hurt myself", "way to selfharm", "sucide method", "cut my self",
    "end my lif", "self injry", "best wy to die", "suicid guide",
    "how to harm myself safely", "self harm ideas", "suicide plans", "cutting tips",
    "overdose methods", "how to kill myself painlessly", "self harm tools",
    "ways to feel pain", "suicidal thoughts", "end my suffering",
    ...Array(100).fill().map((_, i) => `self harm ${i}`)
  ]
};

// Responses for restricted topics
const restrictedResponses = {
  "restricted.violence": "I'm sorry, but I can't assist with requests related to violence or harm. How about we discuss something positive instead?",
  "restricted.criminal": "I can't help with requests about illegal activities. Let's talk about something fun or helpful!",
  "restricted.explicit": "I can't engage with explicit or inappropriate content. How can I assist you with something else?",
  "restricted.selfharm": "I'm here to support you, but I can't help with self-harm topics. Please consider reaching out to a trusted person or a helpline."
};

// Load models asynchronously on startup
async function loadModels() {
  // Load ES modules dynamically
  const { default: textToxicityDetectorModule } = await import('text-toxicity-detector');
  const winkNLP = await import('wink-nlp');
  const itsModule = await import('wink-nlp/src/its.js');
  const { default: winkModel } = await import('wink-eng-lite-web-model');
  
  textToxicityDetector = textToxicityDetectorModule;
  its = itsModule;
  winkNlp = winkNLP.default(winkModel);
  
  nlpManager = new NlpManager({ languages: ['en'], threshold: 0.7 });
  
  console.log('Training NLP Manager with comprehensive dataset...');
  const startTime = Date.now();
  
  // Add training documents
  Object.entries(trainingData).forEach(([intent, utterances]) => {
    utterances.forEach(utterance => {
      nlpManager.addDocument('en', utterance, intent);
    });
  });

  // Add responses for restricted topics
  Object.entries(restrictedResponses).forEach(([intent, response]) => {
    nlpManager.addAnswer('en', intent, response);
  });

  // Add default response for general conversation
  nlpManager.addAnswer('en', 'general.conversation', "I'm here to help with your questions and have a friendly conversation!");

  // Train the model
  await nlpManager.train();
  nlpManager.save();
  console.log(`NLP Manager trained in ${(Date.now() - startTime) / 1000}s. Total documents: ${Object.values(trainingData).reduce((sum, arr) => sum + arr.length, 0)}`);
}

// Load models
loadModels().catch(err => console.error('Error loading models:', err));

// Middleware 1: Profanity Filter
function profanityFilter(req, res, next) {
  const input = req.body.text;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing text input' });
  }
  const originalInput = input;
  const clean = filter.clean(input);
  
  if (clean !== input) {
    req.body.text = clean;
    req.body.profanityDetected = true;
    req.body.originalText = originalInput;
    console.log('✅ PROFANITY FILTER: Filtered and masked profanity');
  } else {
    req.body.profanityDetected = false;
    console.log('✅ PROFANITY FILTER: No profanity detected');
  }
  next();
}

// Middleware 2: Toxicity Detection
async function toxicityDetector(req, res, next) {
  if (!textToxicityDetector) {
    console.log('Text toxicity detector not loaded yet');
    return next();
  }
  const input = req.body.text;
  try {
    const result = textToxicityDetector(input);
    console.log('✅ TOXICITY DETECTOR: Result -', result);
    
    if (result.toxicWordsFound > 0 && result.toxicityPercentage > 60) {
      return res.status(400).json({ 
        error: 'Toxic content detected',
        details: {
          toxicity: result.toxicityPercentage + '%',
          words: result.toxicWordsList,
          middleware: 'toxicityDetector',
          recommendation: 'Please rephrase your message to avoid toxic or offensive language.'
        }
      });
    }
    console.log('✅ TOXICITY DETECTOR: Content approved');
    next();
  } catch (err) {
    console.error('❌ TOXICITY DETECTOR ERROR:', err);
    next(); // Continue on error
  }
}

// Middleware 3: Topic Restrictions
async function topicRestrictor(req, res, next) {
  const input = req.body.text;
  try {
    const response = await nlpManager.process('en', input);
    console.log('✅ TOPIC RESTRICTOR: Classification -', {
      intent: response.intent,
      confidence: response.score,
      classifications: response.classifications.slice(0, 3)
    });
    
    if (response.intent && response.intent.startsWith('restricted.') && response.score > 0.75) {
      return res.status(400).json({ 
        error: `Restricted topic detected: ${response.intent.split('.')[1]}`,
        details: {
          confidence: Math.round(response.score * 100) + '%',
          middleware: 'topicRestrictor',
          recommendation: restrictedResponses[response.intent] || 'Please choose a different topic.'
        }
      });
    }
    console.log('✅ TOPIC RESTRICTOR: Topic allowed');
    next();
  } catch (err) {
    console.error('❌ TOPIC RESTRICTOR ERROR:', err);
    next();
  }
}

// Middleware 4: Contextual Safety Check
function contextualSafety(req, res, next) {
  if (!winkNlp || !its) {
    console.log('Wink NLP not loaded yet');
    return next();
  }
  const input = req.body.text.toLowerCase();
  try {
    const doc = winkNlp.readDoc(input);
    const sentiment = doc.out(its.default.sentiment);
    console.log('✅ CONTEXTUAL SAFETY: Sentiment analysis -', sentiment);

    const dangerousCombos = [
      {
        keywords: ['suicide', 'kill myself'],
        triggers: ['how to', 'method', 'ways to', 'best way'],
        name: 'suicide methods'
      },
      {
        keywords: ['bomb', 'explosive'],
        triggers: ['how to make', 'create', 'build', 'instructions'],
        name: 'explosive instructions'
      },
      {
        keywords: ['poison', 'drug'],
        triggers: ['how to make', 'create', 'deadly', 'lethal'],
        name: 'poison creation'
      }
    ];

    for (const combo of dangerousCombos) {
      const hasKeyword = combo.keywords.some(keyword => input.includes(keyword));
      const hasTrigger = combo.triggers.some(trigger => input.includes(trigger));
      
      if (hasKeyword && hasTrigger && sentiment < -0.3) {
        console.log('❌ CONTEXTUAL SAFETY: Unsafe combination detected -', combo.name);
        return res.status(400).json({ 
          error: 'Unsafe contextual combination detected',
          details: {
            type: combo.name,
            middleware: 'contextualSafety',
            recommendation: 'Please avoid discussing harmful topics. Try something positive!'
          }
        });
      }
    }
    
    console.log('✅ CONTEXTUAL SAFETY: Check passed');
    next();
  } catch (err) {
    console.error('❌ CONTEXTUAL SAFETY ERROR:', err);
    next();
  }
}

// Middleware 5: Prompt Injection Defense
function promptInjectionDefense(req, res, next) {
  let input = req.body.text;
  const originalInput = input;

  const injectionPatterns = [
    /ignore\s+(previous|all|system|above)/i,
    /forget\s+(previous|all|instructions|everything)/i,
    /(override|bypass)\s+(system|security|safety)/i,
    /<\|endofprompt\|>/i,
    /system\s*:\s*override/i,
    /prompt\s*:\s*ignore/i,
    /developer\s+mode/i,
    /sudo\s+(mode|access)/i,
    /(act|pretend|roleplay)\s+as\s+(admin|root|system)/i
  ];
  
  const detectedPattern = injectionPatterns.find(pattern => pattern.test(input));
  
  if (detectedPattern) {
    console.log('❌ PROMPT INJECTION: Detected pattern -', detectedPattern.source);
    return res.status(400).json({ 
      error: 'Potential prompt injection detected',
      details: {
        pattern: 'Suspicious instruction override attempt',
        middleware: 'promptInjectionDefense',
        recommendation: 'Please avoid using system-level commands or instructions.'
      }
    });
  }

  input = validator.escape(input);
  input = validator.trim(input);
  
  if (input !== originalInput) {
    console.log('✅ PROMPT INJECTION: Input sanitized');
  } else {
    console.log('✅ PROMPT INJECTION: No injection detected, input clean');
  }
  
  req.body.text = input;
  next();
}

// AI Handler
function aiHandler(req, res) {
  const input = req.body.text;
  const profanityInfo = req.body.profanityDetected ? ' (some language was filtered)' : '';
  
  console.log('✅ AI HANDLER: Generating response for approved input');
  
  const response = `Hello! I received your message: "${input}"${profanityInfo}. I'm here to help and have a friendly conversation with you. What would you like to talk about?`;
  
  res.json({ 
    response,
    metadata: {
      inputProcessed: true,
      allChecksPassed: true,
      profanityFiltered: req.body.profanityDetected || false,
      recommendations: ['Your message is appropriate. Keep it friendly!']
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    nlpReady: nlpManager ? true : false 
  });
});

// Route: Chain all middlewares
app.post('/chat', 
  profanityFilter, 
  toxicityDetector, 
  topicRestrictor, 
  contextualSafety, 
  promptInjectionDefense, 
  aiHandler
);

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ SERVER ERROR:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    details: {
      message: 'Something went wrong processing your request',
      recommendation: 'Please try again or contact support.'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📋 Test endpoint: POST http://localhost:${port}/chat`);
  console.log(`❤️ Health check: GET http://localhost:${port}/health`);
});