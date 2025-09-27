// server.js - Fixed Node.js Express App for Testing Input Filtering Guardrails

const express = require('express');
const bodyParser = require('body-parser');
const badWords = require('bad-words');
const { NlpManager } = require('node-nlp');
const validator = require('validator');

const app = express();
const port = 3000;

// Use body-parser middleware once
app.use(bodyParser.json());

// Placeholder for commented-out ragStore functions
const {
  logConversation,
  retrieveRelevantConversations,
  listConversations,
  getConversation,
  likeConversation,
  getLikes,
} = require('./ragStore'); // Assumes ragStore.js exists

// Global variables for models
let nlpManager;
let winkNlp;
let textToxicityDetector;
let its;
const filter = new badWords();

// Load models asynchronously on startup
async function loadModels() {
  nlpManager = new NlpManager({ languages: ['en'], threshold: 0.7 }); // Increased threshold
  
  // Load pre-trained model instead of training
  try {
    await nlpManager.load('./model.nlp'); // Adjust path if your model is stored elsewhere
    console.log('NLP Manager loaded successfully.');
  } catch (err) {
    console.error('❌ Failed to load NLP model:', err.message);
    throw err; // Rethrow to handle in startup
  }
}

// Load models on startup
(async () => {
  try {
    await loadModels();
  } catch (err) {
    console.error('Error loading models:', err);
  }
})();

// Middleware 1: Profanity Filter
function profanityFilter(req, res, next) {
  const input = req.body.text;
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
        error: `Toxic content detected`, 
        details: {
          toxicity: result.toxicityPercentage + '%',
          words: result.toxicWordsList,
          middleware: 'toxicityDetector'
        }
      });
    }
    console.log('✅ TOXICITY DETECTOR: Content approved');
    next();
  } catch (err) {
    console.error('❌ TOXICITY DETECTOR ERROR:', err);
    next();
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
          middleware: 'topicRestrictor'
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
          error: `Unsafe contextual combination detected`,
          details: {
            type: combo.name,
            middleware: 'contextualSafety'
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
        middleware: 'promptInjectionDefense'
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
async function aiHandler(req, res) {
  const input = req.body.text;
  const userId = req.body.userId || req.ip || 'anonymous';
  const profanityInfo = req.body.profanityDetected ? ' (some language was filtered)' : '';
  console.log('✅ AI HANDLER: Generating response for approved input');

  let relevantConversations = [];
  try {
    relevantConversations = await retrieveRelevantConversations(input, 3);
  } catch (e) {
    console.warn('RAG retrieval failed:', e.message);
  }

  let ragContext = '';
  if (relevantConversations.length > 0) {
    ragContext = '\nHere are some related past conversations:\n' + relevantConversations.map((c, i) => `(${i+1}) User: ${c.userMessage}\n    Bot: ${c.botResponse}`).join('\n');
  }

  const response = `Hello! I received your message: "${input}"${profanityInfo}. I'm here to help and have a friendly conversation with you. What would you like to talk about?${ragContext}`;

  try {
    await logConversation(userId, input, response);
  } catch (e) {
    console.warn('Failed to log conversation:', e.message);
  }

  res.json({ 
    response,
    metadata: {
      inputProcessed: true,
      allChecksPassed: true,
      profanityFiltered: req.body.profanityDetected || false,
      ragContextCount: relevantConversations.length
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

// Endpoint: List all conversations
app.get('/conversations', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const conversations = await listConversations(limit, offset);
    res.json({ conversations, limit, offset });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list conversations', details: e.message });
  }
});

// Get a single conversation by ID
app.get('/conversations/:id', async (req, res) => {
  try {
    const convo = await getConversation(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    res.json(convo);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get conversation', details: e.message });
  }
});

// Like a conversation
app.post('/conversations/:id/like', (req, res) => {
  try {
    const count = likeConversation(req.params.id);
    res.json({ id: req.params.id, likes: count });
  } catch (e) {
    res.status(500).json({ error: 'Failed to like conversation', details: e.message });
  }
});

// Get likes for a conversation
app.get('/conversations/:id/likes', (req, res) => {
  try {
    const count = getLikes(req.params.id);
    res.json({ id: req.params.id, likes: count });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get likes', details: e.message });
  }
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
      message: 'Something went wrong processing your request'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📋 Test endpoint: POST http://localhost:${port}/chat`);
  console.log(`❤️ Health check: GET http://localhost:${port}/health`);
});